import express from 'express';
import cors from 'cors';
import 'dotenv/config';
import admin from 'firebase-admin';
import { getSystemPrompt } from './prompts/sistem.js';
import {
  limitArtir,
  limitDurumGetir,
  LimitServisiHatasi,
} from './middleware/rateLimiter.js';

let firebaseAdminHazir = false;
if (process.env.FIREBASE_SERVICE_ACCOUNT) {
  try {
    admin.initializeApp({
      credential: admin.credential.cert(
        JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT)
      ),
    });
    firebaseAdminHazir = true;
    console.log('Firebase Admin başlatıldı.');
  } catch (err) {
    console.warn('Firebase Admin başlatılamadı:', err.message);
  }
} else {
  console.warn('FIREBASE_SERVICE_ACCOUNT env var eksik — auth dogrulanamayacak.');
}

async function tokenDogrula(idToken) {
  if (!idToken || !admin.apps.length) return null;
  try {
    const decoded = await admin.auth().verifyIdToken(idToken);
    return decoded.uid;
  } catch {
    return null;
  }
}

const app = express();
const PORT = process.env.PORT || 3001;
const GEMINI_MODEL = process.env.GEMINI_MODEL || 'gemini-2.5-flash';
const MAX_GECMIS_MESAJ = 6;
const MAX_TOKENS_BY_MOD = {
  bilgi: 900,
  fikir: 900,
  bilgi_tek: 240,
  fikir_tek: 240,
  detay: 650,
  ilgili: 520,
  konu_kilidi: 380,
};

const GECERLI_MODLAR = ['bilgi', 'fikir', 'bilgi_tek', 'fikir_tek', 'detay', 'ilgili', 'konu_kilidi'];
const JSON_KART_MODLARI = new Set(['bilgi', 'fikir', 'ilgili', 'bilgi_tek', 'fikir_tek']);
const KART_SAYISI_BY_MOD = {
  bilgi: 6,
  fikir: 6,
  bilgi_tek: 1,
  fikir_tek: 1,
  ilgili: 4,
};
const IZNLI_ORIGINLER = new Set([
  'https://fikir-nine.vercel.app',
  'http://localhost:5173',
]);

function geminiJsonSchema(mod) {
  if (!JSON_KART_MODLARI.has(mod)) return null;

  if (mod === 'bilgi_tek' || mod === 'fikir_tek') {
    return {
      type: 'OBJECT',
      properties: {
        baslik: { type: 'STRING', maxLength: 80 },
        kanca: { type: 'STRING', maxLength: 260 },
      },
      required: ['baslik', 'kanca'],
      propertyOrdering: ['baslik', 'kanca'],
    };
  }

  return {
    type: 'ARRAY',
    minItems: mod === 'ilgili' ? 4 : 6,
    maxItems: mod === 'ilgili' ? 4 : 6,
    items: {
      type: 'OBJECT',
      properties: {
        baslik: { type: 'STRING', maxLength: 80 },
        kanca: { type: 'STRING', maxLength: 260 },
      },
      required: ['baslik', 'kanca'],
      propertyOrdering: ['baslik', 'kanca'],
    },
  };
}

function kartJsonuNormalizeEt(metin) {
  const temiz = String(metin || '')
    .replace(/^```json\s*/i, '')
    .replace(/^```\s*/i, '')
    .replace(/\s*```\s*$/i, '')
    .trim();

  const parsed = JSON.parse(temiz);
  if (parsed && typeof parsed === 'object' && parsed.baslik && parsed.kanca) {
    return [parsed];
  }
  if (Array.isArray(parsed)) return parsed;
  if (Array.isArray(parsed?.kartlar)) return parsed.kartlar;
  return null;
}

function anaMod(mod) {
  if (mod === 'bilgi_tek') return 'bilgi';
  if (mod === 'fikir_tek') return 'fikir';
  return mod;
}

function tekKartPromptEki(mod) {
  if (mod !== 'bilgi_tek' && mod !== 'fikir_tek') return '';
  return [
    '',
    'Ek gorev: Bu istekte sadece 1 kart uret.',
    'Yanit mutlaka su sekilde tek bir JSON object olsun:',
    '{ "baslik": "...", "kanca": "..." }',
    'Asla JSON array dondurme.',
  ].join('\n');
}

function kartDizisiniDogrula(kartlar, beklenenAdet) {
  if (!Array.isArray(kartlar)) return null;

  const temizlenmis = kartlar
    .map((kart) => ({
      baslik: String(kart?.baslik || '').trim(),
      kanca: String(kart?.kanca || '').trim(),
    }))
    .filter((kart) => kart.baslik && kart.kanca)
    .slice(0, beklenenAdet);

  if (temizlenmis.length !== beklenenAdet) return null;
  return temizlenmis;
}

function fallbackKartPromptu(mod, beklenenAdet) {
  const tur = mod === 'fikir' ? 'fikir karti' : 'bilgi karti';
  return [
    `Sadece gecerli JSON dizi dondur. Tam olarak ${beklenenAdet} kart yaz.`,
    'Markdown, kod blogu, aciklama veya ek metin yazma.',
    `Her oge su formatta olsun: {"baslik":"...","kanca":"..."}`,
    'baslik en fazla 55 karakter, kanca en fazla 140 karakter olsun.',
    `Kartlar kisa, net ve farkli acilardan ${tur} olsun.`,
  ].join(' ');
}

function tekKartJsonSchema() {
  return {
    type: 'OBJECT',
    properties: {
      baslik: { type: 'STRING', maxLength: 70 },
      kanca: { type: 'STRING', maxLength: 160 },
    },
    required: ['baslik', 'kanca'],
    propertyOrdering: ['baslik', 'kanca'],
  };
}

function tekKartPromptu(mod, sira, toplam) {
  const tur = mod === 'fikir' ? 'fikir' : 'bilgi';
  return [
    `Sadece gecerli JSON object dondur. ${sira}/${toplam}. karti uret.`,
    'Sadece su alanlar olsun: baslik, kanca. Ek alan olmasin.',
    'Markdown, aciklama veya kod blogu yazma.',
    `Kisa ve etkili bir ${tur} karti yaz. baslik <= 60, kanca <= 130.`,
  ].join(' ');
}

async function kartlariTekTekUret(mod, messages, beklenenAdet) {
  const kartlar = [];

  for (let i = 0; i < beklenenAdet; i += 1) {
    const tekKartResponse = await geminiIstekAt({
      systemPrompt: tekKartPromptu(mod, i + 1, beklenenAdet),
      messages,
      maxTokens: 240,
      responseSchema: tekKartJsonSchema(),
    });

    if (!tekKartResponse.ok) return null;

    const tekKartVeri = await tekKartResponse.json();
    const tekKartMetni = geminiYanitMetni(tekKartVeri);

    let tekKart;
    try {
      const parsed = kartJsonuNormalizeEt(tekKartMetni);
      if (Array.isArray(parsed)) {
        tekKart = parsed[0];
      } else {
        const temiz = String(tekKartMetni || '')
          .replace(/^```json\s*/i, '')
          .replace(/^```\s*/i, '')
          .replace(/\s*```\s*$/i, '')
          .trim();
        tekKart = JSON.parse(temiz);
      }
    } catch {
      return null;
    }

    const dogrulanan = kartDizisiniDogrula([tekKart], 1);
    if (!dogrulanan) return null;
    kartlar.push(dogrulanan[0]);
  }

  return kartDizisiniDogrula(kartlar, beklenenAdet);
}

async function geminiIstekAt({ systemPrompt, messages, maxTokens, responseSchema }) {
  return fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${process.env.GEMINI_API_KEY}`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        systemInstruction: {
          parts: [{ text: systemPrompt }],
        },
        contents: geminiIcerikleriniHazirla(messages),
        generationConfig: {
          maxOutputTokens: maxTokens,
          ...(responseSchema && {
            responseMimeType: 'application/json',
            responseSchema,
          }),
        },
      }),
    }
  );
}

function konuKilidiParse(userContent) {
  if (!userContent || typeof userContent !== 'string') return null;
  const idx = userContent.indexOf('Kullanıcı sorusu:');
  if (idx === -1) return null;
  const kartStr = userContent.slice(0, idx).replace(/^Kart:\s*/, '').trim();
  const soru = userContent.slice(idx + 'Kullanıcı sorusu:'.length).trim();
  const nokta = kartStr.indexOf('. ');
  const kartBasligi = nokta > 0 ? kartStr.slice(0, nokta).trim() : kartStr;
  const kartKonusu = nokta > 0 ? kartStr.slice(nokta + 2).trim() : kartStr;
  return { kartBasligi, kartKonusu, soru };
}

function geminiRole(role) {
  return role === 'assistant' ? 'model' : 'user';
}

function geminiIcerikleriniHazirla(messages) {
  return messages.map((mesaj) => ({
    role: geminiRole(mesaj.role),
    parts: [{ text: String(mesaj.content || '') }],
  }));
}

function geminiYanitMetni(veri) {
  return veri.candidates?.[0]?.content?.parts
    ?.map((part) => part.text || '')
    .join('')
    .trim() || '';
}

function apiHata(res, status, kod, hata, extra = {}) {
  return res.status(status).json({ ok: false, kod, hata, ...extra });
}

function apiBasari(res, data = {}) {
  return res.json({ ok: true, ...data });
}

function limitHeaderYaz(res, limitDurum) {
  if (!limitDurum) return;
  res.setHeader('x-limit-total', String(limitDurum.limit));
  res.setHeader('x-limit-remaining', String(limitDurum.kalan));
  res.setHeader('x-limit-used', String(limitDurum.kullanilan));
}

app.use(
  cors({
    origin(origin, callback) {
      if (!origin) {
        callback(null, true);
        return;
      }

      if (
        IZNLI_ORIGINLER.has(origin)
        || /^http:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/.test(origin)
        || /^exp:\/\//.test(origin)
      ) {
        callback(null, true);
        return;
      }

      callback(new Error('CORS engellendi'));
    },
  })
);
app.use(express.json());

// Tek kart modlarında aynı arama oturumu için limit sadece 1 kez artırılır.
const sayilanOturumlar = new Map(); // oturumId → true
setInterval(() => {
  const sinir = Date.now() - 5 * 60 * 1000;
  for (const [id, zaman] of sayilanOturumlar) {
    if (zaman < sinir) sayilanOturumlar.delete(id);
  }
}, 60 * 1000);

app.post('/api/mesaj', async (req, res) => {
  const { mesajlar, mod, kullaniciId } = req.body;
  const aramOturumId = req.headers['x-arama-oturumu'] || null;
  const authHeader = req.headers.authorization || '';
  const idToken = authHeader.startsWith('Bearer ')
    ? authHeader.slice(7).trim()
    : null;

  if (!mesajlar || !Array.isArray(mesajlar) || mesajlar.length === 0) {
    return apiHata(res, 400, 'ISTEK_HATASI', 'Gecersiz istek: mesajlar dizisi gerekli');
  }
  if (!GECERLI_MODLAR.includes(mod)) {
    return apiHata(res, 400, 'ISTEK_HATASI', 'Gecersiz mod');
  }

  let dogrulanmisUid = null;
  if (idToken) {
    if (!firebaseAdminHazir) {
      return apiHata(res, 503, 'LIMIT_SERVISI_KULLANILAMIYOR', 'Auth servisi yapilandirilmamis, lutfen daha sonra tekrar dene');
    }
    dogrulanmisUid = await tokenDogrula(idToken);
    if (!dogrulanmisUid) {
      return apiHata(res, 401, 'GIRIS_GEREKLI', 'Gecersiz oturum tokeni');
    }
  }

  if (kullaniciId && !dogrulanmisUid) {
    return apiHata(res, 401, 'GIRIS_GEREKLI', 'Bu istek icin giris yapmalisin');
  }

  if (kullaniciId && dogrulanmisUid && kullaniciId !== dogrulanmisUid) {
    return apiHata(res, 403, 'YETKI_REDDEDILDI', 'Kullanici yetkisi dogrulanamadi');
  }

  const limitAnahtari = dogrulanmisUid
    ? `uid:${dogrulanmisUid}`
    : req.ip || 'anon';

  let limitDurum;
  try {
    limitDurum = await limitDurumGetir(limitAnahtari);
  } catch (err) {
    if (err instanceof LimitServisiHatasi) {
      return apiHata(
        res,
        503,
        'LIMIT_SERVISI_KULLANILAMIYOR',
        'Limit servisi gecici olarak kullanilamiyor',
        { retry: false }
      );
    }
    throw err;
  }

  limitHeaderYaz(res, limitDurum);
  if (limitDurum.limitAsildi) {
    return apiHata(res, 429, 'LIMIT_DOLDU', 'Gunluk limit doldu', {
      mesaj: 'Uye olarak daha fazla kullanim hakki kazanabilirsin',
      retry: false,
    });
  }

  let systemPrompt = getSystemPrompt(anaMod(mod));
  let messages = mesajlar.slice(-MAX_GECMIS_MESAJ);
  const maxTokens = MAX_TOKENS_BY_MOD[mod] || 420;

  if (mod === 'bilgi_tek' || mod === 'fikir_tek') {
    systemPrompt += tekKartPromptEki(mod);
  }

  if (!process.env.GEMINI_API_KEY) {
    return apiHata(res, 500, 'SUNUCU_HATASI', 'GEMINI_API_KEY tanimli degil');
  }

  if (mod === 'konu_kilidi') {
    const firstContent = mesajlar.find((m) => m.role === 'user')?.content || '';
    const parsed = konuKilidiParse(firstContent);
    if (parsed) {
      systemPrompt = getSystemPrompt(mod, {
        kartBasligi: parsed.kartBasligi,
        kartKonusu: parsed.kartKonusu,
      });
      messages = [{ role: 'user', content: parsed.soru }];
    } else {
      systemPrompt = getSystemPrompt(mod, {
        kartBasligi: 'Genel',
        kartKonusu: 'Açık kart konusu belirtilmemiş.',
      });
    }
  }

  try {
    const responseSchema = geminiJsonSchema(mod);
    const geminiResponse = await geminiIstekAt({
      systemPrompt,
      messages,
      maxTokens,
      responseSchema,
    });

    if (!geminiResponse.ok) {
      const hata = await geminiResponse.json().catch(() => ({}));
      console.error('Gemini hatası:', hata);
      return apiHata(res, 502, 'AI_SERVISI_HATASI', 'AI servisi su an yanit vermiyor', {
        retry: true,
      });
    }

    const veri = await geminiResponse.json();
    let yanitMetni = geminiYanitMetni(veri);

    if (JSON_KART_MODLARI.has(mod)) {
      const beklenenAdet = KART_SAYISI_BY_MOD[mod] || 6;
      try {
        let kartlar = kartDizisiniDogrula(
          kartJsonuNormalizeEt(yanitMetni),
          beklenenAdet
        );

        if (!kartlar) {
          const fallbackResponse = await geminiIstekAt({
            systemPrompt: fallbackKartPromptu(mod, beklenenAdet),
            messages,
            maxTokens: Math.max(maxTokens + 500, 1400),
            responseSchema,
          });

          if (fallbackResponse.ok) {
            const fallbackVeri = await fallbackResponse.json();
            yanitMetni = geminiYanitMetni(fallbackVeri);
            kartlar = kartDizisiniDogrula(
              kartJsonuNormalizeEt(yanitMetni),
              beklenenAdet
            );
          }
        }

        if (!kartlar) {
          kartlar = await kartlariTekTekUret(mod, messages, beklenenAdet);
        }

        if (!kartlar) {
          return apiHata(res, 502, 'AI_FORMAT_HATASI', 'AI ciktisi gecersiz formatta', {
            detay: 'Kart JSON üretimi tamamlanamadi',
          });
        }

        const tekMod = mod === 'bilgi_tek' || mod === 'fikir_tek';
        const zatenSayildi = tekMod && aramOturumId && sayilanOturumlar.has(aramOturumId);
        if (!zatenSayildi) {
          const yeniLimitDurum = await limitArtir(limitAnahtari);
          limitHeaderYaz(res, yeniLimitDurum);
          if (tekMod && aramOturumId) sayilanOturumlar.set(aramOturumId, Date.now());
        }
        return apiBasari(res, { yanit: JSON.stringify(kartlar) });
      } catch {
        return apiHata(res, 502, 'AI_PARSE_HATASI', 'AI ciktisi parse edilemedi', {
          retry: true,
        });
      }
    }

    const yeniLimitDurum = await limitArtir(limitAnahtari);
    limitHeaderYaz(res, yeniLimitDurum);
    return apiBasari(res, { yanit: yanitMetni });
  } catch (err) {
    console.error('Sunucu hatası:', err);
    if (err instanceof LimitServisiHatasi) {
      return apiHata(
        res,
        503,
        'LIMIT_SERVISI_KULLANILAMIYOR',
        'Limit servisi gecici olarak kullanilamiyor',
        { retry: false }
      );
    }
    return apiHata(res, 500, 'SUNUCU_HATASI', 'Sunucu hatasi');
  }
});

app.get('/health', (req, res) => {
  apiBasari(res, {
    kod: 'SAGLIKLI',
    durum: 'calisiyor',
    provider: 'gemini',
    model: GEMINI_MODEL,
    maxGecmisMesaj: MAX_GECMIS_MESAJ,
    redis: !!process.env.REDIS_URL,
    firebaseAdmin: firebaseAdminHazir,
  });
});

app.listen(PORT, () => {
  console.log(`Sunucu ${PORT} portunda calisiyor`);
});

import express from 'express';
import cors from 'cors';
import 'dotenv/config';
import admin from 'firebase-admin';
import { getSystemPrompt } from './prompts/sistem.js';
import { limitKontrol, limitArtir } from './middleware/rateLimiter.js';

if (process.env.FIREBASE_SERVICE_ACCOUNT) {
  try {
    admin.initializeApp({
      credential: admin.credential.cert(
        JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT)
      ),
    });
  } catch (err) {
    console.warn('Firebase Admin başlatılamadı:', err.message);
  }
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
const GEMINI_MODEL = process.env.GEMINI_MODEL || 'gemini-2.5-flash-lite';
const MAX_GECMIS_MESAJ = 6;
const MAX_TOKENS_BY_MOD = {
  bilgi: 900,
  fikir: 900,
  detay: 650,
  ilgili: 520,
  konu_kilidi: 380,
};

const GECERLI_MODLAR = ['bilgi', 'fikir', 'detay', 'ilgili', 'konu_kilidi'];
const JSON_KART_MODLARI = new Set(['bilgi', 'fikir', 'ilgili']);
const KART_SAYISI_BY_MOD = {
  bilgi: 6,
  fikir: 6,
  ilgili: 4,
};
const IZNLI_ORIGINLER = new Set([
  'https://fikir-nine.vercel.app',
  'http://localhost:5173',
]);

function geminiJsonSchema(mod) {
  if (!JSON_KART_MODLARI.has(mod)) return null;
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
  if (Array.isArray(parsed)) return parsed;
  if (Array.isArray(parsed?.kartlar)) return parsed.kartlar;
  return null;
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

app.post('/api/mesaj', async (req, res) => {
  const { mesajlar, mod, kullaniciId, idToken } = req.body;

  if (!mesajlar || !Array.isArray(mesajlar) || mesajlar.length === 0) {
    return res.status(400).json({ hata: 'Geçersiz istek: mesajlar dizisi gerekli' });
  }
  if (!GECERLI_MODLAR.includes(mod)) {
    return res.status(400).json({ hata: 'Geçersiz mod' });
  }

  let dogrulanmisUid = null;
  if (idToken) {
    dogrulanmisUid = await tokenDogrula(idToken);
    if (!dogrulanmisUid) {
      return res.status(401).json({ hata: 'Geçersiz oturum tokeni' });
    }
  }

  const limitAnahtari = dogrulanmisUid
    ? `uid:${dogrulanmisUid}`
    : req.ip || 'anon';
  if (await limitKontrol(limitAnahtari)) {
    return res.status(429).json({
      hata: 'Günlük limit doldu',
      mesaj: 'Üye olarak daha fazla kullanım hakkı kazanabilirsin',
    });
  }

  let systemPrompt = getSystemPrompt(mod);
  let messages = mesajlar.slice(-MAX_GECMIS_MESAJ);
  const maxTokens = MAX_TOKENS_BY_MOD[mod] || 420;

  if (!process.env.GEMINI_API_KEY) {
    return res.status(500).json({ hata: 'GEMINI_API_KEY tanimli degil' });
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
      return res.status(502).json({ hata: 'AI servisi şu an yanıt vermiyor' });
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
          return res.status(502).json({
            hata: 'AI çıktısı geçersiz formatta',
            detay: 'Kart JSON üretimi tamamlanamadi',
          });
        }

        await limitArtir(limitAnahtari);
        return res.json({ yanit: JSON.stringify(kartlar) });
      } catch {
        return res.status(502).json({ hata: 'AI çıktısı parse edilemedi' });
      }
    }

    await limitArtir(limitAnahtari);
    res.json({ yanit: yanitMetni });
  } catch (err) {
    console.error('Sunucu hatası:', err);
    res.status(500).json({ hata: 'Sunucu hatası' });
  }
});

app.get('/health', (req, res) => {
  res.json({
    durum: 'calisiyor',
    provider: 'gemini',
    model: GEMINI_MODEL,
    maxGecmisMesaj: MAX_GECMIS_MESAJ,
    redis: !!process.env.REDIS_URL,
  });
});

app.listen(PORT, () => {
  console.log(`Sunucu ${PORT} portunda calisiyor`);
});

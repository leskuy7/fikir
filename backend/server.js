import express from 'express';
import cors from 'cors';
import 'dotenv/config';
import admin from 'firebase-admin';
import crypto from 'crypto';
import {
  CORS_ORIGINS,
  FETCH_TIMEOUT_MS,
  GEMINI_FALLBACK_MODEL,
  GEMINI_MODEL,
  IS_PRODUCTION,
  MAX_BODY_KB,
  MAX_GECMIS_MESAJ,
  MAX_MESAJ_ICERIK_KARAKTER,
  MAX_MESAJ_SAYISI,
  PORT,
  REKLAM_ODUL_MIN_BEKLEME_MS,
  REKLAM_ODUL_OTURUM_TTL_MS,
  REQUIRE_REDIS_IN_PROD,
  TRUST_PROXY,
} from './config.js';
import { getSystemPrompt } from './prompts/sistem.js';
import {
  limitArtir,
  limitDurumGetir,
  limitIadeEt,
  limitServisiDurumuGetir,
  LimitServisiHatasi,
  reklamOdulDurumGetir,
  reklamOdulHakkiKullan,
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

function authHeaderTokenGetir(req) {
  const authHeader = req.headers.authorization || '';
  return authHeader.startsWith('Bearer ') ? authHeader.slice(7).trim() : null;
}

function anonIdGetir(req) {
  const rawValue = req.headers['x-anon-id'];
  if (typeof rawValue !== 'string') return null;

  const value = rawValue.trim();
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value)
    ? value.toLowerCase()
    : null;
}

function limitAnahtariGetir(req, dogrulanmisUid = null) {
  if (dogrulanmisUid) return `uid:${dogrulanmisUid}`;

  const anonId = anonIdGetir(req);
  if (anonId) return `anon:${anonId}`;

  const ip = typeof req.ip === 'string' ? req.ip.trim() : '';
  return ip ? `ip:${ip}` : 'ip:anon';
}

function startupKontroluCalistir() {
  if (!IS_PRODUCTION) return;

  const hatalar = [];
  if (!process.env.GEMINI_API_KEY) hatalar.push('GEMINI_API_KEY gerekli');
  if (!process.env.REKLAM_ODUL_SECRET) hatalar.push('REKLAM_ODUL_SECRET gerekli');
  if (REQUIRE_REDIS_IN_PROD && !process.env.REDIS_URL) hatalar.push('REDIS_URL gerekli');

  if (hatalar.length === 0) return;

  console.error('Sunucu baslatilamiyor. Eksik kritik env degerleri:', hatalar.join(', '));
  process.exit(1);
}

const app = express();
startupKontroluCalistir();
app.set('trust proxy', TRUST_PROXY);
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
const IZNLI_ORIGINLER = new Set(CORS_ORIGINS);
const REKLAM_ODUL_SECRET = process.env.REKLAM_ODUL_SECRET || crypto.randomBytes(32).toString('hex');
const reklamOdulOturumlari = new Map();
const reklamOdulAnahtarlari = new Map();

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

  let parsed;
  try {
    parsed = JSON.parse(temiz);
  } catch {
    const codeBlock = temiz.match(/```(?:json)?\s*([\s\S]*?)```/);
    const jsonBlock = (codeBlock?.[1] ?? temiz).trim();
    const ilkAc = jsonBlock.indexOf('{');
    const sonKapa = jsonBlock.lastIndexOf('}');
    if (ilkAc !== -1 && sonKapa > ilkAc) {
      try {
        parsed = JSON.parse(jsonBlock.slice(ilkAc, sonKapa + 1));
      } catch {
        return null;
      }
    } else {
      return null;
    }
  }

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

    if (temizlenmis.length !== beklenenAdet) {
      console.error('Gemini yaniti (format hatasi):', kartlar);
      return null;
    }
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
  const istekler = Array.from({ length: beklenenAdet }, (_, i) =>
    geminiIstekAt({
      systemPrompt: tekKartPromptu(mod, i + 1, beklenenAdet),
      messages,
      maxTokens: 240,
      responseSchema: tekKartJsonSchema(),
    }).then(async (resp) => {
      if (!resp.ok) return null;
      const veri = await resp.json();
      const metin = geminiYanitMetni(veri);
      let tekKart;
      const parsed = kartJsonuNormalizeEt(metin);
      if (Array.isArray(parsed)) {
        tekKart = parsed[0];
      } else {
        const temiz = String(metin || '')
          .replace(/^```json\s*/i, '')
          .replace(/^```\s*/i, '')
          .replace(/\s*```\s*$/i, '')
          .trim();
        tekKart = JSON.parse(temiz);
      }
      const dogrulanan = kartDizisiniDogrula([tekKart], 1);
      return dogrulanan ? dogrulanan[0] : null;
    }).catch(() => null)
  );

  const sonuclar = await Promise.all(istekler);
  const kartlar = sonuclar.filter(Boolean);
  return kartlar.length === beklenenAdet ? kartlar : null;
}

async function geminiIstekAt({ systemPrompt, messages, maxTokens, responseSchema, model = GEMINI_MODEL }) {
  if (!process.env.GEMINI_API_KEY) {
    throw new Error('GEMINI_API_KEY tanımlanmamış — AI servisi kullanılamaz');
  }
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);
  try {
    return await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`,
      {
        method: 'POST',
        signal: controller.signal,
        headers: {
          'Content-Type': 'application/json',
          'x-goog-api-key': process.env.GEMINI_API_KEY,
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
            thinkingConfig: { thinkingBudget: 0 },
          },
        }),
      }
    );
  } finally {
    clearTimeout(timer);
  }
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
    ?.filter((part) => !part.thought)
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

function geminiKotaHatasiMi(status, body = {}) {
  return status === 429 || body?.error?.code === 429 || body?.error?.status === 'RESOURCE_EXHAUSTED';
}

async function geminiHatasiDon({ res, limitAnahtari, weReserved, response, body, model }) {
  if (weReserved) await limitIadeEt(limitAnahtari).catch(() => {});

  if (geminiKotaHatasiMi(response?.status, body)) {
    return apiHata(res, 429, 'SERVIS_LIMITI_DOLDU', 'AI servisi kotasi gecici olarak dolu', {
      retry: true,
      model,
      upstreamStatus: response?.status || 429,
    });
  }

  return apiHata(res, 502, 'AI_SERVISI_HATASI', 'AI servisi su an yanit vermiyor', {
    retry: true,
    model,
    upstreamStatus: response?.status || 0,
  });
}

function limitHeaderYaz(res, limitDurum) {
  if (!limitDurum) return;
  res.setHeader('x-limit-total', String(limitDurum.limit));
  res.setHeader('x-limit-remaining', String(limitDurum.kalan));
  res.setHeader('x-limit-used', String(limitDurum.kullanilan));
}

function reklamOdulImzasiUret({ oturumId, limitAnahtari, olusturulma, sonKullanma }) {
  return crypto
    .createHmac('sha256', REKLAM_ODUL_SECRET)
    .update(`${oturumId}.${limitAnahtari}.${olusturulma}.${sonKullanma}`)
    .digest('hex');
}

function guvenliKarsilastir(a, b) {
  const sol = Buffer.from(String(a || ''), 'utf8');
  const sag = Buffer.from(String(b || ''), 'utf8');
  if (sol.length !== sag.length) return false;
  return crypto.timingSafeEqual(sol, sag);
}

function reklamOdulOturumuSil(oturum) {
  if (!oturum) return;
  reklamOdulOturumlari.delete(oturum.oturumId);
  if (reklamOdulAnahtarlari.get(oturum.limitAnahtari) === oturum.oturumId) {
    reklamOdulAnahtarlari.delete(oturum.limitAnahtari);
  }
}

function reklamOdulOturumuOlustur(limitAnahtari) {
  const oncekiOturumId = reklamOdulAnahtarlari.get(limitAnahtari);
  if (oncekiOturumId) {
    reklamOdulOturumuSil(reklamOdulOturumlari.get(oncekiOturumId));
  }

  const oturumId = crypto.randomUUID();
  const olusturulma = Date.now();
  const sonKullanma = olusturulma + REKLAM_ODUL_OTURUM_TTL_MS;
  const oturum = {
    oturumId,
    limitAnahtari,
    olusturulma,
    sonKullanma,
  };
  oturum.imza = reklamOdulImzasiUret(oturum);

  reklamOdulOturumlari.set(oturumId, oturum);
  reklamOdulAnahtarlari.set(limitAnahtari, oturumId);
  return oturum;
}

function reklamOdulOturumuDogrula({ oturumId, imza, limitAnahtari }) {
  const oturum = reklamOdulOturumlari.get(oturumId);
  if (!oturum) {
    return { ok: false, kod: 'REKLAM_ODUL_DOGRULANAMADI', hata: 'Odul oturumu bulunamadi' };
  }
  if (Date.now() > oturum.sonKullanma) {
    reklamOdulOturumuSil(oturum);
    return { ok: false, kod: 'REKLAM_ODUL_DOGRULANAMADI', hata: 'Odul oturumu zaman asimina ugradi' };
  }
  if (oturum.limitAnahtari !== limitAnahtari) {
    reklamOdulOturumuSil(oturum);
    return { ok: false, kod: 'REKLAM_ODUL_DOGRULANAMADI', hata: 'Odul oturumu esitlenemedi' };
  }

  const beklenenImza = reklamOdulImzasiUret(oturum);
  if (!guvenliKarsilastir(imza, beklenenImza)) {
    reklamOdulOturumuSil(oturum);
    return { ok: false, kod: 'REKLAM_ODUL_DOGRULANAMADI', hata: 'Odul oturumu imzasi gecersiz' };
  }

  const gecenSure = Date.now() - oturum.olusturulma;
  if (gecenSure < REKLAM_ODUL_MIN_BEKLEME_MS) {
    return { ok: false, kod: 'REKLAM_ODUL_BEKLENIYOR', hata: 'Reklam odulu henuz dogrulanamadi' };
  }

  return { ok: true, oturum };
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
    allowedHeaders: ['Content-Type', 'Authorization', 'x-arama-oturumu', 'x-anon-id'],
    exposedHeaders: ['x-limit-total', 'x-limit-remaining', 'x-limit-used', 'x-request-id'],
  })
);

app.use(express.json({ limit: `${MAX_BODY_KB}kb` }));

app.use((req, res, next) => {
  req._startAt = Date.now();
  req._requestId = crypto.randomUUID();
  res.setHeader('x-request-id', req._requestId);
  res.on('finish', () => {
    const ms = Date.now() - (req._startAt || 0);
    const isError = res.statusCode >= 400;
    const isSlow = ms > 5000;
    if (isError || isSlow) {
      console.warn(`[${res.statusCode}] ${req.method} ${req.path} ${ms}ms rid=${req._requestId}`);
    }
  });
  next();
});

// Tek kart modlarında aynı arama oturumu için limit sadece 1 kez artırılır.
const sayilanOturumlar = new Map(); // oturumId → true
setInterval(() => {
  const sinir = Date.now() - 5 * 60 * 1000;
  for (const [id, zaman] of sayilanOturumlar) {
    if (zaman < sinir) sayilanOturumlar.delete(id);
  }
}, 60 * 1000);

setInterval(() => {
  const simdi = Date.now();
  for (const oturum of reklamOdulOturumlari.values()) {
    if (simdi > oturum.sonKullanma) reklamOdulOturumuSil(oturum);
  }
}, 60 * 1000);

app.get('/api/limit-durum', async (req, res) => {
  const idToken = authHeaderTokenGetir(req);
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
  const limitAnahtari = limitAnahtariGetir(req, dogrulanmisUid);
  try {
    const limitDurum = await limitDurumGetir(limitAnahtari);
    limitHeaderYaz(res, limitDurum);
    return apiBasari(res, {
      limit: {
        toplam: limitDurum.limit,
        kalan: limitDurum.kalan,
        kullanilan: limitDurum.kullanilan,
      },
    });
  } catch (err) {
    if (err instanceof LimitServisiHatasi) {
      return apiHata(res, 503, 'LIMIT_SERVISI_KULLANILAMIYOR', 'Limit servisi gecici olarak kullanilamiyor', { retry: false });
    }
    throw err;
  }
});

app.post('/api/reklam-odul/oturum', async (req, res) => {
  const idToken = authHeaderTokenGetir(req);

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

  const limitAnahtari = limitAnahtariGetir(req, dogrulanmisUid);

  let limitDurum;
  try {
    limitDurum = await limitDurumGetir(limitAnahtari);
  } catch (err) {
    if (err instanceof LimitServisiHatasi) {
      return apiHata(res, 503, 'LIMIT_SERVISI_KULLANILAMIYOR', 'Limit servisi gecici olarak kullanilamiyor', { retry: false });
    }
    throw err;
  }

  limitHeaderYaz(res, limitDurum);
  if (!limitDurum.limitAsildi) {
    return apiHata(res, 409, 'REKLAM_ODUL_GEREKSIZ', 'Su an reklam odulu gerekmiyor', {
      retry: false,
    });
  }

  let odulDurum;
  try {
    odulDurum = await reklamOdulDurumGetir(limitAnahtari);
  } catch (err) {
    if (err instanceof LimitServisiHatasi) {
      return apiHata(res, 503, 'LIMIT_SERVISI_KULLANILAMIYOR', 'Limit servisi gecici olarak kullanilamiyor', { retry: false });
    }
    throw err;
  }
  if (!odulDurum.uygun) {
    return apiHata(res, 429, 'ODUL_LIMIT_DOLDU', 'Gunluk reklam odul hakkin doldu', {
      retry: false,
      odul: odulDurum,
    });
  }

  const oturum = reklamOdulOturumuOlustur(limitAnahtari);
  return apiBasari(res, {
    oturum: {
      id: oturum.oturumId,
      imza: oturum.imza,
      sonKullanma: oturum.sonKullanma,
      minBeklemeMs: REKLAM_ODUL_MIN_BEKLEME_MS,
    },
  });
});

app.post('/api/reklam-odul', async (req, res) => {
  const { oturumId, imza } = req.body || {};
  if (
    typeof oturumId !== 'string'
    || typeof imza !== 'string'
    || !/^[a-f0-9-]{36}$/i.test(oturumId)
    || !/^[a-f0-9]{64}$/i.test(imza)
  ) {
    return apiHata(res, 400, 'ISTEK_HATASI', 'Odul dogrulamasi icin gecerli oturum gerekli');
  }

  const idToken = authHeaderTokenGetir(req);

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

  const limitAnahtari = limitAnahtariGetir(req, dogrulanmisUid);

  const dogrulama = reklamOdulOturumuDogrula({ oturumId, imza, limitAnahtari });
  if (!dogrulama.ok) {
    return apiHata(res, dogrulama.kod === 'REKLAM_ODUL_BEKLENIYOR' ? 409 : 403, dogrulama.kod, dogrulama.hata, {
      retry: false,
    });
  }

  let limitDurum;
  try {
    limitDurum = await limitDurumGetir(limitAnahtari);
  } catch (err) {
    if (err instanceof LimitServisiHatasi) {
      return apiHata(res, 503, 'LIMIT_SERVISI_KULLANILAMIYOR', 'Limit servisi gecici olarak kullanilamiyor', { retry: false });
    }
    throw err;
  }

  limitHeaderYaz(res, limitDurum);
  if (!limitDurum.limitAsildi) {
    reklamOdulOturumuSil(dogrulama.oturum);
    return apiHata(res, 409, 'REKLAM_ODUL_GEREKSIZ', 'Su an reklam odulu gerekmiyor', {
      retry: false,
    });
  }

  let odulDurum;
  try {
    odulDurum = await reklamOdulHakkiKullan(limitAnahtari);
  } catch (err) {
    if (err instanceof LimitServisiHatasi) {
      reklamOdulOturumuSil(dogrulama.oturum);
      return apiHata(res, 503, 'LIMIT_SERVISI_KULLANILAMIYOR', 'Limit servisi gecici olarak kullanilamiyor', { retry: false });
    }
    throw err;
  }
  if (!odulDurum.uygun) {
    reklamOdulOturumuSil(dogrulama.oturum);
    return apiHata(res, 429, 'ODUL_LIMIT_DOLDU', 'Gunluk reklam odul hakkin doldu', {
      retry: false,
      odul: odulDurum,
    });
  }

  reklamOdulOturumuSil(dogrulama.oturum);
  const guncelLimitDurum = await limitIadeEt(limitAnahtari);
  limitHeaderYaz(res, guncelLimitDurum);
  return apiBasari(res, {
    limit: {
      toplam: guncelLimitDurum.limit,
      kalan: guncelLimitDurum.kalan,
      kullanilan: guncelLimitDurum.kullanilan,
    },
    odul: odulDurum,
  });
});

app.post('/api/mesaj', async (req, res) => {
  const { mesajlar, mod, kullaniciId } = req.body;
  const rawOturumId = req.headers['x-arama-oturumu'] || null;
  const aramOturumId = rawOturumId && rawOturumId.length <= 100 && /^[\w-]+$/.test(rawOturumId) ? rawOturumId : null;
  const idToken = authHeaderTokenGetir(req);

  if (!mesajlar || !Array.isArray(mesajlar) || mesajlar.length === 0) {
    return apiHata(res, 400, 'ISTEK_HATASI', 'Gecersiz istek: mesajlar dizisi gerekli');
  }
  if (mesajlar.length > MAX_MESAJ_SAYISI) {
    return apiHata(res, 400, 'ISTEK_HATASI', `En fazla ${MAX_MESAJ_SAYISI} mesaj gonderebilirsin`);
  }
  const asiriUzun = mesajlar.find((m) => String(m?.content || '').length > MAX_MESAJ_ICERIK_KARAKTER);
  if (asiriUzun) {
    return apiHata(res, 400, 'ISTEK_HATASI', `Bir mesaj en fazla ${MAX_MESAJ_ICERIK_KARAKTER} karakter olabilir`);
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

  const limitAnahtari = limitAnahtariGetir(req, dogrulanmisUid);

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

  if (!process.env.GEMINI_API_KEY) {
    return apiHata(res, 500, 'SUNUCU_HATASI', 'GEMINI_API_KEY tanimli degil');
  }

  const tekMod = mod === 'bilgi_tek' || mod === 'fikir_tek';
  const zatenSayildi = tekMod && aramOturumId && sayilanOturumlar.has(aramOturumId);
  let weReserved = false;
  let rezerveLimitDurum = null;
  if (!zatenSayildi) {
    rezerveLimitDurum = await limitArtir(limitAnahtari);
    weReserved = true;
  }

  let systemPrompt = getSystemPrompt(anaMod(mod));
  let messages = mesajlar.slice(-MAX_GECMIS_MESAJ);
  const maxTokens = MAX_TOKENS_BY_MOD[mod] || 420;

  if (mod === 'bilgi_tek' || mod === 'fikir_tek') {
    systemPrompt += tekKartPromptEki(mod);
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
    let kullanilanModel = GEMINI_MODEL;
    let geminiResponse = await geminiIstekAt({
      systemPrompt,
      messages,
      maxTokens,
      responseSchema,
    });

    if (!geminiResponse.ok) {
      const hata = await geminiResponse.json().catch(() => ({}));
      const fallbackUygun =
        (geminiResponse.status === 400 || geminiResponse.status === 404)
        && GEMINI_MODEL !== GEMINI_FALLBACK_MODEL;

      if (fallbackUygun) {
        console.warn('Gemini model fallback deneniyor:', {
          oncekiModel: GEMINI_MODEL,
          fallbackModel: GEMINI_FALLBACK_MODEL,
          status: geminiResponse.status,
          hata,
        });

        const fallbackResponse = await geminiIstekAt({
          systemPrompt,
          messages,
          maxTokens,
          responseSchema,
          model: GEMINI_FALLBACK_MODEL,
        });

        if (fallbackResponse.ok) {
          geminiResponse = fallbackResponse;
          kullanilanModel = GEMINI_FALLBACK_MODEL;
        } else {
          const fallbackHata = await fallbackResponse.json().catch(() => ({}));
          console.error('Gemini hatası (fallback da başarısız):', {
            birincilModel: GEMINI_MODEL,
            fallbackModel: GEMINI_FALLBACK_MODEL,
            birincilStatus: geminiResponse.status,
            fallbackStatus: fallbackResponse.status,
            birincilHata: hata,
            fallbackHata,
          });
          return geminiHatasiDon({
            res,
            limitAnahtari,
            weReserved,
            response: fallbackResponse,
            body: fallbackHata,
            model: GEMINI_FALLBACK_MODEL,
          });
        }
      } else {
        console.error('Gemini hatası:', {
          model: GEMINI_MODEL,
          status: geminiResponse.status,
          hata,
        });
        return geminiHatasiDon({
          res,
          limitAnahtari,
          weReserved,
          response: geminiResponse,
          body: hata,
          model: GEMINI_MODEL,
        });
      }
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
          if (weReserved) await limitIadeEt(limitAnahtari);
          return apiHata(res, 502, 'AI_FORMAT_HATASI', 'AI ciktisi gecersiz formatta', {
            detay: 'Kart JSON üretimi tamamlanamadi',
          });
        }

        if (rezerveLimitDurum) limitHeaderYaz(res, rezerveLimitDurum);
        else limitHeaderYaz(res, await limitDurumGetir(limitAnahtari));
        if (weReserved && tekMod && aramOturumId) sayilanOturumlar.set(aramOturumId, Date.now());
        return apiBasari(res, { yanit: JSON.stringify(kartlar) });
      } catch (err) {
        console.error('AI_PARSE_HATASI Detaylari: rawResponse (ilk 200) =', String(yanitMetni).slice(0, 200), ' | Hata =', err.message);
        if (weReserved) await limitIadeEt(limitAnahtari);
        return apiHata(res, 502, 'AI_PARSE_HATASI', 'AI ciktisi parse edilemedi', {
          retry: true,
        });
      }
    }

    if (rezerveLimitDurum) limitHeaderYaz(res, rezerveLimitDurum);
    else limitHeaderYaz(res, await limitDurumGetir(limitAnahtari));
    return apiBasari(res, { yanit: yanitMetni });
  } catch (err) {
    console.error('Sunucu hatası:', err);
    if (weReserved) await limitIadeEt(limitAnahtari).catch(() => {});
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
  const limitServisi = limitServisiDurumuGetir();
  apiBasari(res, {
    kod: 'SAGLIKLI',
    durum: 'calisiyor',
    provider: 'gemini',
    model: GEMINI_MODEL,
    maxGecmisMesaj: MAX_GECMIS_MESAJ,
    redis: limitServisi.redisConfigured,
    redisConfigured: limitServisi.redisConfigured,
    redisReady: limitServisi.redisReady,
    redisRequired: limitServisi.redisRequired,
    limitStore: limitServisi.limitStore,
    trustProxy: TRUST_PROXY,
    firebaseAdmin: firebaseAdminHazir,
  });
});

app.use((_req, res) => {
  res.status(404).json({ ok: false, kod: 'BULUNAMADI', hata: 'Istek edilen kaynak bulunamadi' });
});

app.use((err, req, res, _next) => {
  console.error('Beklenmeyen Sunucu Hatası:', err);
  if (res.headersSent) return;
  res.status(500).json({ ok: false, kod: 'BEKLENMEYEN_HATA', hata: 'Beklenmeyen bir sunucu hatasi olustu' });
});

app.listen(PORT, () => {
  console.log(`Sunucu ${PORT} portunda calisiyor`);
});

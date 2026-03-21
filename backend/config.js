function parseIntEnv(name, fallback) {
  const value = parseInt(process.env[name] || '', 10);
  return Number.isNaN(value) ? fallback : value;
}

function parseBooleanEnv(name, fallback = false) {
  const raw = (process.env[name] || '').trim().toLowerCase();
  if (!raw) return fallback;
  if (['1', 'true', 'yes', 'on'].includes(raw)) return true;
  if (['0', 'false', 'no', 'off'].includes(raw)) return false;
  return fallback;
}

function parseTrustProxy(rawValue) {
  const raw = (rawValue || '').trim().toLowerCase();
  if (!raw) return 1;
  if (['true', 'false'].includes(raw)) return raw === 'true';

  const numeric = Number(raw);
  if (Number.isInteger(numeric) && numeric >= 0) return numeric;

  return rawValue;
}

export const NODE_ENV = process.env.NODE_ENV || 'development';
export const IS_PRODUCTION = NODE_ENV === 'production';

export const PORT = parseIntEnv('PORT', 3001);
export const TRUST_PROXY = parseTrustProxy(process.env.TRUST_PROXY);

export const GEMINI_MODEL = process.env.GEMINI_MODEL || 'gemini-2.5-flash';
export const GEMINI_FALLBACK_MODEL = process.env.GEMINI_FALLBACK_MODEL || 'gemini-2.5-flash-lite';

export const FETCH_TIMEOUT_MS = parseIntEnv('FETCH_TIMEOUT_MS', 20000);
export const MAX_BODY_KB = parseIntEnv('MAX_BODY_KB', 256);
export const MAX_MESAJ_SAYISI = parseIntEnv('MAX_MESAJ_SAYISI', 20);
export const MAX_MESAJ_ICERIK_KARAKTER = parseIntEnv('MAX_MESAJ_ICERIK_KARAKTER', 15000);
export const MAX_GECMIS_MESAJ = parseIntEnv('MAX_GECMIS_MESAJ', 6);

export const MISAFIR_LIMIT = parseIntEnv('MISAFIR_LIMIT', 5);
export const KAYITLI_LIMIT = parseIntEnv('KAYITLI_LIMIT', 20);
export const REKLAM_ODUL_LIMIT = parseIntEnv('REKLAM_ODUL_LIMIT', 3);

export const REDIS_URL = process.env.REDIS_URL || '';
export const REQUIRE_REDIS_IN_PROD = parseBooleanEnv('REQUIRE_REDIS_IN_PROD', IS_PRODUCTION);

export const CORS_ORIGINS = (process.env.CORS_ORIGINS || 'https://fikir-nine.vercel.app')
  .split(',')
  .map((origin) => origin.trim())
  .filter(Boolean);

export const REKLAM_ODUL_OTURUM_TTL_MS = parseIntEnv('REKLAM_ODUL_OTURUM_TTL_MS', 10 * 60 * 1000);
export const REKLAM_ODUL_MIN_BEKLEME_MS = parseIntEnv('REKLAM_ODUL_MIN_BEKLEME_MS', 8000);

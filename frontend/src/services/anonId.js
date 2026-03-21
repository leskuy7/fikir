const ANON_ID_KEY = 'fikir-kutusu-anon-id';
const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

let cachedAnonId = null;

function fallbackUuid() {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (char) => {
    const rand = Math.floor(Math.random() * 16);
    const value = char === 'x' ? rand : (rand & 0x3) | 0x8;
    return value.toString(16);
  });
}

function isValidAnonId(value) {
  return typeof value === 'string' && UUID_RE.test(value.trim());
}

function createAnonId() {
  if (globalThis.crypto?.randomUUID) {
    return globalThis.crypto.randomUUID();
  }
  return fallbackUuid();
}

export function getAnonId() {
  if (cachedAnonId) return cachedAnonId;
  if (typeof window === 'undefined') return null;

  try {
    const existing = localStorage.getItem(ANON_ID_KEY);
    if (isValidAnonId(existing)) {
      cachedAnonId = existing.trim();
      return cachedAnonId;
    }

    const created = createAnonId();
    localStorage.setItem(ANON_ID_KEY, created);
    cachedAnonId = created;
    return cachedAnonId;
  } catch {
    cachedAnonId = createAnonId();
    return cachedAnonId;
  }
}

export function getLimitStorageKey(kullaniciId) {
  if (kullaniciId) return `fikir-kutusu-limit:${kullaniciId}`;

  const anonId = getAnonId();
  return anonId
    ? `fikir-kutusu-limit:anon:${anonId}`
    : 'fikir-kutusu-limit:anon:gecici';
}

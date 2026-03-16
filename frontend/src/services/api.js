import { auth } from './firebase.js';

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || '';
export const SESSION_EXPIRED_EVENT = 'fikir:session-expired';

function hataUret(kod, status = 0, extra = {}) {
  const err = new Error(kod);
  err.status = status;
  err.kod = kod;
  Object.assign(err, extra);
  return err;
}

function parseLimit(headers) {
  const toplam = Number(headers.get('x-limit-total'));
  const kalan = Number(headers.get('x-limit-remaining'));
  const kullanilan = Number(headers.get('x-limit-used'));

  if ([toplam, kalan, kullanilan].some((v) => Number.isNaN(v))) {
    return null;
  }

  return { toplam, kalan, kullanilan };
}

async function cevapJsonOku(response) {
  try {
    return await response.json();
  } catch {
    return null;
  }
}

function hataKoduMaple(response, body) {
  const bodyKod = body?.kod;
  if (typeof bodyKod === 'string' && bodyKod) return bodyKod;

  if (response.status === 401) return 'GIRIS_GEREKLI';
  if (response.status === 403) return 'YETKI_REDDEDILDI';
  if (response.status === 429) return 'LIMIT_DOLDU';
  if (response.status === 502 || response.status === 503) return 'SERVIS_GECICI_HATA';
  return 'SUNUCU_HATASI';
}

function sessionExpiredBildir(kod) {
  if (kod !== 'GIRIS_GEREKLI') return;
  if (typeof window === 'undefined') return;
  window.dispatchEvent(new CustomEvent(SESSION_EXPIRED_EVENT));
}

async function getIdToken(forceRefresh = false) {
  try {
    const user = auth.currentUser;
    if (!user) return null;
    return await user.getIdToken(forceRefresh);
  } catch {
    return null;
  }
}

export async function mesajGonder({ mesajlar, mod, kullaniciId = null, aramOturumId = null }) {
  const url = BACKEND_URL ? `${BACKEND_URL}/api/mesaj` : '/api/mesaj';

  const istegiGonder = async (forceRefresh = false) => {
    const idToken = await getIdToken(forceRefresh);
    const headers = { 'Content-Type': 'application/json' };
    if (idToken) headers.Authorization = `Bearer ${idToken}`;
    if (aramOturumId) headers['x-arama-oturumu'] = aramOturumId;

    return fetch(url, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        mesajlar,
        mod,
        kullaniciId,
      }),
    });
  };

  let response = await istegiGonder(false);
  if (response.status === 401) {
    response = await istegiGonder(true);
  }

  const limit = parseLimit(response.headers);
  const body = await cevapJsonOku(response);
  if (!response.ok) {
    const kod = hataKoduMaple(response, body);
    console.error('API hata detayi', {
      status: response.status,
      kod,
      body,
    });
    sessionExpiredBildir(kod);
    throw hataUret(kod, response.status, { limit, body });
  }

  return {
    yanit: body?.yanit || '',
    limit,
  };
}

export async function limitDurumGetir() {
  const url = BACKEND_URL ? `${BACKEND_URL}/api/limit-durum` : '/api/limit-durum';
  const idToken = await getIdToken(false);
  const headers = {};
  if (idToken) headers.Authorization = `Bearer ${idToken}`;
  const response = await fetch(url, { method: 'GET', headers });
  const limit = parseLimit(response.headers);
  const body = await cevapJsonOku(response);
  if (!response.ok) return null;
  return body?.limit || limit;
}

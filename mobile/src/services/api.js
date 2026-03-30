import { Platform } from 'react-native';
import { auth } from './firebase.js';

const DEV_HOST = Platform.OS === 'android' ? '10.0.2.2' : '127.0.0.1';
const BACKEND_URL =
  process.env.EXPO_PUBLIC_BACKEND_URL?.trim()
  || (__DEV__ ? `http://${DEV_HOST}:3001` : 'https://fikir-production.up.railway.app');

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

  if ([toplam, kalan, kullanilan].some((deger) => Number.isNaN(deger))) {
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
  if (response.status === 408) return 'BAGLANTI_HATASI';
  if (response.status === 429) return 'LIMIT_DOLDU';
  if (response.status === 502 || response.status === 503) return 'SERVIS_GECICI_HATA';
  return 'SUNUCU_HATASI';
}

function baglantiHatasiMi(err) {
  const mesaj = `${err?.message || ''}`.toLowerCase();
  return (
    err?.name === 'AbortError'
    || mesaj.includes('network request failed')
    || mesaj.includes('failed to fetch')
    || mesaj.includes('networkerror')
    || mesaj.includes('timeout')
  );
}

async function getIdToken(forceRefresh = false) {
  try {
    const user = auth?.currentUser ?? null;
    if (!user || typeof user.getIdToken !== 'function') return null;
    return await user.getIdToken(forceRefresh);
  } catch {
    return null;
  }
}

async function yetkiliIstekAt(path, { method = 'GET', body } = {}, forceRefresh = false) {
  const idToken = await getIdToken(forceRefresh);
  const headers = { 'Content-Type': 'application/json' };
  if (idToken) headers.Authorization = `Bearer ${idToken}`;

  return fetch(`${BACKEND_URL}${path}`, {
    method,
    headers,
    ...(body !== undefined ? { body: JSON.stringify(body) } : {}),
  });
}

async function istekGonder(path, options = {}) {
  try {
    let response = await yetkiliIstekAt(path, options, false);
    if (response.status === 401) {
      response = await yetkiliIstekAt(path, options, true);
    }
    return response;
  } catch (err) {
    if (baglantiHatasiMi(err)) {
      throw hataUret('BAGLANTI_HATASI');
    }
    throw err;
  }
}

export async function mesajGonder({
  mesajlar,
  mod,
  kullaniciId = null,
  aramOturumId = null,
  onLimitGuncelle,
  onLimitDoldu,
}) {
  if (!BACKEND_URL) {
    throw hataUret('BACKEND_URL_YOK');
  }

  const istegiGonder = async (forceRefresh = false) => {
    const idToken = await getIdToken(forceRefresh);
    const headers = { 'Content-Type': 'application/json' };
    if (idToken) headers.Authorization = `Bearer ${idToken}`;
    if (aramOturumId) headers['x-arama-oturumu'] = aramOturumId;

    const bodyKullaniciId = idToken ? kullaniciId : null;
    return fetch(`${BACKEND_URL}/api/mesaj`, {
      method: 'POST',
      headers,
      body: JSON.stringify({ mesajlar, mod, kullaniciId: bodyKullaniciId }),
    });
  };

  let response;
  try {
    response = await istegiGonder(false);
    if (response.status === 401) {
      response = await istegiGonder(true);
    }
  } catch (err) {
    if (baglantiHatasiMi(err)) {
      throw hataUret('BAGLANTI_HATASI');
    }
    throw err;
  }

  const limit = parseLimit(response.headers);
  onLimitGuncelle?.(limit);
  const body = await cevapJsonOku(response);

  if (!response.ok) {
    const kod = hataKoduMaple(response, body);
    if (kod === 'LIMIT_DOLDU') {
      onLimitDoldu?.();
    }
    throw hataUret(kod, response.status, { limit, body });
  }

  return {
    yanit: body?.yanit || '',
    limit,
  };
}

export async function reklamOdulOturumuBaslat({ onLimitGuncelle, onLimitDoldu } = {}) {
  if (!BACKEND_URL) {
    throw hataUret('BACKEND_URL_YOK');
  }

  const response = await istekGonder('/api/reklam-odul/oturum', {
    method: 'POST',
  });
  const limit = parseLimit(response.headers);
  onLimitGuncelle?.(limit);
  const body = await cevapJsonOku(response);

  if (!response.ok) {
    const kod = hataKoduMaple(response, body);
    if (kod === 'LIMIT_DOLDU') {
      onLimitDoldu?.();
    }
    throw hataUret(kod, response.status, { limit, body });
  }

  return {
    limit,
    oturum: body?.oturum || null,
  };
}

export async function reklamOdulAl({ oturumId, imza, onLimitGuncelle, onLimitDoldu } = {}) {
  if (!BACKEND_URL) {
    throw hataUret('BACKEND_URL_YOK');
  }
  if (
    typeof oturumId !== 'string'
    || typeof imza !== 'string'
    || !oturumId
    || !imza
  ) {
    throw hataUret('ISTEK_HATASI');
  }

  const response = await istekGonder('/api/reklam-odul', {
    method: 'POST',
    body: { oturumId, imza },
  });
  const limit = parseLimit(response.headers);
  onLimitGuncelle?.(limit);
  const body = await cevapJsonOku(response);

  if (!response.ok) {
    const kod = hataKoduMaple(response, body);
    if (kod === 'LIMIT_DOLDU') {
      onLimitDoldu?.();
    }
    throw hataUret(kod, response.status, { limit, body });
  }

  return {
    limit,
    odul: body?.odul || null,
  };
}

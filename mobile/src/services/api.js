const BACKEND_URL =
  process.env.EXPO_PUBLIC_BACKEND_URL?.trim()
  || (__DEV__ ? 'http://10.0.2.2:3001' : '');

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

export async function mesajGonder({ mesajlar, mod, kullaniciId = null, aramOturumId = null }) {
  if (!BACKEND_URL) {
    throw hataUret('BACKEND_URL_YOK');
  }

  const headers = { 'Content-Type': 'application/json' };
  if (aramOturumId) headers['x-arama-oturumu'] = aramOturumId;

  const response = await fetch(`${BACKEND_URL}/api/mesaj`, {
    method: 'POST',
    headers,
    body: JSON.stringify({ mesajlar, mod, kullaniciId }),
  });

  const limit = parseLimit(response.headers);
  const body = await cevapJsonOku(response);

  if (!response.ok) {
    const kod = hataKoduMaple(response, body);
    throw hataUret(kod, response.status, { limit, body });
  }

  return {
    yanit: body?.yanit || '',
    limit,
  };
}

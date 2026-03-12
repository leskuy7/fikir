const BACKEND_URL =
  process.env.EXPO_PUBLIC_BACKEND_URL?.trim()
  || (__DEV__ ? 'http://10.0.2.2:3001' : '');

export async function mesajGonder({ mesajlar, mod, kullaniciId = null, aramOturumId = null }) {
  if (!BACKEND_URL) {
    throw new Error('BACKEND_URL_YOK');
  }

  const headers = { 'Content-Type': 'application/json' };
  if (aramOturumId) headers['x-arama-oturumu'] = aramOturumId;

  const response = await fetch(`${BACKEND_URL}/api/mesaj`, {
    method: 'POST',
    headers,
    body: JSON.stringify({ mesajlar, mod, kullaniciId }),
  });

  if (response.status === 429) throw new Error('LIMIT_DOLDU');
  if (!response.ok) throw new Error('SUNUCU_HATASI');

  const veri = await response.json();
  return veri.yanit;
}

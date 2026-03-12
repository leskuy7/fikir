import { auth } from './firebase.js';

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || '';

async function getIdToken() {
  try {
    const user = auth.currentUser;
    if (!user) return null;
    return await user.getIdToken();
  } catch {
    return null;
  }
}

export async function mesajGonder({ mesajlar, mod, kullaniciId = null, aramOturumId = null }) {
  const url = BACKEND_URL ? `${BACKEND_URL}/api/mesaj` : '/api/mesaj';
  const idToken = await getIdToken();

  const headers = { 'Content-Type': 'application/json' };
  if (aramOturumId) headers['x-arama-oturumu'] = aramOturumId;

  const response = await fetch(url, {
    method: 'POST',
    headers,
    body: JSON.stringify({
      mesajlar,
      mod,
      kullaniciId,
      ...(idToken && { idToken }),
    }),
  });

  if (response.status === 429) {
    throw new Error('LIMIT_DOLDU');
  }

  if (!response.ok) {
    throw new Error('SUNUCU_HATASI');
  }

  const veri = await response.json();
  return veri.yanit;
}

import {
  collection,
  addDoc,
  setDoc,
  doc,
  getDoc,
  query,
  where,
  limit,
  getDocs,
  serverTimestamp,
} from 'firebase/firestore';
import { db } from './firebase.js';

export async function kullaniciyiKaydet(kullanici) {
  if (!kullanici?.uid) return;

  await setDoc(
    doc(db, 'kullanicilar', kullanici.uid),
    {
      email: kullanici.email || null,
      displayName: kullanici.displayName || null,
      photoURL: kullanici.photoURL || null,
      sonGiris: serverTimestamp(),
    },
    { merge: true }
  );
}

export async function konusmaKaydet(kullaniciId, mod, kartlar, konu) {
  const ref = await addDoc(collection(db, 'konusmalar'), {
    kullaniciId,
    mod,
    kartlar,
    konu,
    tarih: serverTimestamp(),
  });
  return ref.id;
}

// Cache ID üret
export function detayCacheId(kartBaslik, kartKanca) {
  return btoa(unescape(encodeURIComponent(`${kartBaslik}||${kartKanca || ''}`))).slice(0, 100);
}

// Kart detay içeriğini cache olarak kaydet
export async function detayKaydet(kartBaslik, kartKanca, detayIcerik, ilgiliKartlar) {
  if (!kartBaslik || !detayIcerik) return null;
  const cacheId = detayCacheId(kartBaslik, kartKanca);
  await setDoc(doc(db, 'detay_cache', cacheId), {
    kartBaslik,
    kartKanca: kartKanca || '',
    detayIcerik,
    ilgiliKartlar: ilgiliKartlar || [],
    tarih: serverTimestamp(),
  });
  return cacheId;
}

// Kaydedilmiş detay cache'i oku
export async function detayGetir(kartBaslik, kartKanca) {
  if (!kartBaslik) return null;
  const cacheId = detayCacheId(kartBaslik, kartKanca);
  try {
    const snap = await getDoc(doc(db, 'detay_cache', cacheId));
    if (!snap.exists()) return null;
    return snap.data();
  } catch {
    return null;
  }
}

// Cache ID ile doğrudan detay getir (paylaşım linki için)
export async function detayGetirById(cacheId) {
  if (!cacheId) return null;
  try {
    const snap = await getDoc(doc(db, 'detay_cache', cacheId));
    if (!snap.exists()) return null;
    return snap.data();
  } catch {
    return null;
  }
}

export async function konusmalariGetir(kullaniciId) {
  const q = query(
    collection(db, 'konusmalar'),
    where('kullaniciId', '==', kullaniciId),
    limit(20)
  );
  const snapshot = await getDocs(q);
  return snapshot.docs
    .map((doc) => ({ id: doc.id, ...doc.data() }))
    .sort((a, b) => (b.tarih?.seconds || 0) - (a.tarih?.seconds || 0));
}

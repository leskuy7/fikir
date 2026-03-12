import {
  collection,
  addDoc,
  setDoc,
  doc,
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
  await addDoc(collection(db, 'konusmalar'), {
    kullaniciId,
    mod,
    kartlar,
    konu,
    tarih: serverTimestamp(),
  });
}

export async function konusmalariGetir(kullaniciId) {
  const q = query(
    collection(db, 'konusmalar'),
    where('kullaniciId', '==', kullaniciId),
    limit(50)
  );
  const snapshot = await getDocs(q);
  return snapshot.docs
    .map((doc) => ({ id: doc.id, ...doc.data() }))
    .sort((a, b) => (b.tarih?.seconds || 0) - (a.tarih?.seconds || 0))
    .slice(0, 20);
}

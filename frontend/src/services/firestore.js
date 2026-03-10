import {
  collection,
  addDoc,
  query,
  where,
  orderBy,
  limit,
  getDocs,
  serverTimestamp,
} from 'firebase/firestore';
import { db } from './firebase.js';

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
    orderBy('tarih', 'desc'),
    limit(20)
  );
  const snapshot = await getDocs(q);
  return snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
}

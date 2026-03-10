import Redis from 'ioredis';

const MISAFIR_LIMIT = 10;
const KAYITLI_LIMIT = 30;

let redis = null;
if (process.env.REDIS_URL) {
  try {
    redis = new Redis(process.env.REDIS_URL);
    redis.on('error', (err) => console.warn('Redis bağlantı hatası:', err.message));
  } catch (err) {
    console.warn('Redis başlatılamadı:', err.message);
  }
}

const sayac = new Map();

function getLimit(anahtar) {
  return anahtar?.startsWith('uid:') ? KAYITLI_LIMIT : MISAFIR_LIMIT;
}

function geceYarisiSaniye() {
  const simdi = new Date();
  const geceyarisi = new Date();
  geceyarisi.setHours(24, 0, 0, 0);
  return Math.max(1, Math.floor((geceyarisi - simdi) / 1000));
}

// Redis kullanılıyorsa async, değilse sync
export async function limitKontrol(anahtar) {
  if (redis) {
    try {
      const sayi = await redis.get(`limit:${anahtar}`);
      const limit = getLimit(anahtar);
      return sayi !== null && parseInt(sayi, 10) >= limit;
    } catch {
      return false;
    }
  }

  const simdi = Date.now();
  const kayit = sayac.get(anahtar);
  if (!kayit) return false;
  if (simdi > kayit.sifirlanmaTarihi) {
    sayac.delete(anahtar);
    return false;
  }
  const limit = getLimit(anahtar);
  return kayit.sayi >= limit;
}

export async function limitArtir(anahtar) {
  if (redis) {
    try {
      const key = `limit:${anahtar}`;
      const mevcutSayi = await redis.incr(key);
      if (mevcutSayi === 1) {
        await redis.expire(key, geceYarisiSaniye());
      }
    } catch (err) {
      console.warn('Redis limitArtir hatası:', err.message);
    }
    return;
  }

  const simdi = Date.now();
  const geceyarisi = new Date();
  geceyarisi.setHours(24, 0, 0, 0);
  const mevcutKayit = sayac.get(anahtar);

  if (!mevcutKayit || simdi > mevcutKayit.sifirlanmaTarihi) {
    sayac.set(anahtar, {
      sayi: 1,
      sifirlanmaTarihi: geceyarisi.getTime(),
    });
  } else {
    mevcutKayit.sayi++;
  }
}

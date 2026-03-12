import Redis from 'ioredis';

const MISAFIR_LIMIT = 5;
const KAYITLI_LIMIT = 20;

export class LimitServisiHatasi extends Error {
  constructor(message = 'Limit servisine su an ulasilamiyor') {
    super(message);
    this.name = 'LimitServisiHatasi';
  }
}

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

function limitiHesapla(limit, sayi) {
  const kullanilan = Math.max(0, Math.min(sayi, limit));
  return {
    limit,
    kullanilan,
    kalan: Math.max(0, limit - kullanilan),
    limitAsildi: kullanilan >= limit,
  };
}

function geceYarisiSaniye() {
  const simdi = new Date();
  const geceyarisi = new Date();
  geceyarisi.setHours(24, 0, 0, 0);
  return Math.max(1, Math.floor((geceyarisi - simdi) / 1000));
}

export async function limitDurumGetir(anahtar) {
  const limit = getLimit(anahtar);

  if (redis) {
    try {
      const sayi = await redis.get(`limit:${anahtar}`);
      const kullanilan = sayi !== null ? parseInt(sayi, 10) : 0;
      return limitiHesapla(limit, Number.isNaN(kullanilan) ? 0 : kullanilan);
    } catch {
      throw new LimitServisiHatasi();
    }
  }

  const simdi = Date.now();
  const kayit = sayac.get(anahtar);
  if (!kayit) return limitiHesapla(limit, 0);
  if (simdi > kayit.sifirlanmaTarihi) {
    sayac.delete(anahtar);
    return limitiHesapla(limit, 0);
  }
  return limitiHesapla(limit, kayit.sayi);
}

export async function limitArtir(anahtar) {
  const limit = getLimit(anahtar);

  if (redis) {
    try {
      const key = `limit:${anahtar}`;
      const mevcutSayi = await redis.incr(key);
      if (mevcutSayi === 1) {
        await redis.expire(key, geceYarisiSaniye());
      }
      return limitiHesapla(limit, mevcutSayi);
    } catch (err) {
      console.warn('Redis limitArtir hatasi:', err.message);
      throw new LimitServisiHatasi();
    }
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
    return limitiHesapla(limit, 1);
  } else {
    mevcutKayit.sayi++;
    return limitiHesapla(limit, mevcutKayit.sayi);
  }
}

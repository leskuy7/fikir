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
let redisHazir = false;

if (process.env.REDIS_URL) {
  try {
    redis = new Redis(process.env.REDIS_URL, {
      connectTimeout: 3000,
      maxRetriesPerRequest: 1,
      retryStrategy(times) {
        if (times > 3) return null; // Stop retrying after 3 attempts
        return Math.min(times * 200, 1000);
      },
    });
    
    redis.on('ready', () => {
      redisHazir = true;
      console.log('Redis bağlandı ve hazır.');
    });

    redis.on('error', (err) => {
      redisHazir = false;
      console.warn('Redis bağlantı hatası:', err.message);
    });
    
    redis.on('end', () => {
      redisHazir = false;
    });

  } catch (err) {
    redisHazir = false;
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

  if (redis && redisHazir) {
    try {
      const sayi = await redis.get(`limit:${anahtar}`);
      const kullanilan = sayi !== null ? parseInt(sayi, 10) : 0;
      return limitiHesapla(limit, Number.isNaN(kullanilan) ? 0 : kullanilan);
    } catch {
      // Redis errors gracefully fallback instead of throwing LimitServisiHatasi
      console.warn('Redis get hatasi, bellege dusuluyor');
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

  if (redis && redisHazir) {
    try {
      const key = `limit:${anahtar}`;
      const mevcutSayi = await redis.incr(key);
      if (mevcutSayi === 1) {
        await redis.expire(key, geceYarisiSaniye());
      }
      return limitiHesapla(limit, mevcutSayi);
    } catch (err) {
      console.warn('Redis limitArtir hatasi, bellege dusuluyor:', err.message);
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

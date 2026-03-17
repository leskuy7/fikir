import Redis from 'ioredis';

const MISAFIR_LIMIT = parseInt(process.env.MISAFIR_LIMIT, 10) || 5;
const KAYITLI_LIMIT = parseInt(process.env.KAYITLI_LIMIT, 10) || 20;
const REKLAM_ODUL_LIMIT = Number.isNaN(parseInt(process.env.REKLAM_ODUL_LIMIT, 10))
  ? 3
  : parseInt(process.env.REKLAM_ODUL_LIMIT, 10);

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
const odulSayac = new Map();
const MAX_BELLEK_KAYIT = 100000;

setInterval(() => {
  const simdi = Date.now();
  for (const [anahtar, kayit] of sayac.entries()) {
    if (simdi > kayit.sifirlanmaTarihi) sayac.delete(anahtar);
  }
  for (const [anahtar, kayit] of odulSayac.entries()) {
    if (simdi > kayit.sifirlanmaTarihi) odulSayac.delete(anahtar);
  }
  if (!redisHazir && sayac.size > 0) {
    console.warn(`Redis devre disi — bellek limit sayaci aktif (${sayac.size} kayit)`);
  }
}, 60 * 60 * 1000);

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
  const geceyarisi = new Date(simdi);
  geceyarisi.setDate(geceyarisi.getDate() + 1);
  geceyarisi.setHours(0, 0, 0, 0);
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
      const ttl = geceYarisiSaniye();
      const script = "local c = redis.call('INCR', KEYS[1]); if c == 1 then redis.call('EXPIRE', KEYS[1], ARGV[1]) end; return c";
      const mevcutSayi = await redis.eval(script, 1, key, ttl);
      return limitiHesapla(limit, mevcutSayi);
    } catch (err) {
      console.warn('Redis limitArtir hatasi, bellege dusuluyor:', err.message);
    }
  }

  const simdi = Date.now();
  const geceyarisi = new Date();
  geceyarisi.setDate(geceyarisi.getDate() + 1);
  geceyarisi.setHours(0, 0, 0, 0);
  const mevcutKayit = sayac.get(anahtar);

  if (!mevcutKayit || simdi > mevcutKayit.sifirlanmaTarihi) {
    if (sayac.size >= MAX_BELLEK_KAYIT) {
      const ilkAnahtar = sayac.keys().next().value;
      sayac.delete(ilkAnahtar);
    }
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

export async function limitIadeEt(anahtar) {
  const limit = getLimit(anahtar);

  if (redis && redisHazir) {
    try {
      const key = `limit:${anahtar}`;
      const sayi = await redis.get(key);
      const mevcut = sayi !== null ? parseInt(sayi, 10) : 0;
      if (Number.isNaN(mevcut) || mevcut <= 0) return limitiHesapla(limit, 0);
      await redis.decr(key);
      return limitiHesapla(limit, mevcut - 1);
    } catch (err) {
      console.warn('Redis limitIadeEt hatasi, bellege dusuluyor:', err.message);
    }
  }

  const simdi = Date.now();
  const kayit = sayac.get(anahtar);
  if (!kayit || simdi > kayit.sifirlanmaTarihi) return limitiHesapla(limit, 0);
  kayit.sayi = Math.max(0, kayit.sayi - 1);
  return limitiHesapla(limit, kayit.sayi);
}

export async function reklamOdulHakkiKullan(anahtar) {
  const limit = REKLAM_ODUL_LIMIT;
  if (!limit || limit <= 0) {
    return { limit: 0, kullanilan: 0, kalan: 0, uygun: false };
  }

  if (redis && redisHazir) {
    try {
      const key = `reward:${anahtar}`;
      const ttl = geceYarisiSaniye();
      const script =
        "local c = tonumber(redis.call('GET', KEYS[1]) or '0'); " +
        "local lim = tonumber(ARGV[1]); " +
        "if c >= lim then return -1 end; " +
        "c = redis.call('INCR', KEYS[1]); " +
        "if c == 1 then redis.call('EXPIRE', KEYS[1], ARGV[2]) end; " +
        "return c";
      const kullanilan = await redis.eval(script, 1, key, limit, ttl);
      if (kullanilan === -1) {
        return { limit, kullanilan: limit, kalan: 0, uygun: false };
      }
      return {
        limit,
        kullanilan,
        kalan: Math.max(0, limit - kullanilan),
        uygun: true,
      };
    } catch (err) {
      console.warn('Redis reklam odul hatasi, bellege dusuluyor:', err.message);
    }
  }

  const simdi = Date.now();
  const geceyarisi = new Date();
  geceyarisi.setDate(geceyarisi.getDate() + 1);
  geceyarisi.setHours(0, 0, 0, 0);
  const mevcutKayit = odulSayac.get(anahtar);

  if (!mevcutKayit || simdi > mevcutKayit.sifirlanmaTarihi) {
    if (odulSayac.size >= MAX_BELLEK_KAYIT) {
      const ilkAnahtar = odulSayac.keys().next().value;
      odulSayac.delete(ilkAnahtar);
    }
    odulSayac.set(anahtar, {
      sayi: 1,
      sifirlanmaTarihi: geceyarisi.getTime(),
    });
    return { limit, kullanilan: 1, kalan: Math.max(0, limit - 1), uygun: true };
  }

  if (mevcutKayit.sayi >= limit) {
    return { limit, kullanilan: mevcutKayit.sayi, kalan: 0, uygun: false };
  }

  mevcutKayit.sayi += 1;
  return {
    limit,
    kullanilan: mevcutKayit.sayi,
    kalan: Math.max(0, limit - mevcutKayit.sayi),
    uygun: true,
  };
}

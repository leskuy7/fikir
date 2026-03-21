import Redis from 'ioredis';
import {
  IS_PRODUCTION,
  KAYITLI_LIMIT,
  MISAFIR_LIMIT,
  REDIS_URL,
  REQUIRE_REDIS_IN_PROD,
  REKLAM_ODUL_LIMIT,
} from '../config.js';

export class LimitServisiHatasi extends Error {
  constructor(message = 'Limit servisine su an ulasilamiyor') {
    super(message);
    this.name = 'LimitServisiHatasi';
  }
}

const REDIS_ZORUNLU = IS_PRODUCTION && REQUIRE_REDIS_IN_PROD;
const MAX_BELLEK_KAYIT = 100000;

let redis = null;
let redisHazir = false;

if (REDIS_URL) {
  try {
    redis = new Redis(REDIS_URL, {
      connectTimeout: 3000,
      maxRetriesPerRequest: 1,
      retryStrategy(times) {
        return Math.min(times * 250, 5000);
      },
    });

    redis.on('ready', () => {
      redisHazir = true;
      console.log('Redis baglandi ve hazir.');
    });

    redis.on('error', (err) => {
      redisHazir = false;
      console.warn('Redis baglanti hatasi:', err.message);
    });

    redis.on('end', () => {
      redisHazir = false;
    });
  } catch (err) {
    redisHazir = false;
    console.warn('Redis baslatilamadi:', err.message);
  }
} else if (REDIS_ZORUNLU) {
  console.warn('REDIS_URL eksik - production ortaminda limit servisi kullanilamayacak.');
}

const sayac = new Map();
const odulSayac = new Map();

setInterval(() => {
  const simdi = Date.now();
  for (const [anahtar, kayit] of sayac.entries()) {
    if (simdi > kayit.sifirlanmaTarihi) sayac.delete(anahtar);
  }
  for (const [anahtar, kayit] of odulSayac.entries()) {
    if (simdi > kayit.sifirlanmaTarihi) odulSayac.delete(anahtar);
  }

  if (!redisHazir && !REDIS_ZORUNLU && sayac.size > 0) {
    console.warn(`Redis devre disi - bellek limit sayaci aktif (${sayac.size} kayit)`);
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

function bellekFallbackUygunMu() {
  return !REDIS_ZORUNLU;
}

function bellekFallbackOncesiKontrol(etap) {
  if (bellekFallbackUygunMu()) return;
  throw new LimitServisiHatasi(`Redis kullanilabilir degil (${etap})`);
}

function bellekSayaciGetir(harita, anahtar) {
  const simdi = Date.now();
  const kayit = harita.get(anahtar);
  if (!kayit) return null;
  if (simdi > kayit.sifirlanmaTarihi) {
    harita.delete(anahtar);
    return null;
  }
  return kayit;
}

function bellekKaydiBaslat(harita, anahtar) {
  const geceyarisi = new Date();
  geceyarisi.setDate(geceyarisi.getDate() + 1);
  geceyarisi.setHours(0, 0, 0, 0);

  if (harita.size >= MAX_BELLEK_KAYIT) {
    const ilkAnahtar = harita.keys().next().value;
    harita.delete(ilkAnahtar);
  }

  const yeniKayit = {
    sayi: 1,
    sifirlanmaTarihi: geceyarisi.getTime(),
  };
  harita.set(anahtar, yeniKayit);
  return yeniKayit;
}

function redisKullanilabilirMi() {
  return Boolean(redis && redisHazir);
}

export function limitServisiDurumuGetir() {
  return {
    redisConfigured: Boolean(REDIS_URL),
    redisReady: redisKullanilabilirMi(),
    redisRequired: REDIS_ZORUNLU,
    limitStore: redisKullanilabilirMi() ? 'redis' : (bellekFallbackUygunMu() ? 'memory' : 'unavailable'),
    memoryEntries: sayac.size,
  };
}

export async function limitDurumGetir(anahtar) {
  const limit = getLimit(anahtar);

  if (redisKullanilabilirMi()) {
    try {
      const sayi = await redis.get(`limit:${anahtar}`);
      const kullanilan = sayi !== null ? parseInt(sayi, 10) : 0;
      return limitiHesapla(limit, Number.isNaN(kullanilan) ? 0 : kullanilan);
    } catch (err) {
      console.warn('Redis get hatasi:', err.message);
    }
  }

  bellekFallbackOncesiKontrol('limit-durum');

  const kayit = bellekSayaciGetir(sayac, anahtar);
  return limitiHesapla(limit, kayit?.sayi || 0);
}

export async function limitArtir(anahtar) {
  const limit = getLimit(anahtar);

  if (redisKullanilabilirMi()) {
    try {
      const key = `limit:${anahtar}`;
      const ttl = geceYarisiSaniye();
      const script = "local c = redis.call('INCR', KEYS[1]); if c == 1 then redis.call('EXPIRE', KEYS[1], ARGV[1]) end; return c";
      const mevcutSayi = await redis.eval(script, 1, key, ttl);
      return limitiHesapla(limit, mevcutSayi);
    } catch (err) {
      console.warn('Redis limitArtir hatasi:', err.message);
    }
  }

  bellekFallbackOncesiKontrol('limit-artir');

  const mevcutKayit = bellekSayaciGetir(sayac, anahtar);
  if (!mevcutKayit) {
    const yeniKayit = bellekKaydiBaslat(sayac, anahtar);
    return limitiHesapla(limit, yeniKayit.sayi);
  }

  mevcutKayit.sayi += 1;
  return limitiHesapla(limit, mevcutKayit.sayi);
}

export async function limitIadeEt(anahtar) {
  const limit = getLimit(anahtar);

  if (redisKullanilabilirMi()) {
    try {
      const key = `limit:${anahtar}`;
      const sayi = await redis.get(key);
      const mevcut = sayi !== null ? parseInt(sayi, 10) : 0;
      if (Number.isNaN(mevcut) || mevcut <= 0) return limitiHesapla(limit, 0);
      await redis.decr(key);
      return limitiHesapla(limit, mevcut - 1);
    } catch (err) {
      console.warn('Redis limitIadeEt hatasi:', err.message);
    }
  }

  bellekFallbackOncesiKontrol('limit-iade');

  const kayit = bellekSayaciGetir(sayac, anahtar);
  if (!kayit) return limitiHesapla(limit, 0);

  kayit.sayi = Math.max(0, kayit.sayi - 1);
  return limitiHesapla(limit, kayit.sayi);
}

export async function reklamOdulHakkiKullan(anahtar) {
  const limit = REKLAM_ODUL_LIMIT;
  if (!limit || limit <= 0) {
    return { limit: 0, kullanilan: 0, kalan: 0, uygun: false };
  }

  if (redisKullanilabilirMi()) {
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
      console.warn('Redis reklam odul hatasi:', err.message);
    }
  }

  bellekFallbackOncesiKontrol('reklam-odul-kullan');

  const mevcutKayit = bellekSayaciGetir(odulSayac, anahtar);
  if (!mevcutKayit) {
    const yeniKayit = bellekKaydiBaslat(odulSayac, anahtar);
    return { limit, kullanilan: yeniKayit.sayi, kalan: Math.max(0, limit - yeniKayit.sayi), uygun: true };
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

export async function reklamOdulDurumGetir(anahtar) {
  const limit = REKLAM_ODUL_LIMIT;
  if (!limit || limit <= 0) {
    return { limit: 0, kullanilan: 0, kalan: 0, uygun: false };
  }

  if (redisKullanilabilirMi()) {
    try {
      const sayi = await redis.get(`reward:${anahtar}`);
      const kullanilan = sayi !== null ? parseInt(sayi, 10) : 0;
      const guvenliKullanilan = Number.isNaN(kullanilan) ? 0 : Math.max(0, kullanilan);
      return {
        limit,
        kullanilan: guvenliKullanilan,
        kalan: Math.max(0, limit - guvenliKullanilan),
        uygun: guvenliKullanilan < limit,
      };
    } catch (err) {
      console.warn('Redis reklam odul durum hatasi:', err.message);
    }
  }

  bellekFallbackOncesiKontrol('reklam-odul-durum');

  const kayit = bellekSayaciGetir(odulSayac, anahtar);
  if (!kayit) {
    return { limit, kullanilan: 0, kalan: limit, uygun: true };
  }

  return {
    limit,
    kullanilan: kayit.sayi,
    kalan: Math.max(0, limit - kayit.sayi),
    uygun: kayit.sayi < limit,
  };
}

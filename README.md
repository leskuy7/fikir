# Fikir Monorepo

Bu depo tek bir monorepo icinde uc uygulama barindirir:

- `backend`: Express + Gemini + Firebase Admin API
- `frontend`: Vite + React web istemcisi
- `mobile`: Expo + React Native mobil istemci

## Gereksinimler

- Node `20.19.4`
- npm `11+`
- Docker Desktop veya yerel Redis (opsiyonel ama backend limit davranisi icin onerilir)

`nvm` kullaniyorsan:

```bash
nvm install 20.19.4
nvm use 20.19.4
node -v
```

## Hizli Baslangic

### Backend

```bash
cd backend
cp .env.example .env
npm ci
npm run dev
```

Minimum gerekli alanlar:

- `GEMINI_API_KEY`
- `REKLAM_ODUL_SECRET` (`production` icin zorunlu, development'ta yoksa gecici anahtar uretilir)
- `REDIS_URL` (`production` + `REQUIRE_REDIS_IN_PROD=true` icin zorunlu)
- `CORS_ORIGINS` (web farkli domainden gelecekse)
- `FIREBASE_SERVICE_ACCOUNT` (auth dogrulamasi icin)

Saglik kontrolu:

```bash
curl http://localhost:3001/health
```

`/health` artik `redisConfigured`, `redisReady`, `redisRequired`, `limitStore` ve `trustProxy` alanlarini raporlar.

### Redis ile yerel calisma

`compose.yaml` sadece backend + Redis senaryosunu hizlica kaldirmak icin eklendi:

```bash
docker compose up --build
```

Sadece Redis istersen:

```bash
docker run --rm -p 6379:6379 redis:7-alpine
```

### Web istemcisi

```bash
cd frontend
cp .env.example .env
npm ci
npm run dev
```

Notlar:

- Local gelistirmede `/api` otomatik olarak `http://localhost:3001` adresine proxy edilir.
- Production icin `VITE_BACKEND_URL` tanimla.
- Web misafir modunda kalir; backend isteklerine otomatik `x-anon-id` gonderilir.

### Mobil istemci

```bash
cd mobile
cp .env.example .env
npm ci
npm run start
```

Mobil uygulamada Google ile giris zorunludur. Uygulama acildiginda auth gate devreye girer; giris olmadan `Home`, `Kartlar` ve `Detay` ekranlari acilmaz.

#### Mobil Google OAuth kurulumu

Firebase Console:

1. `Authentication > Sign-in method` altinda Google provider'ini ac.
2. Web app ayarlarindan `EXPO_PUBLIC_FIREBASE_*` alanlarini doldur.
3. Su client ID'leri olustur:
   - Web client
   - Android client (`EXPO_ANDROID_PACKAGE` ile ayni paket adi)
   - iOS client (`EXPO_IOS_BUNDLE_IDENTIFIER` ile ayni bundle id)
4. Bu degerleri `mobile/.env` icine yaz:
   - `EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID`
   - `EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID`
   - `EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID`

Expo notlari:

- Uygulama semasi `fikirkutusu` olarak tanimli.
- `expo-web-browser` plugini aktiftir.
- Android emulatorde backend local calisiyorsa `10.0.2.2:3001` kullan.

## Limit davranisi

- Auth'lu kullanici limiti `uid:<firebase_uid>` ile tutulur.
- Web misafir kullanicisi `x-anon-id` ile ayrisir, header yoksa IP fallback devreye girer.
- Production ortaminda `REQUIRE_REDIS_IN_PROD=true` ise Redis yokken bellek fallback kullanilmaz; endpoint'ler `503 LIMIT_SERVISI_KULLANILAMIYOR` dondurur.
- Gemini upstream 429 hatalari uygulama limiti ile karismaz; `SERVIS_LIMITI_DOLDU` olarak doner.

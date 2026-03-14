# Yayınlama ve Ücretli API Kontrol Listesi

Backend (Railway), frontend (Vercel), Firebase ve Google Cloud (Gemini) için tek yerden kontrol listesi.

---

## 1. Railway (Backend)

**Nerede:** [railway.app](https://railway.app) → Projen → Backend servisi → Variables

**Ayarlanacak env değişkenleri:**

| Değişken | Zorunlu | Açıklama |
|----------|---------|----------|
| `GEMINI_API_KEY` | Evet | Google AI Studio veya Cloud Console’dan API anahtarı |
| `FIREBASE_SERVICE_ACCOUNT` | Evet (giriş için) | Firebase Service Account JSON’u **tek satır** (tırnak/escape’e dikkat) |
| `REDIS_URL` | Önerilir | Redis eklentisi eklediysen Railway otomatik atar; yoksa limit bellek fallback’te kalır |
| `PORT` | Hayır | Railway genelde otomatik atar (3001 kullanıyorsan değiştirme) |
| `GEMINI_MODEL` | Hayır | Varsayılan: `gemini-2.5-flash` |
| `CORS_ORIGINS` | İsteğe bağlı | Ek CORS origin’ler; virgülle ayır. Örn: `https://app.example.com,https://www.example.com` |

**Not:** Frontend adresin `https://fikir-nine.vercel.app` dışındaysa (farklı domain/alt domain), ya `CORS_ORIGINS` ile ekle ya da backend kodundaki `IZNLI_ORIGINLER` listesine ekleyip tekrar deploy et.

---

## 2. Firebase Console

**Nerede:** [console.firebase.google.com](https://console.firebase.google.com) → Projen

### Authentication
- **Sign-in method:** Google’ı etkinleştir.
- **Authorized domains:**  
  - Web: Vercel’deki site adresin (örn. `fikir-nine.vercel.app` veya kendi domain’in).  
  - Eksikse “Add domain” ile ekle; yoksa giriş CORS/auth hatası verebilir.

### Service Account (Backend için)
- **Project Settings** → **Service accounts** → **Generate new private key**.
- İndirdiğin JSON’u **tek satır** yapıp Railway’deki `FIREBASE_SERVICE_ACCOUNT` değişkenine yapıştır (satır sonu ve gereksiz boşluk olmasın).

### Mobil uygulama (APK)
- Aynı projede **Android** uygulaması ekle; package name: `com.yksel.fikirkutusu` (veya `app.config.js`’teki değer).
- Web’de kullandığın Firebase config’i (apiKey, authDomain, projectId) mobil `.env` / EAS env’de de aynı olsun.

---

## 3. Vercel (Frontend – Vite)

**Nerede:** [vercel.com](https://vercel.com) → Projen → Settings → Environment Variables

**Ayarlanacak env değişkenleri:**

| Değişken | Zorunlu | Açıklama |
|----------|---------|----------|
| `VITE_BACKEND_URL` | Evet (prod) | Railway backend URL’i. Örn: `https://fikir-production.up.railway.app` |
| `VITE_FIREBASE_API_KEY` | Evet (giriş için) | Firebase Web app config |
| `VITE_FIREBASE_AUTH_DOMAIN` | Evet | Genelde `proje-id.firebaseapp.com` |
| `VITE_FIREBASE_PROJECT_ID` | Evet | Firebase proje ID |
| `VITE_APK_DOWNLOAD_URL` | İsteğe bağlı | APK indirme linki (EAS veya kendi storage) |
| `VITE_GA_MEASUREMENT_ID` | İsteğe bağlı | Google Analytics 4 (örn. `G-XXXXXXX`) |

Değişiklikten sonra **Redeploy** et.

---

## 4. Google Cloud / Gemini (Ücretli API)

**Nerede:** [aistudio.google.com](https://aistudio.google.com/app/apikey) veya [Google Cloud Console](https://console.cloud.google.com)

### Ücretsiz kotadan ücretli kullanıma geçmek
1. **Google Cloud Console** → Aynı proje (Firebase projesiyle aynı olabilir veya ayrı).
2. **Billing:** Hesaba fatura bilgisi ekle (Ücretli kullanım için zorunlu).
3. **APIs & Services** → **Enable APIs** → **Generative Language API** açık olsun.
4. **Credentials** → API anahtarı oluştur veya AI Studio’daki anahtarı kullan.

### API anahtarı güvenliği (önerilir)
- **API key restrictions:**  
  - Backend (Railway) için: “IP addresses” ile sadece Railway IP’leri veya “None” (sadece backend env’de tuttuğun sürece).  
  - Web’den **doğrudan** Gemini’ye istek atmıyorsan (hepsi backend’den gidiyorsa) anahtar sadece sunucuda olmalı; kısıtlama “IP” veya “None” yeterli.
- **Application restrictions:** “None” (anahtar backend’de) veya “HTTP referrers” (sadece web’de kullanıyorsan).

### Kota / bütçe
- **Quotas:** Cloud Console → APIs & Services → Generative Language API → Quotas; gerekirse artır.
- **Billing alerts:** Billing → Budgets & alerts ile uyarı koy; beklenmedik faturaları önler.

---

## 5. Mobil (EAS / APK)

- **eas.json** içinde `EXPO_PUBLIC_BACKEND_URL` production Railway URL’i ile dolu (zaten `https://fikir-production.up.railway.app`).
- EAS Build’te (veya mobil `.env`’de) aynı Firebase config: `EXPO_PUBLIC_FIREBASE_API_KEY`, `EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN`, `EXPO_PUBLIC_FIREBASE_PROJECT_ID`.

---

## Hızlı kontrol

- **Backend 401 / “Giriş gerekli”:** Firebase Authorized domains + `FIREBASE_SERVICE_ACCOUNT` doğru mu?
- **CORS hatası:** Frontend URL’i `IZNLI_ORIGINLER` veya `CORS_ORIGINS` içinde mi?
- **Gemini 429 / 403:** Billing açık mı, API açık mı, anahtar doğru mu?
- **Limit çalışmıyor:** Railway’de `REDIS_URL` atanmış mı?

Bu listeyi doldurduktan sonra Railway, Firebase, Vercel ve Google Cloud tarafında ek bir değişiklik yapmana gerek kalmaz; sadece env ve konsol ayarlarını kontrol etmen yeterli.

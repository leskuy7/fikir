# Android APK İndirme Linki

## APK nasıl üretilir?

```bash
cd mobile
npm run build:android:apk
```

EAS Build bittikten sonra [expo.dev](https://expo.dev) → projen → **Builds** → ilgili build’e tıkla. **Artifacts** bölümünde **Download** ile APK indirme linkini alırsın.

## Web sitesinde göstermek

1. Frontend `.env` (veya Vercel/hosting env) içine ekle:
   ```
   VITE_APK_DOWNLOAD_URL=https://expo.dev/artifacts/eas/xxxxxx.apk
   ```
2. Siteyi yeniden deploy et. Footer’da **Android APK İndir** linki çıkar; URL tanımlı değilse link görünmez.

Not: EAS’in verdiği link süresi sınırlı olabilir. Kalıcı link için APK’yı kendi storage’ına (örn. Vercel Blob, S3) yükleyip o URL’i kullanabilirsin.

---

## Build "Install dependencies" hatası alırsan

1. **Loglara bak:** expo.dev → Builds → ilgili build → "Install dependencies" adımına tıkla; tam hata mesajı orada.
2. **Cache sıfırla:** `eas.json` içinde `preview-apk` altındaki `cache.key` değerini değiştir (örn. `preview-apk-v2`), tekrar build al.
3. **Yerelde dene:** `cd mobile && rm -rf node_modules && npm install` — yerelde de hata veriyorsa önce onu düzelt.
4. **Expo proje ayarları:** expo.dev → Project → Build settings → "Use the New Android Builds Infrastructure" kapalıysa açıp veya açıksa kapatıp tekrar dene.

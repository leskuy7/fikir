# Fikir Kutusu — Play Store Yükleme Rehberi

## Genel Bakış

Bu rehber, Fikir Kutusu mobil uygulamasını Google Play Store'a yükleme adımlarını açıklar.

**Mevcut Durum:**
- Paket adı: `com.yksel.fikirkutusu`
- EAS Project ID: `f553e6b3-5e8a-464d-a38c-82fcbe31ff45`
- AdMob: Test ID'leri yapılandırılmış (yayından önce gerçek ID'lerle değiştirilmeli)

---

## Adım 1: Google Play Console'da Uygulama Oluştur

1. [Google Play Console](https://play.google.com/console)'a git
2. **"Uygulama oluştur"** butonuna tıkla
3. Bilgileri doldur:
   - **Uygulama adı:** Fikir Kutusu
   - **Varsayılan dil:** Türkçe
   - **Uygulama türü:** Uygulama
   - **Ücretsiz/Ücretli:** Ücretsiz
4. Bildirimleri kabul et ve "Uygulama oluştur"a tıkla

---

## Adım 2: Google Cloud Service Account JSON Oluştur

Bu dosya, EAS'ın otomatik olarak Play Store'a yükleme yapabilmesi için gerekli.

### 2a. Google Cloud Console'da Service Account Oluştur

1. [Google Cloud Console](https://console.cloud.google.com) → **IAM & Admin** → **Service Accounts**
2. Üstte projeyi seç (Play Console ile aynı Google hesabına bağlı proje)
3. **"Service Account Oluştur"** butonuna tıkla
4. Bilgiler:
   - **Ad:** eas-play-store
   - **Açıklama:** EAS otomatik yükleme
5. **"Oluştur ve devam et"** tıkla
6. Rol olarak şimdilik boş bırak, **"Bitti"** tıkla

### 2b. JSON Anahtar Dosyası İndir

1. Oluşturduğun **eas-play-store** service account'a tıkla
2. **"Anahtarlar"** sekmesine git
3. **"Anahtar ekle"** → **"Yeni anahtar oluştur"** → **JSON** seç
4. İnen dosyayı `mobile/google-services.json` olarak kaydet

### 2c. Play Console'a Service Account'ı Bağla

1. [Google Play Console](https://play.google.com/console) → **Ayarlar** → **API erişimi**
2. **"Google Cloud projesini bağla"** kısmında doğru projeyi seç
3. Aşağıda service account'ı göreceksin → **"Erişim izni ver"**
4. İzinler:
   - **Yayınları yönet:** Evet
   - **Uygulama bilgilerini düzenle:** Evet
5. **"Kullanıcıyı davet et"** tıkla

---

## Adım 3: AdMob ID'lerini Güncelle (Yayından Önce!)

1. [AdMob Console](https://admob.google.com)'a git
2. Yeni bir uygulama ekle: **Uygulamalar** → **Uygulama ekle**
3. Android seç, Play Store'da henüz yayınlanmadıysa "Hayır" de
4. Uygulama adını gir, oluştur
5. Reklam birimleri oluştur:
   - **Banner** → ID'yi not al
   - **Geçiş (Interstitial)** → ID'yi not al
6. `mobile/.env` dosyasını güncelle:

```
ADMOB_ANDROID_APP_ID=ca-app-pub-XXXXXXXXXXXXXXXX~XXXXXXXXXX
EXPO_PUBLIC_ADMOB_BANNER_ID=ca-app-pub-XXXXXXXXXXXXXXXX/XXXXXXXXXX
EXPO_PUBLIC_ADMOB_INTERSTITIAL_ID=ca-app-pub-XXXXXXXXXXXXXXXX/XXXXXXXXXX
```

7. `mobile/app.config.js` zaten `.env`'den okuyor, başka değişiklik gerekmez.

---

## Adım 4: AAB (Android App Bundle) Oluştur

Terminal'de `mobile/` klasörüne gir ve şu komutu çalıştır:

```bash
cd mobile
npx eas-cli build --platform android --profile production
```

Bu komut:
- EAS sunucularında AAB dosyası oluşturur
- Yaklaşık 10-20 dakika sürer
- Bittiğinde indirme linki verir

**Not:** İlk build'de EAS senden bir keystore oluşturmasını isteyecek — "Generate new keystore" seç.

---

## Adım 5: Play Store'a Yükle

### Seçenek A: Otomatik (EAS Submit)

```bash
cd mobile
npx eas-cli submit --platform android --profile production
```

Bu komut `google-services.json` dosyasını kullanarak doğrudan Play Store'a yükler.

### Seçenek B: Manuel

1. EAS build bittiğinde AAB dosyasını indir
2. Play Console → **Uygulamanız** → **Sürüm** → **Production** (veya **Dahili test**)
3. **"Yeni sürüm oluştur"** tıkla
4. AAB dosyasını sürükle-bırak ile yükle
5. Sürüm notlarını yaz
6. **"İncele"** → **"Yayınla"**

> **Tavsiye:** Önce "Dahili test" kanalına yükle, test et, sonra Production'a geç.

---

## Adım 6: Store Listing (Mağaza Bilgileri)

Play Console'da dolduruların gereken bilgiler:

| Alan | Değer |
|------|-------|
| **Uygulama adı** | Fikir Kutusu |
| **Kısa açıklama** | Merak et, keşfet, ilham al — AI destekli fikir motoru |
| **Tam açıklama** | Fikir Kutusu, yapay zeka destekli Türkçe keşif motorudur. Herhangi bir konu hakkında bilgi kartları ve fikir kartları üreterek öğrenme ve yaratıcılık sürecinizi hızlandırır. |
| **Kategori** | Eğitim veya Araçlar |
| **İletişim e-postası** | leskuyy7@gmail.com |

**Gerekli görseller:**
- Uygulama ikonu: 512x512 (zaten `assets/icon.png` var)
- Öne çıkan görsel: 1024x500
- Ekran görüntüleri: En az 2 adet (telefon boyutu)

---

## Adım 7: Kontrol Listesi

Yayından önce kontrol et:

- [ ] AdMob ID'leri gerçek ID'lerle değiştirildi
- [ ] `google-services.json` dosyası `mobile/` klasörüne eklendi
- [ ] Store listing bilgileri ve görseller tamamlandı
- [ ] Gizlilik politikası URL'si eklendi (web sitesindeki mevcut gizlilik sayfası kullanılabilir)
- [ ] İçerik derecelendirmesi anketini doldurdun
- [ ] Dahili test ile uygulama test edildi
- [ ] Production build'de test AdMob ID'leri gerçek olanlarla değiştirildi

---

## Sık Karşılaşılan Sorunlar

**"EAS build başarısız oldu"**
→ `npx expo-doctor` çalıştır, bağımlılık sorunlarını kontrol et

**"Service account izni yok"**
→ Play Console'da API erişimi bölümünden service account'a gerekli izinleri verdiğinden emin ol

**"AAB imza hatası"**
→ Play Console'da Google Play App Signing'i etkinleştir (varsayılan olarak açık olmalı)

---

## Hızlı Komutlar Özeti

```bash
# AAB oluştur (production)
cd mobile && npx eas-cli build --platform android --profile production

# Play Store'a otomatik yükle
cd mobile && npx eas-cli submit --platform android --profile production

# APK oluştur (test için)
cd mobile && npx eas-cli build --platform android --profile preview-apk

# Bağımlılık kontrolü
cd mobile && npx expo-doctor
```

# Türkiye'nin AI Fikir Ortağı
### Ürün Yol Haritası & Sistem Prompt Belgesi — v2.0

---

## 1. Vizyon ve Ürün Kimliği

Bu bir yapay zeka sohbet botu değil, konu bazlı bir keşif motoru. Kullanıcı bir şey yazar, önüne kartlar çıkar, bir karta tıklar, derine iner, ilgili kartlar belirir, kaymaya devam eder. Pinterest veya TikTok'un içerik akışı mantığı — ama içeriği AI üretiyor ve her şey Türkiye bağlamında.

ChatGPT bilgilidir ama soğuktur, kültürel bağlamı yoktur. Bu ürün o boşluğu doldurmak için var.

### 1.1 Ayrışma Noktası

- Chatbot değil, kart bazlı keşif motoru — kullanıcı soru sormak zorunda değil, tek kelime yeter
- Türk kültürünü, pazarını, sosyoekonomik dinamiklerini içselleştirmiş 5 ayrı sistem promptu
- İki içerik modu: Bilgi ve Fikir — sohbet modu yok, onun yerine kart içi konu kilitli giriş kutusu
- Kart tıkla → detay aç → ilgili kartlara geç → kayma döngüsü (Pinterest/TikTok modeli)
- İki görsel tema: Gazete (editorial, temiz) ve Kozmik (koyu, altın aksanlı) — ayarlardan değiştirilebilir
- Yasal sınırlara sıkı uyum: tıbbi, hukuki, finansal tavsiye vermez

### 1.2 Hedef Kitle

- Girişimci olmayı düşünen ama nereden başlayacağını bilmeyen 18–35 yaş grubu
- Merak eden, araştıran, öğrenmek isteyen her kesim
- Bir konuda fikir arayan, birine danışamayan profesyoneller
- Kafasını dağıtmak, ilginç bilgiler keşfetmek isteyen herkes

### 1.3 Nasıl Çalışır — Kullanıcı Akışı

**Senaryo 1 — Bilgi Modu:**

```
Kullanıcı: "kara delikler" yazar
Sistem: 6 bilgi kartı üretir →
  ┌──────────────┐ ┌──────────────┐ ┌──────────────┐
  │ Kara delik   │ │ Hawking neden│ │ Türkiye'deki │
  │ aslında kara │ │ yanılmış     │ │ teleskoplar  │
  │ değil        │ │ olabilir     │ │ ne gördü?    │
  └──────────────┘ └──────────────┘ └──────────────┘
  ┌──────────────┐ ┌──────────────┐ ┌──────────────┐
  │ Bir kara     │ │ Zamanda      │ │ İlk kara     │
  │ deliğe       │ │ yolculuk     │ │ delik fotoğ- │
  │ düşsen ne    │ │ gerçekten    │ │ rafının      │
  │ olur?        │ │ mümkün mü?  │ │ hikayesi     │
  └──────────────┘ └──────────────┘ └──────────────┘

Kullanıcı "Hawking neden yanılmış olabilir" kartına tıklar →
  Detaylı içerik açılır (3-5 paragraf)
  Altında 4 ilgili kart belirir:
    "Hawking Radyasyonu", "Bilgi paradoksu",
    "Türk fizikçilerin katkısı", "Evrenin sonu teorileri"
  Ve konu kilitli giriş kutusu:
    "Hawking neden yanılmış olabilir bağlamında — ..."
```

**Senaryo 2 — Fikir Modu:**

```
Kullanıcı: "kafe" yazar
Sistem: 6 fikir kartı üretir →
  ┌──────────────┐ ┌──────────────┐ ┌──────────────┐
  │ Kitap-kafe   │ │ Türk kahvesi │ │ Sabah 6'da   │
  │ konsepti:    │ │ deneyim      │ │ açılan       │
  │ akşam        │ │ mağazası     │ │ "erken kuş"  │
  │ etkinlikli   │ │              │ │ kafesi       │
  └──────────────┘ └──────────────┘ └──────────────┘
  ...

Kullanıcı "Türk kahvesi deneyim mağazası" kartına tıklar →
  Detay: neden işe yarar, hedef kitle, tahmini bütçe, Türkiye'deki örnekler
  İlgili kartlar:
    "Kahve turizmi", "Deneyim ekonomisi",
    "KOSGEB kafe destekleri", "İstanbul'un turist trafiği"
  Giriş kutusu:
    "Türk kahvesi deneyim mağazası bağlamında — ..."
```

---

## 2. Ürün Yapısı

### 2.1 İki İçerik Modu: Bilgi ve Fikir

Uygulama iki temel modda çalışır. Kullanıcı sekmeler aracılığıyla mod seçer: "Bilgi" ve "Fikir". Sohbet modu yok — bu bir chatbot değil.

**Bilgi Modu** — kullanıcı bir konu hakkında merak ediyorsa, öğrenmek istiyorsa:

- Konuyla ilgili az bilinen, şaşırtıcı, merak uyandıran 6 bilgi kartı üretir
- Her kart: çarpıcı başlık + 1-2 cümle kanca (hook)
- "Şunu biliyor muydun?" enerjisiyle yazar
- Küresel konuları Türkiye bağlamına çeker
- Her kart bir sonrakini merak ettirerek biter

**Fikir Modu** — kullanıcı iş fikri, proje fikri, yaratıcı fikir arıyorsa:

- Konuyla ilgili 6 özgün, uygulanabilir fikir kartı üretir
- Her kart: fikir başlığı + 1-2 cümle açıklama
- Türkiye'ye özgü pazar boşluklarını, destekleri ve fırsatları bilir
- KOSGEB, TÜBİTAK, e-ticaret mevzuatı hakkında genel bilgiye sahip
- Her fikir kısa ve çarpıcı sunulur

### 2.2 Kart Mekanizması

Bu ürün bir sohbet ekranı değil, kart grid'i üzerine kurulu. İşleyiş adım adım:

1. **Giriş Kutusu:** Kullanıcı bir konu/kelime yazar, Enter'a basar
2. **Kart Grid'i:** 6 kart grid formatında (2×3 veya 3×2) belirir. Her kart tıklanabilir
3. **Kart Detayı:** Kullanıcı bir karta tıklayınca kart açılır, 3-5 paragraf detaylı içerik gösterilir
4. **İlgili Kartlar:** Açılan kartın altında 4 adet "bunlar da ilgini çekebilir" kartı belirir — kullanıcıyı keşfe devam ettirmek için
5. **Konu Kilitli Giriş Kutusu:** Açık kartın altında küçük bir giriş kutusu var. Bu kutu kullanıcının o kart konusu hakkında soru sormasına izin verir, ama konudan sapmasını engeller. Kullanıcı farklı bir konu açmaya çalışırsa sistem kibarca konuya geri çeker

Bu mekanizma kullanıcıyı "kart tıkla → oku → ilgili karta geç → tekrar tıkla" döngüsüne sokar. Pinterest'te resimler arasında kayma, TikTok'ta videolar arasında kaydırma mantığının metin versiyonu.

### 2.3 Tema Sistemi

Uygulama iki ayrı görsel temaya sahiptir. Kullanıcı ayarlar panelinden (⚙️ ikonu) istediği temayı seçer. Tema tercihi tarayıcıda saklanır, tekrar geldiğinde aynı tema yüklenir.

**Tema 1 — Gazete (Editorial)**

- **Arka plan:** Açık/krem beyazı (#faf9f6 veya benzeri)
- **Tipografi:** Serif font başlıklar (Georgia, Playfair Display gibi), sans-serif gövde metni
- **Renk paleti:** Siyah metin, koyu gri ikincil metin, tek bir vurgu rengi (bordo veya koyu mavi)
- **Kartlar:** İnce kenarlı, gölgesiz veya minimal gölge, "gazete kupürü" hissi
- **Grid:** Düzenli, sütun bazlı, temiz hizalama
- **Genel his:** Ciddi, güvenilir, içerik odaklı, okuma deneyimi

**Tema 2 — Kozmik (Renkli)**

- **Arka plan:** Derin koyu (#04040f), animasyonlu yıldız alanı veya hafif parıltı efekti
- **Tipografi:** Modern sans-serif (Inter, Space Grotesk gibi)
- **Renk paleti:** Altın aksan (#c9a84c), mor-mavi gradyanlar, neon parıltılar
- **Kartlar:** Gradient kenarlıklar, hover'da hafif parlama (glow), kart arka planı yarı saydam koyu
- **Grid:** Aynı düzen ama kartlar arası boşluk biraz daha geniş, her kart "yüzüyor" hissi
- **Genel his:** Uzay, keşif, merak, premium. Kozmik bir "bilgi evreni geziyorsun" atmosferi

**Tema değiştirme teknik yapısı:**

- CSS değişkenleri (custom properties) ile tanımlanır: `--bg-primary`, `--text-primary`, `--accent`, `--card-bg`, `--card-border` vb.
- Tema seçimi `<body>` elementine `data-theme="gazete"` veya `data-theme="kozmik"` attribute'u ekler
- `localStorage` ile tercih saklanır
- Geçiş animasyonlu olur (0.3s transition)

---

## 3. Sistem Promptları (5 Ayrı Prompt)

Artık tek bir büyük sistem promptu yok. Her API çağrısı farklı bir iş yapıyor, bu yüzden 5 ayrı prompt var. Backend'de `prompts/sistem.js` dosyasında saklanır, frontend'den erişilemez. `[URUN_ADI]` alanını seçilen ürün adıyla değiştir.

### 3.1 Bilgi Kartları Promptu

Kullanıcı Bilgi sekmesinde bir konu girdiğinde bu prompt çağrılır. Konu başına 6 kart üretir.

```
Sen [URUN_ADI] adlı keşif motorunun bilgi kartı üreticisisin. Türk kültürünü,
Türk pazarını ve Türk kullanıcının merak yapısını derinlemesine anlıyorsun.

Görevin: Verilen konu hakkında 6 adet bilgi kartı üretmek.

Her kart şunları içermeli:
- baslik: Çarpıcı, merak uyandıran, tıklanması kaçınılmaz bir başlık (maks 8 kelime)
- kanca: 1-2 cümle — okuyucu bunu okuyunca kartı açmak zorunda hissetmeli

Kurallar:
- Wikipedia kopyası değil, editoryal bakış açısı sun
- "Şunu biliyor muydun?" enerjisiyle yaz
- Her kartı bir sonrakini merak ettirecek şekilde bitir
- Küresel konuları bile Türkiye bağlamına çek — bir Türk okuyucu için neden önemli?
- Akademik değil, sohbet dili kullan
- Klişelerden kaçın. "İlginçtir ki..." veya "Bilim insanları..." ile başlama
- Her 6 kart birbirinden farklı açılardan yaklaşsın — tekrar etme

Yanıtını şu JSON formatında ver, başka hiçbir şey ekleme:
[
  { "baslik": "...", "kanca": "..." },
  { "baslik": "...", "kanca": "..." },
  { "baslik": "...", "kanca": "..." },
  { "baslik": "...", "kanca": "..." },
  { "baslik": "...", "kanca": "..." },
  { "baslik": "...", "kanca": "..." }
]

— YASAL SINIRLAR —
- Yatırım tavsiyesi verme
- Tıbbi teşhis veya tedavi önerme — doktora yönlendir
- Hukuki görüş verme
- Kişisel veri isteme
- Yanıltıcı veya doğrulanmamış bilgileri gerçekmiş gibi sunma
```

### 3.2 Fikir Kartları Promptu

Kullanıcı Fikir sekmesinde bir konu girdiğinde bu prompt çağrılır. Konu başına 6 fikir kartı üretir.

```
Sen [URUN_ADI] adlı keşif motorunun fikir üreticisisin. Türkiye'nin iş ve
girişim ekosistemini, pazar boşluklarını, yerel fırsatları derinlemesine biliyorsun.

Görevin: Verilen konu hakkında 6 adet iş/proje/yaratıcı fikir kartı üretmek.

Her kart şunları içermeli:
- baslik: Fikri özetleyen çarpıcı başlık (maks 8 kelime)
- kanca: 1-2 cümle — neden bu fikir ilginç, neden işe yarayabilir

Kurallar:
- Fikirler özgün ve uygulanabilir olmalı — "restoran aç" gibi genel şeyler değil
- Türkiye'ye özgü fırsatları, KOSGEB/TÜBİTAK desteklerini, yerel pazar dinamiklerini
  göz önünde bulundur
- Her fikir farklı bir açıdan gelsin: düşük bütçe, teknoloji bazlı, niş pazar,
  sosyal etki vb.
- Gerçekçi ol ama cesur ol — "bunu yapan yok" noktalarını bul
- ChatGPT'nin vereceği sıradan listelerden farklı ol — her fikrin bir hikayesi olsun

Yanıtını şu JSON formatında ver, başka hiçbir şey ekleme:
[
  { "baslik": "...", "kanca": "..." },
  { "baslik": "...", "kanca": "..." },
  { "baslik": "...", "kanca": "..." },
  { "baslik": "...", "kanca": "..." },
  { "baslik": "...", "kanca": "..." },
  { "baslik": "...", "kanca": "..." }
]

— YASAL SINIRLAR —
- Yatırım tavsiyesi verme — "Bu kesin kâr eder" gibi garantiler verme
- Hukuki görüş verme — şirket kuruluş prosedürleri hakkında genel bilgi sun ama
  "bunu yap" deme
- Kişisel veri isteme
```

### 3.3 Kart Detay Promptu

Kullanıcı bir karta tıkladığında bu prompt çağrılır. Kartın başlığını ve kancasını alır, detaylı içerik üretir.

```
Sen [URUN_ADI] adlı keşif motorunun detay yazarısın. Türk kültürünü ve
Türk okuyucunun beklentisini derinlemesine anlıyorsun.

Görevin: Verilen kart başlığı ve kancası hakkında detaylı, zengin bir içerik yazmak.

İçerik kuralları:
- 3-5 paragraf yaz — ne çok kısa ne çok uzun
- Her paragraf kısa ve güçlü olsun — Türk okuyucu uzun paragraftan kaçar
- Sade ve akıcı Türkçe kullan, aşırı resmi ya da bürokratik yazma
- İngilizce terimler gerekiyorsa tırnak içinde kullan (startup, MVP gibi)
- Sadece bilgi verme, bakış açısı sun — okuyucu "vay be, hiç böyle düşünmemiştim" desin
- Türkiye bağlamı her zaman olsun — bir Türk okuyucu neden umursamalı?
- Kaynak belirtebilirsin ama akademik format kullanma, doğal dilde yaz

Tarz:
- ChatGPT gibi davranma — "Tabii ki!" gibi boş girişler yapma
- Pohpohlamadan uzak dur
- Robotik listeler üretme — düz metin yaz, gerekirse arada madde işareti kullan
- Her çıktının bir ruhu, bir bakış açısı olsun

Yanıtını düz metin olarak ver. JSON formatı kullanma. Markdown başlık kullanabilirsin.

— YASAL SINIRLAR —
- Yatırım tavsiyesi verme
- Tıbbi teşhis veya tedavi önerme — doktora yönlendir
- Hukuki görüş verme — genel bilgi sun, "bunu yap" deme
- Kişisel veri isteme
- Her sınır için yumuşak ama net dil kullan:
  "Bu konuda sana net bir öneri sunamam, ama şunu söyleyebilirim..."
```

### 3.4 İlgili Kartlar Promptu

Bir kart açıldığında altında gösterilecek 4 "bunlar da ilgini çekebilir" kartı üretir.

```
Sen [URUN_ADI] adlı keşif motorunun ilgili içerik önerme motorusun.

Görevin: Kullanıcının şu an okuduğu kart konusuyla ilgili ama farklı açılardan
yaklaşan 4 kart önerisi üretmek. Amaç kullanıcıyı keşfe devam ettirmek —
"bir tane daha okuyayım" hissi yaratmak.

Her kart şunları içermeli:
- baslik: Merak uyandıran başlık (maks 8 kelime)
- kanca: 1 cümle — neden bu kart ilginç

Kurallar:
- 4 kartın her biri farklı bir yöne gitsin: biri daha derin, biri yan konu,
  biri Türkiye bağlamı, biri şaşırtıcı bir bağlantı
- Ana konudan tamamen kopmadan ama tekrar etmeden genişle
- "Bunu da mı bilmem gerekiyordu?" tepkisi uyandıracak konular tercih et
- Ana konu ile ilgili kartlar arasında görünmez bir anlatı ağı ör

Yanıtını şu JSON formatında ver, başka hiçbir şey ekleme:
[
  { "baslik": "...", "kanca": "..." },
  { "baslik": "...", "kanca": "..." },
  { "baslik": "...", "kanca": "..." },
  { "baslik": "...", "kanca": "..." }
]
```

### 3.5 Kart İçi Konu Kilidi Promptu

Açık bir kartın altındaki giriş kutusundan gelen sorular bu promptla işlenir. Kullanıcıyı konuda tutar, konudan sapmasını engeller.

```
Sen [URUN_ADI] adlı keşif motorunun konu odaklı yanıtlayıcısısın.

Şu an kullanıcı şu kart konusundaki detay sayfasında:
  Kart başlığı: {kart_basligi}
  Kart konusu: {kart_konusu}

Görevin: Kullanıcının sorusunu YALNIZCA yukarıdaki kart konusu bağlamında yanıtlamak.

Kurallar:
- Bu bir genel sohbet botu DEĞİL — yalnızca mevcut kart konusunu derinleştir
- Kullanıcı konudan saparsa, kibarca ama net şekilde geri çek:
  "Bu ilginç bir soru ama şu an {kart_konusu} konusundayız.
   Bu konuyla ilişkilendirebileceğim bir açı var mı?"
- Kullanıcı tamamen farklı bir konu açarsa:
  "Bunu keşfetmek istersen ana sayfadan yeni bir arama yapabilirsin.
   Şimdilik {kart_konusu} hakkında devam edelim mi?"
- Yanıtlar kısa olsun: 2-4 paragraf maksimum
- Sade Türkçe, sohbet dili
- Her yanıtın sonunda konuyu derinleştiren bir soru veya ilginç bir bilgi bırak
  — kullanıcı bir şey daha sormak istesin

Tarz:
- ChatGPT gibi davranma
- Pohpohlamadan uzak dur — "Harika soru!" deme
- Bilmediğini kabul et — "Bu konuda kesin bilgim yok ama şunu söyleyebilirim..."

— YASAL SINIRLAR —
- Yatırım tavsiyesi verme
- Tıbbi teşhis veya tedavi önerme
- Hukuki görüş verme
- Kişisel veri isteme
```

---

## 4. Teknik Yol Haritası

Mimari şöyle: frontend Vercel'de çalışır, backend Railway'de çalışır, ikisi birbirleriyle HTTP üzerinden konuşur. Kullanıcı Vercel'deki arayüze gider, bir konu yazar, bu istek Railway'deki sunucuya ulaşır, sunucu Anthropic API'ye uygun promptla çağrı yapar, dönen kartları kullanıcıya gösterir. API key hiçbir zaman tarayıcıya ulaşmaz.

---

## Faz 1 — Frontend: React + Vercel

### Proje Oluşturma

Vite ile React projesi oluşturmak Create React App'e göre çok daha hızlı başlatılır ve build süresi kısadır:

```bash
npm create vite@latest urun-adi -- --template react
cd urun-adi
npm install
npm run dev
```

Bu komutlar sonrası tarayıcıda `localhost:5173` açılır ve canlı geliştirme başlar. Her kaydettiğinde sayfa anında güncellenir.

### Klasör Yapısı

```
urun-adi/
├── public/
│   ├── manifest.json          → PWA için uygulama tanımı
│   └── icon-512.png           → telefon ana ekranı ikonu
├── src/
│   ├── components/
│   │   ├── BilgiKartlari.jsx    → bilgi kartları grid'i
│   │   ├── FikirKartlari.jsx    → fikir kartları grid'i
│   │   ├── KartDetay.jsx        → tıklanan kartın detay görünümü
│   │   ├── IlgiliKartlar.jsx    → detay altındaki ilgili kart önerileri
│   │   ├── KonuGirisi.jsx       → kart içi konu kilitli giriş kutusu
│   │   ├── ModSecici.jsx        → Bilgi / Fikir sekme çubuğu
│   │   ├── AyarlarPaneli.jsx    → tema seçimi ve diğer ayarlar
│   │   └── YukleniyorSpinner.jsx → API beklerken gösterilen animasyon
│   ├── hooks/
│   │   ├── useKartlar.js       → kart üretme ve yönetim hook'u
│   │   └── useLimit.js        → localStorage ile günlük limit kontrolü
│   ├── services/
│   │   └── api.js             → Railway backend'e istek atan fonksiyon
│   ├── prompts/
│   │   └── sistem.js          → 5 ayrı sistem promptu (backend'de)
│   ├── themes/
│   │   ├── gazete.css         → Gazete teması CSS değişkenleri
│   │   └── kozmik.css         → Kozmik teması CSS değişkenleri
│   ├── App.jsx                → ana bileşen, mod ve tema state'i burada
│   └── main.jsx               → React root, buraya dokunma
├── .env                       → geliştirme ortamı değişkenleri
├── .env.example               → takım arkadaşları için şablon
├── .gitignore                 → .env burada olmalı, asla commit etme
└── vite.config.js             → proxy ayarları burada
```

### services/api.js — Backend'e İstek Atan Fonksiyon

Frontend hiçbir zaman Anthropic API'ye direkt çağrı yapmaz. Tüm istekler Railway'deki backend'e gider:

```js
const BACKEND_URL = import.meta.env.VITE_BACKEND_URL;
// .env dosyasında:
// VITE_BACKEND_URL=https://urun-adi.up.railway.app
// Geliştirmede: VITE_BACKEND_URL=http://localhost:3001

export async function mesajGonder({ mesajlar, mod, kullaniciId }) {
  const response = await fetch(`${BACKEND_URL}/api/mesaj`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      mesajlar,       // tüm konuşma geçmişi dizisi
      mod,            // 'bilgi' | 'fikir' | 'detay' | 'ilgili' | 'konu_kilidi'
      kullaniciId     // giriş yapmışsa Firebase UID, yoksa null
    })
  });

  if (response.status === 429) {
    throw new Error('LIMIT_DOLDU');
    // bu hatayı UI'da 'Günlük limitin doldu' mesajına dönüştür
  }

  if (!response.ok) {
    throw new Error('SUNUCU_HATASI');
  }

  const veri = await response.json();
  return veri.yanit; // string — Claude'un cevabı
}
```

### hooks/useChat.js — Konuşma Geçmişi Yönetimi

Claude'un hafızası yoktur. Her API çağrısında tüm konuşmayı baştan gönderirsin, Claude önceki mesajları bu şekilde "hatırlar":

```js
import { useState, useCallback } from 'react';
import { mesajGonder } from '../services/api';

export function useChat(mod) {
  const [mesajlar, setMesajlar] = useState([]);
  const [yukleniyor, setYukleniyor] = useState(false);
  const [hata, setHata] = useState(null);

  const gonder = useCallback(async (kullaniciMetni) => {
    setHata(null);
    setYukleniyor(true);

    // kullanıcının mesajını hemen ekle — cevap beklenmeden
    // bu sayede UI donmaz, kullanıcı yazdığını görür
    const guncelMesajlar = [
      ...mesajlar,
      { role: 'user', content: kullaniciMetni }
    ];
    setMesajlar(guncelMesajlar);

    try {
      // geçmişin son 10 mesajını gönder — daha fazlası token israfı
      const gonderilenMesajlar = guncelMesajlar.slice(-10);

      const yanitMetni = await mesajGonder({
        mesajlar: gonderilenMesajlar,
        mod
      });

      // Claude'un cevabını geçmişe ekle
      setMesajlar(prev => [
        ...prev,
        { role: 'assistant', content: yanitMetni }
      ]);

    } catch (err) {
      if (err.message === 'LIMIT_DOLDU') {
        setHata('Günlük limitin doldu. Yarın tekrar gel veya üye ol.');
      } else {
        setHata('Bir şeyler ters gitti. Tekrar dene.');
      }
    } finally {
      setYukleniyor(false);
    }
  }, [mesajlar, mod]);

  const sifirla = useCallback(() => {
    setMesajlar([]);
    setHata(null);
  }, []);

  return { mesajlar, yukleniyor, hata, gonder, sifirla };
}
```

### App.jsx — Ana Bileşen

```jsx
import { useState } from 'react';
import ModSecici from './components/ModSecici';
import BilgiKartlari from './components/BilgiKartlari';
import FikirKartlari from './components/FikirKartlari';
import AyarlarPaneli from './components/AyarlarPaneli';

export default function App() {
  const [aktifMod, setAktifMod] = useState('bilgi');
  const [tema, setTema] = useState(
    localStorage.getItem('tema') || 'kozmik'
  );

  const temaSecimi = (yeniTema) => {
    setTema(yeniTema);
    localStorage.setItem('tema', yeniTema);
    document.body.setAttribute('data-theme', yeniTema);
  };

  return (
    <div className='app' data-theme={tema}>
      <AyarlarPaneli tema={tema} onChange={temaSecimi} />
      <ModSecici aktif={aktifMod} onChange={setAktifMod} />
      {aktifMod === 'bilgi' && <BilgiKartlari />}
      {aktifMod === 'fikir' && <FikirKartlari />}
    </div>
  );
}
```

Her mod bağımsız bileşen olduğu için kendi kartlarını ayrı tutar. Bilgi modunda keşif yaparken Fikir moduna geçip geri dönersen Bilgi kartları sıfırlanmaz. Tema seçimi `localStorage`'da saklanır, sayfa yenilenince de korunur.

### Vercel'e Deploy

```bash
git init
git add .
git commit -m 'ilk commit'
git remote add origin https://github.com/kullaniciadi/urun-adi.git
git push -u origin main
```

Sonra vercel.com'a git, "New Project" de, bu GitHub reposunu seç. Vercel build ayarlarını otomatik algılar. Environment variables bölümüne ekle:

```
VITE_BACKEND_URL = https://urun-adi.up.railway.app
```

Bu değer Railway deploy bölümünde sonra dolacak. Bundan sonra `main` branch'e her push'ta Vercel otomatik deploy eder.

### vite.config.js — Geliştirme Proxy'si

Geliştirme yaparken frontend `localhost:5173`'te, backend `localhost:3001`'de çalışır. Tarayıcı farklı portlar arası istek atmaz (CORS politikası). Bunu aşmak için Vite'a proxy tanımla:

```js
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      '/api': {
        target: 'http://localhost:3001',
        changeOrigin: true
      }
    }
  }
});
```

Bu sayede geliştirme ortamında `/api/mesaj` isteği otomatik olarak `localhost:3001/api/mesaj`'a yönlenir. Production'da ise `VITE_BACKEND_URL` kullanılır.

---

## Faz 2 — Backend: Node.js + Railway

Backend'in tek görevi: API key'i gizlemek, rate limiting yapmak ve Anthropic API'ye güvenli çağrı atmak. Railway bu backend'i çalıştıracak sunucuyu sağlar.

### Railway Nedir, Neden Railway

Railway, kodu GitHub'dan çekip otomatik sunucuya dönüştüren bir platform. Heroku'nun yerini alan modern alternatif. Ücretsiz tier'ı aylık 5 USD değerinde kredi içeriyor — küçük ölçek için yeterli. PostgreSQL, Redis gibi veritabanlarını da tek tıkla ekleyebilirsin. Vercel sadece frontend için ideal olduğu için backend Railway'e gider.

### Backend Proje Kurulumu

Backend için ayrı bir klasör ve ayrı bir GitHub reposu oluştur:

```bash
mkdir urun-adi-backend
cd urun-adi-backend
npm init -y
npm install express cors dotenv
npm install -D nodemon
```

`package.json`'a ekle:

```json
{
  "type": "module",
  "scripts": {
    "start": "node server.js",
    "dev": "nodemon server.js"
  }
}
```

### server.js — Ana Sunucu Dosyası

```js
import express from 'express';
import cors from 'cors';
import 'dotenv/config';
import { PROMPTS } from './prompts/sistem.js';
import { limitKontrol, limitArtir } from './middleware/rateLimiter.js';

const app = express();
const PORT = process.env.PORT || 3001;
// Railway PORT değişkenini otomatik inject eder
// 'process.env.PORT || 3001' ifadesi:
//   production'da Railway'in atadığı portu kullan
//   geliştirmede 3001 kullan

app.use(cors({
  origin: [
    'https://urun-adi.vercel.app',   // production frontend
    'http://localhost:5173'           // geliştirme frontend
  ]
}));
// CORS: hangi domainlerin bu API'ye istek atabileceğini belirler
// Buraya sadece kendi frontend URL'lerini ekle
// Yıldız (*) koyma — herkese açık olur, güvenlik riski

app.use(express.json());
// Gelen isteklerin body'sini JSON olarak parse eder
// Bu olmadan req.body undefined döner

app.post('/api/mesaj', async (req, res) => {
  const { mesajlar, mod, kullaniciId } = req.body;

  // --- Giriş doğrulama ---
  if (!mesajlar || !Array.isArray(mesajlar) || mesajlar.length === 0) {
    return res.status(400).json({ hata: 'Geçersiz istek: mesajlar dizisi gerekli' });
  }
  if (!['bilgi', 'fikir', 'detay', 'ilgili', 'konu_kilidi'].includes(mod)) {
    return res.status(400).json({ hata: 'Geçersiz mod' });
  }

  // --- Rate limiting ---
  // kullaniciId varsa UID bazlı limit, yoksa IP bazlı limit uygula
  const limitAnahtari = kullaniciId || req.ip;
  const limitAsildi = limitKontrol(limitAnahtari);
  if (limitAsildi) {
    return res.status(429).json({
      hata: 'Günlük limit doldu',
      mesaj: 'Üye olarak daha fazla kullanım hakkı kazanabilirsin'
    });
  }

  // --- Anthropic API çağrısı ---
  try {
    const anthropicResponse = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': process.env.ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 1024,
        system: PROMPTS[mod],          // bu belgede tanımlı Türkçe prompt
        messages: mesajlar.slice(-10)  // son 10 mesaj — token tasarrufu
      })
    });

    if (!anthropicResponse.ok) {
      const hata = await anthropicResponse.json();
      console.error('Anthropic hatası:', hata);
      return res.status(502).json({ hata: 'AI servisi şu an yanıt vermiyor' });
    }

    const veri = await anthropicResponse.json();
    const yanitMetni = veri.content[0].text;

    // Başarılı istekte limiti artır
    limitArtir(limitAnahtari);

    res.json({ yanit: yanitMetni });

  } catch (err) {
    console.error('Sunucu hatası:', err);
    res.status(500).json({ hata: 'Sunucu hatası' });
  }
});

// Sağlık kontrolü — Railway ve monitoring araçları bunu ping'ler
app.get('/health', (req, res) => {
  res.json({ durum: 'calisiyor' });
});

app.listen(PORT, () => {
  console.log(`Sunucu ${PORT} portunda calisiyor`);
});
```

### middleware/rateLimiter.js

```js
// Yapı: { 'kullanici-anahtari': { sayi: 5, sifirlanmaTarihi: 1234567890 } }
const sayac = new Map();

const MISAFIR_LIMIT = 10;
const KAYITLI_LIMIT = 30;

export function limitKontrol(anahtar) {
  const simdi = Date.now();
  const kayit = sayac.get(anahtar);

  // Kayıt hiç yoksa → ilk istek, henüz limit aşılmadı
  if (!kayit) return false;

  // Sıfırlanma tarihi geçmişse → yeni gün, sayacı sıfırla
  if (simdi > kayit.sifirlanmaTarihi) {
    sayac.delete(anahtar);
    return false;
  }

  return kayit.sayi >= MISAFIR_LIMIT;
}

export function limitArtir(anahtar) {
  const simdi = Date.now();
  const geceyarisi = new Date();
  geceyarisi.setHours(24, 0, 0, 0); // bugün gece yarısı

  const mevcutKayit = sayac.get(anahtar);

  if (!mevcutKayit || simdi > mevcutKayit.sifirlanmaTarihi) {
    sayac.set(anahtar, {
      sayi: 1,
      sifirlanmaTarihi: geceyarisi.getTime()
    });
  } else {
    mevcutKayit.sayi++;
  }
}
```

> **Not:** Sunucu her yeniden başladığında bu Map sıfırlanır. Kalıcı limit için Faz 3'teki Redis entegrasyonuna geç.

### .env ve .gitignore

```
# .env
ANTHROPIC_API_KEY=sk-ant-api03-xxxxxxxxxxxxx
PORT=3001
```

```
# .gitignore
.env
node_modules/
```

### Railway'e Deploy

```bash
git init
git add .
git commit -m 'backend ilk commit'
git remote add origin https://github.com/kullaniciadi/urun-adi-backend.git
git push -u origin main
```

railway.app'e git → "New Project" → "Deploy from GitHub repo" → backend reposunu seç. Railway `package.json`'daki `start` scriptini otomatik algılar ve çalıştırır.

Deploy sonrası Railway'in Variables sekmesine gir:

```
ANTHROPIC_API_KEY = sk-ant-api03-xxxxxxxxxxxxx
```

Railway sana bir URL verir: `https://urun-adi-backend.up.railway.app`. Bu URL'yi Vercel'deki `VITE_BACKEND_URL` değişkenine yapıştır. Bundan sonra `main` branch'e her push'ta Railway otomatik yeniden deploy eder.

### prompts/sistem.js

```js
export const PROMPTS = {
  bilgi: `
    [3.1 Bilgi Kartları Promptunu buraya yapıştır]
  `,
  fikir: `
    [3.2 Fikir Kartları Promptunu buraya yapıştır]
  `,
  detay: `
    [3.3 Kart Detay Promptunu buraya yapıştır]
  `,
  ilgili: `
    [3.4 İlgili Kartlar Promptunu buraya yapıştır]
  `,
  konu_kilidi: `
    [3.5 Kart İçi Konu Kilidi Promptunu buraya yapıştır]
  `
};
```

Her prompt için bu belgenin 3. bölümündeki tam metni ilgili alana yapıştır. Bu dosya backend'de çalıştığı için kullanıcı tarafından görülemez.

---

## Faz 3 — Kullanıcı Hesabı: Firebase

### Firebase Kurulumu

[console.firebase.google.com](https://console.firebase.google.com)'dan yeni proje oluştur. Authentication bölümünden Google provider'ı etkinleştir. Frontend'e ekle:

```bash
npm install firebase
```

`src/services/firebase.js`:

```js
import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
};
// Bu değerleri Firebase console → Project Settings → Web app'ten alırsın
// Vercel'in environment variables bölümüne ekle

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
```

### hooks/useAuth.js — Google ile Giriş

```js
import { useState, useEffect } from 'react';
import { signInWithPopup, signOut, GoogleAuthProvider, onAuthStateChanged } from 'firebase/auth';
import { auth } from '../services/firebase';

export function useAuth() {
  const [kullanici, setKullanici] = useState(null);
  const [yukleniyor, setYukleniyor] = useState(true);

  useEffect(() => {
    // Sayfa yenilenince oturum otomatik geri gelir
    const abonelikIptal = onAuthStateChanged(auth, (girilenKullanici) => {
      setKullanici(girilenKullanici);
      setYukleniyor(false);
    });
    return abonelikIptal; // component unmount'ta dinlemeyi durdur
  }, []);

  const girisYap = async () => {
    const provider = new GoogleAuthProvider();
    try {
      await signInWithPopup(auth, provider);
      // kullanici state'i onAuthStateChanged üzerinden otomatik güncellenir
    } catch (err) {
      console.error('Giriş hatası:', err);
    }
  };

  const cikisYap = () => signOut(auth);

  return { kullanici, yukleniyor, girisYap, cikisYap };
}
```

`kullanici.uid`, backend'e gönderilecek benzersiz kimlik. Backend bu uid'yi rate limiting anahtarı olarak kullanır. Misafirin IP'si değişebilir, uid değişmez.

### Konuşma Geçmişini Firestore'a Kaydetme

```js
import { collection, addDoc, query, where, orderBy, limit, getDocs, serverTimestamp } from 'firebase/firestore';
import { db } from '../services/firebase';

// Konuşmayı kaydet
export async function konusmaKaydet(kullaniciId, mod, mesajlar) {
  await addDoc(collection(db, 'konusmalar'), {
    kullaniciId,
    mod,
    mesajlar,
    tarih: serverTimestamp()
    // Firestore'un sunucu saatini kullan
    // clientın saatini kullanma — kullanıcı saatini değiştirebilir
  });
}

// Kullanıcının son 10 konuşmasını çek
export async function konusmalariGetir(kullaniciId) {
  const q = query(
    collection(db, 'konusmalar'),
    where('kullaniciId', '==', kullaniciId),
    orderBy('tarih', 'desc'),
    limit(10)
  );
  const snapshot = await getDocs(q);
  return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
}
```

### Backend'de Firebase Admin ile UID Doğrulama

```bash
npm install firebase-admin
```

Railway Variables'a ekle:

```
FIREBASE_SERVICE_ACCOUNT = {"type":"service_account","project_id":"...",...}
```

Firebase console → Project Settings → Service Accounts'tan JSON indir, içeriğini bu değişkene yapıştır.

`server.js`'e ekle:

```js
import admin from 'firebase-admin';

admin.initializeApp({
  credential: admin.credential.cert(
    JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT)
  )
});

// Endpoint'te token doğrulama
if (idToken) {
  try {
    await admin.auth().verifyIdToken(idToken);
  } catch {
    return res.status(401).json({ hata: 'Geçersiz token' });
  }
}
```

### Railway'de Kalıcı Rate Limiting: Redis

Railway dashboard'dan "Add Plugin" → Redis seç. Railway, `REDIS_URL` ortam değişkenini otomatik tanımlar.

```bash
npm install ioredis
```

`middleware/rateLimiter.js`'i Redis ile yeniden yaz:

```js
import Redis from 'ioredis';

const redis = new Redis(process.env.REDIS_URL);

const MISAFIR_LIMIT = 10;

export async function limitKontrol(anahtar) {
  const sayi = await redis.get(`limit:${anahtar}`);
  return sayi !== null && parseInt(sayi) >= MISAFIR_LIMIT;
}

export async function limitArtir(anahtar) {
  const key = `limit:${anahtar}`;
  const mevcutSayi = await redis.incr(key);
  // İlk istek ise TTL ayarla (gece yarısına kadar)
  if (mevcutSayi === 1) {
    const simdi = new Date();
    const geceyarisi = new Date();
    geceyarisi.setHours(24, 0, 0, 0);
    const saniyeFarki = Math.floor((geceyarisi - simdi) / 1000);
    await redis.expire(key, saniyeFarki);
    // TTL süresi dolunca Redis key'i otomatik siler — sıfırlanmış sayılır
  }
}
```

Redis ile sunucu kaç kez yeniden başlarsa başlasın limitler korunur.

---

## Faz 4 — Analitik, Geri Bildirim ve Prompt İyileştirme

### Google Analytics 4 Entegrasyonu

[analytics.google.com](https://analytics.google.com)'dan Measurement ID al (`G-XXXXXXX` formatında). `index.html`'e ekle:

```html
<head>
  <script async src="https://www.googletagmanager.com/gtag/js?id=G-XXXXXXX"></script>
  <script>
    window.dataLayer = window.dataLayer || [];
    function gtag(){dataLayer.push(arguments);}
    gtag('js', new Date());
    gtag('config', 'G-XXXXXXX');
  </script>
</head>
```

`services/api.js` içinde her başarılı API çağrısından sonra event gönder:

```js
gtag('event', 'mesaj_gonderildi', {
  'mod': mod,
  'konusma_uzunlugu': mesajlar.length,
  'girdi_karakter': metin.length
});

window.addEventListener('beforeunload', () => {
  gtag('event', 'oturum_bitti', {
    'son_mod': aktifMod,
    'toplam_mesaj': mesajlar.length
  });
});
```

GA4 raporlarında takip edilecekler: hangi mod en çok kullanılıyor, ortalama oturum kaç mesaj, kullanıcı hangi mesajda bırakıyor. Bırakma noktası prompt sorununa işaret eder.

### Thumbs Up / Down Geri Bildirimi

```jsx
function GeriBildirimButonlari({ mesajIndex, mod }) {
  const [oy, setOy] = useState(null);

  const oyVer = (deger) => {
    setOy(deger);
    gtag('event', 'yanit_degerlendirme', {
      'mod': mod,
      'deger': deger,           // 1 veya -1
      'mesaj_sirasi': mesajIndex
    });
  };

  return (
    <div className='geri-bildirim'>
      <button onClick={() => oyVer(1)} className={oy === 1 ? 'aktif' : ''}>👍</button>
      <button onClick={() => oyVer(-1)} className={oy === -1 ? 'aktif' : ''}>👎</button>
    </div>
  );
}
```

Thumbs down oranı yüksek olan mod önce iyileştirilir. Bir promptu değiştirip yeni oranı eskiyle karşılaştır. Bu basit A/B test döngüsü.

### Sistem Promptunu Nasıl İyileştirirsin

Prompt geliştirme iteratif bir süreçtir: gerçek konuşmaları oku → sorun noktasını bul → promptu değiştir → deploy et → oranları karşılaştır → tekrar et.

Örnek düzeltme:

```
Kullanıcı 3 kelimeden kısa bir girdi yazdıysa, fikir üretmeden önce
şu üç soruyu sor. Hepsini aynı mesajda sor, ayrı ayrı değil:
1. Hangi şehirde düşünüyorsun?
2. Yaklaşık bütçen ne kadar?
3. Bu alanda daha önce deneyimin var mı?
```

---

## Faz 5 — Mobil: PWA ve React Native

### PWA: En Hızlı Mobil Çözüm

Progressive Web App, web sitesini telefona uygulama gibi yüklenebilir hale getirir. App Store veya Play Store gerekmez.

`public/manifest.json`:

```json
{
  "name": "Ürün Adı",
  "short_name": "ÜrünAdı",
  "description": "Türkiye'nin AI fikir ortağı",
  "start_url": "/",
  "display": "standalone",
  "background_color": "#04040f",
  "theme_color": "#c9a84c",
  "icons": [
    { "src": "/icon-192.png", "sizes": "192x192", "type": "image/png" },
    { "src": "/icon-512.png", "sizes": "512x512", "type": "image/png" }
  ]
}
```

`index.html` head'ine:

```html
<link rel="manifest" href="/manifest.json">
<meta name="theme-color" content="#c9a84c">
<meta name="apple-mobile-web-app-capable" content="yes">
<meta name="apple-mobile-web-app-status-bar-style" content="black-translucent">
```

`vite-plugin-pwa` kurulumu:

```bash
npm install -D vite-plugin-pwa
```

`vite.config.js`'e ekle:

```js
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      // Yeni sürüm deploy edilince uygulama otomatik güncellenir
      workbox: {
        globPatterns: ['**/*.{js,css,html,ico,png,svg}']
        // Bu dosyalar kullanıcının telefonunda cache'lenir
      }
    })
  ]
});
```

### React Native: Ne Zaman Geçilmeli

Web kodunun yaklaşık %70'i yeniden kullanılabilir — hook'lar, servisler, prompts dosyası değişmez. Sadece UI bileşenleri native karşılıklarıyla değiştirilir.

```bash
npx create-expo-app urun-adi-mobile
cd urun-adi-mobile
npx expo install expo-notifications
```

### Push Bildirim

```js
import { getMessaging, getToken, onMessage } from 'firebase/messaging';

const messaging = getMessaging();

const izin = await Notification.requestPermission();
if (izin === 'granted') {
  const fcmToken = await getToken(messaging, {
    vapidKey: import.meta.env.VITE_FIREBASE_VAPID_KEY
  });
  // Bu token'ı Firestore'daki kullanıcı kaydına ekle
  await kullaniciyaTokenKaydet(kullanici.uid, fcmToken);
}
```

Railway backend'den bildirim göndermek için:

```js
await admin.messaging().send({
  token: kullaniciFcmToken,
  notification: {
    title: 'Bugün ne keşfetmek istersin?',
    body: 'Yeni fikirler seni bekliyor.'
  }
});
```

---

## Faz 6 — SEO ve Büyüme

### Neden React SEO Sorunudur

Vite ile yapılan React uygulaması, Google bot'u sayfayı taradığında boş bir HTML döner. İçerik JavaScript çalıştıkça yüklenir, Google bunu göremez. Çözüm: Next.js'e geçmek.

### Next.js'e Geçiş

```bash
npx create-next-app@latest urun-adi-next
```

Mevcut hook'lar ve servisler değişmeden taşınır. Routing dosya sistemiyle çalışır:

```
app/
  page.jsx           → anasayfa
  fikir/
    page.jsx         → fikir modu
    [konu]/
      page.jsx       → /fikir/kafe, /fikir/restoran, ...
```

### Statik SEO Sayfaları

```jsx
// app/fikir/[konu]/page.jsx

export async function generateStaticParams() {
  return [
    { konu: 'kafe' },
    { konu: 'e-ticaret' },
    { konu: 'restoran' },
    { konu: 'online-egitim' },
    // ... popüler aramaları buraya ekle
  ];
}

export function generateMetadata({ params }) {
  return {
    title: `${params.konu} iş fikirleri | Ürün Adı`,
    description: `${params.konu} alanında Türkiye'ye özgü iş fikirleri ve girişim önerileri`
  };
}

export default function KonuSayfasi({ params }) {
  return (
    <main>
      <h1>{params.konu} İş Fikirleri</h1>
      <p>Hemen dene ve kişiselleştirilmiş fikirler al:</p>
      <FikirModu baslangicKonu={params.konu} />
    </main>
  );
}
```

### Paylaşılabilir Kartlar

```js
import html2canvas from 'html2canvas';

async function kartOlarakPaylas(kartElementId) {
  const element = document.getElementById(kartElementId);

  const canvas = await html2canvas(element, {
    scale: 2,           // yüksek çözünürlük
    useCORS: true,      // dış kaynaklı görseller için
    backgroundColor: '#04040f'
  });

  const blob = await new Promise(resolve => canvas.toBlob(resolve, 'image/png'));
  const dosya = new File([blob], 'kart.png', { type: 'image/png' });

  if (navigator.canShare && navigator.canShare({ files: [dosya] })) {
    await navigator.share({
      files: [dosya],
      title: 'Keşfettim',
      text: 'Bunu da öğrendim → urun-adi.com'
    });
  } else {
    // Desktop: dosyayı indir
    const link = document.createElement('a');
    link.href = canvas.toDataURL();
    link.download = 'kart.png';
    link.click();
  }
}
```

---

## 5. Gelir Modeli

### Reklam Geliri Projeksiyonu

Türkiye'de mobil display reklam CPM (bin gösterim başına) ortalama 0.5–1.5 USD civarındadır.

- 1.000 aktif günlük kullanıcı × 3 reklam gösterimi = 3.000 gösterim/gün
- Aylık 90.000 gösterim × 1 USD CPM = aylık ~90 USD gelir
- Bu ölçekte API maliyeti de yaklaşık 50–80 USD/ay
- Kârlılık için en az 10.000–20.000 aktif günlük kullanıcı gerekiyor

### Freemium Katmanı (Önerilen Ek Model)

- **Ücretsiz:** Günlük 10 istek, reklam var
- **Premium (79 TL/ay):** Sınırsız, reklamsız, geçmiş kaydı, PDF export
- 1.000 premium kullanıcı = 79.000 TL/ay — sürdürülebilir eşik

---

## 6. Riskler ve Önlemler

### Teknik Riskler

- API maliyeti kontrolden çıkabilir → Günlük limit sistemi ve rate limiting şart
- Sistem promptu manipülasyonu → Prompt injection koruması ekle
- API kesintisi → Yedek mesaj: "Şu an yoğunuz, birazdan tekrar dene"

### Yasal Riskler

- KVKK ihlali → Kişisel veri saklamayı en aza indir, hukuki danışmanlık al
- Yanlış tıbbi/hukuki/finansal bilgi → Sistem prompt uyarıları + kullanıcı bildirimi şart
- Telif hakkı → AI çıktısı telif sorunu yaratmaz, ama içerik moderasyonu gerekebilir

### Pazar Riskleri

- Rakip giriş → Farklılaşma ve Türkçe odak koruma kalkanı
- Kullanıcı çekmek için içerik üretmek zaman alır → SEO'ya erkenden başla

---

## 7. Başlangıç Kontrol Listesi

1. Ürün adı ve domain seç — Namecheap veya GoDaddy, `.com.tr` veya `.com`
2. `console.anthropic.com` → API key al, kredi kartı ekle
3. Frontend: `npm create vite@latest` → GitHub'a push → Vercel'e bağla
4. Backend: Node.js + Express → GitHub'a push → Railway'e bağla
5. Railway Variables → `ANTHROPIC_API_KEY` ekle
6. Vercel Variables → `VITE_BACKEND_URL` = Railway URL'si
7. Bu belgedeki 5 sistem promptunu `prompts/sistem.js`'e yapıştır
8. İki temayı (Gazete + Kozmik) CSS değişkenleriyle tanımla, ayarlar panelinden seçilebilir yap
9. GA4 ekle, thumbs up/down ekle, ilk kullanıcılara aç
10. Firebase Authentication ekle, Firestore geçmiş kaydetme ekle
11. Railway'e Redis plugin ekle, rate limiting kalıcı hale getir
12. `manifest.json` + `vite-plugin-pwa` ekle → PWA hazır
13. Next.js'e geç → statik SEO sayfaları oluştur
14. KVKK gizlilik politikası ve çerez bildirimi sayfası ekle

---

> **Not:** Bu belge yaşayan bir dokümandır. Ürün geliştikçe ve kullanıcı davranışı netleştikçe güncellenmeli. 5 sistem promptu en kritik parça — gerçek kullanıcı verilerine göre düzenli olarak revize edilmeli. Tema tasarımları da kullanıcı geri bildirimine göre ince ayar gerektirebilir.

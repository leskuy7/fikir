export const MOCK_BILGI = [
  { baslik: 'Örnek bilgi kartı 1', kanca: 'Bu bir mock kancadır. API key eklediğinizde gerçek içerik gelir.' },
  { baslik: 'Örnek bilgi kartı 2', kanca: 'Türkiye bağlamında merak uyandıran bilgiler burada olacak.' },
  { baslik: 'Örnek bilgi kartı 3', kanca: 'Keşif motoru gerçek API ile çalışınca bu kartlar dolar.' },
  { baslik: 'Örnek bilgi kartı 4', kanca: 'Şunu biliyor muydun? Mock modundasınız.' },
  { baslik: 'Örnek bilgi kartı 5', kanca: 'Backend .env dosyasına ANTHROPIC_API_KEY ekleyin.' },
  { baslik: 'Örnek bilgi kartı 6', kanca: 'MOCK_MODE=false yapıp API key verin, gerçek kartlar gelsin.' },
];

export const MOCK_FIKIR = [
  { baslik: 'Örnek fikir kartı 1', kanca: 'Türkiye pazarına özgü iş fikirleri mock sonrası gelecek.' },
  { baslik: 'Örnek fikir kartı 2', kanca: 'KOSGEB ve yerel fırsatlar gerçek API ile önerilecek.' },
  { baslik: 'Örnek fikir kartı 3', kanca: 'Niş pazar ve düşük bütçe fikirleri burada.' },
  { baslik: 'Örnek fikir kartı 4', kanca: 'Girişimcilik ekosistemi mock modunda örnek gösterilir.' },
  { baslik: 'Örnek fikir kartı 5', kanca: 'ANTHROPIC_API_KEY ekleyerek gerçek fikirler üretin.' },
  { baslik: 'Örnek fikir kartı 6', kanca: 'Fikir Kutusu production\'da zengin içerik sunar.' },
];

export const MOCK_ILGILI = [
  { baslik: 'İlgili konu 1', kanca: 'Bu konuyla bağlantılı bir öneri.' },
  { baslik: 'İlgili konu 2', kanca: 'Keşfe devam etmek için tıklayın.' },
  { baslik: 'İlgili konu 3', kanca: 'Türkiye bağlamında ilgili içerik.' },
  { baslik: 'İlgili konu 4', kanca: 'API ile dolu içerik gelecek.' },
];

export const MOCK_DETAY = `Bu bir mock detay içeriğidir. Gerçek API (Anthropic) bağlandığında bu kartın konusu hakkında 3-5 paragraf detaylı, Türkiye bağlamında içerik burada görünecek.

Backend ortam değişkenlerine ANTHROPIC_API_KEY ekleyip MOCK_MODE'u kapatarak canlı yanıtlar alabilirsiniz.

Fikir Kutusu, bilgi ve fikir kartlarıyla keşif deneyimi sunar.`;

export const MOCK_KONU_KILIDI = `Bu konu bağlamında sorunuz mock modunda yanıtlanıyor. Gerçek API kullanıldığında yalnızca açık kartın konusuyla sınırlı, kibarca konu dışına çıkmayı engelleyen yanıtlar alırsınız.`;

export function mockYanit(mod) {
  switch (mod) {
    case 'bilgi':
      return JSON.stringify(MOCK_BILGI);
    case 'fikir':
      return JSON.stringify(MOCK_FIKIR);
    case 'ilgili':
      return JSON.stringify(MOCK_ILGILI);
    case 'detay':
      return MOCK_DETAY;
    case 'konu_kilidi':
      return MOCK_KONU_KILIDI;
    default:
      return JSON.stringify(MOCK_BILGI);
  }
}

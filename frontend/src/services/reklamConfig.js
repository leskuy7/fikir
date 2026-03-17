/**
 * Reklam Yapılandırma Servisi
 *
 * Desteklenen sağlayıcılar:
 *   - "adsense"  → Google AdSense
 *   - "adsterra" → Adsterra (invoke.js + atOptions)
 *   - "custom"   → Özel HTML reklam kodu (herhangi bir ağ: Media.net, PropellerAds, vb.)
 *   - "placeholder" → Geliştirme/test için yer tutucu (varsayılan)
 *
 * Kullanım:
 *   VITE_AD_PROVIDER=adsense        → AdSense kullanır
 *   VITE_AD_PROVIDER=custom         → Özel HTML kodu kullanır
 *   (boş veya ayarlanmamış)         → Yer tutucu gösterir
 */

// Aktif reklam sağlayıcısı
export const AD_PROVIDER = import.meta.env.VITE_AD_PROVIDER || 'placeholder';

// Google AdSense ayarları
export const ADSENSE_PUBLISHER_ID = import.meta.env.VITE_ADSENSE_PUBLISHER_ID || '';
export const ADSENSE_SLOT_BANNER = import.meta.env.VITE_ADSENSE_SLOT_BANNER || '';
export const ADSENSE_SLOT_KART = import.meta.env.VITE_ADSENSE_SLOT_KART || '';
export const ADSENSE_SLOT_DETAY = import.meta.env.VITE_ADSENSE_SLOT_DETAY || '';

// Adsterra ayarları
export const ADSTERRA_KEY = import.meta.env.VITE_ADSTERRA_KEY || '';
export const ADSTERRA_SINGLETON = (import.meta.env.VITE_ADSTERRA_SINGLETON || 'true') !== 'false';

// Özel reklam ayarları (herhangi bir reklam ağı için)
export const CUSTOM_AD_SCRIPT_URL = import.meta.env.VITE_CUSTOM_AD_SCRIPT_URL || '';
export const CUSTOM_AD_ATTR = import.meta.env.VITE_CUSTOM_AD_ATTR || ''; // data-zone-id gibi

// Reklam slotları yapılandırması
export const AD_SLOTS = {
  // Hero bölümü altında yatay banner
  banner: {
    id: 'banner',
    adsenseSlot: ADSENSE_SLOT_BANNER,
    format: 'horizontal',
    label: 'Reklam',
    adsterra: { format: 'iframe', width: 300, height: 250 },
  },
  // Kart grid'inde araya giren reklam
  kart: {
    id: 'kart',
    adsenseSlot: ADSENSE_SLOT_KART,
    format: 'auto',
    label: 'Sponsorlu',
    adsterra: { format: 'iframe', width: 300, height: 250 },
  },
  // Kart detay overlay'inde reklam
  detay: {
    id: 'detay',
    adsenseSlot: ADSENSE_SLOT_DETAY,
    format: 'auto',
    label: 'Reklam',
    adsterra: { format: 'iframe', width: 300, height: 250 },
  },
};

// Reklamların aktif olup olmadığını kontrol et
export function reklamlarAktifMi() {
  if (AD_PROVIDER === 'placeholder') return true; // Yer tutucu her zaman gösterilir
  if (AD_PROVIDER === 'adsense') return !!ADSENSE_PUBLISHER_ID;
  if (AD_PROVIDER === 'adsterra') return !!ADSTERRA_KEY;
  if (AD_PROVIDER === 'custom') return !!CUSTOM_AD_SCRIPT_URL;
  return false;
}

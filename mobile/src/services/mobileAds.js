import mobileAds, { TestIds } from 'react-native-google-mobile-ads';

function temizle(deger) {
  if (typeof deger !== 'string') return null;
  const kirpilmis = deger.trim();
  return kirpilmis ? kirpilmis : null;
}

export const reklamBirimleri = {
  banner: temizle(process.env.EXPO_PUBLIC_ADMOB_BANNER_ID) || TestIds.ADAPTIVE_BANNER,
  interstitial: temizle(process.env.EXPO_PUBLIC_ADMOB_INTERSTITIAL_ID) || TestIds.INTERSTITIAL,
  rewarded: temizle(process.env.EXPO_PUBLIC_ADMOB_REWARDED_ID) || TestIds.REWARDED,
};

let baslatmaSozu;

export function reklamlariBaslat() {
  if (!baslatmaSozu) {
    baslatmaSozu = mobileAds().initialize().catch((err) => {
      baslatmaSozu = null;
      throw err;
    });
  }

  return baslatmaSozu;
}

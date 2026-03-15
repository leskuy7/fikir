import { useEffect, useRef } from 'react';
import { InterstitialAd, AdEventType, TestIds } from 'react-native-google-mobile-ads';

const INTERSTITIAL_ID = __DEV__
  ? TestIds.INTERSTITIAL
  : (process.env.EXPO_PUBLIC_ADMOB_INTERSTITIAL_ID || TestIds.INTERSTITIAL);

// Her N. detay açılışında interstitial göster
const HER_N_ACILIS = 3;
let acilisSayaci = 0;

export function useInterstitial() {
  const adRef = useRef(null);

  useEffect(() => {
    const ad = InterstitialAd.createForAdRequest(INTERSTITIAL_ID, {
      requestNonPersonalizedAdsOnly: true,
    });

    const onLoaded = () => {
      adRef.current = ad;
    };

    const unsubLoaded = ad.addAdEventListener(AdEventType.LOADED, onLoaded);
    const unsubClosed = ad.addAdEventListener(AdEventType.CLOSED, () => {
      // Reklam kapandığında yenisini yükle
      ad.load();
    });

    ad.load();

    return () => {
      unsubLoaded();
      unsubClosed();
    };
  }, []);

  const goster = () => {
    acilisSayaci += 1;
    if (acilisSayaci % HER_N_ACILIS === 0 && adRef.current?.loaded) {
      adRef.current.show();
    }
  };

  return { goster };
}

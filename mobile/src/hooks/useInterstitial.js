import { useEffect, useRef, useState, useCallback } from 'react';
import { InterstitialAd, AdEventType, TestIds } from 'react-native-google-mobile-ads';

const INTERSTITIAL_ID = __DEV__
  ? TestIds.INTERSTITIAL
  : (process.env.EXPO_PUBLIC_ADMOB_INTERSTITIAL_ID || TestIds.INTERSTITIAL);

// Her N. detay açılışında interstitial göster
const HER_N_ACILIS = 3;
let acilisSayaci = 0;

export function useInterstitial() {
  const adRef = useRef(null);
  const [hazir, setHazir] = useState(false);
  const onClosedRef = useRef(null);

  useEffect(() => {
    const ad = InterstitialAd.createForAdRequest(INTERSTITIAL_ID, {
      requestNonPersonalizedAdsOnly: true,
    });

    adRef.current = ad;

    const unsubLoaded = ad.addAdEventListener(AdEventType.LOADED, () => {
      setHazir(true);
    });
    const unsubClosed = ad.addAdEventListener(AdEventType.CLOSED, () => {
      // Reklam kapandığında yenisini yükle
      setHazir(false);
      ad.load();
      const cb = onClosedRef.current;
      onClosedRef.current = null;
      if (typeof cb === 'function') cb();
    });
    const unsubError = ad.addAdEventListener(AdEventType.ERROR, () => {
      setHazir(false);
      ad.load();
      onClosedRef.current = null;
    });

    ad.load();

    return () => {
      unsubLoaded();
      unsubClosed();
      unsubError();
    };
  }, []);

  const gosterZorla = useCallback((opts = {}) => {
    const onClosed = typeof opts?.onClosed === 'function' ? opts.onClosed : null;
    if (adRef.current && hazir) {
      onClosedRef.current = onClosed;
      adRef.current.show();
      return true;
    }
    onClosedRef.current = null;
    return false;
  }, [hazir]);

  const goster = useCallback((opts = {}) => {
    const force = opts?.force === true;
    if (force) return gosterZorla(opts);
    acilisSayaci += 1;
    if (acilisSayaci % HER_N_ACILIS === 0) {
      return gosterZorla(opts);
    }
    return false;
  }, [gosterZorla]);

  return { goster, hazir };
}

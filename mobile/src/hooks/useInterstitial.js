import { useCallback, useEffect, useRef, useState } from 'react';
import { AdEventType, InterstitialAd } from 'react-native-google-mobile-ads';
import { reklamBirimleri } from '../services/mobileAds';

let acilisSayaci = 0;
const GOSTERIM_ARALIGI = 5;

export function useInterstitial() {
  const [hazir, setHazir] = useState(false);
  const reklamRef = useRef(null);

  if (!reklamRef.current) {
    reklamRef.current = InterstitialAd.createForAdRequest(reklamBirimleri.interstitial);
  }

  useEffect(() => {
    const reklam = reklamRef.current;

    const kapatYukle = () => {
      setHazir(false);
      reklam.load();
    };

    const abonelikler = [
      reklam.addAdEventListener(AdEventType.LOADED, () => setHazir(true)),
      reklam.addAdEventListener(AdEventType.CLOSED, kapatYukle),
      reklam.addAdEventListener(AdEventType.ERROR, kapatYukle),
    ];

    reklam.load();

    return () => {
      abonelikler.forEach((aboneliktenCik) => aboneliktenCik());
    };
  }, []);

  const goster = useCallback(() => {
    acilisSayaci += 1;
    const reklam = reklamRef.current;

    if (acilisSayaci % GOSTERIM_ARALIGI !== 0) {
      return false;
    }

    if (!hazir) {
      reklam.load();
      return false;
    }

    try {
      reklam.show();
      return true;
    } catch {
      setHazir(false);
      reklam.load();
      return false;
    }
  }, [hazir]);

  return { goster, hazir };
}

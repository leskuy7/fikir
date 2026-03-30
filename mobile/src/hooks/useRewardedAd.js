import { useCallback, useEffect, useRef, useState } from 'react';
import { AdEventType, RewardedAd, RewardedAdEventType } from 'react-native-google-mobile-ads';
import { reklamBirimleri } from '../services/mobileAds';

export function useRewardedAd() {
  const [hazir, setHazir] = useState(false);
  const reklamRef = useRef(null);
  const callbackRef = useRef(null);
  const odulVerildiRef = useRef(false);

  if (!reklamRef.current) {
    reklamRef.current = RewardedAd.createForAdRequest(reklamBirimleri.rewarded);
  }

  useEffect(() => {
    const reklam = reklamRef.current;

    const tekrarYukle = () => {
      setHazir(false);
      reklam.load();
    };

    const abonelikler = [
      reklam.addAdEventListener(RewardedAdEventType.LOADED, () => {
        setHazir(true);
      }),
      reklam.addAdEventListener(RewardedAdEventType.EARNED_REWARD, () => {
        odulVerildiRef.current = true;
        Promise.resolve(callbackRef.current?.onReward?.()).catch(() => {});
      }),
      reklam.addAdEventListener(AdEventType.CLOSED, () => {
        const callbacklar = callbackRef.current;
        const rewarded = odulVerildiRef.current;

        callbackRef.current = null;
        odulVerildiRef.current = false;
        callbacklar?.onClosed?.({ rewarded });
        tekrarYukle();
      }),
      reklam.addAdEventListener(AdEventType.ERROR, (err) => {
        const callbacklar = callbackRef.current;

        callbackRef.current = null;
        odulVerildiRef.current = false;
        callbacklar?.onError?.(err);
        tekrarYukle();
      }),
    ];

    reklam.load();

    return () => {
      abonelikler.forEach((aboneliktenCik) => aboneliktenCik());
    };
  }, []);

  const goster = useCallback((callbacklar = {}) => {
    const reklam = reklamRef.current;

    if (!hazir) {
      reklam.load();
      return false;
    }

    callbackRef.current = callbacklar;
    odulVerildiRef.current = false;

    try {
      reklam.show();
      return true;
    } catch (err) {
      callbackRef.current = null;
      odulVerildiRef.current = false;
      setHazir(false);
      reklam.load();
      callbacklar.onError?.(err);
      return false;
    }
  }, [hazir]);

  return { goster, hazir };
}

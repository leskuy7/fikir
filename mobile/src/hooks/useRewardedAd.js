import { useEffect, useRef, useState, useCallback } from 'react';
import {
  RewardedAd,
  RewardedAdEventType,
  AdEventType,
  TestIds,
} from 'react-native-google-mobile-ads';

const REWARDED_ID = __DEV__
  ? TestIds.REWARDED
  : (process.env.EXPO_PUBLIC_ADMOB_REWARDED_ID || TestIds.REWARDED);

export function useRewardedAd() {
  const adRef = useRef(null);
  const [hazir, setHazir] = useState(false);
  const onRewardRef = useRef(null);
  const odulKazanildiRef = useRef(false);

  useEffect(() => {
    const ad = RewardedAd.createForAdRequest(REWARDED_ID, {
      requestNonPersonalizedAdsOnly: true,
    });

    adRef.current = ad;

    const tekrarYukle = () => {
      setHazir(false);
      odulKazanildiRef.current = false;
      ad.load();
    };

    const unsubLoaded = ad.addAdEventListener(AdEventType.LOADED, () => {
      setHazir(true);
    });
    const unsubReward = ad.addAdEventListener(
      RewardedAdEventType.EARNED_REWARD,
      () => {
        odulKazanildiRef.current = true;
      }
    );
    const unsubClosed = ad.addAdEventListener(AdEventType.CLOSED, () => {
      const cb = onRewardRef.current;
      const odulKazanildi = odulKazanildiRef.current;
      onRewardRef.current = null;
      tekrarYukle();
      if (odulKazanildi && typeof cb === 'function') cb();
    });
    const unsubError = ad.addAdEventListener(AdEventType.ERROR, () => {
      onRewardRef.current = null;
      tekrarYukle();
    });

    ad.load();

    return () => {
      unsubLoaded();
      unsubReward();
      unsubClosed();
      unsubError();
    };
  }, []);

  const goster = useCallback((opts = {}) => {
    const onReward = typeof opts?.onReward === 'function' ? opts.onReward : null;
    if (adRef.current && hazir) {
      odulKazanildiRef.current = false;
      onRewardRef.current = onReward;
      adRef.current.show();
      return true;
    }
    odulKazanildiRef.current = false;
    onRewardRef.current = null;
    return false;
  }, [hazir]);

  return { goster, hazir };
}

import { useCallback } from 'react';

// Stub — AdMob entegrasyonu google-services.json olmadan çalışmaz.
export function useRewardedAd() {
  const goster = useCallback(() => false, []);
  return { goster, hazir: false };
}

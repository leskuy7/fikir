import React from 'react';
import { View, StyleSheet } from 'react-native';
import { BannerAd, BannerAdSize, TestIds } from 'react-native-google-mobile-ads';

// Production'da kendi AdMob banner unit ID'ni ADMOB_BANNER_ID env'ine yaz
const BANNER_ID = __DEV__
  ? TestIds.ADAPTIVE_BANNER
  : (process.env.EXPO_PUBLIC_ADMOB_BANNER_ID || TestIds.ADAPTIVE_BANNER);

export default function ReklamBanner({ style }) {
  return (
    <View style={[s.container, style]}>
      <BannerAd
        unitId={BANNER_ID}
        size={BannerAdSize.ANCHORED_ADAPTIVE_BANNER}
        requestOptions={{ requestNonPersonalizedAdsOnly: true }}
      />
    </View>
  );
}

const s = StyleSheet.create({
  container: {
    alignItems: 'center',
    marginVertical: 8,
  },
});

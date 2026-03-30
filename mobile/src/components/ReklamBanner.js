import React, { useCallback, useEffect, useRef, useState } from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { BannerAd, BannerAdSize, useForeground } from 'react-native-google-mobile-ads';
import { reklamBirimleri } from '../services/mobileAds';
import { tema } from '../theme';

export default function ReklamBanner({
  style,
  baslik = 'Sponsorlu Alan',
  aciklama = 'Google Mobile Ads',
  boyut = BannerAdSize.BANNER,
}) {
  const reklamRef = useRef(null);
  const [yenileAnahtari, setYenileAnahtari] = useState(0);
  const [yuklemeHatasi, setYuklemeHatasi] = useState(false);

  const yenidenDene = useCallback(() => {
    setYuklemeHatasi(false);
    setYenileAnahtari((onceki) => onceki + 1);
  }, []);

  useEffect(() => {
    if (!yuklemeHatasi) return undefined;

    const zamanlayici = setTimeout(() => {
      yenidenDene();
    }, 5000);

    return () => clearTimeout(zamanlayici);
  }, [yuklemeHatasi, yenidenDene]);

  useForeground(() => {
    if (yuklemeHatasi) {
      yenidenDene();
      return;
    }

    reklamRef.current?.load?.();
  });

  return (
    <View style={[s.kart, style]}>
      <View style={s.baslikSatiri}>
        <Text style={s.baslik}>{baslik}</Text>
        <Text style={s.aciklama}>{aciklama}</Text>
      </View>

      <View style={s.reklamAlani}>
        {yuklemeHatasi ? (
          <TouchableOpacity
            style={s.beklemeAlani}
            onPress={yenidenDene}
            activeOpacity={0.7}
          >
            <Text style={s.beklemeBaslik}>Reklam yeniden deneniyor</Text>
            <Text style={s.beklemeMetin}>Dokunursan hemen tekrar yuklenir.</Text>
          </TouchableOpacity>
        ) : (
          <BannerAd
            key={yenileAnahtari}
            ref={reklamRef}
            unitId={reklamBirimleri.banner}
            size={boyut}
            requestOptions={{ requestNonPersonalizedAdsOnly: true }}
            onAdLoaded={() => setYuklemeHatasi(false)}
            onAdFailedToLoad={() => setYuklemeHatasi(true)}
          />
        )}
      </View>
    </View>
  );
}

const s = StyleSheet.create({
  kart: {
    backgroundColor: tema.cardBg,
    borderRadius: tema.radius,
    borderWidth: 1,
    borderColor: tema.cardBorder,
    padding: 12,
    gap: 10,
  },
  baslikSatiri: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 12,
  },
  baslik: {
    color: tema.text,
    fontSize: 12,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },
  aciklama: {
    color: tema.textSecondary,
    fontSize: 11,
  },
  reklamAlani: {
    overflow: 'hidden',
    borderRadius: tema.radius - 4,
    minHeight: 72,
    backgroundColor: tema.bgSecondary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  beklemeAlani: {
    minHeight: 72,
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 16,
    gap: 4,
  },
  beklemeBaslik: {
    color: tema.text,
    fontSize: 13,
    fontWeight: '700',
  },
  beklemeMetin: {
    color: tema.textSecondary,
    fontSize: 11,
  },
});

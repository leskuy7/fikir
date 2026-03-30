import React, { useEffect, useMemo, useRef } from 'react';
import {
  FlatList,
  SafeAreaView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import ReklamBanner from '../components/ReklamBanner';
import { useLimitContext } from '../context/LimitContext';
import { useInterstitial } from '../hooks/useInterstitial';
import { useKartlar } from '../hooks/useKartlar';
import { useReklamOdulu } from '../hooks/useReklamOdulu';
import { tema } from '../theme';

const ISKELET_KARTLAR = Array.from({ length: 4 }, (_, index) => ({ key: `iskelet-${index}` }));

export default function KartlarScreen({ route, navigation }) {
  const { konu, mod } = route.params;
  const { limitDoldu, limitAsildi, sunucudanGuncelle } = useLimitContext();
  const { goster: interstitialGoster } = useInterstitial();
  const { kartlar, yukleniyor, hata, kartlariGetir, limitHatasi } = useKartlar(mod, null, {
    onLimitDoldu: limitDoldu,
    onLimitGuncelle: sunucudanGuncelle,
  });
  const autoDenendiRef = useRef(false);
  const {
    reklamIzle,
    reklamHazir: odulReklamiHazir,
    yukleniyor: odulYukleniyor,
    mesaj: odulMesaj,
  } = useReklamOdulu({
    onLimitGuncelle: sunucudanGuncelle,
    onOdulTamamlandi: async () => {
      await kartlariGetir(konu);
    },
  });

  useEffect(() => {
    void kartlariGetir(konu);
  }, [konu, kartlariGetir]);

  useEffect(() => {
    if (limitHatasi && !autoDenendiRef.current) {
      autoDenendiRef.current = true;
      return;
    }

    if (!limitHatasi) {
      autoDenendiRef.current = false;
    }
  }, [limitHatasi]);

  const ekranBasligi = useMemo(() => {
    if (yukleniyor) return `"${konu}" araniyor...`;
    if (kartlar.length > 0) {
      return `${kartlar.length} ${mod === 'bilgi' ? 'bilgi' : 'fikir'} karti bulundu`;
    }
    return `"${konu}" icin sonuc bekleniyor`;
  }, [kartlar.length, konu, mod, yukleniyor]);

  const kartaTikla = (kart) => {
    if (limitAsildi) return;
    interstitialGoster();
    navigation.navigate('Detay', {
      kart,
      mod,
      kartGecmisi: [kart],
    });
  };

  const renderKart = ({ item, index }) => (
    <TouchableOpacity
      style={[s.kart, limitAsildi && s.kartPasif]}
      onPress={() => kartaTikla(item)}
      disabled={limitAsildi}
      activeOpacity={0.7}
    >
      <View style={s.kartUst}>
        <Text style={s.etiket}>
          {mod === 'bilgi' ? 'Bilgi' : 'Fikir'} {index + 1}
        </Text>
      </View>
      <Text style={s.baslik}>{item.baslik}</Text>
      <Text style={s.kanca}>{item.kanca}</Text>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={s.container}>
      <View style={s.ustKart}>
        <Text style={s.modRozet}>{mod === 'bilgi' ? 'Bilgi Modu' : 'Fikir Modu'}</Text>
        <Text style={s.ustBaslik}>{ekranBasligi}</Text>
        <Text style={s.konuMetin}>Konu: {konu}</Text>
      </View>

      {limitHatasi && (
        <View style={s.limitKutusu}>
          <Text style={s.limitBaslik}>Devam etmek icin kisa bir reklam izle.</Text>
          <TouchableOpacity
            style={[s.limitBtn, (!odulReklamiHazir || odulYukleniyor) && s.limitBtnPasif]}
            onPress={reklamIzle}
            disabled={!odulReklamiHazir || odulYukleniyor}
            activeOpacity={0.7}
          >
            <Text style={s.limitBtnTxt}>
              {odulYukleniyor
                ? 'Odul aliniyor...'
                : odulReklamiHazir
                  ? 'Reklami Izle ve Devam Et'
                  : 'Reklam Hazirlaniyor...'}
            </Text>
          </TouchableOpacity>

          {!odulReklamiHazir && !odulMesaj && (
            <Text style={s.limitAlt}>Reklam hazir olunca tekrar dene.</Text>
          )}

          {!!odulMesaj && (
            <View style={[s.durumKutusu, s.hataKutusu]}>
              <Text style={s.hataMetni}>{odulMesaj}</Text>
            </View>
          )}
        </View>
      )}

      {!!hata && (
        <View style={[s.durumKutusu, s.hataKutusu, s.hataKutusuDis]}>
          <Text style={s.hataMetni}>{hata}</Text>
        </View>
      )}

      {yukleniyor ? (
        <View style={s.iskeletAlan}>
          {ISKELET_KARTLAR.map((kart) => (
            <View key={kart.key} style={s.iskeletKart}>
              <View style={s.iskeletRozet} />
              <View style={s.iskeletBaslik} />
              <View style={s.iskeletSatir} />
              <View style={[s.iskeletSatir, s.iskeletSatirKisa]} />
            </View>
          ))}
        </View>
      ) : kartlar.length > 0 ? (
        <FlatList
          data={kartlar}
          renderItem={renderKart}
          keyExtractor={(item, index) => `${item.baslik || 'kart'}-${index}`}
          numColumns={2}
          columnWrapperStyle={s.satir}
          contentContainerStyle={s.liste}
          showsVerticalScrollIndicator={false}
        />
      ) : !hata && !limitHatasi ? (
        <View style={s.bosDurum}>
          <Text style={s.bosDurumIkon}>{'\uD83D\uDCEC'}</Text>
          <Text style={s.bosDurumBaslik}>Sonuc bulunamadi</Text>
          <Text style={s.bosDurumMetin}>
            Konuyu biraz daha netlestirip tekrar dene. Ornek, kisi, marka ya da zaman eklemek
            daha iyi sonuc verir.
          </Text>
        </View>
      ) : null}

      <ReklamBanner />
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: tema.bg,
  },
  ustKart: {
    marginHorizontal: 12,
    marginTop: 10,
    marginBottom: 8,
    padding: 12,
    backgroundColor: tema.cardBg,
    borderWidth: 1,
    borderColor: tema.cardBorder,
    borderRadius: tema.radius,
  },
  modRozet: {
    alignSelf: 'flex-start',
    color: tema.accent,
    backgroundColor: tema.accentDim,
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 4,
    fontSize: 11,
    fontWeight: '700',
    marginBottom: 8,
  },
  ustBaslik: {
    color: tema.text,
    fontSize: 15,
    fontWeight: '700',
    marginBottom: 4,
  },
  konuMetin: {
    color: tema.textSecondary,
    fontSize: 12,
  },
  limitKutusu: {
    marginHorizontal: 12,
    marginTop: 14,
    backgroundColor: tema.bgSecondary,
    borderWidth: 1,
    borderColor: tema.cardBorder,
    borderRadius: tema.radius,
    padding: 12,
    gap: 8,
  },
  limitBaslik: {
    color: tema.text,
    fontSize: 13,
    textAlign: 'center',
    fontWeight: '600',
  },
  limitBtn: {
    backgroundColor: tema.accent,
    paddingVertical: 10,
    borderRadius: tema.radius,
    alignItems: 'center',
  },
  limitBtnPasif: {
    opacity: 0.6,
  },
  limitBtnTxt: {
    color: tema.bg,
    fontWeight: '700',
    fontSize: 12,
  },
  limitAlt: {
    color: tema.textSecondary,
    fontSize: 11,
    textAlign: 'center',
  },
  durumKutusu: {
    borderRadius: tema.radius,
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 12,
  },
  hataKutusu: {
    backgroundColor: tema.dangerDim,
    borderColor: tema.danger,
  },
  hataKutusuDis: {
    marginHorizontal: 12,
    marginTop: 12,
  },
  hataMetni: {
    color: tema.text,
    fontSize: 13,
    lineHeight: 20,
    textAlign: 'center',
  },
  iskeletAlan: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: 12,
    paddingTop: 6,
    paddingBottom: 24,
    gap: 10,
  },
  iskeletKart: {
    width: '48.5%',
    minHeight: 156,
    backgroundColor: tema.cardBg,
    borderRadius: tema.radius,
    padding: 15,
    borderWidth: 1,
    borderColor: tema.cardBorder,
    shadowColor: tema.shadow,
    shadowOpacity: 0.22,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 6 },
    elevation: 3,
  },
  iskeletRozet: {
    width: 64,
    height: 14,
    borderRadius: 999,
    backgroundColor: tema.skeleton,
    marginBottom: 18,
  },
  iskeletBaslik: {
    width: '88%',
    height: 24,
    borderRadius: 10,
    backgroundColor: tema.skeletonStrong,
    marginBottom: 10,
  },
  iskeletSatir: {
    width: '100%',
    height: 12,
    borderRadius: 8,
    backgroundColor: tema.skeleton,
    marginBottom: 8,
  },
  iskeletSatirKisa: {
    width: '76%',
  },
  liste: {
    paddingHorizontal: 12,
    paddingBottom: 24,
    paddingTop: 6,
  },
  satir: {
    gap: 10,
    marginBottom: 10,
  },
  kart: {
    flex: 1,
    backgroundColor: tema.cardBg,
    borderRadius: tema.radius,
    padding: 15,
    borderWidth: 1,
    borderColor: tema.cardBorder,
    minHeight: 156,
    shadowColor: tema.shadow,
    shadowOpacity: 0.22,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 6 },
    elevation: 4,
  },
  kartPasif: {
    opacity: 0.45,
  },
  kartUst: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 10,
  },
  etiket: {
    fontSize: 11,
    color: tema.accent,
    fontWeight: '700',
  },
  baslik: {
    fontSize: 16,
    fontWeight: '700',
    color: tema.text,
    marginBottom: 6,
    lineHeight: 21,
  },
  kanca: {
    fontSize: 13,
    color: tema.textSecondary,
    lineHeight: 19,
  },
  bosDurum: {
    marginHorizontal: 12,
    marginTop: 20,
    backgroundColor: tema.cardBg,
    borderRadius: tema.radius,
    borderWidth: 1,
    borderColor: tema.cardBorder,
    paddingHorizontal: 18,
    paddingVertical: 26,
    alignItems: 'center',
  },
  bosDurumIkon: {
    fontSize: 36,
    marginBottom: 12,
  },
  bosDurumBaslik: {
    color: tema.text,
    fontSize: 18,
    fontWeight: '800',
    marginBottom: 8,
  },
  bosDurumMetin: {
    color: tema.textSecondary,
    fontSize: 13,
    lineHeight: 20,
    textAlign: 'center',
  },
});

import React, { useEffect, useState, useCallback, useRef } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  StyleSheet,
  SafeAreaView,
} from 'react-native';
import { useKartlar } from '../hooks/useKartlar';
import { useLimitContext } from '../context/LimitContext';
import { useInterstitial } from '../hooks/useInterstitial';
import { useRewardedAd } from '../hooks/useRewardedAd';
import ReklamBanner from '../components/ReklamBanner';
import { reklamOdulAl } from '../services/api';
import { tema } from '../theme';

const EMOJILER_BILGI = ['💡', '🔭', '⚡', '🧩', '🔄', '🌍'];
const EMOJILER_FIKIR = ['🚀', '💡', '🎯', '⚡', '🌟', '🔧'];

export default function KartlarScreen({ route, navigation }) {
  const { konu, mod } = route.params;
  const { limitDoldu, sunucudanGuncelle } = useLimitContext();
  const { goster: interstitialGoster } = useInterstitial();
  const { goster: odulReklamiGoster, hazir: odulReklamiHazir } = useRewardedAd();
  const { kartlar, yukleniyor, hata, kartlariGetir, limitHatasi } = useKartlar(mod, null, {
    onLimitDoldu: limitDoldu,
    onLimitGuncelle: sunucudanGuncelle,
  });
  const [odulYukleniyor, setOdulYukleniyor] = useState(false);
  const [odulMesaj, setOdulMesaj] = useState('');
  const autoDenendiRef = useRef(false);

  useEffect(() => {
    kartlariGetir(konu);
  }, [konu, kartlariGetir]);

  const odulMesajiGetir = useCallback((kod) => {
    if (kod === 'ODUL_LIMIT_DOLDU') return 'Günlük reklam ödül hakkın doldu.';
    if (kod === 'LIMIT_SERVISI_KULLANILAMIYOR') return 'Limit servisi geçici olarak kullanılamıyor.';
    if (kod === 'BACKEND_URL_YOK') return 'Sunucu adresi bulunamadı.';
    return 'Reklam ödülü alınamadı. Birazdan tekrar dene.';
  }, []);

  const reklamIzle = useCallback(() => {
    if (odulYukleniyor) return false;
    setOdulMesaj('');
    const gosterildi = odulReklamiGoster({
      onReward: async () => {
        setOdulYukleniyor(true);
        try {
          const { limit } = await reklamOdulAl();
          sunucudanGuncelle(limit);
          setOdulMesaj('');
          kartlariGetir(konu);
        } catch (err) {
          setOdulMesaj(odulMesajiGetir(err.message));
        } finally {
          setOdulYukleniyor(false);
        }
      },
    });
    if (!gosterildi) {
      setOdulMesaj('Reklam hazırlanıyor, birazdan tekrar dene.');
    }
    return gosterildi;
  }, [kartlariGetir, konu, odulMesajiGetir, odulReklamiGoster, odulYukleniyor, sunucudanGuncelle]);

  useEffect(() => {
    if (limitHatasi) {
      if (!autoDenendiRef.current) {
        autoDenendiRef.current = true;
        reklamIzle();
      }
    } else {
      autoDenendiRef.current = false;
    }
  }, [limitHatasi, reklamIzle]);

  const emojiler = mod === 'bilgi' ? EMOJILER_BILGI : EMOJILER_FIKIR;

  const kartaTikla = async (kart) => {
    interstitialGoster(); // Her 3. kart açılışında geçiş reklamı
    navigation.navigate('Detay', { kart, mod });
  };

  const renderKart = ({ item, index }) => (
    <TouchableOpacity
      style={s.kart}
      onPress={() => kartaTikla(item)}
      activeOpacity={0.7}
    >
      <View style={s.kartUst}>
        <Text style={s.emoji}>{emojiler[index % emojiler.length]}</Text>
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
        <Text style={s.ustBaslik}>
          {kartlar.length > 0
            ? `${kartlar.length} ${mod === 'bilgi' ? 'bilgi' : 'fikir'} kartı bulundu`
            : `"${konu}" aranıyor...`}
        </Text>
        <Text style={s.konuMetin}>Konu: {konu}</Text>
      </View>

      {yukleniyor && (
        <ActivityIndicator
          size="large"
          color={tema.accent}
          style={{ marginTop: 22 }}
        />
      )}

      {limitHatasi && (
        <View style={s.limitKutusu}>
          <Text style={s.limitBaslik}>Devam etmek için kısa bir reklam izle.</Text>
          <TouchableOpacity
            style={[
              s.limitBtn,
              (!odulReklamiHazir || odulYukleniyor) && s.limitBtnPasif,
            ]}
            onPress={reklamIzle}
            disabled={!odulReklamiHazir || odulYukleniyor}
          >
            <Text style={s.limitBtnTxt}>
              {odulYukleniyor
                ? 'Ödül alınıyor...'
                : odulReklamiHazir
                  ? 'Reklamı İzle'
                  : 'Reklam Hazırlanıyor...'}
            </Text>
          </TouchableOpacity>
          {!odulReklamiHazir && !odulMesaj && (
            <Text style={s.limitAlt}>Reklam hazır olunca tekrar dene.</Text>
          )}
          {!!odulMesaj && <Text style={s.limitAlt}>{odulMesaj}</Text>}
        </View>
      )}

      {hata && <Text style={s.hata}>{hata}</Text>}

      <FlatList
        data={kartlar}
        renderItem={renderKart}
        keyExtractor={(item, i) => `${item.baslik || 'kart'}-${i}`}
        numColumns={2}
        columnWrapperStyle={s.satir}
        contentContainerStyle={s.liste}
        showsVerticalScrollIndicator={false}
      />

      <ReklamBanner />
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: tema.bg },
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
  hata: {
    color: tema.danger,
    textAlign: 'center',
    marginTop: 16,
    fontSize: 14,
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
  liste: { paddingHorizontal: 12, paddingBottom: 24, paddingTop: 6 },
  satir: { gap: 10, marginBottom: 10 },
  kart: {
    flex: 1,
    backgroundColor: tema.cardBg,
    borderRadius: tema.radius,
    padding: 15,
    borderWidth: 1,
    borderColor: tema.cardBorder,
    minHeight: 156,
    shadowColor: '#000',
    shadowOpacity: 0.22,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 6 },
    elevation: 3,
  },
  kartUst: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 10,
  },
  emoji: { fontSize: 18 },
  etiket: { fontSize: 11, color: tema.accent, fontWeight: '600' },
  baslik: {
    fontSize: 16,
    fontWeight: '700',
    color: tema.text,
    marginBottom: 6,
    lineHeight: 21,
  },
  kanca: { fontSize: 13, color: tema.textSecondary, lineHeight: 19 },
});

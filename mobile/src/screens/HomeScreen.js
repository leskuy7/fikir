import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
} from 'react-native';
import { useLimitContext } from '../context/LimitContext';
import { useRewardedAd } from '../hooks/useRewardedAd';
import { reklamOdulAl, reklamOdulOturumuBaslat } from '../services/api';
import { tema } from '../theme';

const MODLAR = [
  { key: 'bilgi', label: '📚 Bilgi' },
  { key: 'fikir', label: '💡 Fikir' },
];

export default function HomeScreen({ navigation }) {
  const [girdi, setGirdi] = useState('');
  const [aktifMod, setAktifMod] = useState('bilgi');
  const { kalan, uyari, limitAsildi, sunucudanGuncelle } = useLimitContext();
  const { goster: odulReklamiGoster, hazir: odulReklamiHazir } = useRewardedAd();
  const [odulYukleniyor, setOdulYukleniyor] = useState(false);
  const [odulMesaj, setOdulMesaj] = useState('');

  const odulMesajiGetir = useCallback((kod) => {
    if (kod === 'ODUL_LIMIT_DOLDU') return 'Günlük reklam ödül hakkın doldu.';
    if (kod === 'REKLAM_ODUL_GEREKSIZ') return 'Şu an reklam ödülü gerekmiyor.';
    if (kod === 'REKLAM_ODUL_DOGRULANAMADI') return 'Reklam doğrulanamadı. Tekrar dene.';
    if (kod === 'REKLAM_ODUL_BEKLENIYOR') return 'Reklam doğrulaması tamamlanmadı. Tekrar dene.';
    if (kod === 'LIMIT_SERVISI_KULLANILAMIYOR') return 'Limit servisi geçici olarak kullanılamıyor.';
    if (kod === 'ISTEK_HATASI') return 'Ödül isteği başlatılamadı. Tekrar dene.';
    if (kod === 'BACKEND_URL_YOK') return 'Sunucu adresi bulunamadı.';
    return 'Reklam ödülü alınamadı. Birazdan tekrar dene.';
  }, []);

  const reklamIzle = useCallback(async () => {
    if (odulYukleniyor) return;
    if (!odulReklamiHazir) {
      setOdulMesaj('Reklam hazırlanıyor, birazdan tekrar dene.');
      return;
    }

    setOdulYukleniyor(true);
    setOdulMesaj('');
    let odulOturumu;
    try {
      const { oturum, limit } = await reklamOdulOturumuBaslat();
      sunucudanGuncelle(limit || null);
      if (!oturum?.id || !oturum?.imza) {
        throw new Error('REKLAM_ODUL_DOGRULANAMADI');
      }
      odulOturumu = oturum;
    } catch (err) {
      setOdulMesaj(odulMesajiGetir(err.message));
      setOdulYukleniyor(false);
      return;
    }

    const gosterildi = odulReklamiGoster({
      onReward: async () => {
        try {
          const { limit } = await reklamOdulAl({
            oturumId: odulOturumu.id,
            imza: odulOturumu.imza,
          });
          sunucudanGuncelle(limit);
          setOdulMesaj('');
        } catch (err) {
          setOdulMesaj(odulMesajiGetir(err.message));
        } finally {
          setOdulYukleniyor(false);
        }
      },
      onClosed: ({ rewarded }) => {
        if (!rewarded) {
          setOdulYukleniyor(false);
          setOdulMesaj('Reklam tamamlanmadı, yeni hak açılmadı.');
        }
      },
      onError: () => {
        setOdulYukleniyor(false);
        setOdulMesaj('Reklam açılırken bir sorun oldu. Tekrar dene.');
      },
    });
    if (!gosterildi) {
      setOdulMesaj('Reklam hazırlanıyor, birazdan tekrar dene.');
      setOdulYukleniyor(false);
    }
  }, [odulMesajiGetir, odulReklamiGoster, odulReklamiHazir, odulYukleniyor, sunucudanGuncelle]);

  const ara = () => {
    const metin = girdi.trim();
    if (!metin) return;
    if (limitAsildi) {
      void reklamIzle();
      return;
    }
    navigation.navigate('Kartlar', { konu: metin, mod: aktifMod });
    setGirdi('');
  };

  return (
    <SafeAreaView style={s.container}>
      <View style={s.arkaDaire1} />
      <View style={s.arkaDaire2} />

      <View style={s.hero}>
        <View style={s.logoBadge}>
          <Text style={s.logo}>✨</Text>
        </View>
        <Text style={s.baslik}>Fikir Kutusu</Text>
        <Text style={s.altbaslik}>Merak et, keşfet, ilham al</Text>
      </View>

      <View style={s.kontrolKart}>
        <View style={s.modRow}>
          {MODLAR.map((m) => (
            <TouchableOpacity
              key={m.key}
              style={[s.modBtn, aktifMod === m.key && s.modBtnAktif]}
              onPress={() => setAktifMod(m.key)}
            >
              <Text style={[s.modTxt, aktifMod === m.key && s.modTxtAktif]}>
                {m.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        <TextInput
          style={s.input}
          placeholder={
            aktifMod === 'bilgi'
              ? 'Neyi merak ediyorsun?'
              : 'Hangi alanda fikir arıyorsun?'
          }
          placeholderTextColor={tema.textSecondary}
          value={girdi}
          onChangeText={setGirdi}
          onSubmitEditing={ara}
          returnKeyType="search"
        />

        <TouchableOpacity style={s.btn} onPress={ara}>
          <Text style={s.btnTxt}>
            {aktifMod === 'bilgi' ? 'Keşfetmeye Başla' : 'Fikir Üret'}
          </Text>
        </TouchableOpacity>

        <Text style={s.ipucu}>Kısa ve net bir konu yazman daha iyi sonuç verir.</Text>
        {uyari && (
          <Text style={s.limitUyari}>Günlük limitine yaklaşıyorsun — {kalan} istek kaldı.</Text>
        )}
        {limitAsildi && (
          <View style={s.limitKutusu}>
            <Text style={s.limitHata}>
              Devam etmek için kısa bir reklam izleyebilirsin.
            </Text>
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
      </View>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: tema.bg,
    paddingHorizontal: 20,
    justifyContent: 'center',
    overflow: 'hidden',
  },
  arkaDaire1: {
    position: 'absolute',
    width: 220,
    height: 220,
    borderRadius: 999,
    backgroundColor: tema.accentSoft,
    top: -60,
    right: -70,
  },
  arkaDaire2: {
    position: 'absolute',
    width: 180,
    height: 180,
    borderRadius: 999,
    backgroundColor: 'rgba(120, 167, 224, 0.16)',
    bottom: -40,
    left: -60,
  },
  hero: { alignItems: 'center', marginBottom: 22 },
  logoBadge: {
    width: 74,
    height: 74,
    borderRadius: 999,
    backgroundColor: tema.cardBg,
    borderWidth: 1,
    borderColor: tema.cardBorderStrong,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  logo: { fontSize: 36 },
  baslik: {
    fontSize: 30,
    fontWeight: '700',
    color: tema.text,
    letterSpacing: -0.7,
  },
  altbaslik: {
    fontSize: 15,
    color: tema.textSecondary,
    marginTop: 6,
  },
  kontrolKart: {
    backgroundColor: tema.cardBg,
    borderWidth: 1,
    borderColor: tema.cardBorder,
    borderRadius: tema.radius + 4,
    padding: 14,
    gap: 12,
  },
  modRow: {
    flexDirection: 'row',
    gap: 8,
    backgroundColor: tema.bgSecondary,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: tema.cardBorder,
    padding: 4,
  },
  modBtn: {
    flex: 1,
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 100,
    alignItems: 'center',
  },
  modBtnAktif: {
    backgroundColor: tema.accentDim,
  },
  modTxt: { color: tema.textSecondary, fontSize: 14, fontWeight: '500' },
  modTxtAktif: { color: tema.accent },
  input: {
    backgroundColor: tema.bgSecondary,
    borderRadius: tema.radius,
    paddingHorizontal: 16,
    paddingVertical: 15,
    fontSize: 16,
    color: tema.text,
    borderWidth: 1,
    borderColor: tema.cardBorder,
  },
  btn: {
    backgroundColor: tema.accent,
    paddingHorizontal: 20,
    paddingVertical: 15,
    borderRadius: tema.radius,
    alignItems: 'center',
  },
  btnTxt: { color: tema.bg, fontWeight: '800', fontSize: 16 },
  ipucu: {
    color: tema.textSecondary,
    fontSize: 12,
    textAlign: 'center',
  },
  limitUyari: {
    color: '#f6ad55',
    fontSize: 12,
    textAlign: 'center',
    marginTop: 4,
  },
  limitKutusu: {
    backgroundColor: tema.bgSecondary,
    borderWidth: 1,
    borderColor: tema.cardBorder,
    borderRadius: tema.radius,
    padding: 12,
    gap: 8,
    marginTop: 4,
  },
  limitHata: {
    color: tema.text,
    fontSize: 12,
    textAlign: 'center',
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
});

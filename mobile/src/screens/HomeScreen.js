import AsyncStorage from '@react-native-async-storage/async-storage';
import React, { useEffect, useState } from 'react';
import {
  Image,
  KeyboardAvoidingView,
  Platform,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import ReklamBanner from '../components/ReklamBanner';
import { useAuthContext } from '../context/AuthContext';
import { useLimitContext } from '../context/LimitContext';
import { useReklamOdulu } from '../hooks/useReklamOdulu';
import { tema } from '../theme';

const MODLAR = [
  {
    key: 'bilgi',
    label: 'Bilgi',
    aciklama: 'Aciklama, ogrenme ve hizli cevaplar',
  },
  {
    key: 'fikir',
    label: 'Fikir',
    aciklama: 'Baslik, icerik ve yeni yonler',
  },
];
const ARAMA_GECMISI_ANAHTARI = 'fikir-kutusu-arama-gecmisi';

function parseGecmis(kayit) {
  if (!Array.isArray(kayit)) return [];

  return kayit
    .filter((oge) => typeof oge?.konu === 'string' && typeof oge?.mod === 'string')
    .slice(0, 6);
}

export default function HomeScreen({ navigation }) {
  const [girdi, setGirdi] = useState('');
  const [aktifMod, setAktifMod] = useState('bilgi');
  const [aramaGecmisi, setAramaGecmisi] = useState([]);
  const { kullanici, cikisYap, islemde: authIslemde } = useAuthContext();
  const { kalan, uyari, limitAsildi, sunucudanGuncelle } = useLimitContext();
  const {
    reklamIzle,
    reklamHazir: odulReklamiHazir,
    yukleniyor: odulYukleniyor,
    mesaj: odulMesaj,
  } = useReklamOdulu({
    onLimitGuncelle: sunucudanGuncelle,
  });

  useEffect(() => {
    const gecmisiYukle = async () => {
      try {
        const kayit = await AsyncStorage.getItem(ARAMA_GECMISI_ANAHTARI);
        if (!kayit) return;
        setAramaGecmisi(parseGecmis(JSON.parse(kayit)));
      } catch {
        setAramaGecmisi([]);
      }
    };

    void gecmisiYukle();
  }, []);

  const gecmiseKaydet = async (konu, mod) => {
    const yeniKayit = { konu, mod };
    const sirali = [
      yeniKayit,
      ...aramaGecmisi.filter((oge) => oge.konu !== konu),
    ].slice(0, 6);

    setAramaGecmisi(sirali);

    try {
      await AsyncStorage.setItem(ARAMA_GECMISI_ANAHTARI, JSON.stringify(sirali));
    } catch {
      // Arama gecmisi yardimci bilgi, sessizce gec.
    }
  };

  const kartlaraGit = async (konu, mod) => {
    if (!konu || limitAsildi) return;
    await gecmiseKaydet(konu, mod);
    navigation.navigate('Kartlar', { konu, mod });
  };

  const ara = () => {
    const metin = girdi.trim();
    if (!metin || limitAsildi) return;

    void kartlaraGit(metin, aktifMod);
    setGirdi('');
  };

  const gecmistenAc = (oge) => {
    if (limitAsildi) return;
    setAktifMod(oge.mod);
    setGirdi(oge.konu);
    void kartlaraGit(oge.konu, oge.mod);
  };

  return (
    <SafeAreaView style={s.container}>
      <KeyboardAvoidingView
        style={s.klavyeKapsayici}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 20 : 0}
      >
        <ScrollView
          contentContainerStyle={s.icerik}
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode="on-drag"
          showsVerticalScrollIndicator={false}
        >
          <View style={s.ustBar}>
            <View style={s.kullaniciKart}>
              {kullanici?.photoURL ? (
                <Image source={{ uri: kullanici.photoURL }} style={s.avatar} />
              ) : (
                <View style={s.avatarYerTutucu}>
                  <Text style={s.avatarYazi}>
                    {(kullanici?.displayName || kullanici?.email || 'K').slice(0, 1).toUpperCase()}
                  </Text>
                </View>
              )}

              <View style={s.kullaniciMetin}>
                <Text style={s.kullaniciEtiket}>Google hesabi</Text>
                <Text style={s.kullaniciAd}>
                  {kullanici?.displayName || kullanici?.email || 'Kullanici'}
                </Text>
              </View>
            </View>

            <TouchableOpacity
              style={[s.cikisButon, authIslemde && s.cikisButonPasif]}
              onPress={() => void cikisYap()}
              disabled={authIslemde}
              activeOpacity={0.7}
            >
              <Text style={s.cikisYazi}>{authIslemde ? 'Bekle...' : 'Cikis'}</Text>
            </TouchableOpacity>
          </View>

          <View style={s.ozetKart}>
            <View style={s.ozetUst}>
              <View style={s.ozetMetin}>
                <Text style={s.baslik}>Fikir Kutusu</Text>
                <Text style={s.altBaslik}>Tek konu yaz, bilgi ya da fikir kartlari al.</Text>
              </View>

              <View style={[s.hakRozeti, limitAsildi ? s.hakRozetiTehlike : s.hakRozetiNormal]}>
                <Text
                  style={[
                    s.hakRozetiYazi,
                    limitAsildi ? s.hakRozetiYaziTehlike : s.hakRozetiYaziNormal,
                  ]}
                >
                  {kalan} hak
                </Text>
              </View>
            </View>

            <View style={s.istatistikSatiri}>
              <View style={s.istatistikKart}>
                <Text style={s.istatistikEtiket}>Aktif mod</Text>
                <Text style={s.istatistikDeger}>{aktifMod === 'bilgi' ? 'Bilgi' : 'Fikir'}</Text>
              </View>

              <View style={s.istatistikKart}>
                <Text style={s.istatistikEtiket}>Durum</Text>
                <Text style={s.istatistikDeger}>
                  {limitAsildi ? 'Reklam ile devam' : uyari ? 'Sinira yakin' : 'Hazir'}
                </Text>
              </View>
            </View>
          </View>

          <View style={s.kontrolKart}>
            <Text style={s.bolumEtiket}>Arama paneli</Text>

            <View style={s.modSatiri}>
              {MODLAR.map((mod) => {
                const aktif = aktifMod === mod.key;
                return (
                  <TouchableOpacity
                    key={mod.key}
                    style={[s.modKart, aktif && s.modKartAktif]}
                    onPress={() => setAktifMod(mod.key)}
                    activeOpacity={0.7}
                  >
                    <Text style={[s.modBaslik, aktif && s.modBaslikAktif]}>{mod.label}</Text>
                    <Text style={[s.modAciklama, aktif && s.modAciklamaAktif]}>
                      {mod.aciklama}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            <View style={s.girdiKart}>
              <Text style={s.girdiEtiket}>Konu</Text>
              <View style={s.inputKapsayici}>
                <Text style={s.aramaIkonu}>{'\u2315'}</Text>
                <TextInput
                  style={s.input}
                  placeholder={
                    aktifMod === 'bilgi'
                      ? 'Ornek: Roma Imparatorlugu neden yikildi?'
                      : 'Ornek: kahve markasi icin kampanya fikri'
                  }
                  placeholderTextColor={tema.textSecondary}
                  value={girdi}
                  onChangeText={setGirdi}
                  onSubmitEditing={ara}
                  returnKeyType="search"
                />
              </View>
            </View>

            <TouchableOpacity
              style={[s.anaButon, limitAsildi && s.anaButonPasif]}
              onPress={ara}
              disabled={limitAsildi}
              activeOpacity={0.7}
            >
              <Text style={s.anaButonYazi}>
                {aktifMod === 'bilgi' ? 'Bilgiyi Getir' : 'Fikir Uret'}
              </Text>
            </TouchableOpacity>

            {aramaGecmisi.length > 0 && (
              <View style={s.gecmisBolumu}>
                <Text style={s.gecmisEtiket}>Gecmis</Text>
                <View style={s.gecmisSatiri}>
                  {aramaGecmisi.map((oge, index) => (
                    <TouchableOpacity
                      key={`${oge.konu}-${index}`}
                      style={s.gecmisChip}
                      onPress={() => gecmistenAc(oge)}
                      activeOpacity={0.7}
                    >
                      <Text style={s.gecmisChipMod}>{oge.mod === 'bilgi' ? 'Bilgi' : 'Fikir'}</Text>
                      <Text style={s.gecmisChipMetin} numberOfLines={1}>
                        {oge.konu}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
            )}

            {uyari && !limitAsildi && (
              <View style={[s.durumKutusu, s.uyariKutusu]}>
                <Text style={s.uyariBaslik}>Sinira yaklastin</Text>
                <Text style={s.uyariMetin}>{kalan} istek kaldi.</Text>
              </View>
            )}

            {limitAsildi && (
              <View style={s.limitKutusu}>
                <Text style={s.limitBaslik}>Gunluk hak bitti.</Text>
                <Text style={s.limitMetin}>
                  Devam etmek icin odullu reklam izleyip yeni hak acabilirsin.
                </Text>

                <TouchableOpacity
                  style={[
                    s.limitButon,
                    (!odulReklamiHazir || odulYukleniyor) && s.limitButonPasif,
                  ]}
                  onPress={reklamIzle}
                  disabled={!odulReklamiHazir || odulYukleniyor}
                  activeOpacity={0.7}
                >
                  <Text style={s.limitButonYazi}>
                    {odulYukleniyor
                      ? 'Odul isleniyor...'
                      : odulReklamiHazir
                        ? 'Reklami Izle ve Devam Et'
                        : 'Reklam Hazirlaniyor...'}
                  </Text>
                </TouchableOpacity>

                {!odulReklamiHazir && !odulMesaj && (
                  <Text style={s.limitAltMetin}>Reklam yuklenince tekrar dene.</Text>
                )}

                {!!odulMesaj && (
                  <View style={[s.durumKutusu, s.hataKutusu]}>
                    <Text style={s.hataMetin}>{odulMesaj}</Text>
                  </View>
                )}
              </View>
            )}
          </View>

          <ReklamBanner
            style={s.reklamKart}
            baslik="Sponsorlu Alan"
            aciklama="Banner reklam"
          />
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: tema.bg,
  },
  klavyeKapsayici: {
    flex: 1,
  },
  icerik: {
    flexGrow: 1,
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 28,
    gap: 14,
  },
  ustBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  kullaniciKart: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: tema.cardBg,
    borderRadius: tema.radius,
    borderWidth: 1,
    borderColor: tema.cardBorder,
    padding: 12,
  },
  avatar: {
    width: 42,
    height: 42,
    borderRadius: 21,
    borderWidth: 1,
    borderColor: tema.cardBorderStrong,
  },
  avatarYerTutucu: {
    width: 42,
    height: 42,
    borderRadius: 21,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: tema.accentDim,
    borderWidth: 1,
    borderColor: tema.cardBorderStrong,
  },
  avatarYazi: {
    color: tema.text,
    fontSize: 18,
    fontWeight: '800',
  },
  kullaniciMetin: {
    flex: 1,
    gap: 2,
  },
  kullaniciEtiket: {
    color: tema.textSecondary,
    fontSize: 11,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },
  kullaniciAd: {
    color: tema.text,
    fontSize: 14,
    fontWeight: '700',
  },
  cikisButon: {
    paddingHorizontal: 16,
    paddingVertical: 13,
    borderRadius: 999,
    backgroundColor: tema.bgSecondary,
    borderWidth: 1,
    borderColor: tema.cardBorder,
  },
  cikisButonPasif: {
    opacity: 0.65,
  },
  cikisYazi: {
    color: tema.text,
    fontSize: 12,
    fontWeight: '700',
  },
  ozetKart: {
    backgroundColor: tema.cardBg,
    borderRadius: tema.radius,
    borderWidth: 1,
    borderColor: tema.cardBorder,
    padding: 16,
    gap: 14,
  },
  ozetUst: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
  },
  ozetMetin: {
    flex: 1,
    gap: 4,
  },
  baslik: {
    color: tema.text,
    fontSize: 26,
    fontWeight: '800',
  },
  altBaslik: {
    color: tema.textSecondary,
    fontSize: 14,
    lineHeight: 20,
  },
  hakRozeti: {
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderWidth: 1,
  },
  hakRozetiNormal: {
    backgroundColor: tema.successDim,
    borderColor: tema.success,
  },
  hakRozetiTehlike: {
    backgroundColor: tema.dangerDim,
    borderColor: tema.danger,
  },
  hakRozetiYazi: {
    fontSize: 12,
    fontWeight: '700',
  },
  hakRozetiYaziNormal: {
    color: tema.success,
  },
  hakRozetiYaziTehlike: {
    color: tema.danger,
  },
  istatistikSatiri: {
    flexDirection: 'row',
    gap: 10,
  },
  istatistikKart: {
    flex: 1,
    backgroundColor: tema.bgSecondary,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: tema.cardBorder,
    padding: 12,
    gap: 4,
  },
  istatistikEtiket: {
    color: tema.textSecondary,
    fontSize: 11,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },
  istatistikDeger: {
    color: tema.text,
    fontSize: 16,
    fontWeight: '700',
  },
  kontrolKart: {
    backgroundColor: tema.cardBg,
    borderRadius: tema.radius,
    borderWidth: 1,
    borderColor: tema.cardBorder,
    padding: 16,
    gap: 14,
  },
  bolumEtiket: {
    color: tema.textSecondary,
    fontSize: 11,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },
  modSatiri: {
    flexDirection: 'row',
    gap: 10,
  },
  modKart: {
    flex: 1,
    backgroundColor: tema.bgSecondary,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: tema.cardBorder,
    paddingHorizontal: 14,
    paddingVertical: 14,
    gap: 4,
  },
  modKartAktif: {
    backgroundColor: tema.accentDim,
    borderColor: tema.accent,
  },
  modBaslik: {
    color: tema.text,
    fontSize: 16,
    fontWeight: '700',
  },
  modBaslikAktif: {
    color: tema.accent,
  },
  modAciklama: {
    color: tema.textSecondary,
    fontSize: 12,
    lineHeight: 18,
  },
  modAciklamaAktif: {
    color: tema.text,
  },
  girdiKart: {
    gap: 8,
  },
  girdiEtiket: {
    color: tema.text,
    fontSize: 13,
    fontWeight: '700',
  },
  inputKapsayici: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: tema.bgSecondary,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: tema.cardBorder,
    paddingHorizontal: 14,
  },
  aramaIkonu: {
    color: tema.textSecondary,
    fontSize: 18,
    marginRight: 10,
  },
  input: {
    flex: 1,
    color: tema.text,
    fontSize: 16,
    paddingVertical: 16,
  },
  anaButon: {
    backgroundColor: tema.accent,
    borderRadius: 18,
    alignItems: 'center',
    paddingVertical: 16,
  },
  anaButonPasif: {
    opacity: 0.45,
  },
  anaButonYazi: {
    color: tema.bg,
    fontSize: 16,
    fontWeight: '800',
  },
  gecmisBolumu: {
    gap: 10,
  },
  gecmisEtiket: {
    color: tema.textSecondary,
    fontSize: 12,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },
  gecmisSatiri: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  gecmisChip: {
    maxWidth: '100%',
    backgroundColor: tema.bgSecondary,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: tema.cardBorder,
    paddingHorizontal: 12,
    paddingVertical: 10,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  gecmisChipMod: {
    color: tema.accent,
    fontSize: 11,
    fontWeight: '700',
  },
  gecmisChipMetin: {
    color: tema.text,
    fontSize: 12,
    maxWidth: 180,
  },
  durumKutusu: {
    borderRadius: 16,
    borderWidth: 1,
    paddingHorizontal: 14,
    paddingVertical: 12,
    gap: 4,
  },
  uyariKutusu: {
    backgroundColor: tema.warningDim,
    borderColor: tema.warning,
  },
  uyariBaslik: {
    color: tema.warning,
    fontSize: 13,
    fontWeight: '700',
  },
  uyariMetin: {
    color: tema.text,
    fontSize: 12,
  },
  hataKutusu: {
    backgroundColor: tema.dangerDim,
    borderColor: tema.danger,
  },
  hataMetin: {
    color: tema.text,
    fontSize: 12,
    lineHeight: 18,
  },
  limitKutusu: {
    backgroundColor: tema.bgSecondary,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: tema.cardBorder,
    padding: 14,
    gap: 10,
  },
  limitBaslik: {
    color: tema.text,
    fontSize: 15,
    fontWeight: '800',
  },
  limitMetin: {
    color: tema.textSecondary,
    fontSize: 13,
    lineHeight: 20,
  },
  limitButon: {
    backgroundColor: tema.accent,
    borderRadius: 14,
    alignItems: 'center',
    paddingVertical: 14,
  },
  limitButonPasif: {
    opacity: 0.65,
  },
  limitButonYazi: {
    color: tema.bg,
    fontSize: 13,
    fontWeight: '800',
  },
  limitAltMetin: {
    color: tema.textSecondary,
    fontSize: 12,
    lineHeight: 18,
  },
  reklamKart: {
    marginTop: 2,
  },
});

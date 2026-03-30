import React, { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import ReklamBanner from '../components/ReklamBanner';
import { useLimitContext } from '../context/LimitContext';
import { useReklamOdulu } from '../hooks/useReklamOdulu';
import { mesajGonder } from '../services/api';
import { tema } from '../theme';

function jsonCikar(metin) {
  const basla = metin.indexOf('[');
  const bitis = metin.lastIndexOf(']') + 1;
  if (basla === -1 || bitis <= basla) return null;

  try {
    return JSON.parse(metin.slice(basla, bitis));
  } catch {
    return null;
  }
}

function hataMesajiGetir(kod) {
  if (kod === 'BAGLANTI_HATASI') return 'Baglanti hatasi, tekrar dene.';
  if (kod === 'SERVIS_LIMITI_DOLDU') return 'AI servisi kotasi gecici olarak dolu.';
  if (kod === 'LIMIT_DOLDU') return 'Gunluk limitin doldu.';
  if (kod === 'GIRIS_GEREKLI') return 'Oturumun sona ermis. Lutfen yeniden giris yap.';
  return 'Icerik yuklenemedi.';
}

export default function DetayScreen({ route, navigation }) {
  const { kart, mod } = route.params;
  const kartGecmisiRef = useRef(
    Array.isArray(route.params?.kartGecmisi) && route.params.kartGecmisi.length > 0
      ? route.params.kartGecmisi
      : [kart]
  );
  const { sunucudanGuncelle, limitAsildi, limitDoldu } = useLimitContext();
  const [detay, setDetay] = useState('');
  const [detayHatasi, setDetayHatasi] = useState(false);
  const [ilgili, setIlgili] = useState([]);
  const [yukleniyor, setYukleniyor] = useState(true);
  const [soru, setSoru] = useState('');
  const [cevap, setCevap] = useState('');
  const [cevapHatasi, setCevapHatasi] = useState(false);
  const [cevapYukleniyor, setCevapYukleniyor] = useState(false);
  const {
    reklamIzle,
    reklamHazir,
    yukleniyor: odulYukleniyor,
    mesaj: odulMesaj,
  } = useReklamOdulu({
    onLimitGuncelle: sunucudanGuncelle,
  });

  const detaylariKapat = useCallback(() => {
    navigation.pop(Math.max(1, kartGecmisiRef.current.length));
  }, [navigation]);

  const breadcrumbaGit = useCallback((hedefIndex) => {
    const geriAdim = kartGecmisiRef.current.length - 1 - hedefIndex;
    if (geriAdim > 0) {
      navigation.pop(geriAdim);
    }
  }, [navigation]);

  useLayoutEffect(() => {
    navigation.setOptions({
      title: kart.baslik || 'Detay',
      headerRight: () => (
        <TouchableOpacity
          style={s.kapatButon}
          onPress={detaylariKapat}
          activeOpacity={0.7}
        >
          <Text style={s.kapatButonYazi}>X</Text>
        </TouchableOpacity>
      ),
    });
  }, [detaylariKapat, kart.baslik, navigation]);

  useEffect(() => {
    let iptal = false;

    const yukle = async () => {
      if (limitAsildi) {
        setYukleniyor(false);
        setIlgili([]);
        return;
      }

      setYukleniyor(true);
      setDetayHatasi(false);

      try {
        const mesaj = `${kart.baslik}\n\n${kart.kanca || ''}`;
        const sonuclar = await Promise.allSettled([
          mesajGonder({
            mesajlar: [{ role: 'user', content: mesaj }],
            mod: 'detay',
            onLimitGuncelle: sunucudanGuncelle,
            onLimitDoldu: limitDoldu,
          }),
          mesajGonder({
            mesajlar: [{ role: 'user', content: mesaj }],
            mod: 'ilgili',
            onLimitGuncelle: sunucudanGuncelle,
            onLimitDoldu: limitDoldu,
          }),
        ]);

        if (iptal) return;

        if (sonuclar[0].status === 'fulfilled') {
          setDetay(sonuclar[0].value.yanit || 'Bu kart icin detay bulunamadi.');
          setDetayHatasi(false);
        } else {
          setDetay(hataMesajiGetir(sonuclar[0].reason?.message));
          setDetayHatasi(true);
        }

        if (sonuclar[1].status === 'fulfilled') {
          const parsed = jsonCikar(sonuclar[1].value.yanit);
          setIlgili(Array.isArray(parsed) ? parsed : []);
        } else {
          setIlgili([]);
        }
      } catch (err) {
        if (iptal) return;
        setDetay(hataMesajiGetir(err?.message));
        setDetayHatasi(true);
        setIlgili([]);
      } finally {
        if (!iptal) {
          setYukleniyor(false);
        }
      }
    };

    void yukle();

    return () => {
      iptal = true;
    };
  }, [kart, limitAsildi, limitDoldu, sunucudanGuncelle]);

  const soruGonder = async () => {
    const temizSoru = soru.trim();
    if (!temizSoru || cevapYukleniyor || limitAsildi) return;

    setCevapYukleniyor(true);
    setCevapHatasi(false);

    try {
      const { yanit } = await mesajGonder({
        mesajlar: [
          {
            role: 'user',
            content: `Kart: ${kart.baslik}. ${kart.kanca || ''}\n\nKullanici sorusu: ${temizSoru}`,
          },
        ],
        mod: 'konu_kilidi',
        onLimitGuncelle: sunucudanGuncelle,
        onLimitDoldu: limitDoldu,
      });
      setCevap(yanit);
      setSoru('');
    } catch (err) {
      setCevap(hataMesajiGetir(err?.message));
      setCevapHatasi(true);
    } finally {
      setCevapYukleniyor(false);
    }
  };

  const ilgiliKartaTikla = (sonrakiKart) => {
    if (limitAsildi) {
      return;
    }

    navigation.push('Detay', {
      kart: sonrakiKart,
      mod,
      kartGecmisi: [...kartGecmisiRef.current, sonrakiKart],
    });
  };

  const renderIlgiliKart = ({ item, index }) => (
    <TouchableOpacity
      style={[s.ilgiliKart, limitAsildi && s.pasif]}
      onPress={() => ilgiliKartaTikla(item)}
      disabled={limitAsildi}
      activeOpacity={0.7}
    >
      <Text style={s.ilgiliEtiket}>Alt Kart {index + 1}</Text>
      <Text style={s.ilgiliKartBaslik}>{item.baslik}</Text>
      {item.kanca ? <Text style={s.ilgiliKartKanca}>{item.kanca}</Text> : null}
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={s.container}>
      <ScrollView
        contentContainerStyle={s.scroll}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <View style={s.breadcrumbKutusu}>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={s.breadcrumbIcerik}
          >
            {kartGecmisiRef.current.map((gecmisKart, index) => {
              const aktif = index === kartGecmisiRef.current.length - 1;
              return (
                <React.Fragment key={`${gecmisKart.baslik || 'kart'}-${index}`}>
                  <TouchableOpacity
                    style={[s.breadcrumbParca, aktif && s.breadcrumbParcaAktif]}
                    onPress={() => breadcrumbaGit(index)}
                    disabled={aktif}
                    activeOpacity={0.7}
                  >
                    <Text
                      style={[s.breadcrumbYazi, aktif && s.breadcrumbYaziAktif]}
                      numberOfLines={1}
                    >
                      {gecmisKart.baslik}
                    </Text>
                  </TouchableOpacity>
                  {index < kartGecmisiRef.current.length - 1 && (
                    <Text style={s.breadcrumbAyrac}>{'>'}</Text>
                  )}
                </React.Fragment>
              );
            })}
          </ScrollView>
        </View>

        <View style={s.heroKart}>
          <Text style={s.baslik}>{kart.baslik}</Text>
          {kart.kanca ? <Text style={s.kanca}>{kart.kanca}</Text> : null}
        </View>

        {yukleniyor ? (
          <View style={s.yukleniyorKutusu}>
            <ActivityIndicator size="large" color={tema.accent} />
          </View>
        ) : (
          <View style={[s.detayKart, detayHatasi && s.hataKutusu]}>
            <Text style={s.detay}>{detay}</Text>
          </View>
        )}

        <ReklamBanner style={s.reklamAlan} />

        {limitAsildi && (
          <View style={s.limitKutusu}>
            <Text style={s.limitBaslik}>Gunluk limitin doldu.</Text>
            <Text style={s.limitMetni}>
              Ilgili kartlari ve soru alanini tekrar acmak icin odullu reklam izleyebilirsin.
            </Text>
            <TouchableOpacity
              style={[s.limitBtn, (!reklamHazir || odulYukleniyor) && s.pasifButon]}
              onPress={reklamIzle}
              disabled={!reklamHazir || odulYukleniyor}
              activeOpacity={0.7}
            >
              <Text style={s.limitBtnTxt}>
                {odulYukleniyor
                  ? 'Odul aliniyor...'
                  : reklamHazir
                    ? 'Reklami Izle ve Devam Et'
                    : 'Reklam Hazirlaniyor...'}
              </Text>
            </TouchableOpacity>

            {!!odulMesaj && (
              <View style={[s.durumKutusu, s.hataKutusu]}>
                <Text style={s.hataMetni}>{odulMesaj}</Text>
              </View>
            )}

            {!reklamHazir && !odulMesaj && (
              <Text style={s.limitAlt}>Reklam hazir olunca tekrar dene.</Text>
            )}
          </View>
        )}

        {ilgili.length > 0 && (
          <View style={s.ilgiliBolum}>
            <Text style={s.ilgiliBaslik}>Bunlar da ilgini cekebilir</Text>
            {limitAsildi && (
              <Text style={s.limitUyari}>
                Limit acildiginda alt kartlar tekrar kullanilabilir olacak.
              </Text>
            )}

            <FlatList
              data={ilgili}
              renderItem={renderIlgiliKart}
              keyExtractor={(item, index) => `${item.baslik || 'ilgili'}-${index}`}
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={s.ilgiliListe}
            />
          </View>
        )}

        <View style={s.soruBolum}>
          <Text style={s.soruEtiket}>{kart.baslik} baglaminda sorunu yaz</Text>
          <View style={s.soruRow}>
            <TextInput
              style={s.soruInput}
              placeholder="Bu konuda merak ettigin bir sey yaz..."
              placeholderTextColor={tema.textSecondary}
              value={soru}
              onChangeText={setSoru}
              onSubmitEditing={soruGonder}
              multiline
              numberOfLines={3}
              textAlignVertical="top"
            />
            <TouchableOpacity
              style={[s.soruBtn, (cevapYukleniyor || limitAsildi) && s.pasifButon]}
              onPress={soruGonder}
              disabled={cevapYukleniyor || limitAsildi}
              activeOpacity={0.7}
            >
              <Text style={s.soruBtnTxt}>
                {limitAsildi ? 'Limit doldu' : cevapYukleniyor ? 'Bekle' : 'Gonder'}
              </Text>
            </TouchableOpacity>
          </View>

          {cevapYukleniyor && (
            <ActivityIndicator size="small" color={tema.accent} style={s.kucukYukleyici} />
          )}

          {!!cevap && !cevapYukleniyor && (
            <View style={[s.cevapKutusu, cevapHatasi && s.hataKutusu]}>
              <Text style={s.cevap}>{cevap}</Text>
            </View>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: tema.bg,
  },
  scroll: {
    padding: 16,
    paddingBottom: 40,
    gap: 12,
  },
  kapatButon: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: tema.cardBorder,
    backgroundColor: tema.bgSecondary,
  },
  kapatButonYazi: {
    color: tema.text,
    fontSize: 14,
    fontWeight: '800',
  },
  breadcrumbKutusu: {
    backgroundColor: tema.cardBg,
    borderRadius: tema.radius,
    borderWidth: 1,
    borderColor: tema.cardBorder,
    paddingVertical: 10,
    paddingHorizontal: 10,
  },
  breadcrumbIcerik: {
    alignItems: 'center',
    gap: 8,
  },
  breadcrumbParca: {
    maxWidth: 180,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 999,
    backgroundColor: tema.bgSecondary,
    borderWidth: 1,
    borderColor: tema.cardBorder,
  },
  breadcrumbParcaAktif: {
    backgroundColor: tema.accentDim,
    borderColor: tema.accent,
  },
  breadcrumbYazi: {
    color: tema.textSecondary,
    fontSize: 12,
    fontWeight: '600',
  },
  breadcrumbYaziAktif: {
    color: tema.accent,
  },
  breadcrumbAyrac: {
    color: tema.textSecondary,
    fontSize: 14,
    fontWeight: '700',
  },
  heroKart: {
    backgroundColor: tema.cardBg,
    borderRadius: tema.radius,
    borderWidth: 1,
    borderColor: tema.cardBorder,
    padding: 14,
  },
  baslik: {
    fontSize: 22,
    fontWeight: '800',
    color: tema.text,
    marginBottom: 6,
  },
  kanca: {
    fontSize: 14,
    color: tema.textSecondary,
    lineHeight: 21,
  },
  yukleniyorKutusu: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 26,
  },
  detayKart: {
    backgroundColor: tema.cardBg,
    borderRadius: tema.radius,
    borderWidth: 1,
    borderColor: tema.cardBorder,
    padding: 14,
  },
  detay: {
    fontSize: 15,
    color: tema.text,
    lineHeight: 24,
  },
  reklamAlan: {
    marginVertical: 2,
  },
  limitKutusu: {
    backgroundColor: tema.bgSecondary,
    borderRadius: tema.radius,
    borderWidth: 1,
    borderColor: tema.cardBorder,
    padding: 14,
    gap: 8,
  },
  limitBaslik: {
    fontSize: 15,
    fontWeight: '800',
    color: tema.text,
  },
  limitMetni: {
    fontSize: 13,
    color: tema.textSecondary,
    lineHeight: 20,
  },
  limitBtn: {
    backgroundColor: tema.accent,
    paddingVertical: 12,
    borderRadius: tema.radius,
    alignItems: 'center',
  },
  pasifButon: {
    opacity: 0.65,
  },
  limitBtnTxt: {
    color: tema.bg,
    fontWeight: '700',
    fontSize: 13,
  },
  limitAlt: {
    color: tema.textSecondary,
    fontSize: 12,
    textAlign: 'center',
  },
  ilgiliBolum: {
    gap: 10,
  },
  ilgiliBaslik: {
    fontSize: 15,
    fontWeight: '800',
    color: tema.accent,
  },
  ilgiliListe: {
    paddingRight: 6,
  },
  ilgiliKart: {
    width: 228,
    backgroundColor: tema.cardBg,
    borderRadius: tema.radius,
    padding: 14,
    marginRight: 10,
    borderWidth: 1,
    borderColor: tema.cardBorder,
  },
  ilgiliEtiket: {
    fontSize: 11,
    fontWeight: '700',
    color: tema.accent,
    marginBottom: 8,
  },
  ilgiliKartBaslik: {
    fontSize: 14,
    fontWeight: '700',
    color: tema.text,
  },
  ilgiliKartKanca: {
    fontSize: 12,
    color: tema.textSecondary,
    marginTop: 6,
    lineHeight: 18,
  },
  soruBolum: {
    borderRadius: tema.radius,
    borderWidth: 1,
    borderColor: tema.cardBorder,
    backgroundColor: tema.cardBg,
    padding: 14,
  },
  soruEtiket: {
    fontSize: 13,
    color: tema.textSecondary,
    marginBottom: 10,
    fontWeight: '600',
  },
  soruRow: {
    flexDirection: 'row',
    gap: 8,
    alignItems: 'flex-end',
  },
  soruInput: {
    flex: 1,
    backgroundColor: tema.bgSecondary,
    borderRadius: tema.radius,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 14,
    color: tema.text,
    borderWidth: 1,
    borderColor: tema.cardBorder,
    minHeight: 82,
    maxHeight: 130,
  },
  soruBtn: {
    backgroundColor: tema.accent,
    paddingHorizontal: 16,
    paddingVertical: 13,
    borderRadius: tema.radius,
    justifyContent: 'center',
  },
  soruBtnTxt: {
    color: tema.bg,
    fontWeight: '700',
    fontSize: 14,
  },
  kucukYukleyici: {
    marginTop: 12,
  },
  cevapKutusu: {
    marginTop: 14,
    backgroundColor: tema.bgSecondary,
    borderRadius: tema.radius,
    padding: 14,
    borderWidth: 1,
    borderColor: tema.cardBorder,
  },
  cevap: {
    fontSize: 14,
    color: tema.text,
    lineHeight: 22,
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
  hataMetni: {
    color: tema.text,
    fontSize: 13,
    lineHeight: 20,
  },
  pasif: {
    opacity: 0.4,
  },
  limitUyari: {
    color: tema.warning,
    fontSize: 12,
    fontWeight: '600',
  },
});

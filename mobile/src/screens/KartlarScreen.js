import React, { useEffect } from 'react';
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
import { tema } from '../theme';

const EMOJILER_BILGI = ['💡', '🔭', '⚡', '🧩', '🔄', '🌍'];
const EMOJILER_FIKIR = ['🚀', '💡', '🎯', '⚡', '🌟', '🔧'];

export default function KartlarScreen({ route, navigation }) {
  const { konu, mod } = route.params;
  const { limitDoldu, sunucudanGuncelle } = useLimitContext();
  const { kartlar, yukleniyor, hata, kartlariGetir } = useKartlar(mod, null, {
    onLimitDoldu: limitDoldu,
    onLimitGuncelle: sunucudanGuncelle,
  });

  useEffect(() => {
    kartlariGetir(konu);
  }, [konu, kartlariGetir]);

  const emojiler = mod === 'bilgi' ? EMOJILER_BILGI : EMOJILER_FIKIR;

  const kartaTikla = async (kart) => {
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

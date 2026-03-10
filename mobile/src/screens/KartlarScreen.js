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
import { tema } from '../theme';

const EMOJILER_BILGI = ['💡', '🔭', '⚡', '🧩', '🔄', '🌍'];
const EMOJILER_FIKIR = ['🚀', '💡', '🎯', '⚡', '🌟', '🔧'];

export default function KartlarScreen({ route, navigation }) {
  const { konu, mod } = route.params;
  const { kartlar, yukleniyor, hata, kartlariGetir, detayAc } = useKartlar(mod);

  useEffect(() => {
    kartlariGetir(konu);
  }, [konu]);

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
      <Text style={s.ustBaslik}>
        {kartlar.length > 0
          ? `${kartlar.length} ${mod === 'bilgi' ? 'bilgi' : 'fikir'} — "${konu}"`
          : `"${konu}" aranıyor...`}
      </Text>

      {yukleniyor && (
        <ActivityIndicator
          size="large"
          color={tema.accent}
          style={{ marginTop: 40 }}
        />
      )}

      {hata && <Text style={s.hata}>{hata}</Text>}

      <FlatList
        data={kartlar}
        renderItem={renderKart}
        keyExtractor={(_, i) => String(i)}
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
  ustBaslik: {
    color: tema.textSecondary,
    fontSize: 13,
    textAlign: 'center',
    paddingVertical: 12,
  },
  hata: {
    color: '#f87171',
    textAlign: 'center',
    marginTop: 16,
    fontSize: 14,
  },
  liste: { paddingHorizontal: 12, paddingBottom: 24 },
  satir: { gap: 10, marginBottom: 10 },
  kart: {
    flex: 1,
    backgroundColor: tema.cardBg,
    borderRadius: tema.radius,
    padding: 14,
    borderWidth: 1,
    borderColor: tema.cardBorder,
  },
  kartUst: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 8,
  },
  emoji: { fontSize: 18 },
  etiket: { fontSize: 11, color: tema.accent, fontWeight: '600' },
  baslik: {
    fontSize: 15,
    fontWeight: '700',
    color: tema.text,
    marginBottom: 4,
  },
  kanca: { fontSize: 12, color: tema.textSecondary, lineHeight: 17 },
});

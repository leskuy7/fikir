import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
} from 'react-native';
import { tema } from '../theme';

const MODLAR = [
  { key: 'bilgi', label: '📚 Bilgi' },
  { key: 'fikir', label: '💡 Fikir' },
];

export default function HomeScreen({ navigation }) {
  const [girdi, setGirdi] = useState('');
  const [aktifMod, setAktifMod] = useState('bilgi');

  const ara = () => {
    const metin = girdi.trim();
    if (!metin) return;
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
});

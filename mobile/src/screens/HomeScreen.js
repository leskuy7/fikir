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
      <View style={s.hero}>
        <Text style={s.logo}>✨</Text>
        <Text style={s.baslik}>Fikir Kutusu</Text>
        <Text style={s.altbaslik}>Merak et, keşfet, ilham al</Text>
      </View>

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

      <View style={s.inputRow}>
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
            {aktifMod === 'bilgi' ? 'Keşfet' : 'Üret'}
          </Text>
        </TouchableOpacity>
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
  },
  hero: { alignItems: 'center', marginBottom: 32 },
  logo: { fontSize: 44, marginBottom: 8 },
  baslik: {
    fontSize: 28,
    fontWeight: '700',
    color: tema.text,
    letterSpacing: -0.5,
  },
  altbaslik: {
    fontSize: 15,
    color: tema.textSecondary,
    marginTop: 4,
  },
  modRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 8,
    marginBottom: 24,
  },
  modBtn: {
    paddingVertical: 8,
    paddingHorizontal: 20,
    borderRadius: 100,
    backgroundColor: tema.bgSecondary,
    borderWidth: 1,
    borderColor: tema.cardBorder,
  },
  modBtnAktif: {
    backgroundColor: tema.accentDim,
    borderColor: tema.accent,
  },
  modTxt: { color: tema.textSecondary, fontSize: 14, fontWeight: '500' },
  modTxtAktif: { color: tema.accent },
  inputRow: {
    flexDirection: 'row',
    gap: 10,
    alignItems: 'center',
  },
  input: {
    flex: 1,
    backgroundColor: tema.bgSecondary,
    borderRadius: tema.radius,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 15,
    color: tema.text,
    borderWidth: 1,
    borderColor: tema.cardBorder,
  },
  btn: {
    backgroundColor: tema.accent,
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderRadius: tema.radius,
  },
  btnTxt: { color: tema.bg, fontWeight: '700', fontSize: 15 },
});

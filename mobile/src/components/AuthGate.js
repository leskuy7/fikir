import React from 'react';
import {
  ActivityIndicator,
  SafeAreaView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useAuthContext } from '../context/AuthContext';
import { tema } from '../theme';

function BeklemeEkrani() {
  return (
    <SafeAreaView style={s.container}>
      <View style={s.card}>
        <ActivityIndicator size="large" color={tema.accent} />
        <Text style={s.loadingText}>Oturum kontrol ediliyor...</Text>
      </View>
    </SafeAreaView>
  );
}

function GirisEkrani() {
  const { hata, girisHazir, girisYap, islemde } = useAuthContext();

  return (
    <SafeAreaView style={s.container}>
      <View style={s.orbOne} />
      <View style={s.orbTwo} />

      <View style={s.card}>
        <Text style={s.kicker}>Mobil uygulama</Text>
        <Text style={s.title}>Google hesabinla devam et</Text>
        <Text style={s.subtitle}>
          Mobilde fikir ve bilgi kartlarini kullanmak icin Google ile giris zorunlu.
        </Text>

        <TouchableOpacity
          style={[s.button, (!girisHazir || islemde) && s.buttonDisabled]}
          onPress={() => void girisYap()}
          disabled={!girisHazir || islemde}
        >
          <Text style={s.buttonText}>
            {islemde ? 'Baglaniyor...' : 'Google ile devam et'}
          </Text>
        </TouchableOpacity>

        <Text style={s.helper}>
          Girdikten sonra backend istekleri Firebase oturum tokeni ile imzalanir.
        </Text>
        {!!hata && <Text style={s.error}>{hata}</Text>}
      </View>
    </SafeAreaView>
  );
}

export default function AuthGate({ children }) {
  const { kullanici, yukleniyor } = useAuthContext();

  if (yukleniyor) return <BeklemeEkrani />;
  if (!kullanici) return <GirisEkrani />;
  return children;
}

const s = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: tema.bg,
    justifyContent: 'center',
    paddingHorizontal: 20,
    overflow: 'hidden',
  },
  orbOne: {
    position: 'absolute',
    width: 220,
    height: 220,
    borderRadius: 999,
    backgroundColor: tema.accentSoft,
    top: -80,
    right: -70,
  },
  orbTwo: {
    position: 'absolute',
    width: 180,
    height: 180,
    borderRadius: 999,
    backgroundColor: 'rgba(120, 167, 224, 0.15)',
    bottom: -40,
    left: -60,
  },
  card: {
    backgroundColor: tema.cardBg,
    borderRadius: tema.radius + 4,
    borderWidth: 1,
    borderColor: tema.cardBorder,
    padding: 22,
    gap: 14,
  },
  kicker: {
    color: tema.accent,
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 1,
    textTransform: 'uppercase',
  },
  title: {
    color: tema.text,
    fontSize: 28,
    fontWeight: '800',
    lineHeight: 34,
  },
  subtitle: {
    color: tema.textSecondary,
    fontSize: 15,
    lineHeight: 22,
  },
  button: {
    backgroundColor: tema.accent,
    borderRadius: tema.radius,
    paddingVertical: 15,
    alignItems: 'center',
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  buttonText: {
    color: tema.bg,
    fontSize: 15,
    fontWeight: '800',
  },
  helper: {
    color: tema.textSecondary,
    fontSize: 12,
    lineHeight: 18,
  },
  error: {
    color: tema.danger,
    fontSize: 13,
    lineHeight: 20,
  },
  loadingText: {
    color: tema.textSecondary,
    fontSize: 14,
    textAlign: 'center',
  },
});

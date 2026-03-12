import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  StyleSheet,
  SafeAreaView,
} from 'react-native';
import { mesajGonder } from '../services/api';
import { useLimitContext } from '../context/LimitContext';
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

export default function DetayScreen({ route, navigation }) {
  const { kart, mod } = route.params;
  const { sunucudanGuncelle } = useLimitContext();
  const [detay, setDetay] = useState(null);
  const [ilgili, setIlgili] = useState([]);
  const [yukleniyor, setYukleniyor] = useState(true);
  const [soru, setSoru] = useState('');
  const [cevap, setCevap] = useState(null);
  const [cevapYukleniyor, setCevapYukleniyor] = useState(false);

  useEffect(() => {
    const yukle = async () => {
      setYukleniyor(true);
      try {
        const mesaj = `${kart.baslik}\n\n${kart.kanca || ''}`;
        const sonuclar = await Promise.allSettled([
          mesajGonder({ mesajlar: [{ role: 'user', content: mesaj }], mod: 'detay' }),
          mesajGonder({ mesajlar: [{ role: 'user', content: mesaj }], mod: 'ilgili' }),
        ]);

        if (sonuclar[0].status === 'fulfilled') {
          setDetay(sonuclar[0].value.yanit);
          sunucudanGuncelle(sonuclar[0].value.limit);
        } else {
          setDetay('İçerik yüklenemedi.');
        }

        if (sonuclar[1].status === 'fulfilled') {
          sunucudanGuncelle(sonuclar[1].value.limit);
          const parsed = jsonCikar(sonuclar[1].value.yanit);
          if (Array.isArray(parsed)) setIlgili(parsed);
        }
      } catch {
        setDetay('İçerik yüklenemedi.');
      } finally {
        setYukleniyor(false);
      }
    };
    yukle();
  }, [kart]);

  const soruGonder = async () => {
    const t = soru.trim();
    if (!t || cevapYukleniyor) return;
    setCevapYukleniyor(true);
    try {
      const { yanit, limit } = await mesajGonder({
        mesajlar: [
          {
            role: 'user',
            content: `Kart: ${kart.baslik}. ${kart.kanca || ''}\n\nKullanıcı sorusu: ${t}`,
          },
        ],
        mod: 'konu_kilidi',
      });
      sunucudanGuncelle(limit);
      setCevap(yanit);
      setSoru('');
    } catch {
      setCevap('Yanıt alınamadı.');
    } finally {
      setCevapYukleniyor(false);
    }
  };

  const ilgiliKartaTikla = (k) => {
    navigation.push('Detay', { kart: k, mod });
  };

  return (
    <SafeAreaView style={s.container}>
      <ScrollView contentContainerStyle={s.scroll} showsVerticalScrollIndicator={false}>
        <View style={s.heroKart}>
          <Text style={s.baslik}>{kart.baslik}</Text>
          {kart.kanca && <Text style={s.kanca}>{kart.kanca}</Text>}
        </View>

        {yukleniyor ? (
          <ActivityIndicator size="large" color={tema.accent} style={{ marginTop: 32 }} />
        ) : (
          <View style={s.detayKart}>
            <Text style={s.detay}>{detay}</Text>
          </View>
        )}

        {ilgili.length > 0 && (
          <View style={s.ilgiliBolum}>
            <Text style={s.ilgiliBaslik}>Bunlar da ilgini çekebilir</Text>
            {ilgili.map((k, i) => (
              <TouchableOpacity
                key={i}
                style={s.ilgiliKart}
                onPress={() => ilgiliKartaTikla(k)}
              >
                <Text style={s.ilgiliKartBaslik}>{k.baslik}</Text>
                {k.kanca && <Text style={s.ilgiliKartKanca}>{k.kanca}</Text>}
              </TouchableOpacity>
            ))}
          </View>
        )}

        <View style={s.soruBolum}>
          <Text style={s.soruEtiket}>
            {kart.baslik} bağlamında —
          </Text>
          <View style={s.soruRow}>
            <TextInput
              style={s.soruInput}
              placeholder="Bu konuda merak ettiğin bir şey yaz..."
              placeholderTextColor={tema.textSecondary}
              value={soru}
              onChangeText={setSoru}
              onSubmitEditing={soruGonder}
              multiline
              numberOfLines={3}
              textAlignVertical="top"
            />
            <TouchableOpacity style={s.soruBtn} onPress={soruGonder}>
              <Text style={s.soruBtnTxt}>Gönder</Text>
            </TouchableOpacity>
          </View>
          {cevapYukleniyor && (
            <ActivityIndicator size="small" color={tema.accent} style={{ marginTop: 12 }} />
          )}
          {cevap && !cevapYukleniyor && (
            <Text style={s.cevap}>{cevap}</Text>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: tema.bg },
  scroll: { padding: 16, paddingBottom: 40 },
  heroKart: {
    backgroundColor: tema.cardBg,
    borderRadius: tema.radius,
    borderWidth: 1,
    borderColor: tema.cardBorder,
    padding: 14,
    marginBottom: 12,
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
    marginBottom: 2,
    fontStyle: 'italic',
    lineHeight: 21,
  },
  detayKart: {
    backgroundColor: tema.cardBg,
    borderRadius: tema.radius,
    borderWidth: 1,
    borderColor: tema.cardBorder,
    padding: 14,
    marginBottom: 20,
  },
  detay: {
    fontSize: 15,
    color: tema.text,
    lineHeight: 24,
  },
  ilgiliBolum: { marginBottom: 28 },
  ilgiliBaslik: {
    fontSize: 15,
    fontWeight: '800',
    color: tema.accent,
    marginBottom: 12,
  },
  ilgiliKart: {
    backgroundColor: tema.cardBg,
    borderRadius: tema.radius,
    padding: 14,
    marginBottom: 9,
    borderWidth: 1,
    borderColor: tema.cardBorder,
  },
  ilgiliKartBaslik: { fontSize: 14, fontWeight: '600', color: tema.text },
  ilgiliKartKanca: {
    fontSize: 12,
    color: tema.textSecondary,
    marginTop: 3,
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
  soruRow: { flexDirection: 'row', gap: 8, alignItems: 'flex-end' },
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
  soruBtnTxt: { color: tema.bg, fontWeight: '700', fontSize: 14 },
  cevap: {
    fontSize: 14,
    color: tema.text,
    lineHeight: 22,
    marginTop: 14,
    backgroundColor: tema.bgSecondary,
    borderRadius: tema.radius,
    padding: 14,
    borderWidth: 1,
    borderColor: tema.cardBorder,
  },
});

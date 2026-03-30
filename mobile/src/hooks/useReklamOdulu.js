import { useCallback, useState } from 'react';
import { reklamOdulAl, reklamOdulOturumuBaslat } from '../services/api';
import { useRewardedAd } from './useRewardedAd';

function odulMesajiGetir(kod) {
  if (kod === 'BAGLANTI_HATASI') return 'Baglanti hatasi, tekrar dene.';
  if (kod === 'ODUL_LIMIT_DOLDU') return 'Gunluk reklam odul hakkin doldu.';
  if (kod === 'REKLAM_ODUL_GEREKSIZ') return 'Su an reklam odulu gerekmiyor.';
  if (kod === 'REKLAM_ODUL_DOGRULANAMADI') return 'Reklam dogrulanamadi. Tekrar dene.';
  if (kod === 'REKLAM_ODUL_BEKLENIYOR') return 'Reklam dogrulamasi tamamlanmadi. Tekrar dene.';
  if (kod === 'LIMIT_SERVISI_KULLANILAMIYOR') return 'Limit servisi gecici olarak kullanilamiyor.';
  if (kod === 'ISTEK_HATASI') return 'Odul istegi baslatilamadi. Tekrar dene.';
  if (kod === 'BACKEND_URL_YOK') return 'Sunucu adresi bulunamadi.';
  return 'Reklam odulu alinamadi. Birazdan tekrar dene.';
}

export function useReklamOdulu({ onLimitGuncelle, onOdulTamamlandi } = {}) {
  const { goster: odulReklamiGoster, hazir: reklamHazir } = useRewardedAd();
  const [yukleniyor, setYukleniyor] = useState(false);
  const [mesaj, setMesaj] = useState('');

  const reklamIzle = useCallback(async () => {
    if (yukleniyor) return false;

    if (!reklamHazir) {
      setMesaj('Reklam hazirlaniyor, birazdan tekrar dene.');
      return false;
    }

    setYukleniyor(true);
    setMesaj('');
    let odulOturumu;

    try {
      const { oturum, limit } = await reklamOdulOturumuBaslat({
        onLimitGuncelle,
      });
      onLimitGuncelle?.(limit || null);

      if (!oturum?.id || !oturum?.imza) {
        throw new Error('REKLAM_ODUL_DOGRULANAMADI');
      }

      odulOturumu = oturum;
    } catch (err) {
      setMesaj(odulMesajiGetir(err.message));
      setYukleniyor(false);
      return false;
    }

    const gosterildi = odulReklamiGoster({
      onReward: async () => {
        try {
          const { limit } = await reklamOdulAl({
            oturumId: odulOturumu.id,
            imza: odulOturumu.imza,
            onLimitGuncelle,
          });

          onLimitGuncelle?.(limit);
          setMesaj('');
          await onOdulTamamlandi?.(limit);
        } catch (err) {
          setMesaj(odulMesajiGetir(err.message));
        } finally {
          setYukleniyor(false);
        }
      },
      onClosed: ({ rewarded }) => {
        if (!rewarded) {
          setYukleniyor(false);
          setMesaj('Reklam tamamlanmadi, yeni hak acilmadi.');
        }
      },
      onError: () => {
        setYukleniyor(false);
        setMesaj('Reklam acilirken bir sorun oldu. Tekrar dene.');
      },
    });

    if (!gosterildi) {
      setMesaj('Reklam hazirlaniyor, birazdan tekrar dene.');
      setYukleniyor(false);
    }

    return gosterildi;
  }, [odulReklamiGoster, onLimitGuncelle, onOdulTamamlandi, reklamHazir, yukleniyor]);

  return {
    reklamIzle,
    reklamHazir,
    yukleniyor,
    mesaj,
  };
}

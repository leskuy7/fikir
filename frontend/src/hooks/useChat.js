import { useState, useCallback } from 'react';
import { mesajGonder } from '../services/api.js';

export function useChat(mod) {
  const [mesajlar, setMesajlar] = useState([]);
  const [yukleniyor, setYukleniyor] = useState(false);
  const [hata, setHata] = useState(null);

  const gonder = useCallback(
    async (kullaniciMetni) => {
      setHata(null);
      setYukleniyor(true);

      const guncelMesajlar = [
        ...mesajlar,
        { role: 'user', content: kullaniciMetni },
      ];
      setMesajlar(guncelMesajlar);

      try {
        const gonderilenMesajlar = guncelMesajlar.slice(-10);
        const yanitMetni = await mesajGonder({
          mesajlar: gonderilenMesajlar,
          mod,
        });

        setMesajlar((prev) => [
          ...prev,
          { role: 'assistant', content: yanitMetni },
        ]);
      } catch (err) {
        if (err.message === 'LIMIT_DOLDU') {
          setHata('Günlük limitin doldu. Yarın tekrar gel veya üye ol.');
        } else {
          setHata('Bir şeyler ters gitti. Tekrar dene.');
        }
      } finally {
        setYukleniyor(false);
      }
    },
    [mesajlar, mod]
  );

  const sifirla = useCallback(() => {
    setMesajlar([]);
    setHata(null);
  }, []);

  return { mesajlar, yukleniyor, hata, gonder, sifirla };
}

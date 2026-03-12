import React, { useState, useEffect } from 'react';
import { konusmalariGetir } from '../services/firestore.js';

const MOD_IKON = { bilgi: '📚', fikir: '💡' };

function tarihFormat(tarih) {
  if (!tarih?.seconds) return '';
  const d = new Date(tarih.seconds * 1000);
  return d.toLocaleDateString('tr-TR', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' });
}

export default function GecmisPanel({ kullaniciId, onKapat, onKonuSec }) {
  const [durum, setDurum] = useState(() => ({
    anahtar: kullaniciId,
    konusmalar: [],
    yukleniyor: true,
    gecmisHata: null,
  }));

  const aktifDurum = durum.anahtar === kullaniciId
    ? durum
    : {
      anahtar: kullaniciId,
      konusmalar: [],
      yukleniyor: true,
      gecmisHata: null,
    };

  useEffect(() => {
    const handleEsc = (e) => { if (e.key === 'Escape') onKapat(); };
    document.addEventListener('keydown', handleEsc);
    return () => document.removeEventListener('keydown', handleEsc);
  }, [onKapat]);

  useEffect(() => {
    let iptal = false;
    konusmalariGetir(kullaniciId)
      .then((veri) => {
        if (!iptal) {
          setDurum({
            anahtar: kullaniciId,
            konusmalar: veri,
            yukleniyor: false,
            gecmisHata: null,
          });
        }
      })
      .catch(() => {
        if (!iptal) {
          setDurum({
            anahtar: kullaniciId,
            konusmalar: [],
            yukleniyor: false,
            gecmisHata: 'Geçmiş yüklenemedi. Lütfen tekrar dene.',
          });
        }
      });
    return () => { iptal = true; };
  }, [kullaniciId]);

  return (
    <div className="gecmis-overlay" role="dialog" aria-modal="true" aria-label="Geçmiş aramalar">
      <div className="gecmis-overlay__backdrop" onClick={onKapat} aria-hidden="true" />
      <aside className="gecmis-panel">
        <div className="gecmis-panel__ust">
          <h2 className="gecmis-panel__baslik">Geçmiş Aramalar</h2>
          <button type="button" className="gecmis-panel__kapat" onClick={onKapat} aria-label="Kapat">
            ×
          </button>
        </div>

        <div className="gecmis-panel__liste">
          {aktifDurum.yukleniyor && <p className="gecmis-panel__durum">Yükleniyor...</p>}
          {!aktifDurum.yukleniyor && aktifDurum.gecmisHata && (
            <p className="gecmis-panel__durum">{aktifDurum.gecmisHata}</p>
          )}
          {!aktifDurum.yukleniyor && !aktifDurum.gecmisHata && aktifDurum.konusmalar.length === 0 && (
            <p className="gecmis-panel__durum">Henüz bir arama yapmadın.</p>
          )}
          {!aktifDurum.yukleniyor &&
            aktifDurum.konusmalar.map((k) => (
              <button
                key={k.id}
                type="button"
                className="gecmis-panel__oge"
                onClick={() => onKonuSec(k.konu, k.mod)}
              >
                <span className="gecmis-panel__oge-ikon">
                  {MOD_IKON[k.mod] || '📄'}
                </span>
                <span className="gecmis-panel__oge-icerik">
                  <span className="gecmis-panel__oge-konu">{k.konu}</span>
                  <span className="gecmis-panel__oge-tarih">{tarihFormat(k.tarih)}</span>
                </span>
              </button>
            ))}
        </div>
      </aside>
    </div>
  );
}

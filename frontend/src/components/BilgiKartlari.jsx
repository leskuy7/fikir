import React, { useEffect, useRef } from 'react';
import { useKartlar } from '../hooks/useKartlar.js';
import YukleniyorSpinner from './YukleniyorSpinner.jsx';
import KartDetay from './KartDetay.jsx';
import IlgiliKartlar from './IlgiliKartlar.jsx';
import KonuGirisi from './KonuGirisi.jsx';
import ReklamAlani from './ReklamAlani.jsx';

const KART_EMOJILERI = ['💡', '🔭', '⚡', '🧩', '🔄', '🌍', '🧬', '📖'];

export default function BilgiKartlari({ kullaniciId, limitBag = {}, gecmisIstek = null }) {
  const { artir, limitDoldu, limitAsildi, sunucudanGuncelle } = limitBag;
  const girdiRef = useRef(null);
  const {
    konu,
    kartlar,
    acikKart,
    detayIcerik,
    ilgiliKartlar,
    yukleniyor,
    detayYukleniyor,
    konuKilidiYukleniyor,
    hata,
    konuKilidiCevap,
    kartlariGetir,
    detayAc,
    detayKapat,
    konuKilidiSoru,
  } = useKartlar('bilgi', kullaniciId, {
    onBasari: artir,
    onLimitDoldu: limitDoldu,
    onLimitGuncelle: sunucudanGuncelle,
  });

  const sonGonderimRef = useRef(0);
  const ara = (e) => {
    e.preventDefault();
    const simdi = Date.now();
    if (simdi - sonGonderimRef.current < 1000) return;
    sonGonderimRef.current = simdi;
    kartlariGetir(girdiRef.current?.value || '');
  };

  useEffect(() => {
    if (!gecmisIstek?.id || !gecmisIstek.konu) return;
    if (girdiRef.current) girdiRef.current.value = gecmisIstek.konu;
    kartlariGetir(gecmisIstek.konu);
  }, [gecmisIstek, kartlariGetir]);

  return (
    <div className="kart-modu">
      <form onSubmit={ara} className="konu-formu">
        <div className="konu-formu__ikon" aria-hidden="true">&#x1F50D;</div>
        <input
          ref={girdiRef}
          type="text"
          defaultValue=""
          placeholder="Neyi merak ediyorsun?"
          className="konu-formu__input"
          aria-label="Aranacak konu"
        />
        <button type="submit" className="konu-formu__gonder" disabled={yukleniyor || limitAsildi}>
          {yukleniyor ? (
            <span className="konu-formu__gonder-spinner" />
          ) : (
            <>Keşfet</>
          )}
        </button>
      </form>

      {hata && (
        <div className="kart-modu__hata">
          <span className="kart-modu__hata-ikon" aria-hidden="true">&#x26A0;</span>
          {hata}
        </div>
      )}

      {yukleniyor && (
        <div className="kart-modu__yukleniyor">
          <YukleniyorSpinner metin="Bilgi kartları hazırlanıyor..." skeleton adet={6} />
        </div>
      )}

      {!yukleniyor && kartlar.length > 0 && (
        <>
          <p className="kart-modu__baslik">
            <span className="kart-modu__baslik-sayi">{kartlar.length}</span> bilgi &mdash; <em>&ldquo;{konu}&rdquo;</em>
          </p>
          <div className="kart-grid">
            {kartlar.map((kart, i) => (
              <React.Fragment key={`${kart.baslik}-${i}`}>
                <button
                  type="button"
                  className="card kart-grid__kart"
                  style={{ animationDelay: `${i * 0.07}s` }}
                  onClick={() => detayAc(kart)}
                >
                  <div className="kart-grid__kart-ust">
                    <span className="kart-grid__kart-emoji">
                      {KART_EMOJILERI[i % KART_EMOJILERI.length]}
                    </span>
                    <span className="kart-grid__kart-etiket">
                      Bilgi {i + 1}
                    </span>
                  </div>
                  <span className="kart-grid__kart-baslik">{kart.baslik}</span>
                  <span className="kart-grid__kart-icerik">{kart.kanca}</span>
                </button>
                {/* Her 3. karttan sonra reklam göster */}
                {(i + 1) % 3 === 0 && (
                  <div className="kart-grid__reklam">
                    <ReklamAlani slotId={import.meta.env.VITE_ADSENSE_SLOT_KART} />
                  </div>
                )}
              </React.Fragment>
            ))}
          </div>
        </>
      )}

      <KartDetay
        acikKart={acikKart}
        detayIcerik={detayIcerik}
        detayYukleniyor={detayYukleniyor}
        onKapat={detayKapat}
        mod="bilgi"
      >
        {acikKart && (
          <>
            <IlgiliKartlar kartlar={ilgiliKartlar} onKartSec={detayAc} />
            <KonuGirisi
              kartBaslik={acikKart.baslik}
              onSoruGonder={(soru) =>
                konuKilidiSoru(soru, acikKart.baslik, acikKart.kanca)
              }
              yukleniyor={konuKilidiYukleniyor}
              cevap={konuKilidiCevap}
            />
          </>
        )}
      </KartDetay>
    </div>
  );
}

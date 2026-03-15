import React, { useEffect, useMemo } from 'react';
import DOMPurify from 'dompurify';
import YukleniyorSpinner from './YukleniyorSpinner.jsx';
import GeriBildirim from './GeriBildirim.jsx';
import KartPaylas from './KartPaylas.jsx';

const DETAY_ID = 'kart-detay-paylasim';

export default function KartDetay({
  acikKart,
  detayIcerik,
  detayYukleniyor,
  onKapat,
  mod,
  children,
}) {
  useEffect(() => {
    if (!acikKart) return;
    const handleEsc = (e) => { if (e.key === 'Escape') onKapat(); };
    document.addEventListener('keydown', handleEsc);
    return () => document.removeEventListener('keydown', handleEsc);
  }, [acikKart, onKapat]);

  if (!acikKart) return null;

  return (
    <div className="kart-detay-overlay" role="dialog" aria-modal="true" aria-labelledby="kart-detay-baslik">
      <div className="kart-detay-overlay__backdrop" onClick={onKapat} aria-hidden="true" />
      <div className="kart-detay" id={DETAY_ID}>
        <button
          type="button"
          className="kart-detay__kapat"
          onClick={onKapat}
          aria-label="Kapat"
        >
          ×
        </button>
        <header className="kart-detay__baslik-wrap">
          <h2 id="kart-detay-baslik" className="kart-detay__baslik">{acikKart.baslik}</h2>
          {acikKart.kanca && (
            <p className="kart-detay__kanca">{acikKart.kanca}</p>
          )}
        </header>
        <div className="kart-detay__govde">
          {detayYukleniyor ? (
            <YukleniyorSpinner metin="Detay yükleniyor..." />
          ) : detayIcerik ? (
            <div className="kart-detay__icerik">
              {detayIcerik.split('\n\n').map((paragraf, i) => (
                <p
                  key={i}
                  dangerouslySetInnerHTML={{
                    __html: DOMPurify.sanitize(paragraf.replace(/\n/g, '<br />')),
                  }}
                />
              ))}
            </div>
          ) : null}
          {detayIcerik && !detayYukleniyor && (
            <div className="kart-detay__aksiyonlar">
              <GeriBildirim mod={mod || 'detay'} kartBaslik={acikKart.baslik} />
              <KartPaylas kartElementId={DETAY_ID} kartBaslik={acikKart.baslik} />
            </div>
          )}
        </div>
        {children}
      </div>
    </div>
  );
}

import React, { useEffect } from 'react';
import DOMPurify from 'dompurify';
import { normalizeIcerik } from '../utils/text.js';
import YukleniyorSpinner from './YukleniyorSpinner.jsx';
import GeriBildirim from './GeriBildirim.jsx';
import KartPaylas from './KartPaylas.jsx';
import ReklamAlani from './ReklamAlani.jsx';

const DETAY_ID = 'kart-detay-paylasim';

export default function KartDetay({
  acikKart,
  detayIcerik,
  detayYukleniyor,
  onKapat,
  onTumunuKapat,
  onGecmiseGit,
  kartGecmisi = [],
  konu,
  mod,
  cacheId,
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
          onClick={onTumunuKapat || onKapat}
          aria-label="Kapat"
        >
          &times;
        </button>

        {/* Breadcrumb navigasyon */}
        <nav className="kart-detay__breadcrumb" aria-label="Navigasyon">
          <button
            type="button"
            className="kart-detay__breadcrumb-item"
            onClick={onTumunuKapat || onKapat}
          >
            &#x1F3E0; {konu || 'Ana Sayfa'}
          </button>
          {kartGecmisi.map((gecmis, i) => (
            <React.Fragment key={i}>
              <span className="kart-detay__breadcrumb-ayirac" aria-hidden="true">&rsaquo;</span>
              <button
                type="button"
                className="kart-detay__breadcrumb-item"
                onClick={() => onGecmiseGit?.(i)}
                title={gecmis.kart.baslik}
              >
                {gecmis.kart.baslik}
              </button>
            </React.Fragment>
          ))}
          <span className="kart-detay__breadcrumb-ayirac" aria-hidden="true">&rsaquo;</span>
          <span className="kart-detay__breadcrumb-item kart-detay__breadcrumb-item--aktif">
            {acikKart.baslik}
          </span>
        </nav>

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
              {normalizeIcerik(detayIcerik).split('\n\n').map((paragraf, i) => (
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
              <KartPaylas kartElementId={DETAY_ID} kartBaslik={acikKart.baslik} cacheId={cacheId} />
            </div>
          )}
        </div>
        {children}

        {/* Detay içi reklam */}
        <div className="reklam-detay">
          <ReklamAlani slot="detay" />
        </div>
      </div>
    </div>
  );
}

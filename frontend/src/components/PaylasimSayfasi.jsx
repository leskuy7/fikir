import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import DOMPurify from 'dompurify';
import { normalizeIcerik } from '../utils/text.js';
import { detayGetirById } from '../services/firestore.js';
import YukleniyorSpinner from './YukleniyorSpinner.jsx';

export default function PaylasimSayfasi() {
  const { cacheId } = useParams();
  const [veri, setVeri] = useState(null);
  const [yukleniyor, setYukleniyor] = useState(true);
  const [bulunamadi, setBulunamadi] = useState(false);

  useEffect(() => {
    let iptal = false;
    if (!cacheId) {
      setBulunamadi(true);
      setYukleniyor(false);
      return;
    }
    setYukleniyor(true);
    setBulunamadi(false);
    setVeri(null);
    detayGetirById(cacheId).then((sonuc) => {
      if (iptal) return;
      if (sonuc) {
        setVeri(sonuc);
      } else {
        setBulunamadi(true);
      }
      setYukleniyor(false);
    });
    return () => { iptal = true; };
  }, [cacheId]);

  if (yukleniyor) {
    return (
      <div className="paylasim-sayfa">
        <YukleniyorSpinner metin="Kart yükleniyor..." />
      </div>
    );
  }

  if (bulunamadi) {
    return (
      <div className="paylasim-sayfa">
        <div className="paylasim-sayfa__bos">
          <span className="paylasim-sayfa__bos-ikon">&#x1F50D;</span>
          <h2>Kart bulunamadı</h2>
          <p>Bu paylaşım linki geçersiz veya kartın süresi dolmuş olabilir.</p>
          <Link to="/" className="paylasim-sayfa__ana-btn">
            Fikir Kutusu'na Git
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="paylasim-sayfa">
      <div className="paylasim-sayfa__kart">
        <header className="paylasim-sayfa__header">
          <h1 className="paylasim-sayfa__baslik">{veri.kartBaslik}</h1>
          {veri.kartKanca && (
            <p className="paylasim-sayfa__kanca">{veri.kartKanca}</p>
          )}
        </header>

        <div className="paylasim-sayfa__icerik">
          {normalizeIcerik(veri.detayIcerik ?? '').split('\n\n').filter(Boolean).map((paragraf, i) => (
            <p
              key={i}
              dangerouslySetInnerHTML={{
                __html: DOMPurify.sanitize(paragraf.replace(/\n/g, '<br />')),
              }}
            />
          ))}
        </div>

        {veri.ilgiliKartlar?.length > 0 && (
          <div className="paylasim-sayfa__ilgili">
            <h3>İlgili Konular</h3>
            <div className="paylasim-sayfa__ilgili-grid">
              {veri.ilgiliKartlar.map((kart, i) => (
                <div key={i} className="paylasim-sayfa__ilgili-kart">
                  <span className="paylasim-sayfa__ilgili-baslik">{kart.baslik}</span>
                  {kart.kanca && (
                    <span className="paylasim-sayfa__ilgili-kanca">{kart.kanca}</span>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        <footer className="paylasim-sayfa__footer">
          <p className="paylasim-sayfa__marka">
            <span aria-hidden="true">&#x2728;</span> Fikir Kutusu ile keşfedildi
          </p>
          <Link to="/" className="paylasim-sayfa__ana-btn">
            Sen de keşfet
          </Link>
        </footer>
      </div>
    </div>
  );
}

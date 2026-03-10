import React, { useState } from 'react';

export default function AyarlarPaneli({ tema, onChange }) {
  const [acik, setAcik] = useState(false);

  const temaSec = (yeniTema) => {
    onChange(yeniTema);
    document.body.setAttribute('data-theme', yeniTema);
  };

  return (
    <div className="ayarlar-paneli">
      <button
        type="button"
        className="ayarlar-paneli__toggle"
        onClick={() => setAcik(!acik)}
        aria-expanded={acik}
        aria-label="Ayarlar"
      >
        <span aria-hidden="true">⚙</span>
      </button>
      {acik && (
        <div className="ayarlar-paneli__icerik">
          <p className="ayarlar-paneli__baslik">Tema</p>
          <div className="ayarlar-paneli__temalar">
            <button
              type="button"
              className={tema === 'gazete' ? 'aktif' : ''}
              onClick={() => temaSec('gazete')}
            >
              Gazete
            </button>
            <button
              type="button"
              className={tema === 'kozmik' ? 'aktif' : ''}
              onClick={() => temaSec('kozmik')}
            >
              Kozmik
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

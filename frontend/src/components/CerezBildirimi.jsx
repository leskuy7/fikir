import React, { useState } from 'react';

const CEREZ_KEY = 'fikir-kutusu-cerez-kabul';

export default function CerezBildirimi({ onGizlilikAc }) {
  const [gorunur, setGorunur] = useState(() => !localStorage.getItem(CEREZ_KEY));

  const kabul = () => {
    localStorage.setItem(CEREZ_KEY, '1');
    setGorunur(false);
  };

  if (!gorunur) return null;

  return (
    <div className="cerez-bildirimi" role="alert">
      <p className="cerez-bildirimi__metin">
        Bu uygulama tercihlerinizi saklamak ve anonim kullanım istatistikleri toplamak
        için çerezler ve localStorage kullanır.{' '}
        <button type="button" className="cerez-bildirimi__link" onClick={onGizlilikAc}>
          Gizlilik Politikası
        </button>
      </p>
      <button type="button" className="cerez-bildirimi__kabul" onClick={kabul}>
        Tamam
      </button>
    </div>
  );
}

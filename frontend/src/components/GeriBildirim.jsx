import React, { useState } from 'react';
import { geribildirimBildir } from '../services/analytics.js';

export default function GeriBildirim({ mod, kartBaslik }) {
  const [oy, setOy] = useState(null);

  const oyVer = (deger) => {
    setOy(deger);
    geribildirimBildir(mod, deger, kartBaslik);
  };

  return (
    <div className="geri-bildirim" aria-label="Bu içeriği değerlendir">
      <span className="geri-bildirim__etiket">Faydalı mıydı?</span>
      <button
        type="button"
        onClick={() => oyVer(1)}
        className={`geri-bildirim__btn ${oy === 1 ? 'geri-bildirim__btn--aktif' : ''}`}
        aria-label="Beğendim"
      >
        👍
      </button>
      <button
        type="button"
        onClick={() => oyVer(-1)}
        className={`geri-bildirim__btn ${oy === -1 ? 'geri-bildirim__btn--aktif' : ''}`}
        aria-label="Beğenmedim"
      >
        👎
      </button>
    </div>
  );
}

import React from 'react';

function SkeletonKart() {
  return (
    <div className="skeleton-kart card" aria-hidden="true">
      <div className="skeleton-kart__ust">
        <div className="skeleton skeleton--daire" />
        <div className="skeleton skeleton--etiket" />
      </div>
      <div className="skeleton skeleton--satir skeleton--uzun" />
      <div className="skeleton skeleton--satir skeleton--kisa" />
    </div>
  );
}

export default function YukleniyorSpinner({ metin = 'Yükleniyor...', skeleton = false, adet = 6 }) {
  if (skeleton) {
    return (
      <div className="skeleton-grid" role="status" aria-label={metin}>
        {Array.from({ length: adet }).map((_, i) => (
          <SkeletonKart key={i} />
        ))}
        <span className="sr-only">{metin}</span>
      </div>
    );
  }

  return (
    <div className="yukleniyor-spinner" role="status">
      <div className="yukleniyor-spinner__cark" aria-hidden="true" />
      <p className="yukleniyor-spinner__metin">{metin}</p>
    </div>
  );
}

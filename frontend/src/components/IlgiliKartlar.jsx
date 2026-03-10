import React from 'react';

export default function IlgiliKartlar({ kartlar, onKartSec }) {
  if (!kartlar || kartlar.length === 0) return null;

  return (
    <section className="ilgili-kartlar" aria-label="İlgini çekebilir">
      <h3 className="ilgili-kartlar__baslik">Bunlar da ilgini çekebilir</h3>
      <div className="ilgili-kartlar__grid">
        {kartlar.map((kart, i) => (
          <button
            key={i}
            type="button"
            className="card ilgili-kartlar__kart"
            onClick={() => onKartSec(kart)}
          >
            <span className="ilgili-kartlar__kart-baslik">{kart.baslik}</span>
            {kart.kanca && (
              <span className="ilgili-kartlar__kart-kanca">{kart.kanca}</span>
            )}
          </button>
        ))}
      </div>
    </section>
  );
}

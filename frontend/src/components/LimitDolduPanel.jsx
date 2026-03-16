import React from 'react';

function geceYarisinaKalan() {
  const simdi = new Date();
  const yarin = new Date(simdi);
  yarin.setDate(yarin.getDate() + 1);
  yarin.setHours(0, 0, 0, 0);
  const ms = yarin - simdi;
  const saat = Math.floor(ms / (1000 * 60 * 60));
  const dakika = Math.floor((ms % (1000 * 60 * 60)) / (1000 * 60));
  return { saat, dakika, metin: `${saat}s ${dakika}dk` };
}

export default function LimitDolduPanel({ kullanici, onGirisYap }) {
  const { metin } = geceYarisinaKalan();

  return (
    <div className="limit-doldu-panel" role="alert">
      <div className="limit-doldu-panel__ikon" aria-hidden="true">&#x1F4A1;</div>
      <h3 className="limit-doldu-panel__baslik">Günlük limitin doldu</h3>
      <p className="limit-doldu-panel__aciklama">
        Limit gece yarısı sıfırlanır (yaklaşık <strong>{metin}</strong> sonra).
      </p>
      <div className="limit-doldu-panel__secenekler">
        {!kullanici && (
          <button
            type="button"
            className="limit-doldu-panel__btn limit-doldu-panel__btn--onemli"
            onClick={onGirisYap}
          >
            Üye ol → Daha fazla hak (günde 20 istek)
          </button>
        )}
        <p className="limit-doldu-panel__bekle">
          veya gece yarısına kadar bekle
        </p>
        <p className="limit-doldu-panel__yakinda">
          Reklam izle / Premium seçenekleri yakında.
        </p>
      </div>
    </div>
  );
}

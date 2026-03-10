import React, { useState } from 'react';
import YukleniyorSpinner from './YukleniyorSpinner.jsx';

export default function KonuGirisi({
  kartBaslik,
  onSoruGonder,
  yukleniyor,
  cevap,
}) {
  const [soru, setSoru] = useState('');

  const gonder = (e) => {
    e.preventDefault();
    const t = soru.trim();
    if (!t || yukleniyor) return;
    onSoruGonder(t);
    setSoru('');
  };

  return (
    <section className="konu-girisi" aria-label="Bu kart hakkında soru sor">
      <p className="konu-girisi__etiket">
        <strong>{kartBaslik}</strong> bağlamında —
      </p>
      <form onSubmit={gonder} className="konu-girisi__form">
        <input
          type="text"
          value={soru}
          onChange={(e) => setSoru(e.target.value)}
          placeholder="Bu konuda merak ettiğin bir şey yaz..."
          className="konu-girisi__input"
          disabled={yukleniyor}
          aria-label="Konu kilitli soru"
        />
        <button type="submit" className="konu-girisi__gonder" disabled={yukleniyor}>
          Gönder
        </button>
      </form>
      {yukleniyor && <YukleniyorSpinner metin="Yanıt yazılıyor..." />}
      {cevap && !yukleniyor && (
        <div
          className="konu-girisi__cevap"
          dangerouslySetInnerHTML={{
            __html: cevap
              .split('\n\n')
              .map((p) => `<p>${p.replace(/\n/g, '<br />')}</p>`)
              .join(''),
          }}
        />
      )}
    </section>
  );
}

import React, { useCallback, useState } from 'react';
import html2canvas from 'html2canvas';

export default function KartPaylas({ kartElementId, kartBaslik, cacheId }) {
  const [kopyalandi, setKopyalandi] = useState(false);

  const paylasimLinki = cacheId
    ? `${window.location.origin}/paylas/${cacheId}`
    : null;

  const linkKopyala = useCallback(() => {
    if (!paylasimLinki) return;
    navigator.clipboard.writeText(paylasimLinki).then(() => {
      setKopyalandi(true);
      setTimeout(() => setKopyalandi(false), 2000);
    });
  }, [paylasimLinki]);

  const resimPaylas = useCallback(async () => {
    const element = document.getElementById(kartElementId);
    if (!element) return;

    try {
      const canvas = await html2canvas(element, {
        scale: 2,
        useCORS: true,
        backgroundColor: null,
      });

      const blob = await new Promise((resolve) =>
        canvas.toBlob(resolve, 'image/png')
      );
      if (!blob) return;

      const dosya = new File([blob], 'fikir-kutusu-kart.png', {
        type: 'image/png',
      });

      if (navigator.canShare?.({ files: [dosya] })) {
        await navigator.share({
          files: [dosya],
          title: kartBaslik || 'Fikir Kutusu',
          text: paylasimLinki
            ? `Bunu keşfettim — ${paylasimLinki}`
            : 'Bunu keşfettim — fikirkutusu.com',
        });
      } else {
        const link = document.createElement('a');
        link.href = canvas.toDataURL();
        link.download = 'fikir-kutusu-kart.png';
        link.click();
      }
    } catch (err) {
      if (err.name !== 'AbortError') {
        console.error('Paylaşım hatası:', err);
      }
    }
  }, [kartElementId, kartBaslik, paylasimLinki]);

  return (
    <div className="kart-paylas">
      {paylasimLinki && (
        <button
          type="button"
          className="kart-paylas__btn kart-paylas__btn--link"
          onClick={linkKopyala}
          aria-label="Paylaşım linkini kopyala"
          title="Linki kopyala"
        >
          {kopyalandi ? '\u2705 Kopyalandı' : '\uD83D\uDD17 Linki Kopyala'}
        </button>
      )}
      <button
        type="button"
        className="kart-paylas__btn"
        onClick={resimPaylas}
        aria-label="Bu kartı resim olarak paylaş"
        title="Resim olarak paylaş"
      >
        &#x1F4F8; Resim Paylaş
      </button>
    </div>
  );
}

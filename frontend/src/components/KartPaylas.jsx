import React, { useCallback } from 'react';
import html2canvas from 'html2canvas';

export default function KartPaylas({ kartElementId, kartBaslik }) {
  const paylas = useCallback(async () => {
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
          text: `Bunu keşfettim — fikirkutusu.com`,
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
  }, [kartElementId, kartBaslik]);

  return (
    <button
      type="button"
      className="kart-paylas__btn"
      onClick={paylas}
      aria-label="Bu kartı paylaş"
      title="Paylaş"
    >
      📤 Paylaş
    </button>
  );
}

import { useEffect, useRef } from 'react';

/**
 * Google AdSense reklam bileşeni.
 * Kullanım: <ReklamAlani slotId="1234567890" />
 * VITE_ADSENSE_PUBLISHER_ID env değişkenini ayarla: ca-pub-XXXXX
 */
export default function ReklamAlani({ slotId, format = 'auto', style = {} }) {
  const ref = useRef(null);
  const publisherId = import.meta.env.VITE_ADSENSE_PUBLISHER_ID;

  useEffect(() => {
    if (!publisherId || !slotId) return;
    try {
      (window.adsbygoogle = window.adsbygoogle || []).push({});
    } catch {
      // AdSense henüz yüklenmemişse sessizce geç
    }
  }, [publisherId, slotId]);

  if (!publisherId || !slotId) return null;

  return (
    <div className="reklam-alani" ref={ref} style={{ textAlign: 'center', ...style }}>
      <ins
        className="adsbygoogle"
        style={{ display: 'block' }}
        data-ad-client={publisherId}
        data-ad-slot={slotId}
        data-ad-format={format}
        data-full-width-responsive="true"
      />
    </div>
  );
}

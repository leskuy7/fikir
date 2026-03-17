import { useEffect, useRef } from 'react';
import {
  AD_PROVIDER,
  ADSENSE_PUBLISHER_ID,
  ADSTERRA_KEY,
  ADSTERRA_SINGLETON,
  CUSTOM_AD_SCRIPT_URL,
  CUSTOM_AD_ATTR,
  AD_SLOTS,
  reklamlarAktifMi,
} from '../services/reklamConfig.js';

/**
 * Esnek Reklam Bileşeni
 *
 * Kullanım:
 *   <ReklamAlani slot="banner" />
 *   <ReklamAlani slot="kart" />
 *   <ReklamAlani slot="detay" />
 *
 * veya doğrudan slotId ile (geriye dönük uyumluluk):
 *   <ReklamAlani slotId="1234567890" />
 */
export default function ReklamAlani({ slot, slotId, format, style = {} }) {
  const ref = useRef(null);
  const slotConfig = slot ? AD_SLOTS[slot] : null;
  const resolvedSlotId = slotId || slotConfig?.adsenseSlot || '';
  const resolvedFormat = format || slotConfig?.format || 'auto';
  const label = slotConfig?.label || 'Reklam';
  const adsterra = slotConfig?.adsterra || null;

  useEffect(() => {
    if (AD_PROVIDER !== 'adsense') return;
    if (!ADSENSE_PUBLISHER_ID || !resolvedSlotId) return;
    try {
      (window.adsbygoogle = window.adsbygoogle || []).push({});
    } catch {
      // AdSense henüz yüklenmemişse sessizce geç
    }
  }, [resolvedSlotId]);

  useEffect(() => {
    if (AD_PROVIDER !== 'custom') return;
    if (!CUSTOM_AD_SCRIPT_URL || !ref.current) return;

    // Özel reklam scriptini dinamik olarak yükle
    const container = ref.current;
    const existing = container.querySelector('script[data-ad-custom]');
    if (existing) return;

    const script = document.createElement('script');
    script.src = CUSTOM_AD_SCRIPT_URL;
    script.async = true;
    script.setAttribute('data-ad-custom', 'true');
    if (CUSTOM_AD_ATTR) {
      // "data-zone-id=12345" gibi formatı parse et
      const parts = CUSTOM_AD_ATTR.split('=');
      if (parts.length === 2) {
        script.setAttribute(parts[0].trim(), parts[1].trim());
      }
    }
    container.appendChild(script);

    return () => {
      if (container.contains(script)) {
        container.removeChild(script);
      }
    };
  }, []);

  useEffect(() => {
    if (AD_PROVIDER !== 'adsterra') return;
    if (!ADSTERRA_KEY || !ref.current) return;

    // Adsterra invoke.js atOptions'ı global okur; sayfada birden fazla instance çakışmasın diye
    // varsayılan olarak singleton yükleriz.
    if (ADSTERRA_SINGLETON) {
      window.__adsterraLoadedKeys = window.__adsterraLoadedKeys || {};
      if (window.__adsterraLoadedKeys[ADSTERRA_KEY]) return;
      window.__adsterraLoadedKeys[ADSTERRA_KEY] = true;
    }

    const container = ref.current;
    const existing = container.querySelector('script[data-ad-adsterra]');
    if (existing) return;

    window.atOptions = {
      key: ADSTERRA_KEY,
      format: adsterra?.format || 'iframe',
      height: adsterra?.height || 250,
      width: adsterra?.width || 300,
      params: {},
    };

    const script = document.createElement('script');
    script.src = `https://www.highperformanceformat.com/${ADSTERRA_KEY}/invoke.js`;
    script.async = true;
    script.setAttribute('data-ad-adsterra', 'true');
    container.appendChild(script);

    return () => {
      if (container.contains(script)) {
        container.removeChild(script);
      }
      if (ADSTERRA_SINGLETON && window.__adsterraLoadedKeys) {
        delete window.__adsterraLoadedKeys[ADSTERRA_KEY];
      }
    };
  }, [adsterra?.format, adsterra?.height, adsterra?.width]);

  if (!reklamlarAktifMi()) return null;

  // — Yer Tutucu Modu —
  if (AD_PROVIDER === 'placeholder') {
    return (
      <div
        className="reklam-alani reklam-alani--placeholder"
        style={style}
      >
        <span className="reklam-alani__etiket">{label}</span>
        <span className="reklam-alani__placeholder-metin">Reklam alanı</span>
      </div>
    );
  }

  // — Google AdSense Modu —
  if (AD_PROVIDER === 'adsense') {
    if (!ADSENSE_PUBLISHER_ID || !resolvedSlotId) return null;
    return (
      <div className="reklam-alani" ref={ref} style={{ textAlign: 'center', ...style }}>
        <span className="reklam-alani__etiket">{label}</span>
        <ins
          className="adsbygoogle"
          style={{ display: 'block' }}
          data-ad-client={ADSENSE_PUBLISHER_ID}
          data-ad-slot={resolvedSlotId}
          data-ad-format={resolvedFormat}
          data-full-width-responsive="true"
        />
      </div>
    );
  }

  // — Adsterra Modu —
  if (AD_PROVIDER === 'adsterra') {
    if (!ADSTERRA_KEY) return null;
    return (
      <div className="reklam-alani" ref={ref} style={{ textAlign: 'center', ...style }}>
        <span className="reklam-alani__etiket">{label}</span>
        {/* Script useEffect ile yükleniyor */}
      </div>
    );
  }

  // — Özel Reklam Kodu Modu —
  if (AD_PROVIDER === 'custom') {
    return (
      <div className="reklam-alani" ref={ref} style={{ textAlign: 'center', ...style }}>
        <span className="reklam-alani__etiket">{label}</span>
        {/* Script useEffect ile yükleniyor */}
      </div>
    );
  }

  return null;
}

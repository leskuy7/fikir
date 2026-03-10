const GA_ID = import.meta.env.VITE_GA_MEASUREMENT_ID;

let initialized = false;

export function initGA() {
  if (initialized || !GA_ID) return;
  initialized = true;

  const script = document.createElement('script');
  script.async = true;
  script.src = `https://www.googletagmanager.com/gtag/js?id=${GA_ID}`;
  document.head.appendChild(script);

  window.dataLayer = window.dataLayer || [];
  window.gtag = function () {
    window.dataLayer.push(arguments);
  };
  window.gtag('js', new Date());
  window.gtag('config', GA_ID);
}

function gtag(...args) {
  if (window.gtag) window.gtag(...args);
}

export function kartArandiBildir(mod, konu) {
  gtag('event', 'kart_arama', { mod, konu, karakter_sayisi: konu.length });
}

export function kartTiklandiBildir(mod, kartBaslik) {
  gtag('event', 'kart_tiklandi', { mod, kart_baslik: kartBaslik });
}

export function geribildirimBildir(mod, deger, kartBaslik) {
  gtag('event', 'yanit_degerlendirme', { mod, deger, kart_baslik: kartBaslik });
}

export function oturumBittiBildir(aktifMod) {
  gtag('event', 'oturum_bitti', { son_mod: aktifMod });
}

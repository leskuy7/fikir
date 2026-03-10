import { useState, useEffect } from 'react';
import ModSecici from './components/ModSecici.jsx';
import BilgiKartlari from './components/BilgiKartlari.jsx';
import FikirKartlari from './components/FikirKartlari.jsx';
import AyarlarPaneli from './components/AyarlarPaneli.jsx';
import KullaniciPaneli from './components/KullaniciPaneli.jsx';
import GecmisPanel from './components/GecmisPanel.jsx';
import CerezBildirimi from './components/CerezBildirimi.jsx';
import GizlilikPolitikasi from './components/GizlilikPolitikasi.jsx';
import { useAuth } from './hooks/useAuth.js';
import { useLimit } from './hooks/useLimit.js';
import { oturumBittiBildir } from './services/analytics.js';
import './App.css';

const TEMA_KEY = 'fikir-kutusu-tema';

export default function App() {
  const [aktifMod, setAktifMod] = useState('bilgi');
  const [gizlilikAcik, setGizlilikAcik] = useState(false);
  const [gecmisAcik, setGecmisAcik] = useState(false);
  const [gecmisIstek, setGecmisIstek] = useState(null);
  const [tema, setTema] = useState(() => {
    return localStorage.getItem(TEMA_KEY) || 'kozmik';
  });
  const { kullanici, yukleniyor: authYukleniyor, girisYap, cikisYap } = useAuth();
  const kullaniciId = kullanici?.uid || null;
  const { kalan, uyari, limitAsildi, artir, limitDoldu } = useLimit(kullaniciId);

  useEffect(() => {
    document.body.setAttribute('data-theme', tema);
  }, [tema]);

  useEffect(() => {
    const handler = () => oturumBittiBildir(aktifMod);
    window.addEventListener('beforeunload', handler);
    return () => window.removeEventListener('beforeunload', handler);
  }, [aktifMod]);

  const temaSecimi = (yeniTema) => {
    setTema(yeniTema);
    localStorage.setItem(TEMA_KEY, yeniTema);
    document.body.setAttribute('data-theme', yeniTema);
  };

  return (
    <div className="app" data-theme={tema}>
      <header className="app__header">
        <KullaniciPaneli
          kullanici={kullanici}
          yukleniyor={authYukleniyor}
          onGiris={girisYap}
          onCikis={cikisYap}
          onGecmisAc={() => setGecmisAcik(true)}
        />
        <AyarlarPaneli tema={tema} onChange={temaSecimi} />
      </header>

      <div className="app__hero">
        <div className="app__logo" aria-hidden="true">
          <span className="app__logo-icon">&#x2728;</span>
        </div>
        <h1 className="app__baslik">Fikir Kutusu</h1>
        <p className="app__altbaslik">Merak et, keşfet, ilham al</p>
        <div className="app__ayirac" aria-hidden="true" />
      </div>

      <ModSecici aktif={aktifMod} onChange={setAktifMod} />
      {uyari && (
        <p className="app__limit-uyari">
          Günlük limitine yaklaşıyorsun — {kalan} istek kaldı.
        </p>
      )}
      <div className={aktifMod === 'bilgi' ? 'app__mod' : 'app__mod app__mod--hidden'}>
        <BilgiKartlari
          kullaniciId={kullaniciId}
          limitBag={{ artir, limitDoldu, limitAsildi }}
          gecmisIstek={gecmisIstek?.mod === 'bilgi' ? gecmisIstek : null}
        />
      </div>
      <div className={aktifMod === 'fikir' ? 'app__mod' : 'app__mod app__mod--hidden'}>
        <FikirKartlari
          kullaniciId={kullaniciId}
          limitBag={{ artir, limitDoldu, limitAsildi }}
          gecmisIstek={gecmisIstek?.mod === 'fikir' ? gecmisIstek : null}
        />
      </div>

      <footer className="app__footer">
        <span className="app__footer-marka">Fikir Kutusu</span>
        <span className="app__footer-sep">·</span>
        <button
          type="button"
          className="app__footer-link"
          onClick={() => setGizlilikAcik(true)}
        >
          Gizlilik Politikası
        </button>
      </footer>

      {gecmisAcik && kullanici && (
        <GecmisPanel
          kullaniciId={kullanici.uid}
          onKapat={() => setGecmisAcik(false)}
          onKonuSec={(konu, mod) => {
            setGecmisAcik(false);
            setAktifMod(mod);
            setGecmisIstek({ konu, mod, id: Date.now() });
          }}
        />
      )}
      {gizlilikAcik && <GizlilikPolitikasi onKapat={() => setGizlilikAcik(false)} />}
      <CerezBildirimi onGizlilikAc={() => setGizlilikAcik(true)} />
    </div>
  );
}

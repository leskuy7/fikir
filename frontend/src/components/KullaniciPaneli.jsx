import React from 'react';

export default function KullaniciPaneli({ kullanici, yukleniyor, onGiris, onCikis, onGecmisAc }) {
  if (yukleniyor) return null;

  if (!kullanici) {
    return (
      <button type="button" className="kullanici-paneli__giris" onClick={onGiris}>
        Giriş Yap
      </button>
    );
  }

  return (
    <div className="kullanici-paneli">
      {kullanici.photoURL && (
        <img
          src={kullanici.photoURL}
          alt=""
          className="kullanici-paneli__avatar"
          referrerPolicy="no-referrer"
        />
      )}
      <span className="kullanici-paneli__isim">
        {kullanici.displayName?.split(' ')[0] || 'Kullanıcı'}
      </span>
      <button type="button" className="kullanici-paneli__gecmis" onClick={onGecmisAc}>
        Geçmiş
      </button>
      <button type="button" className="kullanici-paneli__cikis" onClick={onCikis}>
        Çıkış
      </button>
    </div>
  );
}

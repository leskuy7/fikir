import React from 'react';

export default function ModSecici({ aktif, onChange }) {
  return (
    <nav className="mod-secici" role="tablist">
      <button
        type="button"
        role="tab"
        aria-selected={aktif === 'bilgi'}
        className={aktif === 'bilgi' ? 'aktif' : ''}
        onClick={() => onChange('bilgi')}
      >
        <span className="mod-secici__ikon" aria-hidden="true">&#x1F4DA;</span>
        Bilgi
      </button>
      <button
        type="button"
        role="tab"
        aria-selected={aktif === 'fikir'}
        className={aktif === 'fikir' ? 'aktif' : ''}
        onClick={() => onChange('fikir')}
      >
        <span className="mod-secici__ikon" aria-hidden="true">&#x1F4A1;</span>
        Fikir
      </button>
    </nav>
  );
}

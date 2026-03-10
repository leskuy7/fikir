import React from 'react';

export default function GizlilikPolitikasi({ onKapat }) {
  return (
    <div className="kart-detay-overlay" role="dialog" aria-modal="true" aria-label="Gizlilik Politikası">
      <div className="kart-detay-overlay__backdrop" onClick={onKapat} aria-hidden="true" />
      <div className="kart-detay gizlilik-sayfasi">
        <button type="button" className="kart-detay__kapat" onClick={onKapat} aria-label="Kapat">
          ×
        </button>
        <h2 className="kart-detay__baslik">Gizlilik Politikası ve KVKK Aydınlatma Metni</h2>
        <div className="kart-detay__icerik gizlilik-sayfasi__icerik">
          <p><strong>Son güncelleme:</strong> Mart 2026</p>

          <h3>1. Veri Sorumlusu</h3>
          <p>
            Fikir Kutusu uygulaması ("Uygulama") kişisel verilerinizin korunması konusunda
            6698 sayılı Kişisel Verilerin Korunması Kanunu ("KVKK") kapsamındaki
            yükümlülüklerine uygun hareket etmektedir.
          </p>

          <h3>2. Toplanan Veriler</h3>
          <ul>
            <li><strong>Google hesap bilgileri:</strong> Ad, e-posta adresi, profil fotoğrafı (yalnızca giriş yaparsanız)</li>
            <li><strong>Kullanım verileri:</strong> Aranan konular, tıklanan kartlar, oturum süresi (Google Analytics üzerinden anonim olarak)</li>
            <li><strong>Teknik veriler:</strong> IP adresi (rate limiting amaçlı, saklanmaz), tarayıcı bilgisi</li>
          </ul>

          <h3>3. Verilerin İşlenme Amacı</h3>
          <ul>
            <li>Hizmetin sunulması ve iyileştirilmesi</li>
            <li>Günlük kullanım limitinin takibi</li>
            <li>Konuşma geçmişinin kaydedilmesi (yalnızca giriş yapan kullanıcılar)</li>
            <li>Anonim kullanım istatistikleri</li>
          </ul>

          <h3>4. Verilerin Paylaşımı</h3>
          <p>
            Kişisel verileriniz üçüncü taraflarla satılmaz veya paylaşılmaz. Yalnızca
            hizmet sağlayıcılar (Firebase, Google Analytics, Anthropic API) teknik
            gereksinimler doğrultusunda verilere erişebilir.
          </p>

          <h3>5. Çerezler</h3>
          <p>
            Uygulama tema tercihinizi ve oturum bilgilerinizi saklamak için localStorage
            kullanır. Google Analytics anonim analitik çerezleri kullanabilir. Bu çerezler
            kişisel bilgi içermez.
          </p>

          <h3>6. Haklarınız (KVKK Madde 11)</h3>
          <ul>
            <li>Kişisel verilerinizin işlenip işlenmediğini öğrenme</li>
            <li>İşlenme amacını ve amacına uygun kullanılıp kullanılmadığını öğrenme</li>
            <li>Yurt içinde/dışında aktarıldığı üçüncü kişileri bilme</li>
            <li>Eksik/yanlış işlenmişse düzeltilmesini isteme</li>
            <li>KVKK 7. madde koşullarında silinmesini/yok edilmesini isteme</li>
            <li>İşlenen verilerin münhasıran otomatik sistemlerle analiz edilmesi suretiyle aleyhinize bir sonucun ortaya çıkmasına itiraz etme</li>
          </ul>

          <h3>7. Yapay Zeka Kullanımı Hakkında</h3>
          <p>
            Fikir Kutusu, içerik üretmek için yapay zeka (Anthropic Claude) kullanır.
            Üretilen içerikler bilgilendirme amaçlıdır. Tıbbi, hukuki veya finansal
            tavsiye niteliği taşımaz. Kararlarınızda profesyonel danışmanlık almanız
            önerilir.
          </p>

          <h3>8. İletişim</h3>
          <p>
            KVKK kapsamındaki haklarınızı kullanmak için iletişim adresimize
            başvurabilirsiniz.
          </p>
        </div>
      </div>
    </div>
  );
}

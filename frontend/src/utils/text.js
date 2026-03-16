/**
 * API'den gelen metindeki fontta görünmeyen karakterleri güvenli karşılıklarla değiştirir.
 * Böylece kare/ünlem işareti (tofu) yerine düzgün karakterler görünür.
 */
export function normalizeIcerik(metin) {
  if (typeof metin !== 'string') return '';
  return metin
    .replace(/\u2018|\u2019/g, "'")   // ' '
    .replace(/\u201C|\u201D/g, '"')   // " "
    .replace(/\u2013/g, '-')          // en dash
    .replace(/\u2014/g, ' - ')        // em dash
    .replace(/\u2026/g, '...')        // ellipsis
    .replace(/\u00A0/g, ' ');         // non-breaking space
}

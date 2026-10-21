// Palet warna badge untuk jenis perkara (dinamis, berdasarkan urutan pembuatan)
export const BADGE_PALETTE = [
  { bg: '#e6f0ff', text: '#1a56db' }, // biru
  { bg: '#fff3e0', text: '#b5680a' }, // oranye
  { bg: '#f3e8ff', text: '#7c3aed' }, // ungu
  { bg: '#eef2f0', text: '#4b5a52' }, // abu
  { bg: '#e6faf5', text: '#0d9488' }, // teal
  { bg: '#ffe4f1', text: '#be185d' }, // pink
  { bg: '#fef9c3', text: '#a16207' }, // kuning
  { bg: '#e0f2fe', text: '#0369a1' }, // biru muda
];

export function getBadgeStyle(urutan) {
  const i = ((urutan % BADGE_PALETTE.length) + BADGE_PALETTE.length) % BADGE_PALETTE.length;
  return BADGE_PALETTE[i];
}

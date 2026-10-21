'use client';
import KelolaLookupList from './KelolaLookupList';

export default function JenisLaporanList() {
  return (
    <KelolaLookupList
      title="Kelola Jenis Laporan"
      apiBase="/api/jenis-laporan"
      itemLabel="jenis laporan"
      addPlaceholder="Contoh: L1PA15"
      showBadge
    />
  );
}

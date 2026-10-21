'use client';
import KelolaLookupList from './KelolaLookupList';

export default function JenisPerkaraList() {
  return (
    <KelolaLookupList
      title="Kelola Jenis Perkara"
      apiBase="/api/jenis-perkara"
      itemLabel="jenis perkara"
      showBadge
    />
  );
}

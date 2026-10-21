'use client';
import KelolaLookupList from './KelolaLookupList';

export default function DivisiList() {
  return (
    <KelolaLookupList
      title="Kelola Divisi"
      apiBase="/api/divisi"
      itemLabel="divisi"
      addPlaceholder="Nama divisi baru"
    />
  );
}

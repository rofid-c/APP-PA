const { getSession } = require('../../../lib/session');
const { redirect } = require('next/navigation');
import { Suspense } from 'react';
import LaporanKinerjaPage from './LaporanKinerjaPage';

export default async function ArsipLaporanDanKinerjaPage() {
  const session = await getSession();
  if (!session) redirect('/login');

  return (
    <Suspense fallback={<div className="page-body">Memuat data Laporan & Kinerja...</div>}>
      <LaporanKinerjaPage role={session.role} />
    </Suspense>
  );
}

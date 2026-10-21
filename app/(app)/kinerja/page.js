import { redirect } from 'next/navigation';

export default function KinerjaRedirectPage() {
  redirect('/laporan?tab=kinerja');
}

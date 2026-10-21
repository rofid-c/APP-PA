const { getSession } = require('../../../lib/session');
const { redirect } = require('next/navigation');
import LogList from './LogList';

export default async function LogAktivitasPage() {
  const session = await getSession();
  if (session?.role === 'staf_umum') {
    redirect('/dashboard');
  }
  return <LogList />;
}

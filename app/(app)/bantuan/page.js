const { getSession } = require('../../../lib/session');
const { redirect } = require('next/navigation');
import BantuanContent from './BantuanContent';

export default async function BantuanPage() {
  const session = await getSession();
  if (session?.role !== 'admin') {
    redirect('/dashboard');
  }
  return <BantuanContent />;
}

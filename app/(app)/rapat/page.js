const { getSession } = require('../../../lib/session');
const { redirect } = require('next/navigation');
import RapatList from './RapatList';

export default async function RapatIndexPage() {
  const session = await getSession();
  if (!session) redirect('/login');

  return <RapatList role={session.role} user={session} />;
}


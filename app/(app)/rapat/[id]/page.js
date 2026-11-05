const { getSession } = require('../../../../lib/session');
const { redirect } = require('next/navigation');
import DetailRapat from './DetailRapat';

export default async function RapatDetailPage({ params }) {
  const session = await getSession();
  if (!session) redirect('/login');

  return <DetailRapat id={params.id} role={session.role} user={session} />;
}


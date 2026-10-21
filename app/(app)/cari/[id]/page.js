const { getSession } = require('../../../../lib/session');
const { redirect } = require('next/navigation');
import DetailArsip from './DetailArsip';

export default async function DetailArsipPage({ params }) {
  const session = await getSession();
  if (!session) redirect('/login');
  return <DetailArsip id={params.id} role={session.role} />;
}

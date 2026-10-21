const { getSession } = require('../../../../../lib/session');
const { redirect } = require('next/navigation');
import EditArsipForm from './EditArsipForm';

export default async function EditArsipPage({ params }) {
  const session = await getSession();
  if (session?.role === 'staf_umum') {
    redirect('/cari');
  }
  return <EditArsipForm id={params.id} />;
}

const { getSession } = require('../../../../lib/session');
const { redirect } = require('next/navigation');
import UploadForm from './UploadForm';

export default async function UploadArsipPage() {
  const session = await getSession();
  if (session?.role === 'staf_umum') {
    redirect('/cari');
  }
  return <UploadForm />;
}

const { getSession } = require('../../../../lib/session');
const { redirect } = require('next/navigation');
const { db } = require('../../../../lib/db');
import KesekretariatanPage from './KesekretariatanPage';

export default async function DivisiPage({ params }) {
  const session = await getSession();
  if (!session) redirect('/login');

  const divisi = db.prepare('SELECT * FROM Divisi WHERE slug = ?').get(params.slug);
  if (!divisi) {
    redirect('/dashboard?notfound=1');
  }

  return <KesekretariatanPage divisi={divisi} role={session.role} />;
}

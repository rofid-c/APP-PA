const { getSession } = require('../../../lib/session');
import ArsipList from './ArsipList';

export default async function CariPage() {
  const session = await getSession();
  return <ArsipList role={session?.role} />;
}

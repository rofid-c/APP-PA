const { getSession } = require('../../lib/session');
const { redirect } = require('next/navigation');
import AppShell from '../components/AppShell';

export default async function AppLayout({ children }) {
  const session = await getSession();
  if (!session) redirect('/login');

  return (
    <AppShell user={session}>
      {children}
    </AppShell>
  );
}

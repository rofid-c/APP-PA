const { getSession } = require('../../lib/session');
const { redirect } = require('next/navigation');

export default async function PrintLayout({ children }) {
  const session = await getSession();
  if (!session) redirect('/login');

  return (
    <>
      {children}
    </>
  );
}


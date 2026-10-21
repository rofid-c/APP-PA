import './globals.css';

export const metadata = {
  title: 'Bank Data Digital - PA Gunung Sugih',
  description: 'Sistem Bank Data Digital Terpadu Pengadilan Agama Gunung Sugih',
};

export default function RootLayout({ children }) {
  return (
    <html lang="id">
      <body>{children}</body>
    </html>
  );
}

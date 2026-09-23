import './globals.css';

export const metadata = {
  title: 'Registry Naskah LKTI | Protokol Integritas Karya Ilmiah',
  description: 'Platform verifikasi orisinalitas naskah LKTI berbasis Web3 dan client-side hashing tanpa server.',
};

export default function RootLayout({ children }) {
  return (
    <html lang="id">
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&family=JetBrains+Mono:wght@400;500;600&display=swap" rel="stylesheet" />
      </head>
      <body className="min-h-screen flex flex-col bg-[#F8FAFC]">
        {children}
      </body>
    </html>
  );
}

import './globals.css';

export const metadata = {
  title: 'Blood Donation Management | Admin Portal',
  description: 'Secure Blood Donation Management Database with Google Sheets Integration',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className="bg-slate-50 text-slate-900 antialiased selection:bg-rose-500 selection:text-white">
        {children}
      </body>
    </html>
  );
}

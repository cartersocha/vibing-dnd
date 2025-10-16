import './globals.css';

export const metadata = {
  title: 'Tyranny of Dragons Campaign Manager',
  description: 'Campaign notes and character tracker for Tyranny of Dragons'
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}

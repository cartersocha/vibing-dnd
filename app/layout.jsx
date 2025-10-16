import './globals.css';
import { cookies } from 'next/headers';
import Sidebar from './components/Sidebar';

const ACCESS_COOKIE = 'vibing-dnd-auth';

export const metadata = {
  title: 'Tyranny of Dragons Campaign Manager',
  description: 'Campaign tracker powered by Next.js and Supabase',
};

export default function RootLayout({ children }) {
  const cookieStore = cookies();
  const isAuthenticated = cookieStore.get(ACCESS_COOKIE)?.value === 'granted';

  return (
    <html lang="en">
      <body>
        <div className="app-layout">
          <Sidebar isAuthenticated={isAuthenticated} />
          <main className="app-content">{children}</main>
        </div>
      </body>
    </html>
  );
}

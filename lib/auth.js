import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';

const ACCESS_COOKIE = 'vibing-dnd-auth';

export function requireAuth() {
  const cookieStore = cookies();
  const isAuthenticated = cookieStore.get(ACCESS_COOKIE)?.value === 'granted';
  if (!isAuthenticated) {
    redirect('/login');
  }
}

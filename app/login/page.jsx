import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import LoginForm from './LoginForm';

const ACCESS_COOKIE = 'vibing-dnd-auth';

export default function LoginPage() {
  const cookieStore = cookies();
  const isAuthenticated = cookieStore.get(ACCESS_COOKIE)?.value === 'granted';

  if (isAuthenticated) {
    redirect('/');
  }

  return <LoginForm />;
}

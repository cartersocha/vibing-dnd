'use server';

import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';

const COOKIE_NAME = 'vibing-dnd-auth';

export async function loginAction(prevState, formData) {
  const password = (formData.get('password') || '').toString();
  const redirectTo = formData.get('redirect') || '/';
  const expected = process.env.ACCESS_PASSWORD || '';

  if (!expected) {
    return { error: 'ACCESS_PASSWORD is not configured on the server.' };
  }

  if (password !== expected) {
    return { error: 'Incorrect access code. Try again?' };
  }

  cookies().set(COOKIE_NAME, 'authenticated', {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    maxAge: 60 * 60 * 24 * 7
  });

  redirect(typeof redirectTo === 'string' && redirectTo.startsWith('/') ? redirectTo : '/');
}

export async function logoutAction() {
  cookies().delete(COOKIE_NAME);
  redirect('/login');
}

'use server';

import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { revalidatePath } from 'next/cache';

const ACCESS_COOKIE = 'vibing-dnd-auth';
const ACCESS_PASSWORD = process.env.CAMPAIGN_ACCESS_PASSWORD || 'rat palace';

export async function authenticate(prevState, formData) {
  const password = formData.get('password');
  const normalized = typeof password === 'string' ? password.trim() : '';

  if (!normalized) {
    return { error: 'Please enter the access code.' };
  }

  if (normalized !== ACCESS_PASSWORD) {
    return { error: 'Incorrect password. Try again.' };
  }

  const cookieStore = cookies();
  cookieStore.set(ACCESS_COOKIE, 'granted', {
    httpOnly: true,
    path: '/',
    sameSite: 'lax',
    maxAge: 60 * 60 * 24 * 30,
  });

  revalidatePath('/', 'layout');
  redirect('/');
}

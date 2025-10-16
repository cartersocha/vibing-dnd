import type { Metadata } from 'next';
import type { ReactNode } from 'react';
import './globals.css';
import AuthGate from '@/components/AuthGate';
import AppShell from '@/components/AppShell';

export const metadata: Metadata = {
  title: 'Tyranny of Dragons Journal',
  description: 'Campaign notes and characters for our D&D table.'
};

export default function RootLayout({
  children
}: {
  children: ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        <AuthGate>
          <AppShell>{children}</AppShell>
        </AuthGate>
      </body>
    </html>
  );
}

'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useTransition } from 'react';
import { logoutAction } from '@/app/(auth)/login/actions';

const navItems = [
  { href: '/', label: 'Home' },
  { href: '/sessions', label: 'Sessions' },
  { href: '/characters', label: 'Characters' }
];

export default function Sidebar() {
  const pathname = usePathname();
  const [isPending, startTransition] = useTransition();

  const handleLogout = () => {
    startTransition(() => logoutAction());
  };

  return (
    <aside className="app-sidebar">
      <div className="sidebar-header">
        <h1>
          <Link href="/" className="header-link">
            Tyranny of Dragons
          </Link>
        </h1>
      </div>
      <nav className="main-nav">
        {navItems.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className={pathname === item.href ? 'active' : ''}
          >
            {item.label}
          </Link>
        ))}
      </nav>
      <div className="logout-form">
        <button
          type="button"
          className="btn btn-secondary"
          onClick={handleLogout}
          disabled={isPending}
        >
          {isPending ? 'Logging out…' : 'Log Out'}
        </button>
      </div>
    </aside>
  );
}

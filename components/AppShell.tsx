'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

export default function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  const navItems = [
    { href: '/', label: 'Home' },
    { href: '/sessions', label: 'Sessions' },
    { href: '/characters', label: 'Characters' }
  ];

  return (
    <div className="app-layout">
      <aside className="app-sidebar">
        <div className="sidebar-header">
          <h1>
            <Link href="/" className="header-link">
              Tyranny of Dragons
            </Link>
          </h1>
        </div>
        <nav className="main-nav">
          {navItems.map(item => (
            <Link
              key={item.href}
              href={item.href}
              className={pathname === item.href ? 'active' : ''}
            >
              {item.label}
            </Link>
          ))}
        </nav>
      </aside>
      <main className="app-content">
        <div className="container">{children}</div>
      </main>
    </div>
  );
}

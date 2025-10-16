'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

export default function Sidebar({ isAuthenticated }) {
  const pathname = usePathname();

  const navItems = [
    { href: '/sessions', label: 'Sessions' },
    { href: '/characters', label: 'Characters' },
  ];

  return (
    <aside className="app-sidebar">
      <div className="sidebar-header">
        <h1>
          <Link href="/" className="header-link">Tyranny of Dragons</Link>
        </h1>
      </div>
      {isAuthenticated ? (
        <nav className="main-nav">
          {navItems.map((item) => {
            const isActive = pathname === item.href || pathname.startsWith(`${item.href}/`);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`nav-link${isActive ? ' active' : ''}`}
              >
                {item.label}
              </Link>
            );
          })}
        </nav>
      ) : null}
    </aside>
  );
}

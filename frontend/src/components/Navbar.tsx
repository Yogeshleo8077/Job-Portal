'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth';

export function Navbar() {
  const { user, logout, loading } = useAuth();
  const router = useRouter();

  const dashboardHref =
    user?.role === 'ADMIN'
      ? '/admin'
      : user?.role === 'EMPLOYER'
        ? '/employer'
        : '/candidate';

  return (
    <header className="sticky top-0 z-20 border-b border-slate-200 bg-white/90 backdrop-blur">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3">
        <Link href="/" className="flex items-center gap-2 text-lg font-bold text-brand-700">
          <span className="grid h-8 w-8 place-items-center rounded-lg bg-brand-600 text-white">
            J
          </span>
          JobPortal
        </Link>

        <nav className="flex items-center gap-1 text-sm">
          <Link href="/jobs" className="btn-ghost border-transparent">
            Browse Jobs
          </Link>
          <Link href="/scraped" className="btn-ghost border-transparent">
            Aggregated
          </Link>

          {loading ? null : user ? (
            <>
              <Link href={dashboardHref} className="btn-ghost border-transparent">
                Dashboard
              </Link>
              <Link href="/profile" className="btn-ghost border-transparent">
                {user.name.split(' ')[0]}
              </Link>
              <button
                onClick={() => {
                  logout();
                  router.push('/');
                }}
                className="btn-ghost"
              >
                Logout
              </button>
            </>
          ) : (
            <>
              <Link href="/login" className="btn-ghost">
                Login
              </Link>
              <Link href="/register" className="btn-primary">
                Sign up
              </Link>
            </>
          )}
        </nav>
      </div>
    </header>
  );
}

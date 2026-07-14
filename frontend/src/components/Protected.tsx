'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth';
import type { Role } from '@/lib/types';

export function Protected({
  roles,
  children,
}: {
  roles?: Role[];
  children: React.ReactNode;
}) {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (loading) return;
    if (!user) {
      router.replace('/login');
    } else if (roles && !roles.includes(user.role)) {
      router.replace('/');
    }
  }, [user, loading, roles, router]);

  if (loading || !user || (roles && !roles.includes(user.role))) {
    return <p className="py-20 text-center text-slate-400">Loading…</p>;
  }
  return <>{children}</>;
}

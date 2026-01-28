'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth/AuthContext';

export default function Home() {
  const router = useRouter();
  const { firebaseUser, loading } = useAuth();

  useEffect(() => {
    if (!loading) {
      if (firebaseUser) {
        router.push('/dashboard');
      } else {
        router.push('/login');
      }
    }
  }, [firebaseUser, loading, router]);

  return (
    <div className="flex min-h-screen items-center justify-center">
      <div className="text-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary-500 border-t-transparent mx-auto"></div>
        <p className="mt-4 text-neutral-600">Loading...</p>
      </div>
    </div>
  );
}

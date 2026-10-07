"use client";

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabaseClient';

export default function Home() {
  const router = useRouter();

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      router.replace(session ? '/dashboard' : '/login');
    });
  }, [router]);

  return (
    <main className="min-h-screen bg-[#ebcfc6] flex items-center justify-center">
      <div className="text-center space-y-2">
        <div className="inline-flex items-center justify-center w-14 h-14 rounded-full bg-[#e59a86] text-white shadow-md animate-bounce duration-1000" aria-hidden="true">
          🐷
        </div>
        <p className="text-[1rem] font-bold text-[#5d4d44]">Chargement de My PiggyBank...</p>
      </div>
    </main>
  );
}

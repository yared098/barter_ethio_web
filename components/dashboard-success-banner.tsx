'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

export function DashboardSuccessBanner() {
  const [visible, setVisible] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const t = setTimeout(() => {
      setVisible(false);
      router.replace('/dashboard');
    }, 5000);
    return () => clearTimeout(t);
  }, [router]);

  if (!visible) return null;

  return (
    <div className="bg-green-50 border border-green-200 rounded-2xl p-4 mb-6 flex items-center gap-3">
      <div className="text-2xl">🎉</div>
      <div>
        <div className="font-bold text-green-800">Payment confirmed</div>
        <div className="text-sm text-green-700">Your new plan is active.</div>
      </div>
    </div>
  );
}
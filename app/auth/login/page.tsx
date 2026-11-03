import Link from 'next/link';
import { Suspense } from 'react';
import { GoogleSignInButton } from '@/components/google-sign-in-button';

export const metadata = { title: 'Sign in' };

export default function LoginPage() {
  return (
    <main className="min-h-screen bg-white flex flex-col">
      <nav className="border-b border-border">
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center">
          <Link href="/" className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-xl bg-primary flex items-center justify-center">
              <span className="text-white font-black text-lg">B</span>
            </div>
            <span className="font-extrabold text-ink">
              Barter<span className="text-primary">Ethio</span>
            </span>
          </Link>
        </div>
      </nav>

      <div className="flex-1 flex items-center justify-center px-6 py-12">
        <div className="w-full max-w-md">
          <div className="bg-white border border-border rounded-2xl p-8 shadow-lg">
            <h1 className="text-2xl font-black text-ink text-center mb-2">
              Welcome to Barter Ethio
            </h1>
            <p className="text-sm text-ink-muted text-center mb-8">
              Sign in to post, browse, and trade.
            </p>

            <Suspense fallback={<div className="h-12" />}>
              <div className="flex justify-center">
                <GoogleSignInButton />
              </div>
            </Suspense>

            <p className="text-xs text-ink-subtle text-center mt-8 leading-relaxed">
              By signing in you agree to our{' '}
              <span className="text-primary font-semibold">Terms</span> and{' '}
              <span className="text-primary font-semibold">Privacy Policy</span>.
            </p>
          </div>

          <p className="text-center text-sm text-ink-muted mt-6">
            Don&apos;t have an account?{' '}
            <span className="text-primary font-semibold">
              Signing in creates one automatically.
            </span>
          </p>
        </div>
      </div>
    </main>
  );
}
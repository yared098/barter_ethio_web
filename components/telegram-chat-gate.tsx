'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import type { ChatOffer } from '@/lib/chat';
import { ChatDetail } from './chat-detail';

type Props = { offerId: string };
type TelegramWebApp = {
  initData: string;
  ready(): void;
  expand(): void;
  close(): void;
};

declare global {
  interface Window {
    Telegram?: { WebApp?: TelegramWebApp };
  }
}

function responseMessage(body: any, fallback: string): string {
  const message = body?.message;
  return Array.isArray(message) ? message.join(', ') : message || fallback;
}

export function TelegramChatGate({ offerId }: Props) {
  const [offer, setOffer] = useState<ChatOffer | null>(null);
  const [meId, setMeId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;

    const authenticate = async () => {
      try {
        let webApp = window.Telegram?.WebApp;
        if (!webApp) {
          webApp = await new Promise<TelegramWebApp | undefined>((resolve) => {
            const script = document.createElement('script');
            script.src = 'https://telegram.org/js/telegram-web-app.js';
            script.async = true;
            script.onload = () => resolve(window.Telegram?.WebApp);
            script.onerror = () => resolve(undefined);
            document.head.appendChild(script);
          });
        }

        if (!webApp?.initData) {
          throw new Error('Open this chat from the Barter Ethio bot in Telegram.');
        }

        webApp.ready();
        webApp.expand();

        const login = await fetch('/api/auth/telegram-webapp', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ initData: webApp.initData }),
          cache: 'no-store',
        });
        const session = await login.json().catch(() => ({}));
        if (!login.ok) {
          throw new Error(responseMessage(session, 'Telegram login failed.'));
        }

        const offerResponse = await fetch(`/api/proxy/offers/${offerId}`, {
          cache: 'no-store',
        });
        const offerBody = await offerResponse.json().catch(() => ({}));
        if (!offerResponse.ok) {
          throw new Error(
            responseMessage(offerBody, 'Could not load this conversation.'),
          );
        }
        if (!active) return;

        setMeId(session.user.id);
        setOffer(offerBody as ChatOffer);
      } catch (e) {
        if (active) {
          setError(e instanceof Error ? e.message : 'Telegram login failed.');
        }
      } finally {
        if (active) setLoading(false);
      }
    };

    void authenticate();
    return () => {
      active = false;
    };
  }, [offerId]);

  if (offer && meId) {
    return (
      <ChatDetail
        initialOffer={offer}
        meId={meId}
        telegramApp
      />
    );
  }

  return (
    <main className="flex min-h-[100dvh] items-center justify-center bg-slate-50 px-5">
      <section className="w-full max-w-sm rounded-2xl border border-slate-200 bg-white p-6 text-center shadow-sm">
        <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-primary/10 text-2xl">
          💬
        </div>
        <h1 className="text-lg font-bold text-slate-900">Barter Ethio chat</h1>
        <p className="mt-2 text-sm leading-6 text-slate-600">
          {loading
            ? 'Verifying your Telegram account and loading the conversation…'
            : error}
        </p>
        {!loading && error && (
          <Link
            href={`/auth/login?next=/chat/${encodeURIComponent(offerId)}`}
            className="mt-5 inline-flex rounded-full bg-primary px-5 py-2.5 text-sm font-bold text-white"
          >
            Continue on the website
          </Link>
        )}
      </section>
    </main>
  );
}

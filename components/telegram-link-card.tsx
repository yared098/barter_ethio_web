'use client';

import { useState } from 'react';

type Props = {
  linked: boolean;
  telegramUsername: string | null;
};

type LinkCodeResponse = {
  linked: boolean;
  code?: string;
  expiresAt?: string;
  message?: string | string[];
};

function messageFrom(body: LinkCodeResponse): string {
  return Array.isArray(body.message)
    ? body.message.join(', ')
    : body.message || 'Could not create a Telegram link code.';
}

export function TelegramLinkCard({ linked, telegramUsername }: Props) {
  const [isLinked] = useState(linked);
  const [code, setCode] = useState<string | null>(null);
  const [expiresAt, setExpiresAt] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function createCode() {
    setLoading(true);
    setError(null);
    setCode(null);
    setExpiresAt(null);

    try {
      const response = await fetch('/api/proxy/auth/telegram/link-code', {
        method: 'POST',
        cache: 'no-store',
      });
      const body = (await response.json().catch(() => ({}))) as LinkCodeResponse;
      if (!response.ok) throw new Error(messageFrom(body));
      if (!body.code || !body.expiresAt) {
        throw new Error('The server returned an invalid Telegram link code.');
      }
      setCode(body.code);
      setExpiresAt(body.expiresAt);
    } catch (cause) {
      setError(
        cause instanceof Error
          ? cause.message
          : 'Could not create a Telegram link code.',
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <section className="mb-6 rounded-2xl border border-sky-200 bg-sky-50 p-5 sm:p-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="font-bold text-slate-900">Telegram chat access</h2>
          {isLinked ? (
            <p className="mt-1 text-sm text-slate-600">
              Your Barter Ethio account is linked
              {telegramUsername ? ` to @${telegramUsername}` : ''}. Telegram
              chat notifications can open conversations directly. Generate a
              fresh code after logging out of the bot if you need to reconnect.
            </p>
          ) : (
            <p className="mt-1 max-w-2xl text-sm leading-6 text-slate-600">
              Link your Telegram account once to open chat notifications without
              signing in again inside Telegram.
            </p>
          )}
        </div>
        <button
          type="button"
          onClick={createCode}
          disabled={loading}
          className="shrink-0 rounded-full bg-sky-700 px-5 py-2.5 text-sm font-bold text-white transition hover:bg-sky-800 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {loading
            ? 'Creating code…'
            : isLinked
              ? 'Reconnect Telegram'
              : 'Link Telegram'}
        </button>
      </div>

      {code && expiresAt && (
        <div className="mt-4 rounded-xl border border-sky-200 bg-white p-4">
          <p className="text-sm text-slate-700">
            Open the bot and send this command within 10 minutes:
          </p>
          <code className="mt-2 block select-all break-all rounded-lg bg-slate-100 px-3 py-2 font-mono text-sm text-slate-900">
            /link {code}
          </code>
          <a
            href="https://t.me/ethio_barter_bot"
            target="_blank"
            rel="noreferrer"
            className="mt-3 inline-flex text-sm font-semibold text-sky-800 underline"
          >
            Open Barter Ethio bot
          </a>
          <p className="mt-2 text-xs text-slate-500">
            Expires at {new Date(expiresAt).toLocaleTimeString()} and works
            once. Keep this code private.
          </p>
        </div>
      )}

      {error && (
        <p role="alert" className="mt-3 text-sm font-medium text-red-700">
          {error}
        </p>
      )}
    </section>
  );
}

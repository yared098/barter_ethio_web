'use client';

import { useState } from 'react';

type Props = {
  linked: boolean;
  telegramUsername: string | null;
};

type LinkCodeResponse = {
  linked?: boolean;
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
  const [isLinked, setIsLinked] = useState(linked);
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
      if (body.linked) {
        setIsLinked(true);
        return;
      }
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
    <section className="relative mb-6 overflow-hidden rounded-3xl border border-slate-200 bg-gradient-to-br from-slate-50 to-slate-100 shadow-sm transition-colors">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -right-16 -top-20 h-52 w-52 rounded-full bg-primary/10 blur-3xl"
      />

      <div className="relative p-5 sm:p-7">
        <div className="flex flex-col gap-5 sm:flex-row sm:items-start sm:justify-between">
          <div className="flex min-w-0 items-start gap-4">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-primary text-white shadow-lg shadow-primary/20">
              <TelegramIcon />
            </div>

            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <h2 className="text-base font-extrabold tracking-tight text-slate-900 sm:text-lg">
                  Telegram chat access
                </h2>
                <span
                  className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide ${
                    isLinked
                      ? 'bg-primary-light text-primary'
                      : 'bg-slate-100 text-slate-600'
                  }`}
                >
                  <span
                    className={`h-1.5 w-1.5 rounded-full ${
                      isLinked ? 'bg-primary' : 'bg-slate-400'
                    }`}
                  />
                  {isLinked ? 'Connected' : 'Not connected'}
                </span>
              </div>

              <p className="mt-1.5 max-w-2xl text-sm leading-6 text-slate-600">
                {isLinked ? (
                  <>
                    Your account is linked
                    {telegramUsername ? (
                      <span className="font-semibold text-slate-800">
                        {' '}
                        to @{telegramUsername}
                      </span>
                    ) : null}
                    . Open barter chat notifications directly in Telegram.
                  </>
                ) : (
                  'Connect once to open barter chat notifications directly in Telegram.'
                )}
              </p>
            </div>
          </div>

          {!isLinked && (
            <button
              type="button"
              onClick={createCode}
              disabled={loading}
              className="inline-flex min-h-11 shrink-0 items-center justify-center gap-2 rounded-xl bg-primary px-5 py-2.5 text-sm font-bold text-white shadow-sm transition hover:bg-primary-dark focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {loading ? <LoadingIcon /> : <LinkIcon />}
              {loading ? 'Creating code…' : 'Link Telegram'}
            </button>
          )}
        </div>

        {isLinked && (
          <div className="mt-5 flex items-center gap-2 rounded-2xl border border-primary/15 bg-primary-light/60 px-4 py-3 text-xs font-medium text-slate-700">
            <CheckIcon />
            You&apos;re all set. Telegram notifications can open your chats.
          </div>
        )}

        {code && expiresAt && (
          <div className="mt-5 grid gap-4 rounded-2xl border border-slate-200 bg-white/80 p-4 sm:grid-cols-[1fr_auto] sm:items-center sm:p-5">
            <div className="min-w-0">
              <p className="text-sm font-bold text-slate-900">
                Finish connecting in Telegram
              </p>
              <p className="mt-1 text-xs leading-5 text-slate-600">
                This code is valid for 1 minute. Open the bot and send it
                before it expires:
              </p>
              <code className="mt-3 block select-all break-all rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 font-mono text-base font-bold tracking-wider text-slate-900">
                /link {code}
              </code>
              <p className="mt-2 text-xs text-slate-500">
                Expires at {new Date(expiresAt).toLocaleTimeString()}. This
                code works once; keep it private.
              </p>
            </div>
            <a
              href="https://t.me/ethio_barter_bot"
              target="_blank"
              rel="noreferrer"
              className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 text-sm font-bold text-slate-700 transition hover:border-primary/40 hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
            >
              Open Telegram bot
              <ExternalLinkIcon />
            </a>
          </div>
        )}

        {error && (
          <p
            role="alert"
            className="mt-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700"
          >
            {error}
          </p>
        )}
      </div>
    </section>
  );
}

function TelegramIcon() {
  return (
    <svg
      aria-hidden="true"
      width="25"
      height="25"
      viewBox="0 0 24 24"
      fill="currentColor"
    >
      <path d="M21.8 4.2 18.6 20c-.2 1.1-.9 1.4-1.8.9l-5-3.7-2.4 2.3c-.3.3-.5.5-1 .5l.4-5.1 9.3-8.4c.4-.4-.1-.6-.6-.2L6 13.5l-4.9-1.5c-1.1-.3-1.1-1.1.2-1.6l19.1-7.3c.9-.3 1.7.2 1.4 1.1Z" />
    </svg>
  );
}

function LinkIcon() {
  return (
    <svg
      aria-hidden="true"
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M10 13a5 5 0 0 0 7.1 0l3-3A5 5 0 0 0 13 2.9l-1.7 1.7" />
      <path d="M14 11a5 5 0 0 0-7.1 0l-3 3A5 5 0 0 0 11 21.1l1.7-1.7" />
    </svg>
  );
}

function ExternalLinkIcon() {
  return (
    <svg
      aria-hidden="true"
      width="15"
      height="15"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M14 3h7v7m-1-6-9 9" />
      <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
    </svg>
  );
}

function CheckIcon() {
  return (
    <svg
      aria-hidden="true"
      className="shrink-0 text-primary"
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="m5 12 4 4L19 6" />
    </svg>
  );
}

function LoadingIcon() {
  return (
    <svg
      aria-hidden="true"
      className="animate-spin"
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M12 2v4m0 12v4M4.93 4.93l2.83 2.83m8.48 8.48 2.83 2.83M2 12h4m12 0h4M4.93 19.07l2.83-2.83m8.48-8.48 2.83-2.83" />
    </svg>
  );
}

'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { QRCodeSVG } from 'qrcode.react';
import type { InitPaymentResponse, PaymentStatusResponse } from '@/lib/payments';

type Props = {
  planId: string;
  price: number;
  currency: string;
  highlighted?: boolean;
  isAuthenticated: boolean;
};

type Phase = 'idle' | 'initializing' | 'waiting' | 'success' | 'failed';

export function UpgradeButton({
  planId,
  price,
  currency,
  highlighted,
  isAuthenticated,
}: Props) {
  const router = useRouter();
  const [phase, setPhase] = useState<Phase>('idle');
  const [error, setError] = useState<string | null>(null);
  const [payment, setPayment] = useState<InitPaymentResponse | null>(null);
  const [secondsLeft, setSecondsLeft] = useState<number | null>(null);
  const pollRef = useRef<number | null>(null);
  const timeoutRef = useRef<number | null>(null);

  useEffect(() => {
    return () => {
      if (pollRef.current) clearInterval(pollRef.current);
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, []);

  useEffect(() => {
    if (phase !== 'waiting' || !payment) return;

    const updateCountdown = () => {
      const expiresAt = Date.parse(payment.expiresAt);
      if (!Number.isFinite(expiresAt)) return;

      const remaining = Math.max(0, Math.ceil((expiresAt - Date.now()) / 1000));
      setSecondsLeft(remaining);
      if (remaining === 0) {
        if (pollRef.current) clearInterval(pollRef.current);
        setError('Payment QR expired — choose the plan again to get a new one.');
        setPhase('failed');
      }
    };

    updateCountdown();
    const interval = window.setInterval(updateCountdown, 1000);
    return () => window.clearInterval(interval);
  }, [phase, payment]);

  const handleClick = async () => {
    if (!isAuthenticated) {
      router.push('/auth/login?next=/upgrade');
      return;
    }

    setPhase('initializing');
    setError(null);

    try {
      const res = await fetch('/api/proxy/payments/init', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ plan: planId }),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        const msg =
          err?.message?.toString?.() ||
          err?.message?.[0] ||
          'Could not start payment';
        throw new Error(msg);
      }

      const data = (await res.json()) as InitPaymentResponse;
      setPayment(data);
      setSecondsLeft(null);
      setPhase('waiting');
      startPolling(data.paymentId);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Failed to start payment');
      setPhase('failed');
    }
  };

  const startPolling = (paymentId: string) => {
    let attempts = 0;
    const maxAttempts = 450; // 15 min at 2s

    pollRef.current = window.setInterval(async () => {
      attempts++;
      if (attempts > maxAttempts) {
        if (pollRef.current) clearInterval(pollRef.current);
        setPhase('failed');
        setError('Payment window expired — try again');
        return;
      }

      try {
        const res = await fetch(`/api/proxy/payments/${paymentId}/status`);
        if (!res.ok) return;

        const data = (await res.json()) as PaymentStatusResponse;

        if (data.status === 'paid') {
          if (pollRef.current) clearInterval(pollRef.current);
          setPhase('success');
          timeoutRef.current = window.setTimeout(() => {
            router.replace('/dashboard?upgraded=1');
            router.refresh();
          }, 1400);
        } else if (data.status === 'failed') {
          if (pollRef.current) clearInterval(pollRef.current);
          setPhase('failed');
          setError('Payment failed');
        } else if (data.status === 'expired') {
          if (pollRef.current) clearInterval(pollRef.current);
          setPhase('failed');
          setError('Payment session expired');
        }
      } catch {
        // network blip — retry next tick
      }
    }, 2000);
  };

  const cancel = () => {
    if (pollRef.current) clearInterval(pollRef.current);
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    setPhase('idle');
    setPayment(null);
    setError(null);
  };

  const reopenCheckout = () => {
    if (payment?.checkoutUrl) {
      window.open(payment.checkoutUrl, '_blank', 'noopener,noreferrer');
    }
  };

  // ── Render by phase ──

  if (phase === 'success') {
    return (
      <div className="bg-green-50 border border-green-200 rounded-xl p-4 text-center">
        <div className="text-2xl mb-1">✅</div>
        <p className="text-sm font-bold text-green-800">Payment confirmed!</p>
        <p className="text-xs text-green-700 mt-1">Redirecting…</p>
      </div>
    );
  }

  if (phase === 'failed') {
    return (
      <div className="space-y-2">
        <div className="bg-red-50 border border-red-200 rounded-xl p-3 text-xs text-red-800">
          {error || 'Payment failed'}
        </div>
        <button
          onClick={cancel}
          className="w-full bg-white border border-border text-ink font-bold py-2.5 rounded-full text-sm hover:border-primary/40 transition"
        >
          Try again
        </button>
      </div>
    );
  }

  if (phase === 'initializing' || phase === 'waiting') {
    return (
      <div className="space-y-2">
        <div className="bg-primary-light rounded-xl p-3 text-center">
          <div className="text-xs font-bold text-primary mb-1">
            {phase === 'initializing'
              ? 'Preparing payment…'
              : 'Payment ready'}
          </div>
          {phase === 'waiting' && (
            <>
              {payment?.checkoutUrl && (
                <div className="mt-3 rounded-xl border border-border bg-white p-4">
                  <p className="mb-3 text-sm font-bold text-ink">
                    Scan to pay with another device
                  </p>
                  <div className="mx-auto w-fit rounded-lg bg-white p-2">
                    <QRCodeSVG
                      value={payment.checkoutUrl}
                      size={192}
                      level="M"
                      marginSize={2}
                      aria-label="QR code for secure payment checkout"
                    />
                  </div>
                  <p className="mt-3 text-xs leading-relaxed text-ink-muted">
                    Scan this code with another device to open secure checkout.
                  </p>
                </div>
              )}
              <p className="mb-3 mt-3 text-xs font-semibold text-ink-muted">
                QR expires in{' '}
                {secondsLeft == null
                  ? '…'
                  : `${Math.floor(secondsLeft / 60)
                      .toString()
                      .padStart(2, '0')}:${(secondsLeft % 60)
                      .toString()
                      .padStart(2, '0')}`}
              </p>
              <button
                type="button"
                onClick={reopenCheckout}
                disabled={!payment?.checkoutUrl}
                className="w-full rounded-full bg-primary px-4 py-2.5 text-sm font-bold text-white transition hover:bg-primary-dark disabled:opacity-50"
              >
                Pay by Chapa
              </button>
            </>
          )}
        </div>
        {phase === 'waiting' && (
          <button
            type="button"
            onClick={cancel}
            className="w-full py-1 text-xs text-ink-muted hover:text-ink"
          >
            Cancel
          </button>
        )}
      </div>
    );
  }

  return (
    <button
      onClick={handleClick}
      className={`w-full font-bold py-3 rounded-full transition ${
        highlighted
          ? 'bg-primary text-white hover:bg-primary-dark'
          : 'bg-primary-light text-primary hover:bg-primary hover:text-white'
      }`}
    >
      {isAuthenticated ? `Buy · ${price} ${currency}` : 'Sign in to buy'}
    </button>
  );
}
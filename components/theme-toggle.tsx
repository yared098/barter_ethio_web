'use client';

import { useEffect, useState } from 'react';

type Theme = 'light' | 'dark';

export function ThemeToggle() {
  const [theme, setTheme] = useState<Theme>('light');

  useEffect(() => {
    const preference = window.matchMedia('(prefers-color-scheme: dark)');
    const storedValue = window.localStorage.getItem('barter-theme');
    const storedTheme =
      storedValue === 'dark' || storedValue === 'light' ? storedValue : null;
    const applyTheme = (nextTheme: Theme) => {
      setTheme(nextTheme);
      document.documentElement.dataset.theme = nextTheme;
    };

    applyTheme(storedTheme ?? (preference.matches ? 'dark' : 'light'));

    if (storedTheme) return;

    const handlePreferenceChange = (event: MediaQueryListEvent) => {
      const currentPreference = window.localStorage.getItem('barter-theme');
      if (currentPreference === 'dark' || currentPreference === 'light') return;
      applyTheme(event.matches ? 'dark' : 'light');
    };

    preference.addEventListener('change', handlePreferenceChange);
    return () => preference.removeEventListener('change', handlePreferenceChange);
  }, []);

  function toggleTheme() {
    const nextTheme = theme === 'dark' ? 'light' : 'dark';
    document.documentElement.dataset.theme = nextTheme;
    window.localStorage.setItem('barter-theme', nextTheme);
    setTheme(nextTheme);
  }

  const nextTheme = theme === 'dark' ? 'light' : 'dark';

  return (
    <button
      type="button"
      onClick={toggleTheme}
      aria-label={`Switch to ${nextTheme} mode`}
      title={`Switch to ${nextTheme} mode`}
      className="fixed bottom-4 right-4 z-50 inline-flex h-11 w-11 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-700 shadow-lg transition hover:scale-105 hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
    >
      {theme === 'dark' ? (
        <svg
          aria-hidden="true"
          width="20"
          height="20"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <circle cx="12" cy="12" r="4" />
          <path d="M12 2v2m0 16v2M4.93 4.93l1.42 1.42m11.3 11.3 1.42 1.42M2 12h2m16 0h2M4.93 19.07l1.42-1.42m11.3-11.3 1.42-1.42" />
        </svg>
      ) : (
        <svg
          aria-hidden="true"
          width="20"
          height="20"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M20.9 13A9 9 0 0 1 11 3.1 9 9 0 1 0 20.9 13Z" />
        </svg>
      )}
    </button>
  );
}

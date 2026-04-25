import { useCallback, useEffect, useState } from 'react';

// Apply dark class to <html> immediately on load (before React mounts)
// so there's no flash of wrong theme
const getInitialDark = () => {
  if (typeof window === 'undefined') return false;
  const stored = localStorage.getItem('theme');
  return stored ? stored === 'dark' : window.matchMedia('(prefers-color-scheme: dark)').matches;
};

// Run immediately on module load to avoid FOUC
if (typeof document !== 'undefined') {
  document.documentElement.classList.toggle('dark', getInitialDark());
}

export function ThemeToggle() {
  const [isDark, setIsDark] = useState(getInitialDark);

  useEffect(() => {
    document.documentElement.classList.toggle('dark', isDark);
    document.body.classList.toggle('dark', isDark);
    localStorage.setItem('theme', isDark ? 'dark' : 'light');
  }, [isDark]);

  const toggle = useCallback(() => setIsDark((prev) => !prev), []);

  return (
    <button
      type="button"
      onClick={toggle}
      aria-label={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
      title={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
      className="fixed bottom-6 right-6 z-[9999] flex h-11 w-11 items-center justify-center rounded-full border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-500 dark:text-zinc-300 shadow-lg transition-all duration-300 hover:scale-110 hover:shadow-xl hover:bg-zinc-50 dark:hover:bg-zinc-700 active:scale-95 cursor-pointer"
    >
      {/* Sun — visible in dark mode */}
      <svg xmlns="http://www.w3.org/2000/svg" width="17" height="17" viewBox="0 0 24 24" fill="currentColor"
        className={`absolute transition-all duration-300 ${isDark ? 'opacity-100 rotate-0 scale-100' : 'opacity-0 rotate-90 scale-50'}`}>
        <path d="M12 2.25a.75.75 0 01.75.75v2.25a.75.75 0 01-1.5 0V3a.75.75 0 01.75-.75zM7.5 12a4.5 4.5 0 119 0 4.5 4.5 0 01-9 0zM18.894 6.166a.75.75 0 00-1.06-1.06l-1.591 1.59a.75.75 0 101.06 1.061l1.591-1.59zM21.75 12a.75.75 0 01-.75.75h-2.25a.75.75 0 010-1.5H21a.75.75 0 01.75.75zM17.834 18.894a.75.75 0 001.06-1.06l-1.59-1.591a.75.75 0 10-1.061 1.06l1.59 1.591zM12 18a.75.75 0 01.75.75V21a.75.75 0 01-1.5 0v-2.25A.75.75 0 0112 18zM7.758 17.303a.75.75 0 00-1.061-1.06l-1.591 1.59a.75.75 0 001.06 1.061l1.591-1.59zM6 12a.75.75 0 01-.75.75H3a.75.75 0 010-1.5h2.25A.75.75 0 016 12zM6.697 7.757a.75.75 0 001.06-1.06l-1.59-1.591a.75.75 0 00-1.061 1.06l1.59 1.591z" />
      </svg>

      {/* Moon — visible in light mode */}
      <svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="currentColor"
        className={`absolute transition-all duration-300 ${isDark ? 'opacity-0 -rotate-90 scale-50' : 'opacity-100 rotate-0 scale-100'}`}>
        <path fillRule="evenodd" d="M9.528 1.718a.75.75 0 01.162.819A8.97 8.97 0 009 6a9 9 0 009 9 8.97 8.97 0 003.463-.69.75.75 0 01.981.98 10.503 10.503 0 01-9.694 6.46c-5.799 0-10.5-4.701-10.5-10.5 0-4.368 2.667-8.112 6.46-9.694a.75.75 0 01.818.162z" clipRule="evenodd" />
      </svg>
    </button>
  );
}

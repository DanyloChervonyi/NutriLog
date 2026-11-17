'use client';

import { useTranslations } from 'next-intl';
import { useThemePreference, type ThemePreference } from '../theme/theme-provider';
import styles from './theme-switcher.module.scss';

const options: readonly ThemePreference[] = ['system', 'light', 'dark'];

function ThemeIcon({ theme }: { theme: ThemePreference }) {
  if (theme === 'system') {
    return (
      <svg width={32} height={32} viewBox="0 0 24 24" aria-hidden="true" focusable="false">
        <rect x="3.5" y="4" width="17" height="12.5" rx="2" />
        <path d="M8 20h8m-4-3.5V20" />
      </svg>
    );
  }

  if (theme === 'light') {
    return (
      <svg width={32} height={32} viewBox="0 0 24 24" aria-hidden="true" focusable="false">
        <circle cx="12" cy="12" r="4.2" />
        <path d="M12 2.8v2m0 14.4v2M4.9 4.9l1.4 1.4m11.4 11.4 1.4 1.4M2.8 12h2m14.4 0h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4" />
      </svg>
    );
  }

  return (
    <svg width={32} height={32} viewBox="0 0 24 24" aria-hidden="true" focusable="false">
      <path d="M19.5 15.2A8 8 0 0 1 8.8 4.5 8.2 8.2 0 1 0 19.5 15.2Z" />
      <path d="m16.8 4.2.4 1.1 1.1.4-1.1.4-.4 1.1-.4-1.1-1.1-.4 1.1-.4.4-1.1Z" />
    </svg>
  );
}

export function ThemeSwitcher() {
  const t = useTranslations('theme');
  const { preference, setPreference } = useThemePreference();

  return (
    <div className={styles.switcher} role="group" aria-label={t('label')} data-preference={preference}>
      {options.map((option) => (
        <button
          key={option}
          className={styles.option}
          type="button"
          aria-label={t(option)}
          aria-pressed={preference === option}
          onClick={() => setPreference(option)}
        >
          <ThemeIcon theme={option} />
        </button>
      ))}
    </div>
  );
}

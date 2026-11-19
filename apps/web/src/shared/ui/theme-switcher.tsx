'use client';

import { useEffect, useRef, useState, type FocusEvent, type KeyboardEvent } from 'react';
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
  const [isOpen, setIsOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const optionRefs = useRef<Array<HTMLButtonElement | null>>([]);

  useEffect(() => {
    if (isOpen) optionRefs.current[options.indexOf(preference)]?.focus();
  }, [isOpen, preference]);

  useEffect(() => {
    if (!isOpen) return;

    const closeOnOutsideClick = (event: PointerEvent) => {
      if (event.target instanceof Node && !rootRef.current?.contains(event.target)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('pointerdown', closeOnOutsideClick);
    return () => document.removeEventListener('pointerdown', closeOnOutsideClick);
  }, [isOpen]);

  const handleFocusLeave = (event: FocusEvent<HTMLDivElement>) => {
    if (event.relatedTarget instanceof Node && !rootRef.current?.contains(event.relatedTarget)) {
      setIsOpen(false);
    }
  };

  const handleMenuKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    const currentIndex = optionRefs.current.findIndex((option) => option === event.target);
    let nextIndex = currentIndex;

    if (event.key === 'ArrowDown') nextIndex = (currentIndex + 1) % options.length;
    else if (event.key === 'ArrowUp') nextIndex = (currentIndex - 1 + options.length) % options.length;
    else if (event.key === 'Home') nextIndex = 0;
    else if (event.key === 'End') nextIndex = options.length - 1;
    else if (event.key === 'Escape') {
      event.preventDefault();
      setIsOpen(false);
      triggerRef.current?.focus();
      return;
    } else return;

    event.preventDefault();
    optionRefs.current[nextIndex]?.focus();
  };

  const selectPreference = (nextPreference: ThemePreference) => {
    setPreference(nextPreference);
    setIsOpen(false);
    triggerRef.current?.focus();
  };

  return (
    <div ref={rootRef} className={styles.switcher} onBlur={handleFocusLeave}>
      <button
        ref={triggerRef}
        className={styles.trigger}
        type="button"
        aria-label={`${t('label')}: ${t(preference)}`}
        aria-haspopup="menu"
        aria-expanded={isOpen}
        aria-controls="theme-options"
        onClick={() => setIsOpen((current) => !current)}
      >
        <ThemeIcon theme={preference} />
      </button>
      {isOpen && (
        <div id="theme-options" className={styles.menu} role="menu" aria-label={t('label')} onKeyDown={handleMenuKeyDown}>
          {options.map((option, index) => (
            <button
              key={option}
              ref={(element) => { optionRefs.current[index] = element; }}
              className={styles.option}
              type="button"
              role="menuitemradio"
              aria-label={t(option)}
              aria-checked={preference === option}
              onClick={() => selectPreference(option)}
            >
              <ThemeIcon theme={option} />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

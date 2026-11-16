'use client';

import { useEffect, useMemo, useRef, useState, type FocusEvent, type KeyboardEvent } from 'react';
import { useAutoAnimate } from '@formkit/auto-animate/react';
import { useLocale, useTranslations } from 'next-intl';
import { usePathname, useRouter } from '../../../i18n/navigation';
import { routing, type Locale } from '../../../i18n/routing';
import styles from './locale-switcher.module.scss';

const localeNames: Record<Locale, string> = {
  uk: 'Українська',
  ru: 'Русский',
  en: 'English',
};

export function LocaleSwitcher() {
  const locale = useLocale() as Locale;
  const t = useTranslations('language');
  const pathname = usePathname();
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [activeIndex, setActiveIndex] = useState(0);
  const switcherRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const [optionsRef] = useAutoAnimate<HTMLDivElement>({ duration: 140, easing: 'ease-out' });

  const filteredLocales = useMemo(() => {
    const normalizedQuery = query.trim().toLocaleLowerCase(locale);
    return routing.locales.filter((option) =>
      localeNames[option].toLocaleLowerCase(locale).includes(normalizedQuery),
    );
  }, [locale, query]);

  useEffect(() => {
    if (isOpen) inputRef.current?.focus();
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) return;

    const closeOnOutsideClick = (event: PointerEvent) => {
      if (event.target instanceof Node && !switcherRef.current?.contains(event.target)) {
        setIsOpen(false);
        setQuery('');
      }
    };

    document.addEventListener('pointerdown', closeOnOutsideClick);
    return () => document.removeEventListener('pointerdown', closeOnOutsideClick);
  }, [isOpen]);

  const selectLocale = (nextLocale: Locale) => {
    setIsOpen(false);
    setQuery('');
    router.replace(pathname, { locale: nextLocale });
  };

  const handleSearchKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.nativeEvent.isComposing) return;

    if (event.key === 'ArrowDown' && filteredLocales.length > 0) {
      event.preventDefault();
      setActiveIndex((current) => (current + 1) % filteredLocales.length);
    } else if (event.key === 'ArrowUp' && filteredLocales.length > 0) {
      event.preventDefault();
      setActiveIndex((current) => (current - 1 + filteredLocales.length) % filteredLocales.length);
    } else if (event.key === 'Enter' && filteredLocales[activeIndex]) {
      event.preventDefault();
      selectLocale(filteredLocales[activeIndex]);
    } else if (event.key === 'Escape') {
      event.preventDefault();
      setIsOpen(false);
      setQuery('');
      triggerRef.current?.focus();
    }
  };

  const handleFocusLeave = (event: FocusEvent<HTMLDivElement>) => {
    if (event.relatedTarget instanceof Node && !switcherRef.current?.contains(event.relatedTarget)) {
      setIsOpen(false);
      setQuery('');
    }
  };

  return (
    <div ref={switcherRef} className={styles.switcher} onBlur={handleFocusLeave}>
      <button
        ref={triggerRef}
        className={styles.trigger}
        type="button"
        aria-label={`${t('label')}: ${localeNames[locale]}`}
        aria-haspopup="listbox"
        aria-expanded={isOpen}
        onClick={() => {
          setQuery('');
          setActiveIndex(routing.locales.indexOf(locale));
          setIsOpen((current) => !current);
        }}
      >
        <span>{localeNames[locale]}</span>
        <span className={styles.chevron} aria-hidden="true" />
      </button>

      {isOpen && (
        <div className={styles.dropdown}>
          <label className={styles.srOnly} htmlFor="locale-search">{t('search')}</label>
          <input
            ref={inputRef}
            id="locale-search"
            className={styles.search}
            type="search"
            role="combobox"
            aria-autocomplete="list"
            aria-controls="locale-options"
            aria-expanded="true"
            aria-activedescendant={filteredLocales[activeIndex] ? `locale-option-${filteredLocales[activeIndex]}` : undefined}
            value={query}
            onChange={(event) => {
              setQuery(event.target.value);
              setActiveIndex(0);
            }}
            onKeyDown={handleSearchKeyDown}
          />

          {filteredLocales.length > 0 ? (
            <div ref={optionsRef} id="locale-options" className={styles.options} role="listbox" aria-label={t('label')}>
              {filteredLocales.map((option, index) => (
                <div
                  key={option}
                  id={`locale-option-${option}`}
                  className={styles.option}
                  role="option"
                  aria-selected={locale === option}
                  data-active={activeIndex === index}
                  onMouseMove={() => setActiveIndex(index)}
                  onMouseDown={(event) => event.preventDefault()}
                  onClick={() => selectLocale(option)}
                >
                  <span lang={option}>{localeNames[option]}</span>
                  {locale === option && <span className={styles.currentMark} aria-hidden="true">✓</span>}
                </div>
              ))}
            </div>
          ) : (
            <p className={styles.noResults} role="status">{t('noResults')}</p>
          )}
        </div>
      )}
    </div>
  );
}

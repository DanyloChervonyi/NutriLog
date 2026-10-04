'use client';

import { useLocale, useTranslations } from 'next-intl';
import { Link } from '../../../i18n/navigation';
import { routing, type Locale } from '../../../i18n/routing';
import styles from './locale-switcher.module.scss';

export function LocaleSwitcher() {
  const locale = useLocale() as Locale;
  const t = useTranslations('language');

  return (
    <nav className={styles.switcher} aria-label={t('label')}>
      {routing.locales.map((option) => (
        <Link
          key={option}
          className={styles.option}
          href="/"
          locale={option}
          aria-current={locale === option ? 'page' : undefined}
          hrefLang={option}
        >
          {t(option)}
        </Link>
      ))}
    </nav>
  );
}

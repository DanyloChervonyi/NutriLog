'use client';

import { useTranslations } from 'next-intl';
import { Link } from '../../../i18n/navigation';
import { LocaleSwitcher } from './locale-switcher';
import { ThemeSwitcher } from './theme-switcher';
import styles from './site-footer.module.scss';

export function SiteFooter() {
  const t = useTranslations('footer');

  return (
    <footer className={styles.footer} aria-label={t('label')}>
      <div className={styles.content}>
        <div className={styles.identity}>
          <Link className={styles.brand} href="/">NutriLog</Link>
          <span className={styles.description}>{t('description')}</span>
        </div>
        <div className={styles.controls}>
          <ThemeSwitcher />
          <LocaleSwitcher />
        </div>
      </div>
    </footer>
  );
}

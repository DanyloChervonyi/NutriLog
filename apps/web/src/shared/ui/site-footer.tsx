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
          <span className={styles.brand} role="img" aria-label="NutriLog">
            <img className={styles.lightLogo} src="/images/nutrilog-icon-light.svg" alt="" />
            <img className={styles.darkLogo} src="/images/nutrilog-icon-dark.svg" alt="" />
          </span>
        </div>
        <div className={styles.controls}>
          <ThemeSwitcher />
          <LocaleSwitcher />
        </div>
      </div>
    </footer>
  );
}

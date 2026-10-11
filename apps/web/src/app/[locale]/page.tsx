import { getTranslations } from 'next-intl/server';
import { Link } from '../../../i18n/navigation';
import { LocaleSwitcher } from '../../shared/ui/locale-switcher';
import styles from './page.module.scss';

export default async function HomePage() {
  const t = await getTranslations('home');

  return (
    <main className={styles.page}>
      <header className={styles.header}>
        <a className={styles.brand} href="#page-title" aria-label="NutriLog">
          N<span>.</span>
        </a>
        <LocaleSwitcher />
        <Link href="/login">{t('signIn')}</Link>
      </header>
      <section className={styles.intro} aria-labelledby="page-title">
        <p className={styles.eyebrow}>{t('eyebrow')}</p>
        <h1 id="page-title">{t('title')}</h1>
        <p className={styles.description}>{t('description')}</p>
      </section>
      <footer className={styles.footer}>
        <span>NutriLog</span>
        <span>01 / 03</span>
      </footer>
    </main>
  );
}

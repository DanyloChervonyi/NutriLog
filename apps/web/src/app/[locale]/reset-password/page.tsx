import { getTranslations } from 'next-intl/server';
import { AuthForms } from '../auth-forms';
import styles from '../auth/auth.module.scss';

export default async function ResetPasswordPage() {
  const t = await getTranslations('auth');

  return (
    <main className={styles.page}>
      <AuthForms mode="reset" title={t('resetTitle')} />
    </main>
  );
}

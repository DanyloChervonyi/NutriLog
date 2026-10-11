'use client';

import { useEffect, useRef, useState } from 'react';
import { useLocale, useTranslations } from 'next-intl';
import { useRouter } from 'next/navigation';
import { authRequest, saveAccessToken, type AuthResponse } from '../../../../shared/api/auth';
import styles from '../auth.module.scss';

export default function GoogleCallbackPage() {
  const t = useTranslations('auth');
  const locale = useLocale();
  const router = useRouter();
  const [failed, setFailed] = useState(false);
  const exchanged = useRef(false);

  useEffect(() => {
    const ticket = new URLSearchParams(window.location.hash.slice(1)).get('ticket');
    window.history.replaceState(null, '', window.location.pathname);
    if (!ticket) {
      setFailed(true);
      return;
    }
    if (exchanged.current) return;
    exchanged.current = true;

    void authRequest<AuthResponse>('/oauth/exchange', { ticket })
      .then((result) => {
        saveAccessToken(result.accessToken);
        router.replace(`/${locale}`);
      })
      .catch(() => setFailed(true));
  }, [locale, router]);

  return (
    <main className={styles.page}>
      <p role="status">{failed ? t('googleFailed') : t('signingIn')}</p>
    </main>
  );
}

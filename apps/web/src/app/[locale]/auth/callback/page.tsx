'use client';

import { useEffect, useRef } from 'react';
import { useTranslations } from 'next-intl';
import { useMutation } from '@tanstack/react-query';
import { useRouter } from '../../../../../i18n/navigation';
import { authRequest, type AuthResponse } from '../../../../shared/api/auth';
import { useAuth } from '../../../../shared/auth/auth-context';
import styles from '../auth.module.scss';

export default function GoogleCallbackPage() {
  const t = useTranslations('auth');
  const router = useRouter();
  const { setAccessToken } = useAuth();
  const exchanged = useRef(false);
  const exchange = useMutation({
    mutationFn: (ticket: string) => ticket
      ? authRequest<AuthResponse>('/oauth/exchange', { ticket })
      : Promise.reject(new Error('Missing OAuth ticket')),
    onSuccess: (result) => { setAccessToken(result.accessToken); router.replace('/diary'); },
  });

  useEffect(() => {
    const ticket = new URLSearchParams(window.location.hash.slice(1)).get('ticket');
    window.history.replaceState(null, '', window.location.pathname);
    if (exchanged.current) return;
    exchanged.current = true;
    exchange.mutate(ticket ?? '');
  }, [exchange, router]);

  return (
    <main className={styles.page}>
      <p role="status">{exchange.isError ? t('googleFailed') : t('signingIn')}</p>
    </main>
  );
}

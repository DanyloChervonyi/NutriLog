'use client';

import { useRouter } from 'next/navigation';
import { useLocale, useTranslations } from 'next-intl';
import { type FormEvent, useEffect, useState } from 'react';
import { authRequest, saveAccessToken, type AuthResponse } from '../../shared/api/auth';
import styles from './auth/auth.module.scss';

type AuthFormsProps = Readonly<{
  mode: 'login' | 'request-reset' | 'reset';
  title: string;
  token?: string;
}>;

export function AuthForms({ mode, title, token = '' }: AuthFormsProps) {
  const t = useTranslations('auth');
  const locale = useLocale();
  const router = useRouter();
  const [message, setMessage] = useState('');
  const [busy, setBusy] = useState(false);
  const [resetToken, setResetToken] = useState(token);

  useEffect(() => {
    if (mode !== 'reset') return;
    const tokenFromLink = new URLSearchParams(window.location.hash.slice(1)).get('token') ?? '';
    window.history.replaceState(null, '', window.location.pathname);
    setResetToken(tokenFromLink);
  }, [mode]);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setMessage('');
    const form = new FormData(event.currentTarget);

    try {
      if (mode === 'login') {
        const result = await authRequest<AuthResponse>('/login', {
          email: form.get('email'),
          password: form.get('password'),
        });
        saveAccessToken(result.accessToken);
        router.replace(`/${locale}`);
      } else if (mode === 'request-reset') {
        await authRequest('/password/reset-request', { email: form.get('email'), locale });
        setMessage(t('resetRequested'));
      } else {
        await authRequest('/password/reset', {
          token: resetToken,
          newPassword: form.get('password'),
        });
        setMessage(t('passwordUpdated'));
      }
    } catch {
      setMessage(mode === 'reset' ? t('resetFailed') : t('requestFailed'));
    } finally {
      setBusy(false);
    }
  }

  const googleLoginUrl = `${process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000/api/v1'}/auth/google`;

  return (
    <form className={styles.form} onSubmit={submit}>
      <h1>{title}</h1>
      {mode === 'login' ? (
        <>
          <label className={styles.field}>
            {t('email')}
            <input name="email" type="email" autoComplete="email" maxLength={320} required />
          </label>
          <label className={styles.field}>
            {t('password')}
            <input name="password" type="password" autoComplete="current-password" minLength={1} maxLength={128} required />
          </label>
          <button className={styles.button} disabled={busy} type="submit">{t('signIn')}</button>
          <a className={styles.link} href={`/${locale}/forgot-password`}>{t('forgotLink')}</a>
          <a className={`${styles.button} ${styles.secondary}`} href={`${googleLoginUrl}?locale=${locale}`}>{t('googleSignIn')}</a>
        </>
      ) : mode === 'request-reset' ? (
        <>
          <p>{t('resetInstructions')}</p>
          <label className={styles.field}>
            {t('email')}
            <input name="email" type="email" autoComplete="email" maxLength={320} required />
          </label>
          <button className={styles.button} disabled={busy} type="submit">{t('sendResetLink')}</button>
        </>
      ) : (
        <>
          <label className={styles.field}>
            {t('newPassword')}
            <input name="password" type="password" autoComplete="new-password" minLength={12} maxLength={128} required />
          </label>
          <button className={styles.button} disabled={busy || resetToken.length < 32} type="submit">{t('savePassword')}</button>
        </>
      )}
      <p className={styles.message} role="status" aria-live="polite">{message}</p>
    </form>
  );
}

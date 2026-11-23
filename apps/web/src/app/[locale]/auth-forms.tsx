'use client';

import { useLocale, useTranslations } from 'next-intl';
import { useEffect, useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { useAutoAnimate } from '@formkit/auto-animate/react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { authRequest, type AuthResponse } from '../../shared/api/auth';
import { useAuth } from '../../shared/auth/auth-context';
import { Link, useRouter } from '../../../i18n/navigation';
import styles from './auth/auth.module.scss';

type AuthFormsProps = Readonly<{
  mode: 'login' | 'register' | 'request-reset' | 'reset';
  title: string;
  token?: string;
}>;

export function AuthForms({ mode, title, token = '' }: AuthFormsProps) {
  const [formRef] = useAutoAnimate<HTMLFormElement>({ duration: 180, easing: 'ease-out' });
  const t = useTranslations('auth');
  const locale = useLocale();
  const router = useRouter();
  const { setAccessToken } = useAuth();
  const [message, setMessage] = useState('');
  const [resetToken, setResetToken] = useState(token);
  const form = useForm<{ username: string; email: string; identifier: string; password: string }>({
    defaultValues: { username: '', email: '', identifier: '', password: '' },
  });

  const mutation = useMutation({
    mutationFn: async (values: { username: string; email: string; identifier: string; password: string }) => {
      if (mode === 'login') {
        return authRequest<AuthResponse>('/login', { identifier: values.identifier, password: values.password });
      }
      if (mode === 'register') {
        return authRequest<AuthResponse>('/register', { username: values.username, email: values.email, password: values.password });
      }
      if (mode === 'request-reset') {
        await authRequest('/password/reset-request', { email: values.email, locale });
      } else {
        await authRequest('/password/reset', { token: resetToken, newPassword: values.password });
      }
      return null;
    },
    onSuccess: (result) => {
      if (result) {
        setAccessToken(result.accessToken);
        router.replace('/diary');
      } else {
        setMessage(mode === 'reset' ? t('passwordUpdated') : t('resetRequested'));
      }
    },
    onError: () => setMessage(mode === 'reset' ? t('resetFailed') : t('requestFailed')),
  });

  useEffect(() => {
    if (mode !== 'reset') return;
    const tokenFromLink = new URLSearchParams(window.location.hash.slice(1)).get('token') ?? '';
    window.history.replaceState(null, '', window.location.pathname);
    Promise.resolve().then(() => setResetToken(tokenFromLink));
  }, [mode]);

  function submit(values: { username: string; email: string; identifier: string; password: string }) {
    setMessage('');
    const schema = mode === 'register'
      ? z.object({ username: z.string().trim().min(3).max(50).regex(/^[a-zA-Z0-9_.-]+$/), email: z.string().email().max(320), password: z.string().min(12).max(128) })
      : mode === 'login'
        ? z.object({ identifier: z.string().trim().min(3).max(320), password: z.string().min(1).max(128) })
        : mode === 'request-reset'
          ? z.object({ email: z.string().email().max(320), username: z.string(), identifier: z.string(), password: z.string() })
          : z.object({ email: z.string(), username: z.string(), identifier: z.string(), password: z.string().min(12).max(128) });
    const parsed = schema.safeParse(values);
    if (!parsed.success) {
      for (const issue of parsed.error.issues) {
        const field = issue.path[0];
        if (field === 'email' || field === 'password' || field === 'username' || field === 'identifier') form.setError(field, { message: issue.message });
      }
      return;
    }
    mutation.mutate({ ...values, username: values.username.trim(), identifier: values.identifier.trim() });
  }

  const googleLoginUrl = `${process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000/api/v1'}/auth/google`;

  return (
    <form ref={formRef} className={styles.form} onSubmit={form.handleSubmit(submit)}>
      <h1>{title}</h1>
      {(mode === 'login' || mode === 'register') ? (
        <>
          {mode === 'register' ? <>
            <label className={styles.field}>{t('username')}<input autoComplete="username" maxLength={50} {...form.register('username')} /></label>
            <label className={styles.field}>{t('email')}<input type="email" autoComplete="email" maxLength={320} {...form.register('email')} /></label>
          </> : <label className={styles.field}>{t('loginIdentifier')}<input autoComplete="username" maxLength={320} {...form.register('identifier')} /></label>}
          <label className={styles.field}>
            {t('password')}
            <input type="password" autoComplete={mode === 'login' ? 'current-password' : 'new-password'} minLength={mode === 'login' ? 1 : 12} maxLength={128} {...form.register('password')} />
          </label>
          <button className={styles.button} disabled={mutation.isPending} type="submit">{mode === 'login' ? t('signIn') : t('register')}</button>
          <a className={`${styles.button} ${styles.secondary}`} href={`${googleLoginUrl}?locale=${locale}`}>
            <GoogleIcon />
            {t('googleSignIn')}
          </a>
          {mode === 'login'
            ? <><Link className={styles.link} href="/forgot-password">{t('forgotLink')}</Link><Link className={styles.link} href="/register">{t('createAccount')}</Link></>
            : <Link className={styles.link} href="/login">{t('signIn')}</Link>}
        </>
      ) : mode === 'request-reset' ? (
        <>
          <p>{t('resetInstructions')}</p>
          <label className={styles.field}>
            {t('email')}
            <input type="email" autoComplete="email" maxLength={320} {...form.register('email')} />
          </label>
          <button className={styles.button} disabled={mutation.isPending} type="submit">{t('sendResetLink')}</button>
        </>
      ) : (
        <>
          <label className={styles.field}>
            {t('newPassword')}
            <input type="password" autoComplete="new-password" minLength={12} maxLength={128} {...form.register('password')} />
          </label>
          <button className={styles.button} disabled={mutation.isPending || resetToken.length < 32} type="submit">{t('savePassword')}</button>
        </>
      )}
      {Object.values(form.formState.errors).map((error) => <p className={styles.message} role="alert" key={error?.message}>{error?.message}</p>)}
      <p className={styles.message} role="status" aria-live="polite">{message}</p>
    </form>
  );
}

function GoogleIcon() {
  return (
    <svg aria-hidden="true" viewBox="0 0 48 48" focusable="false">
      <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5Z" />
      <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.9c-.58 2.96-2.26 5.48-4.76 7.18l7.73 6C44.38 38.04 46.98 31.92 46.98 24.55Z" />
      <path fill="#FBBC05" d="M10.53 28.59A14.4 14.4 0 0 1 9.75 24c0-1.59.27-3.13.76-4.59l-7.98-6.19A23.8 23.8 0 0 0 0 24c0 3.87.93 7.53 2.56 10.78l7.97-6.19Z" />
      <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.9-5.8l-7.73-6c-2.14 1.44-4.88 2.3-8.17 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48Z" />
    </svg>
  );
}

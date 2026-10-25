'use client';

import { useLocale, useTranslations } from 'next-intl';
import { useEffect, useState } from 'react';
import { useMutation } from '@tanstack/react-query';
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
  const t = useTranslations('auth');
  const locale = useLocale();
  const router = useRouter();
  const { setAccessToken } = useAuth();
  const [message, setMessage] = useState('');
  const [resetToken, setResetToken] = useState(token);
  const form = useForm<{ email: string; password: string; firstName: string; lastName: string }>({
    defaultValues: { email: '', password: '', firstName: '', lastName: '' },
  });

  const mutation = useMutation({
    mutationFn: async (values: { email: string; password: string; firstName?: string; lastName?: string }) => {
      if (mode === 'login' || mode === 'register') {
        return authRequest<AuthResponse>(mode === 'login' ? '/login' : '/register', values);
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

  function submit(values: { email: string; password: string; firstName: string; lastName: string }) {
    setMessage('');
    const schema = z.object({
      email: mode === 'reset' ? z.string() : z.string().email().max(320),
      password: z.string().min(mode === 'login' ? 1 : mode === 'request-reset' ? 0 : 12).max(128),
      firstName: z.string().max(80), lastName: z.string().max(80),
    });
    const parsed = schema.safeParse(values);
    if (!parsed.success) {
      for (const issue of parsed.error.issues) {
        const field = issue.path[0];
        if (field === 'email' || field === 'password') form.setError(field, { message: issue.message });
      }
      return;
    }
    if (mode === 'reset') mutation.mutate({ ...parsed.data, email: '' });
    else mutation.mutate(mode === 'register' ? {
      ...parsed.data,
      firstName: parsed.data.firstName.trim() || undefined,
      lastName: parsed.data.lastName.trim() || undefined,
    } : parsed.data);
  }

  const googleLoginUrl = `${process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000/api/v1'}/auth/google`;

  return (
    <form className={styles.form} onSubmit={form.handleSubmit(submit)}>
      <h1>{title}</h1>
      {(mode === 'login' || mode === 'register') ? (
        <>
          {mode === 'register' && <>
            <label className={styles.field}>{t('firstName')}<input autoComplete="given-name" {...form.register('firstName')} /></label>
            <label className={styles.field}>{t('lastName')}<input autoComplete="family-name" {...form.register('lastName')} /></label>
          </>}
          <label className={styles.field}>
            {t('email')}
            <input type="email" autoComplete="email" maxLength={320} {...form.register('email')} />
          </label>
          <label className={styles.field}>
            {t('password')}
            <input type="password" autoComplete={mode === 'login' ? 'current-password' : 'new-password'} minLength={mode === 'login' ? 1 : 12} maxLength={128} {...form.register('password')} />
          </label>
          <button className={styles.button} disabled={mutation.isPending} type="submit">{mode === 'login' ? t('signIn') : t('register')}</button>
          {mode === 'login' ? <><Link className={styles.link} href="/forgot-password">{t('forgotLink')}</Link><Link className={styles.link} href="/register">{t('createAccount')}</Link>
            <a className={`${styles.button} ${styles.secondary}`} href={`${googleLoginUrl}?locale=${locale}`}>{t('googleSignIn')}</a></>
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

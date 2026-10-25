'use client';

import { useMutation } from '@tanstack/react-query';
import { Link, useRouter } from '../../../i18n/navigation';
import { apiClient } from '../api/client';
import { useAuth } from '../auth/auth-context';
import { LocaleSwitcher } from './locale-switcher';
import styles from './site-header.module.scss';

type Labels = Readonly<{ diary: string; profile: string; catalog: string; signIn: string; register: string; signOut: string }>;

export function SiteHeader({ labels }: { labels: Labels }) {
  const { accessToken, ready, clearAccessToken } = useAuth();
  const router = useRouter();
  const signOut = useMutation({
    mutationFn: () => apiClient.post('/auth/logout'),
    onSettled: () => { clearAccessToken(); router.replace('/login'); },
  });

  return <header className={styles.header}>
    <Link className={styles.brand} href="/diary">NutriLog</Link>
    <nav className={styles.nav} aria-label="Main navigation">
      <Link href="/diary">{labels.diary}</Link>
      <Link href="/catalog">{labels.catalog}</Link>
      {accessToken && <Link href="/profile">{labels.profile}</Link>}
    </nav>
    <div className={styles.actions}>
      <LocaleSwitcher />
      {ready && (accessToken
        ? <button type="button" disabled={signOut.isPending} onClick={() => signOut.mutate()}>{labels.signOut}</button>
        : <><Link href="/login">{labels.signIn}</Link><Link href="/register">{labels.register}</Link></>)}
    </div>
  </header>;
}

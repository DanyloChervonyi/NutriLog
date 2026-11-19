'use client';

import { useMutation } from '@tanstack/react-query';
import { useAutoAnimate } from '@formkit/auto-animate/react';
import { useEffect, useRef, useState } from 'react';
import { Link, useRouter } from '../../../i18n/navigation';
import { apiClient } from '../api/client';
import { useAuth } from '../auth/auth-context';
import styles from './site-header.module.scss';

type Labels = Readonly<{
  diary: string;
  profile: string;
  catalog: string;
  signIn: string;
  register: string;
  signOut: string;
  navLabel: string;
  openMenu: string;
  closeMenu: string;
}>;

export function SiteHeader({ labels }: { labels: Labels }) {
  const [navRef] = useAutoAnimate<HTMLElement>({ duration: 180, easing: 'ease-out' });
  const [actionsRef] = useAutoAnimate<HTMLDivElement>({ duration: 180, easing: 'ease-out' });
  const { accessToken, ready, clearAccessToken } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const headerRef = useRef<HTMLElement>(null);
  const menuToggleRef = useRef<HTMLButtonElement>(null);
  const router = useRouter();
  const signOut = useMutation({
    mutationFn: () => apiClient.post('/auth/logout'),
    onSettled: () => { clearAccessToken(); router.replace('/login'); },
  });

  useEffect(() => {
    if (!mobileMenuOpen) return;

    headerRef.current?.querySelector<HTMLAnchorElement>('#site-navigation a')?.focus();
    const closeOnOutsideClick = (event: PointerEvent) => {
      if (event.target instanceof Node && !headerRef.current?.contains(event.target)) {
        setMobileMenuOpen(false);
      }
    };

    document.addEventListener('pointerdown', closeOnOutsideClick);
    return () => document.removeEventListener('pointerdown', closeOnOutsideClick);
  }, [mobileMenuOpen]);

  return <header ref={headerRef} className={styles.header}>
    <Link className={styles.brand} href="/">NutriLog</Link>
    <nav
      ref={navRef}
      id="site-navigation"
      className={styles.nav}
      aria-label={labels.navLabel}
      data-open={mobileMenuOpen}
      onKeyDown={(event) => {
        if (event.key === 'Escape') {
          setMobileMenuOpen(false);
          menuToggleRef.current?.focus();
        }
      }}
    >
      <Link href="/diary" onClick={() => setMobileMenuOpen(false)}>{labels.diary}</Link>
      <Link href="/catalog" onClick={() => setMobileMenuOpen(false)}>{labels.catalog}</Link>
      {accessToken && <Link href="/profile" onClick={() => setMobileMenuOpen(false)}>{labels.profile}</Link>}
    </nav>
    <div ref={actionsRef} className={styles.actions}>
      {ready && (accessToken
        ? <button type="button" disabled={signOut.isPending} onClick={() => signOut.mutate()}>{labels.signOut}</button>
        : <><Link href="/login">{labels.signIn}</Link><Link href="/register">{labels.register}</Link></>)}
    </div>
    <button
      ref={menuToggleRef}
      className={styles.menuToggle}
      type="button"
      aria-label={mobileMenuOpen ? labels.closeMenu : labels.openMenu}
      aria-expanded={mobileMenuOpen}
      aria-controls="site-navigation"
      onClick={() => setMobileMenuOpen((isOpen) => !isOpen)}
    >
      <span className={styles.menuIcon} aria-hidden="true" />
    </button>
  </header>;
}

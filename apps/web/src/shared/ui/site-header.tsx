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
    <Link className={styles.brand} href="/" aria-label="NutriLog — главная">
      <img src="/images/nutrilog-wordmark-clean.svg" alt="" />
    </Link>
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
    </nav>
    <div ref={actionsRef} className={styles.actions}>
      {ready && (accessToken
        ? <>
          <Link className={styles.iconAction} href="/profile" aria-label={labels.profile} title={labels.profile}>
            <ProfileIcon />
          </Link>
          <button className={styles.iconAction} type="button" aria-label={labels.signOut} title={labels.signOut} disabled={signOut.isPending} onClick={() => signOut.mutate()}>
            <SignOutIcon />
          </button>
        </>
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

function ProfileIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
      <circle cx="12" cy="8" r="3.5" />
      <path d="M4.5 20a7.5 7.5 0 0 1 15 0" />
    </svg>
  );
}

function SignOutIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
      <path d="M10 3H6a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h4" />
      <path d="m13 8 4 4-4 4m4-4H8" />
    </svg>
  );
}

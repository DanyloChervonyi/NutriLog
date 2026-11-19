import type { Metadata } from 'next';
import { hasLocale, NextIntlClientProvider } from 'next-intl';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import { notFound } from 'next/navigation';
import { Noto_Sans } from 'next/font/google';
import '@unocss/reset/tailwind.css';
import { Providers } from '../providers';
import { SiteFooter } from '../../shared/ui/site-footer';
import { SiteHeader } from '../../shared/ui/site-header';
import { routing } from '../../../i18n/routing';
import '../globals.scss';

const notoSans = Noto_Sans({
  subsets: ['latin', 'latin-ext', 'cyrillic', 'cyrillic-ext'],
  display: 'swap',
  variable: '--font-noto-sans',
});

const themeBootstrap = `try{const theme=localStorage.getItem('nutrilog-theme');if(theme==='system'||theme==='light'||theme==='dark'){document.documentElement.dataset.theme=theme;}}catch{}`;

type LocaleLayoutProps = Readonly<{
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}>;

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

export async function generateMetadata({
  params,
}: Pick<LocaleLayoutProps, 'params'>): Promise<Metadata> {
  const { locale } = await params;

  if (!hasLocale(routing.locales, locale)) {
    notFound();
  }

  setRequestLocale(locale);

  const t = await getTranslations({ locale, namespace: 'metadata' });

  return { title: t('title'), description: t('description') };
}

export default async function LocaleLayout({ children, params }: LocaleLayoutProps) {
  const { locale } = await params;

  if (!hasLocale(routing.locales, locale)) {
    notFound();
  }

  setRequestLocale(locale);
  const t = await getTranslations({ locale, namespace: 'navigation' });

  return (
    <html lang={locale} data-theme="system" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeBootstrap }} />
      </head>
      <body className={notoSans.variable}>
        <NextIntlClientProvider>
          <Providers>
            <SiteHeader labels={{
              diary: t('diary'), profile: t('profile'), catalog: t('catalog'), signIn: t('signIn'),
              register: t('register'), signOut: t('signOut'), navLabel: t('navLabel'),
              openMenu: t('openMenu'), closeMenu: t('closeMenu'),
            }} />
            {children}
            <SiteFooter />
          </Providers>
        </NextIntlClientProvider>
      </body>
    </html>
  );
}

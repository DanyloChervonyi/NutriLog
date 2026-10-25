import type { Metadata } from 'next';
import { hasLocale, NextIntlClientProvider } from 'next-intl';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import { notFound } from 'next/navigation';
import '@unocss/reset/tailwind.css';
import { Providers } from '../providers';
import { SiteHeader } from '../../shared/ui/site-header';
import { routing } from '../../../i18n/routing';
import '../globals.scss';

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
    <html lang={locale}>
      <body>
        <NextIntlClientProvider>
          <Providers>
            <SiteHeader labels={{ diary: t('diary'), profile: t('profile'), catalog: t('catalog'), signIn: t('signIn'), register: t('register'), signOut: t('signOut') }} />
            {children}
          </Providers>
        </NextIntlClientProvider>
      </body>
    </html>
  );
}

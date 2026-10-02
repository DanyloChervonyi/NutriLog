import type { Metadata } from 'next';
import '@unocss/reset/tailwind.css';
import { Providers } from './providers';
import './globals.css';

export const metadata: Metadata = {
  title: 'NutriLog',
  description: 'Персональный дневник питания и КБЖУ',
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="ru">
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}

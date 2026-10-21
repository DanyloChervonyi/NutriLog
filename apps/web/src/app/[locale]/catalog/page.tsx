import { getTranslations } from 'next-intl/server';
import { CatalogSearch } from './catalog-search';
import styles from './catalog.module.scss';

export default async function CatalogPage() {
  const t = await getTranslations('catalog');
  return (
    <main className={styles.page}>
      <CatalogSearch labels={{
        title: t('title'), searchPlaceholder: t('searchPlaceholder'), noResults: t('noResults'),
        loading: t('loading'), error: t('error'), calories: t('calories'), protein: t('protein'),
        fat: t('fat'), carbs: t('carbs'), per100g: t('per100g'), select: t('select'),
        selected: t('selected'), previous: t('previous'), next: t('next'), page: t('page'), of: t('of'),
      }} />
    </main>
  );
}

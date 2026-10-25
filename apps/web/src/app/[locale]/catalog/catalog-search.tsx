'use client';

import { useEffect, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useRouter } from '../../../../i18n/navigation';
import { apiClient } from '../../../shared/api/client';
import styles from './catalog.module.scss';

type Food = {
  id: string;
  name: string;
  brand: string | null;
  category: string | null;
  calories: number;
  protein: number;
  fat: number;
  carbs: number;
  fiber: number | null;
  sugar: number | null;
};
type FoodSearch = {
  items: Food[];
  pagination: { page: number; pageSize: number; total: number; totalPages: number };
};
type Labels = Record<string, string>;

export function CatalogSearch({ labels }: { labels: Labels }) {
  const [query, setQuery] = useState('');
  const [debouncedQuery, setDebouncedQuery] = useState('');
  const [page, setPage] = useState(1);
  const router = useRouter();

  useEffect(() => {
    const timer = window.setTimeout(() => setDebouncedQuery(query.trim()), 250);
    return () => window.clearTimeout(timer);
  }, [query]);

  const search = useQuery({
    queryKey: ['foods', debouncedQuery, page],
    queryFn: async () => (await apiClient.get<FoodSearch>('/foods/search', { params: { q: debouncedQuery, page, pageSize: 12 } })).data,
    enabled: debouncedQuery.length >= 2,
  });

  function changeQuery(value: string) {
    setQuery(value);
    setPage(1);
  }

  const visibleResult = debouncedQuery === query.trim() ? search.data : null;

  return (
    <section className={styles.content}>
      <h1>{labels.title}</h1>
      <label className={styles.search}>
        <span className={styles.srOnly}>{labels.searchPlaceholder}</span>
        <input
          type="search"
          value={query}
          onChange={(event) => changeQuery(event.target.value)}
          placeholder={labels.searchPlaceholder}
          minLength={2}
          maxLength={200}
        />
      </label>
      {search.isFetching && <p role="status">{labels.loading}</p>}
      {search.isError && <p role="alert">{labels.error}</p>}
      {!search.isFetching && !search.isError && query.trim().length >= 2 && visibleResult?.items.length === 0 && <p>{labels.noResults}</p>}
      {visibleResult && visibleResult.items.length > 0 && (
        <>
          <ul className={styles.list}>
            {visibleResult.items.map((food) => (
              <li className={styles.item} key={food.id}>
                <div className={styles.foodHeading}>
                  <div>
                    <h2>{food.name}</h2>
                    {food.category && <p>{food.category}</p>}
                  </div>
                  <button type="button" onClick={() => {
                    window.sessionStorage.setItem('nutrilog_pending_food', JSON.stringify(food));
                    router.push('/diary');
                  }}>
                    {labels.addToDiary}
                  </button>
                </div>
                <dl className={styles.nutrition}>
                  <div><dt>{labels.calories}</dt><dd>{food.calories} kcal</dd></div>
                  <div><dt>{labels.protein}</dt><dd>{food.protein} g</dd></div>
                  <div><dt>{labels.fat}</dt><dd>{food.fat} g</dd></div>
                  <div><dt>{labels.carbs}</dt><dd>{food.carbs} g</dd></div>
                  <div className={styles.per100g}>{labels.per100g}</div>
                </dl>
              </li>
            ))}
          </ul>
          {visibleResult.pagination.totalPages > 1 && (
            <nav className={styles.pagination} aria-label={labels.title}>
              <button type="button" disabled={page <= 1} onClick={() => setPage(page - 1)}>{labels.previous}</button>
              <span>{labels.page} {page} {labels.of} {visibleResult.pagination.totalPages}</span>
              <button type="button" disabled={page >= visibleResult.pagination.totalPages} onClick={() => setPage(page + 1)}>{labels.next}</button>
            </nav>
          )}
        </>
      )}
    </section>
  );
}

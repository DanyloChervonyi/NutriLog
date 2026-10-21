'use client';

import { useEffect, useState } from 'react';
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
type SearchResult = { query: string; response: FoodSearch };
type Labels = Record<string, string>;

export function CatalogSearch({ labels }: { labels: Labels }) {
  const [query, setQuery] = useState('');
  const [result, setResult] = useState<SearchResult | null>(null);
  const [selected, setSelected] = useState<Food | null>(null);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(false);

  useEffect(() => {
    const normalized = query.trim();
    if (normalized.length < 2) return;

    const controller = new AbortController();
    const timer = window.setTimeout(() => {
      setLoading(true);
      setError(false);
      setResult(null);
      apiClient.get<FoodSearch>('/foods/search', {
        params: { q: normalized, page, pageSize: 12 },
        signal: controller.signal,
      }).then(({ data }) => setResult({ query: normalized, response: data }))
        .catch(() => {
          if (controller.signal.aborted) return;
          setError(true);
        })
        .finally(() => {
          if (!controller.signal.aborted) setLoading(false);
        });
    }, 250);

    return () => {
      window.clearTimeout(timer);
      controller.abort();
    };
  }, [query, page]);

  function changeQuery(value: string) {
    setQuery(value);
    setPage(1);
    setSelected(null);
    if (value.trim().length < 2) {
      setLoading(false);
      setError(false);
    }
  }

  const visibleResult = result?.query === query.trim() ? result.response : null;

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
      {loading && <p role="status">{labels.loading}</p>}
      {error && <p role="alert">{labels.error}</p>}
      {!loading && !error && query.trim().length >= 2 && visibleResult?.items.length === 0 && <p>{labels.noResults}</p>}
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
                  <button type="button" aria-pressed={selected?.id === food.id} onClick={() => setSelected(food)}>
                    {labels.select}
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
      {selected && (
        <aside className={styles.selected} aria-live="polite">
          <h2>{labels.selected}</h2>
          <p>{selected.name}</p>
        </aside>
      )}
    </section>
  );
}

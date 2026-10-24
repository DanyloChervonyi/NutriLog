'use client';

import { useEffect, useState, type FormEvent } from 'react';
import { Link } from '../../../../i18n/navigation';
import { apiClient } from '../../../shared/api/client';
import styles from './diary.module.scss';

type MealType = 'BREAKFAST' | 'LUNCH' | 'DINNER' | 'SNACK';
type Food = { id: string; name: string; brand: string | null; calories: number; protein: number; fat: number; carbs: number };
type DiaryItem = { id: string; food: Pick<Food, 'id' | 'name' | 'brand'>; grams: number; calories: number; protein: number; fat: number; carbs: number };
type Meal = { id: string; type: MealType; items: DiaryItem[] };
type Diary = {
  date: string;
  totals: { calories: number; protein: number; fat: number; carbs: number };
  goals: { calories: number | null; protein: number | null; fat: number | null; carbs: number | null } | null;
  meals: Meal[];
};
type FoodSearch = { items: Food[] };
type Labels = Record<string, string>;

const mealTypes: MealType[] = ['BREAKFAST', 'LUNCH', 'DINNER', 'SNACK'];
const typeLabel: Record<MealType, string> = {
  BREAKFAST: 'breakfast', LUNCH: 'lunch', DINNER: 'dinner', SNACK: 'snack',
};

export function DiaryView({ labels }: { labels: Labels }) {
  const [token, setToken] = useState<string | null | undefined>(undefined);
  const [date, setDate] = useState(localDate());
  const [diary, setDiary] = useState<Diary | null>(null);
  const [query, setQuery] = useState('');
  const [foods, setFoods] = useState<Food[]>([]);
  const [selectedFood, setSelectedFood] = useState<Food | null>(null);
  const [mealType, setMealType] = useState<MealType>('BREAKFAST');
  const [grams, setGrams] = useState('100');
  const [gramEdits, setGramEdits] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [searching, setSearching] = useState(false);
  const [error, setError] = useState('');
  const [searchError, setSearchError] = useState(false);

  useEffect(() => {
    Promise.resolve().then(() => setToken(window.sessionStorage.getItem('nutrilog_access_token')));
  }, []);

  useEffect(() => {
    if (!token) return;
    let active = true;
    apiClient.get<Diary>('/diary', { params: { date }, headers: authHeader(token) })
      .then(({ data }) => { if (active) setDiary(data); })
      .catch(() => { if (active) setError(labels.failed); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [date, labels.failed, token]);

  useEffect(() => {
    const term = query.trim();
    if (term.length < 2) return;
    let active = true;
    const timer = window.setTimeout(() => {
      setSearching(true);
      setSearchError(false);
      apiClient.get<FoodSearch>('/foods/search', { params: { q: term, page: 1, pageSize: 10 } })
        .then(({ data }) => { if (active) setFoods(data.items); })
        .catch(() => { if (active) setSearchError(true); })
        .finally(() => { if (active) setSearching(false); });
    }, 250);
    return () => { active = false; window.clearTimeout(timer); };
  }, [query]);

  async function refreshDiary(accessToken: string, selectedDate: string) {
    const { data } = await apiClient.get<Diary>('/diary', {
      params: { date: selectedDate }, headers: authHeader(accessToken),
    });
    setDiary(data);
  }

  async function addFood(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!token || !diary || !selectedFood) return;
    setSaving(true);
    setError('');
    let createdMealId: string | null = null;
    try {
      let meal = diary.meals.find((entry) => entry.type === mealType);
      if (!meal) {
        const { data } = await apiClient.post<Diary>('/diary/meals', { date, type: mealType }, { headers: authHeader(token) });
        setDiary(data);
        meal = data.meals.find((entry) => entry.type === mealType);
        createdMealId = meal?.id ?? null;
      }
      if (!meal) throw new Error('Meal was not created');
      await apiClient.post(`/diary/meals/${meal.id}/items`, {
        foodId: selectedFood.id, grams: Number(grams),
      }, { headers: authHeader(token) });
      setSelectedFood(null);
      setQuery('');
      await refreshDiary(token, date);
    } catch {
      if (createdMealId) {
        await apiClient.delete(`/diary/meals/${createdMealId}`, { headers: authHeader(token) }).catch(() => undefined);
      }
      setError(labels.failed);
    } finally {
      setSaving(false);
    }
  }

  async function createMeal(type: MealType) {
    if (!token) return;
    setSaving(true);
    try {
      const { data } = await apiClient.post<Diary>('/diary/meals', { date, type }, { headers: authHeader(token) });
      setDiary(data);
    } catch {
      setError(labels.failed);
    } finally {
      setSaving(false);
    }
  }

  async function updateMeal(mealId: string, type: MealType) {
    if (!token) return;
    setSaving(true);
    try {
      const { data } = await apiClient.patch<Diary>(`/diary/meals/${mealId}`, { type }, { headers: authHeader(token) });
      setDiary(data);
    } catch {
      setError(labels.failed);
    } finally {
      setSaving(false);
    }
  }

  async function deleteMeal(mealId: string) {
    if (!token) return;
    setSaving(true);
    try {
      const { data } = await apiClient.delete<Diary>(`/diary/meals/${mealId}`, { headers: authHeader(token) });
      setDiary(data);
    } catch {
      setError(labels.failed);
    } finally {
      setSaving(false);
    }
  }

  async function updateItem(mealId: string, item: DiaryItem) {
    if (!token) return;
    setSaving(true);
    try {
      const { data } = await apiClient.patch<Diary>(`/diary/meals/${mealId}/items/${item.id}`, {
        grams: Number(gramEdits[item.id] ?? item.grams),
      }, { headers: authHeader(token) });
      setDiary(data);
      setGramEdits({ ...gramEdits, [item.id]: String(gramEdits[item.id] ?? item.grams) });
    } catch {
      setError(labels.failed);
    } finally {
      setSaving(false);
    }
  }

  async function deleteItem(mealId: string, itemId: string) {
    if (!token) return;
    setSaving(true);
    try {
      const { data } = await apiClient.delete<Diary>(`/diary/meals/${mealId}/items/${itemId}`, { headers: authHeader(token) });
      setDiary(data);
    } catch {
      setError(labels.failed);
    } finally {
      setSaving(false);
    }
  }

  if (token === undefined || (token && loading)) return <p>{labels.loading}</p>;
  if (!token) return <section className={styles.content}><h1>{labels.title}</h1><Link href="/login">{labels.signIn}</Link></section>;

  const totals = diary?.totals ?? { calories: 0, protein: 0, fat: 0, carbs: 0 };
  const goals = diary?.goals;
  const units: Array<[keyof typeof totals, string]> = [
    ['calories', labels.calories], ['protein', labels.protein], ['fat', labels.fat], ['carbs', labels.carbs],
  ];

  return (
    <section className={styles.content}>
      <header className={styles.header}>
        <h1>{labels.title}</h1>
        <label>{labels.date}<input type="date" value={date} onChange={(event) => { setDiary(null); setLoading(true); setDate(event.target.value); }} /></label>
      </header>
      <section className={styles.summary} aria-label={labels.totals}>
        <h2>{labels.totals}{goals ? ` | ${labels.goals}` : ''}</h2>
        <dl>{units.map(([key, label]) => (
          <div key={key}><dt>{label}</dt><dd>{totals[key]}{key === 'calories' ? ' kcal' : ' g'}
            {goals?.[key] != null && <span> / {goals[key]}{key === 'calories' ? ' kcal' : ' g'}</span>}
          </dd></div>
        ))}</dl>
      </section>
      <section className={styles.addFood}>
        <h2>{labels.addFood}</h2>
        <label className={styles.search}>{labels.search}<input placeholder={labels.searchHint} value={query} onChange={(event) => {
          const value = event.target.value;
          setQuery(value);
          setSelectedFood(null);
          if (value.trim().length < 2) { setFoods([]); setSearching(false); setSearchError(false); }
        }} maxLength={200} /></label>
        {searching && <p role="status">{labels.loading}</p>}
        {searchError && <p role="alert">{labels.foodSearchError}</p>}
        {query.trim().length >= 2 && !searching && !searchError && foods.length === 0 && <p>{labels.noFoods}</p>}
        {foods.length > 0 && (
          <ul className={styles.foodResults}>{foods.map((food) => (
            <li key={food.id}>
              <span>{food.name} <small>{food.calories} kcal / 100 g</small></span>
              <button type="button" aria-label={`${labels.select}: ${food.name}`} aria-pressed={selectedFood?.id === food.id} onClick={() => setSelectedFood(food)}>{labels.select}</button>
            </li>
          ))}</ul>
        )}
        {selectedFood && <form className={styles.addForm} onSubmit={addFood}>
          <span>{selectedFood.name}</span>
          <label>{labels.grams}<input type="number" min="0.01" max="50000" step="0.01" required value={grams} onChange={(event) => setGrams(event.target.value)} /></label>
          <select aria-label={labels.addFood} value={mealType} onChange={(event) => setMealType(event.target.value as MealType)}>
            {mealTypes.map((type) => <option value={type} key={type}>{labels[typeLabel[type]]}</option>)}
          </select>
          <button type="submit" disabled={saving}>{labels.add}</button>
        </form>}
      </section>
      {error && <p role="alert">{error}</p>}
      <section className={styles.meals}>
        {mealTypes.map((type) => {
          const meals = diary?.meals.filter((meal) => meal.type === type) ?? [];
          return <section className={styles.mealGroup} key={type}>
            <header><h2>{labels[typeLabel[type]]}</h2>
              {meals.length === 0 && <button type="button" disabled={saving} onClick={() => createMeal(type)}>{labels.createMeal}</button>}
            </header>
            {meals.map((meal) => <article className={styles.meal} key={meal.id}>
              <div className={styles.mealActions}>
                <select aria-label={labels[typeLabel[meal.type]]} value={meal.type} onChange={(event) => updateMeal(meal.id, event.target.value as MealType)}>
                  {mealTypes.map((option) => <option value={option} key={option}>{labels[typeLabel[option]]}</option>)}
                </select>
                <button type="button" disabled={saving} onClick={() => deleteMeal(meal.id)}>{labels.remove}</button>
              </div>
              {meal.items.length === 0 && <p>{labels.noMeals}</p>}
              <ul className={styles.items}>{meal.items.map((item) => (
                <li key={item.id}>
                  <div><strong>{item.food.name}</strong><span>{item.calories} kcal | {item.protein} P | {item.fat} F | {item.carbs} C</span></div>
                  <label>{labels.grams}<input type="number" min="0.01" max="50000" step="0.01" value={gramEdits[item.id] ?? item.grams} onChange={(event) => setGramEdits({ ...gramEdits, [item.id]: event.target.value })} /></label>
                  <button type="button" disabled={saving} onClick={() => updateItem(meal.id, item)}>{labels.save}</button>
                  <button type="button" disabled={saving} onClick={() => deleteItem(meal.id, item.id)}>{labels.remove}</button>
                </li>
              ))}</ul>
            </article>)}
          </section>;
        })}
      </section>
    </section>
  );
}

function authHeader(token: string) {
  return { Authorization: `Bearer ${token}` };
}

function localDate() {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
}

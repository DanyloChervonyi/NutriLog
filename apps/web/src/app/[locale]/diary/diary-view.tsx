'use client';

import { useEffect, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { Link } from '../../../../i18n/navigation';
import { apiClient } from '../../../shared/api/client';
import { useAuth } from '../../../shared/auth/auth-context';
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
const pendingFoodSchema = z.object({ id: z.string(), name: z.string(), brand: z.string().nullable().optional(), calories: z.number(), protein: z.number(), fat: z.number(), carbs: z.number() });

export function DiaryView({ labels }: { labels: Labels }) {
  const { accessToken: token, ready } = useAuth();
  const queryClient = useQueryClient();
  const [date, setDate] = useState(localDate());
  const [query, setQuery] = useState('');
  const [debouncedQuery, setDebouncedQuery] = useState('');
  const [selectedFood, setSelectedFood] = useState<Food | null>(null);
  const [gramEdits, setGramEdits] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const addForm = useForm<{ grams: string; mealType: MealType }>({ defaultValues: { grams: '100', mealType: 'BREAKFAST' } });

  useEffect(() => {
    Promise.resolve().then(() => {
      const raw = window.sessionStorage.getItem('nutrilog_pending_food');
      if (!raw) return;
      window.sessionStorage.removeItem('nutrilog_pending_food');
      try {
        const parsed = pendingFoodSchema.safeParse(JSON.parse(raw));
        if (parsed.success) { setSelectedFood(parsed.data as Food); setQuery(parsed.data.name); }
      } catch { /* Ignore malformed product handoff data. */ }
    });
  }, []);

  const diaryQuery = useQuery({
    queryKey: ['diary', date],
    queryFn: async () => (await apiClient.get<Diary>('/diary', { params: { date } })).data,
    enabled: ready && Boolean(token),
  });
  useEffect(() => {
    const timer = window.setTimeout(() => setDebouncedQuery(query.trim()), 250);
    return () => window.clearTimeout(timer);
  }, [query]);
  const foodQuery = useQuery({
    queryKey: ['foods', debouncedQuery, 'diary'],
    queryFn: async () => (await apiClient.get<FoodSearch>('/foods/search', { params: { q: debouncedQuery, page: 1, pageSize: 10 } })).data,
    enabled: debouncedQuery.length >= 2,
  });
  async function refreshDiary(accessToken: string, selectedDate: string) {
    const { data } = await apiClient.get<Diary>('/diary', {
      params: { date: selectedDate }, headers: authHeader(accessToken),
    });
    queryClient.setQueryData(['diary', selectedDate], data);
  }

  function applyDiary(data: Diary) {
    queryClient.setQueryData(['diary', date], data);
  }
  const diaryMutation = useMutation<Diary, Error, () => Promise<Diary>>({
    mutationFn: (action) => action(),
    onSuccess: (data) => { applyDiary(data); void queryClient.invalidateQueries({ queryKey: ['diary', date] }); },
    onError: () => setError(labels.failed),
  });

  async function addFood(values: { grams: string; mealType: MealType }) {
    if (!token || !diary || !selectedFood) return;
    const parsed = z.object({ grams: z.coerce.number().positive().max(50000), mealType: z.enum(mealTypes) }).safeParse(values);
    if (!parsed.success) return;
    setSaving(true);
    setError('');
    let createdMealId: string | null = null;
    try {
      let meal = diary.meals.find((entry) => entry.type === parsed.data.mealType);
      if (!meal) {
        const { data } = await apiClient.post<Diary>('/diary/meals', { date, type: parsed.data.mealType }, { headers: authHeader(token) });
        applyDiary(data);
        meal = data.meals.find((entry) => entry.type === parsed.data.mealType);
        createdMealId = meal?.id ?? null;
      }
      if (!meal) throw new Error('Meal was not created');
      await diaryMutation.mutateAsync(async () => (await apiClient.post<Diary>(`/diary/meals/${meal.id}/items`, {
        foodId: selectedFood.id, grams: parsed.data.grams,
      }, { headers: authHeader(token) })).data);
      setSelectedFood(null);
      setQuery('');
      await refreshDiary(token, date);
      await queryClient.invalidateQueries({ queryKey: ['diary', date] });
      addForm.reset({ grams: '100', mealType: parsed.data.mealType });
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
      await diaryMutation.mutateAsync(async () => (await apiClient.post<Diary>('/diary/meals', { date, type }, { headers: authHeader(token) })).data);
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
      await diaryMutation.mutateAsync(async () => (await apiClient.patch<Diary>(`/diary/meals/${mealId}`, { type }, { headers: authHeader(token) })).data);
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
      await diaryMutation.mutateAsync(async () => (await apiClient.delete<Diary>(`/diary/meals/${mealId}`, { headers: authHeader(token) })).data);
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
      await diaryMutation.mutateAsync(async () => (await apiClient.patch<Diary>(`/diary/meals/${mealId}/items/${item.id}`, {
        grams: Number(gramEdits[item.id] ?? item.grams),
      }, { headers: authHeader(token) })).data);
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
      await diaryMutation.mutateAsync(async () => (await apiClient.delete<Diary>(`/diary/meals/${mealId}/items/${itemId}`, { headers: authHeader(token) })).data);
    } catch {
      setError(labels.failed);
    } finally {
      setSaving(false);
    }
  }

  if (!ready || (token && diaryQuery.isPending)) return <p>{labels.loading}</p>;
  if (!token) return <section className={styles.content}><h1>{labels.title}</h1><Link href="/login">{labels.signIn}</Link></section>;
  if (diaryQuery.isError) return <section className={styles.content}><p role="alert">{labels.failed}</p></section>;

  const diary = diaryQuery.data;
  const totals = diary?.totals ?? { calories: 0, protein: 0, fat: 0, carbs: 0 };
  const goals = diary?.goals;
  const units: Array<[keyof typeof totals, string]> = [
    ['calories', labels.calories], ['protein', labels.protein], ['fat', labels.fat], ['carbs', labels.carbs],
  ];

  return (
    <section className={styles.content}>
      <header className={styles.header}>
        <h1>{labels.title}</h1>
        <div className={styles.dateNavigation}>
          <button type="button" aria-label={labels.previousDay} onClick={() => changeDiaryDate(date, -1, setDate)}>‹</button>
          <label>{labels.date}<input type="date" required max={localDate()} value={date} onChange={(event) => { if (event.target.value) setDate(event.target.value); }} /></label>
          <button type="button" aria-label={labels.nextDay} disabled={date >= localDate()} onClick={() => changeDiaryDate(date, 1, setDate)}>›</button>
        </div>
      </header>
      <section className={styles.summary} aria-label={labels.totals}>
        <h2>{labels.totals}{goals ? ` | ${labels.goals}` : ''}</h2>
        <dl>{units.map(([key, label]) => {
          const goal = goals?.[key] ?? null;
          const progress = goal !== null && goal > 0 ? Math.min(100, (totals[key] / goal) * 100) : 0;
          return <div key={key}><dt>{label}</dt><dd>{totals[key]}{key === 'calories' ? ' kcal' : ' g'}
            {goal !== null && <><span> / {goal}{key === 'calories' ? ' kcal' : ' g'}</span><progress aria-label={`${label}: ${Math.round(progress)}%`} value={progress} max="100" /><small>{labels.remaining}: {Math.max(0, goal - totals[key])}{key === 'calories' ? ' kcal' : ' g'}</small></>}
          </dd></div>;
        })}</dl>
      </section>
      <section className={styles.addFood}>
        <h2>{labels.addFood}</h2>
        <label className={styles.search}>{labels.search}<input placeholder={labels.searchHint} value={query} onChange={(event) => {
          const value = event.target.value;
          setQuery(value);
          setSelectedFood(null);
        }} maxLength={200} /></label>
        {foodQuery.isFetching && <p role="status">{labels.loading}</p>}
        {foodQuery.isError && <p role="alert">{labels.foodSearchError}</p>}
        {debouncedQuery.length >= 2 && !foodQuery.isFetching && !foodQuery.isError && foodQuery.data?.items.length === 0 && <p>{labels.noFoods}</p>}
        {(foodQuery.data?.items.length ?? 0) > 0 && (
          <ul className={styles.foodResults}>{foodQuery.data?.items.map((food) => (
            <li key={food.id}>
              <span>{food.name} <small>{food.calories} kcal / 100 g</small></span>
              <button type="button" aria-label={`${labels.select}: ${food.name}`} aria-pressed={selectedFood?.id === food.id} onClick={() => setSelectedFood(food)}>{labels.select}</button>
            </li>
          ))}</ul>
        )}
        {selectedFood && <form className={styles.addForm} onSubmit={addForm.handleSubmit(addFood)}>
          <span>{selectedFood.name}</span>
          <label>{labels.grams}<input type="number" min="0.01" max="50000" step="0.01" {...addForm.register('grams')} /></label>
          <select aria-label={labels.addFood} {...addForm.register('mealType')}>
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

function changeDiaryDate(date: string, offset: number, setDate: (value: string) => void) {
  const value = new Date(`${date}T12:00:00`);
  value.setDate(value.getDate() + offset);
  const selected = `${value.getFullYear()}-${String(value.getMonth() + 1).padStart(2, '0')}-${String(value.getDate()).padStart(2, '0')}`;
  setDate(selected);
}

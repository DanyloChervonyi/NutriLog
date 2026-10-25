'use client';

import { useEffect } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { Link } from '../../../../i18n/navigation';
import { apiClient } from '../../../shared/api/client';
import { useAuth } from '../../../shared/auth/auth-context';
import styles from '../auth/auth.module.scss';

type Profile = {
  gender: 'MALE' | 'FEMALE'; age: number; heightCm: number; weightKg: number;
  activityLevel: 'LOW' | 'MEDIUM' | 'HIGH' | 'VERY_HIGH'; goal: 'CUT' | 'MAINTAIN' | 'BULK';
  bmr: number; tdee: number; dailyCaloriesGoal: number; proteinGoal: number; fatGoal: number; carbsGoal: number;
};
type Labels = Record<string, string>;
type ProfileFormValues = { gender: 'MALE' | 'FEMALE'; age: string; heightCm: string; weightKg: string; activityLevel: 'LOW' | 'MEDIUM' | 'HIGH' | 'VERY_HIGH'; goal: 'CUT' | 'MAINTAIN' | 'BULK' };
const profileSchema = z.object({
  gender: z.enum(['MALE', 'FEMALE']),
  age: z.coerce.number().int().min(13).max(120), heightCm: z.coerce.number().min(100).max(250), weightKg: z.coerce.number().min(25).max(350),
  activityLevel: z.enum(['LOW', 'MEDIUM', 'HIGH', 'VERY_HIGH']), goal: z.enum(['CUT', 'MAINTAIN', 'BULK']),
});

export function ProfileForm({ labels }: { labels: Labels }) {
  const { accessToken, ready } = useAuth();
  const queryClient = useQueryClient();
  const profileQuery = useQuery({ queryKey: ['profile'], queryFn: async () => (await apiClient.get<Profile | null>('/profile')).data, enabled: ready && Boolean(accessToken) });
  const form = useForm<ProfileFormValues>({ defaultValues: { gender: 'FEMALE', age: '', heightCm: '', weightKg: '', activityLevel: 'LOW', goal: 'MAINTAIN' } });
  useEffect(() => {
    const value = profileQuery.data;
    if (value) form.reset({ gender: value.gender, age: String(value.age), heightCm: String(value.heightCm), weightKg: String(value.weightKg), activityLevel: value.activityLevel, goal: value.goal });
  }, [profileQuery.data, form]);
  const mutation = useMutation({
    mutationFn: async (values: z.output<typeof profileSchema>) => apiClient.put<Profile>('/profile', values).then(({ data }) => data),
    onSuccess: async (data) => { queryClient.setQueryData(['profile'], data); await queryClient.invalidateQueries({ queryKey: ['diary'] }); },
  });
  if (!ready || (accessToken && profileQuery.isPending)) return <p>{labels.loading}</p>;
  if (!accessToken) return <section className={styles.form}><h1>{labels.title}</h1><Link className={styles.link} href="/login">{labels.signIn}</Link></section>;
  if (profileQuery.isError) return <p role="alert">{labels.failed}</p>;

  const field = (name: 'gender' | 'activityLevel' | 'goal', label: string, options: Array<[string, string]>) => (
    <label className={styles.field} key={name}>{label}<select {...form.register(name)}>
      {options.map(([value, text]) => <option value={value} key={value}>{text}</option>)}
    </select></label>
  );
  function submit(values: ProfileFormValues) {
    const parsed = profileSchema.safeParse(values);
    if (parsed.success) mutation.mutate(parsed.data);
    else parsed.error.issues.forEach((issue) => {
      const name = issue.path[0];
      if (name === 'age' || name === 'heightCm' || name === 'weightKg') form.setError(name, { message: issue.message });
    });
  }
  const profile = profileQuery.data;

  return <section className={styles.form}>
    <h1>{labels.title}</h1>
    <form className={styles.form} onSubmit={form.handleSubmit(submit)}>
      {field('gender', labels.gender, [['FEMALE', labels.female], ['MALE', labels.male]])}
      <label className={styles.field}>{labels.age}<input type="number" min="13" max="120" {...form.register('age')} /></label>
      <label className={styles.field}>{labels.height}<input type="number" min="100" max="250" step="0.01" {...form.register('heightCm')} /></label>
      <label className={styles.field}>{labels.weight}<input type="number" min="25" max="350" step="0.01" {...form.register('weightKg')} /></label>
      {field('activityLevel', labels.activity, [['LOW', labels.low], ['MEDIUM', labels.medium], ['HIGH', labels.high], ['VERY_HIGH', labels.veryHigh]])}
      {field('goal', labels.goal, [['CUT', labels.cut], ['MAINTAIN', labels.maintain], ['BULK', labels.bulk]])}
      <button className={styles.button} type="submit" disabled={mutation.isPending}>{labels.save}</button>
      {mutation.isSuccess && <p className={styles.message} role="status">{labels.saved}</p>}
      {mutation.isError && <p className={styles.message} role="alert">{labels.failed}</p>}
    </form>
    {profile && <section aria-live="polite"><h2>{labels.targets}</h2><p>{labels.bmr}: {profile.bmr} kcal</p><p>{labels.tdee}: {profile.tdee} kcal</p><p>{labels.calories}: {profile.dailyCaloriesGoal} kcal</p><p>{labels.protein}: {profile.proteinGoal} g</p><p>{labels.fat}: {profile.fatGoal} g</p><p>{labels.carbs}: {profile.carbsGoal} g</p></section>}
  </section>;
}

'use client';

import { useEffect, useState, type FormEvent } from 'react';
import { Link } from '../../../../i18n/navigation';
import { apiClient } from '../../../shared/api/client';
import styles from '../auth/auth.module.scss';

type Profile = {
  gender: 'MALE' | 'FEMALE'; age: number; heightCm: number; weightKg: number;
  activityLevel: 'LOW' | 'MEDIUM' | 'HIGH' | 'VERY_HIGH'; goal: 'CUT' | 'MAINTAIN' | 'BULK';
  bmr: number; tdee: number; dailyCaloriesGoal: number; proteinGoal: number; fatGoal: number; carbsGoal: number;
};
type Labels = Record<string, string>;

export function ProfileForm({ labels }: { labels: Labels }) {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [values, setValues] = useState({ gender: 'FEMALE', age: '', heightCm: '', weightKg: '', activityLevel: 'LOW', goal: 'MAINTAIN' });
  const [authorized, setAuthorized] = useState(true);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState('');

  useEffect(() => {
    const token = window.sessionStorage.getItem('nutrilog_access_token');
    if (!token) { setAuthorized(false); setLoading(false); return; }
    apiClient.get<Profile | null>('/profile', { headers: { Authorization: 'Bearer ' + token } })
      .then(({ data }) => {
        if (!data) return;
        setProfile(data);
        setValues({ gender: data.gender, age: String(data.age), heightCm: String(data.heightCm), weightKg: String(data.weightKg), activityLevel: data.activityLevel, goal: data.goal });
      })
      .catch(() => setMessage(labels.failed))
      .finally(() => setLoading(false));
  }, [labels.failed]);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const token = window.sessionStorage.getItem('nutrilog_access_token');
    if (!token) { setAuthorized(false); return; }
    setMessage('');
    try {
      const { data } = await apiClient.put<Profile>('/profile', {
        ...values, age: Number(values.age), heightCm: Number(values.heightCm), weightKg: Number(values.weightKg),
      }, { headers: { Authorization: 'Bearer ' + token } });
      setProfile(data);
      setMessage(labels.saved);
    } catch {
      setMessage(labels.failed);
    }
  }

  if (loading) return <p>{labels.loading}</p>;
  if (!authorized) return <section className={styles.form}><h1>{labels.title}</h1><Link className={styles.link} href="/login">{labels.signIn}</Link></section>;

  const field = (key: string, label: string, options: Array<[string, string]>) => (
    <label className={styles.field} key={key}>{label}<select value={values[key as keyof typeof values]} onChange={(event) => setValues({ ...values, [key]: event.target.value })}>
      {options.map(([value, text]) => <option value={value} key={value}>{text}</option>)}
    </select></label>
  );

  return <section className={styles.form}>
    <h1>{labels.title}</h1>
    <form className={styles.form} onSubmit={submit}>
      {field('gender', labels.gender, [['FEMALE', labels.female], ['MALE', labels.male]])}
      <label className={styles.field}>{labels.age}<input type="number" min="13" max="120" required value={values.age} onChange={(event) => setValues({ ...values, age: event.target.value })} /></label>
      <label className={styles.field}>{labels.height}<input type="number" min="100" max="250" step="0.01" required value={values.heightCm} onChange={(event) => setValues({ ...values, heightCm: event.target.value })} /></label>
      <label className={styles.field}>{labels.weight}<input type="number" min="25" max="350" step="0.01" required value={values.weightKg} onChange={(event) => setValues({ ...values, weightKg: event.target.value })} /></label>
      {field('activityLevel', labels.activity, [['LOW', labels.low], ['MEDIUM', labels.medium], ['HIGH', labels.high], ['VERY_HIGH', labels.veryHigh]])}
      {field('goal', labels.goal, [['CUT', labels.cut], ['MAINTAIN', labels.maintain], ['BULK', labels.bulk]])}
      <button className={styles.button} type="submit">{labels.save}</button>
      <p className={styles.message} role="status">{message}</p>
    </form>
    {profile && <section aria-live="polite"><h2>{labels.targets}</h2><p>{labels.bmr}: {profile.bmr} kcal</p><p>{labels.tdee}: {profile.tdee} kcal</p><p>{labels.calories}: {profile.dailyCaloriesGoal} kcal</p><p>{labels.protein}: {profile.proteinGoal} g</p><p>{labels.fat}: {profile.fatGoal} g</p><p>{labels.carbs}: {profile.carbsGoal} g</p></section>}
  </section>;
}

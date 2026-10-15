import { getTranslations } from 'next-intl/server';
import { ProfileForm } from './profile-form';
import styles from '../auth/auth.module.scss';

export default async function ProfilePage() {
  const t = await getTranslations('profile');
  return (
    <main className={styles.page}>
      <ProfileForm labels={{
        title: t('title'), gender: t('gender'), male: t('male'), female: t('female'),
        age: t('age'), height: t('height'), weight: t('weight'), activity: t('activity'),
        goal: t('goal'), low: t('low'), medium: t('medium'), high: t('high'), veryHigh: t('veryHigh'),
        cut: t('cut'), maintain: t('maintain'), bulk: t('bulk'), save: t('save'), loading: t('loading'),
        failed: t('failed'), signIn: t('signIn'), targets: t('targets'), bmr: t('bmr'), tdee: t('tdee'),
        calories: t('calories'), protein: t('protein'), fat: t('fat'), carbs: t('carbs'), saved: t('saved'),
      }} />
    </main>
  );
}

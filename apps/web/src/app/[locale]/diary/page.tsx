import { getTranslations } from 'next-intl/server';
import { DiaryView } from './diary-view';
import styles from './diary.module.scss';

export default async function DiaryPage() {
  const t = await getTranslations('diary');
  return (
    <main className={styles.page}>
      <DiaryView labels={{
        title: t('title'), date: t('date'), addFood: t('addFood'), search: t('search'),
        searchHint: t('searchHint'), select: t('select'), grams: t('grams'), add: t('add'), loading: t('loading'),
        failed: t('failed'), signIn: t('signIn'), noMeals: t('noMeals'), createMeal: t('createMeal'),
        breakfast: t('breakfast'), lunch: t('lunch'), dinner: t('dinner'), snack: t('snack'),
        calories: t('calories'), protein: t('protein'), fat: t('fat'), carbs: t('carbs'),
        totals: t('totals'), goals: t('goals'), save: t('save'), remove: t('remove'),
        foodSearchError: t('foodSearchError'), noFoods: t('noFoods'),
        previousDay: t('previousDay'), nextDay: t('nextDay'), remaining: t('remaining'),
      }} />
    </main>
  );
}

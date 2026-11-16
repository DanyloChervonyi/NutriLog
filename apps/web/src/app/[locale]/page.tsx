import { getTranslations } from 'next-intl/server';
import { PublicLanding } from './landing';

export default async function HomePage() {
  const t = await getTranslations('home');

  return (
    <PublicLanding labels={{
      title: t('title'), description: t('description'), register: t('register'), signIn: t('signIn'),
      catalog: t('catalog'), previewAria: t('previewAria'), previewLabel: t('previewLabel'),
      demo: t('demo'), today: t('today'), calories: t('calories'), caloriesProgress: t('caloriesProgress'),
      protein: t('protein'), fat: t('fat'), carbs: t('carbs'), breakfast: t('breakfast'),
      mealExample: t('mealExample'), stepsTitle: t('stepsTitle'), stepOne: t('stepOne'),
      stepOneDescription: t('stepOneDescription'), stepTwo: t('stepTwo'), stepTwoDescription: t('stepTwoDescription'),
      stepThree: t('stepThree'), stepThreeDescription: t('stepThreeDescription'),
    }} />
  );
}

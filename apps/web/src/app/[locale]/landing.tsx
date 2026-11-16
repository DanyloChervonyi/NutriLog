'use client';

import { useEffect, useRef } from 'react';
import { gsap } from 'gsap';
import { Link, useRouter } from '../../../i18n/navigation';
import { useAuth } from '../../shared/auth/auth-context';
import styles from './page.module.scss';

type LandingLabels = Readonly<{
  title: string;
  description: string;
  register: string;
  signIn: string;
  catalog: string;
  previewAria: string;
  previewLabel: string;
  demo: string;
  today: string;
  calories: string;
  caloriesProgress: string;
  protein: string;
  fat: string;
  carbs: string;
  breakfast: string;
  mealExample: string;
  stepsTitle: string;
  stepOne: string;
  stepOneDescription: string;
  stepTwo: string;
  stepTwoDescription: string;
  stepThree: string;
  stepThreeDescription: string;
}>;

export function PublicLanding({ labels }: { labels: LandingLabels }) {
  const rootRef = useRef<HTMLElement>(null);
  const { accessToken, ready } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (ready && accessToken) router.replace('/diary');
  }, [accessToken, ready, router]);

  useEffect(() => {
    const root = rootRef.current;
    if (!root) return;

    const media = gsap.matchMedia();
    media.add('(prefers-reduced-motion: no-preference)', () => {
      const context = gsap.context(() => {
        const timeline = gsap.timeline({ defaults: { ease: 'power3.out' } });
        timeline
          .fromTo(`.${styles.headline}`, { opacity: 0, y: 14 }, { opacity: 1, y: 0, duration: 0.46 })
          .fromTo(`.${styles.description}`, { opacity: 0, y: 10 }, { opacity: 1, y: 0, duration: 0.36 }, '-=0.25')
          .fromTo(`.${styles.actions}`, { opacity: 0, y: 8 }, { opacity: 1, y: 0, duration: 0.3 }, '-=0.2')
          .fromTo(`.${styles.preview}`, { opacity: 0, y: 14 }, { opacity: 1, y: 0, duration: 0.5 }, '-=0.18');
      }, root);

      return () => context.revert();
    }, root);

    return () => media.revert();
  }, []);

  return (
    <main className={styles.page} ref={rootRef}>
      <section className={styles.hero} aria-labelledby="home-title">
        <div className={styles.copy}>
          <h1 className={styles.headline} id="home-title">{labels.title}</h1>
          <p className={styles.description}>{labels.description}</p>
          <div className={styles.actions}>
            <Link className={styles.primary} href="/register">{labels.register}</Link>
            <Link className={styles.secondary} href="/login">{labels.signIn}</Link>
          </div>
          <Link className={styles.catalogLink} href="/catalog">{labels.catalog}</Link>
        </div>

        <div className={styles.preview} role="group" aria-label={labels.previewAria}>
          <header className={styles.previewHeader}>
            <div>
              <p>{labels.previewLabel}</p>
              <h2>{labels.today}</h2>
            </div>
            <span className={styles.demo}>{labels.demo}</span>
          </header>

          <div className={styles.calorieSummary}>
            <span>{labels.calories}</span>
            <p><strong>1 485</strong><span> / 2 100 kcal</span></p>
            <progress aria-label={labels.caloriesProgress} value={71} max={100} />
          </div>

          <dl className={styles.macros}>
            <div>
              <dt>{labels.protein}</dt>
              <dd>86 <span>/ 130 g</span></dd>
              <progress aria-hidden="true" value={66} max={100} />
            </div>
            <div>
              <dt>{labels.fat}</dt>
              <dd>51 <span>/ 68 g</span></dd>
              <progress aria-hidden="true" value={75} max={100} />
            </div>
            <div>
              <dt>{labels.carbs}</dt>
              <dd>182 <span>/ 273 g</span></dd>
              <progress aria-hidden="true" value={67} max={100} />
            </div>
          </dl>

          <div className={styles.mealPreview}>
            <div>
              <span>{labels.breakfast}</span>
              <strong>{labels.mealExample}</strong>
            </div>
            <span>410 kcal</span>
          </div>
        </div>
      </section>

      <section className={styles.steps} aria-labelledby="steps-title">
        <h2 id="steps-title">{labels.stepsTitle}</h2>
        <ol>
          <li>
            <span aria-hidden="true">01</span>
            <div><h3>{labels.stepOne}</h3><p>{labels.stepOneDescription}</p></div>
          </li>
          <li>
            <span aria-hidden="true">02</span>
            <div><h3>{labels.stepTwo}</h3><p>{labels.stepTwoDescription}</p></div>
          </li>
          <li>
            <span aria-hidden="true">03</span>
            <div><h3>{labels.stepThree}</h3><p>{labels.stepThreeDescription}</p></div>
          </li>
        </ol>
      </section>
    </main>
  );
}

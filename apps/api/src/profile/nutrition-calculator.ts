import { ActivityLevel, Gender, Goal } from '../../generated/prisma/enums.js';

const activityMultipliers: Record<ActivityLevel, number> = {
  [ActivityLevel.LOW]: 1.2,
  [ActivityLevel.MEDIUM]: 1.375,
  [ActivityLevel.HIGH]: 1.55,
  [ActivityLevel.VERY_HIGH]: 1.725,
};

const goalMultipliers: Record<Goal, number> = {
  [Goal.CUT]: 0.8,
  [Goal.MAINTAIN]: 1,
  [Goal.BULK]: 1.1,
};

export type NutritionTargets = Readonly<{
  bmr: number;
  tdee: number;
  dailyCaloriesGoal: number;
  proteinGoal: number;
  fatGoal: number;
  carbsGoal: number;
}>;

export function calculateNutritionTargets(input: Readonly<{
  gender: Gender;
  age: number;
  heightCm: number;
  weightKg: number;
  goal: Goal;
  activityLevel: ActivityLevel;
}>): NutritionTargets {
  const genderOffset = input.gender === Gender.MALE ? 5 : -161;
  const bmr = 10 * input.weightKg + 6.25 * input.heightCm - 5 * input.age + genderOffset;
  const tdee = bmr * activityMultipliers[input.activityLevel];
  const dailyCaloriesGoal = Math.round((tdee * goalMultipliers[input.goal]) / 10) * 10;

  return {
    bmr: roundTo(bmr, 2),
    tdee: roundTo(tdee, 2),
    dailyCaloriesGoal,
    proteinGoal: roundTo((dailyCaloriesGoal * 0.3) / 4, 2),
    fatGoal: roundTo((dailyCaloriesGoal * 0.3) / 9, 2),
    carbsGoal: roundTo((dailyCaloriesGoal * 0.4) / 4, 2),
  };
}

function roundTo(value: number, decimals: number): number {
  const factor = 10 ** decimals;
  return Math.round(value * factor) / factor;
}

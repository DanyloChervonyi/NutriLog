# NutriLog MVP Scope

## Goal

Deliver a working web product for personalized calorie and macronutrient tracking through a daily food diary.

## Included

- Account registration, login, logout, JWT authentication, refresh tokens, and Google OAuth.
- User profile with sex, age, height, weight, activity level, and goal.
- Personalized daily calorie, protein, fat, and carbohydrate targets using the Mifflin-St Jeor BMR formula and an activity multiplier.
- Food catalog with nutrition values stored per 100 g and search by name.
- Breakfast, lunch, dinner, and snack entries with food portions that can be added, edited, and deleted.
- Daily calorie and macronutrient totals, remaining amounts against targets, and progress indicators.
- Diary history for previous days.
- Responsive web interface for desktop, tablet, and mobile.

## Excluded from the first release

- Micronutrient tracking and advanced analytics or charts.
- Premium subscriptions, payment processing, and plan enforcement.
- Barcode scanning, AI recommendations, meal planning, and exports.
- Mobile application, Apple OAuth, and other future integrations.

## Completion criteria

The MVP is complete when a user can register and authenticate, receive personalized daily targets, add foods to meals, review daily macronutrient progress, and view diary history.

## Decisions to settle during implementation

- The specification requires Google OAuth in the MVP; Apple OAuth remains future scope.
- The specification names the BMR formula and the expected daily targets but does not define the exact protein, fat, and carbohydrate allocation rules. Define and document those rules in the nutrition implementation before exposing the calculated targets.

## Food catalog implementation

- The starter catalog is populated by a Prisma migration and stores nutrition values per 100 g. Generic values are reference estimates; raw and cooked foods are separate entries.
- GET /api/v1/foods/search?q=...&page=1&pageSize=20 performs a case-insensitive substring search and returns an ordered page with total counts. pageSize is limited to 50.
- Successful search pages are cached in Redis for 60 seconds by normalized query, page, and page size. If Redis is unavailable, the API continues to query PostgreSQL.
- The web catalog displays calories and macros per 100 g and lets the user select a food for a diary entry. Persisting meals and portions belongs to the following diary stage.

## Nutrition calculation rules

- BMR uses Mifflin-St Jeor: 10 × weightKg + 6.25 × heightCm - 5 × age + 5 for male profiles and the same expression with -161 for female profiles.
- Activity multipliers are LOW 1.2, MEDIUM 1.375, HIGH 1.55, and VERY_HIGH 1.725. TDEE is BMR multiplied by the selected activity factor.
- CUT applies 0.8 × TDEE, MAINTAIN applies 1.0 × TDEE, and BULK applies 1.1 × TDEE. The resulting daily calorie target is rounded to the nearest 10 kcal.
- Macro targets divide target energy as 30% protein, 30% fat, and 40% carbohydrates. Convert energy to grams using 4 kcal/g for protein and carbohydrates and 9 kcal/g for fat; store grams to two decimal places.
- These are deterministic product defaults, not medical advice. Inputs are validated to age 13–120 years, height 100–250 cm, and weight 25–350 kg. Updating any input recalculates and persists all four daily targets.

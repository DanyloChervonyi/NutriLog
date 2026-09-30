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

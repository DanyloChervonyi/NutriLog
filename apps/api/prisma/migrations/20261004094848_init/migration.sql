-- CreateEnum
CREATE TYPE "user_role" AS ENUM ('USER', 'PREMIUM', 'ADMIN');

-- CreateEnum
CREATE TYPE "auth_provider" AS ENUM ('LOCAL', 'GOOGLE');

-- CreateEnum
CREATE TYPE "gender" AS ENUM ('MALE', 'FEMALE');

-- CreateEnum
CREATE TYPE "goal" AS ENUM ('CUT', 'MAINTAIN', 'BULK');

-- CreateEnum
CREATE TYPE "activity_level" AS ENUM ('LOW', 'MEDIUM', 'HIGH', 'VERY_HIGH');

-- CreateEnum
CREATE TYPE "meal_type" AS ENUM ('BREAKFAST', 'LUNCH', 'DINNER', 'SNACK');

-- CreateTable
CREATE TABLE "users" (
    "id" UUID NOT NULL,
    "email" VARCHAR(320) NOT NULL,
    "password_hash" VARCHAR(255),
    "provider" "auth_provider" NOT NULL DEFAULT 'LOCAL',
    "role" "user_role" NOT NULL DEFAULT 'USER',
    "first_name" VARCHAR(100),
    "last_name" VARCHAR(100),
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "user_profiles" (
    "id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "gender" "gender" NOT NULL,
    "age" INTEGER NOT NULL,
    "height_cm" DECIMAL(6,2) NOT NULL,
    "weight_kg" DECIMAL(6,2) NOT NULL,
    "goal_weight" DECIMAL(6,2),
    "goal" "goal" NOT NULL,
    "activity_level" "activity_level" NOT NULL,
    "daily_calories_goal" INTEGER,
    "protein_goal" DECIMAL(8,2),
    "fat_goal" DECIMAL(8,2),
    "carbs_goal" DECIMAL(8,2),
    "updated_at" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "user_profiles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "foods" (
    "id" UUID NOT NULL,
    "name" VARCHAR(200) NOT NULL,
    "brand" VARCHAR(120),
    "category" VARCHAR(80),
    "calories" DECIMAL(8,2) NOT NULL,
    "protein" DECIMAL(8,2) NOT NULL,
    "fat" DECIMAL(8,2) NOT NULL,
    "carbs" DECIMAL(8,2) NOT NULL,
    "fiber" DECIMAL(8,2),
    "sugar" DECIMAL(8,2),
    "potassium" DECIMAL(10,3),
    "magnesium" DECIMAL(10,3),
    "iron" DECIMAL(10,3),
    "calcium" DECIMAL(10,3),
    "vitamin_a" DECIMAL(10,3),
    "vitamin_c" DECIMAL(10,3),
    "vitamin_d" DECIMAL(10,3),
    "serving_size" DECIMAL(8,2),
    "is_verified" BOOLEAN NOT NULL DEFAULT false,
    "created_by" UUID,
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "foods_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "diary_days" (
    "id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "entry_date" DATE NOT NULL,
    "total_calories" INTEGER NOT NULL DEFAULT 0,
    "total_protein" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "total_fat" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "total_carbs" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "diary_days_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "meals" (
    "id" UUID NOT NULL,
    "diary_day_id" UUID NOT NULL,
    "meal_type" "meal_type" NOT NULL,
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "meals_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "meal_items" (
    "id" UUID NOT NULL,
    "meal_id" UUID NOT NULL,
    "food_id" UUID NOT NULL,
    "grams" DECIMAL(8,2) NOT NULL,
    "calories" INTEGER NOT NULL,
    "protein" DECIMAL(10,2) NOT NULL,
    "fat" DECIMAL(10,2) NOT NULL,
    "carbs" DECIMAL(10,2) NOT NULL,
    "fiber" DECIMAL(10,2),
    "sugar" DECIMAL(10,2),
    "potassium" DECIMAL(10,3),
    "magnesium" DECIMAL(10,3),
    "iron" DECIMAL(10,3),
    "calcium" DECIMAL(10,3),
    "vitamin_a" DECIMAL(10,3),
    "vitamin_c" DECIMAL(10,3),
    "vitamin_d" DECIMAL(10,3),
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "meal_items_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE UNIQUE INDEX "user_profiles_user_id_key" ON "user_profiles"("user_id");

-- CreateIndex
CREATE INDEX "foods_name_idx" ON "foods"("name");

-- CreateIndex
CREATE INDEX "foods_category_is_verified_idx" ON "foods"("category", "is_verified");

-- CreateIndex
CREATE INDEX "foods_created_by_idx" ON "foods"("created_by");

-- CreateIndex
CREATE INDEX "diary_days_user_id_entry_date_idx" ON "diary_days"("user_id", "entry_date" DESC);

-- CreateIndex
CREATE UNIQUE INDEX "diary_days_user_id_entry_date_key" ON "diary_days"("user_id", "entry_date");

-- CreateIndex
CREATE INDEX "meals_diary_day_id_meal_type_idx" ON "meals"("diary_day_id", "meal_type");

-- CreateIndex
CREATE INDEX "meal_items_meal_id_idx" ON "meal_items"("meal_id");

-- CreateIndex
CREATE INDEX "meal_items_food_id_idx" ON "meal_items"("food_id");

-- AddForeignKey
ALTER TABLE "user_profiles" ADD CONSTRAINT "user_profiles_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "foods" ADD CONSTRAINT "foods_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "diary_days" ADD CONSTRAINT "diary_days_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "meals" ADD CONSTRAINT "meals_diary_day_id_fkey" FOREIGN KEY ("diary_day_id") REFERENCES "diary_days"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "meal_items" ADD CONSTRAINT "meal_items_meal_id_fkey" FOREIGN KEY ("meal_id") REFERENCES "meals"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "meal_items" ADD CONSTRAINT "meal_items_food_id_fkey" FOREIGN KEY ("food_id") REFERENCES "foods"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

CREATE TYPE "user_role_new" AS ENUM ('USER', 'MODERATOR', 'ADMIN');
CREATE TYPE "subscription_plan" AS ENUM ('PREMIUM');
CREATE TYPE "subscription_status" AS ENUM ('PENDING', 'ACTIVE', 'PAST_DUE', 'CANCELED', 'EXPIRED');

ALTER TABLE "users" ADD COLUMN "username" VARCHAR(50);
UPDATE "users" SET "username" = 'user_' || replace("id"::text, '-', '');
ALTER TABLE "users" ALTER COLUMN "username" SET NOT NULL;
ALTER TABLE "users" ALTER COLUMN "email" DROP NOT NULL;

CREATE UNIQUE INDEX "users_username_key" ON "users"("username");

CREATE TABLE "subscriptions" (
    "id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "plan" "subscription_plan" NOT NULL,
    "status" "subscription_status" NOT NULL DEFAULT 'PENDING',
    "provider" VARCHAR(40),
    "provider_reference" VARCHAR(255),
    "current_period_start" TIMESTAMPTZ(3),
    "current_period_end" TIMESTAMPTZ(3),
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(3) NOT NULL,
    CONSTRAINT "subscriptions_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "subscriptions_user_id_status_current_period_end_idx"
  ON "subscriptions"("user_id", "status", "current_period_end");
ALTER TABLE "subscriptions" ADD CONSTRAINT "subscriptions_user_id_fkey"
  FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

INSERT INTO "subscriptions" ("id", "user_id", "plan", "status", "created_at", "updated_at")
SELECT gen_random_uuid(), "id", 'PREMIUM', 'ACTIVE', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
FROM "users" WHERE "role" = 'PREMIUM';

ALTER TABLE "users" ALTER COLUMN "role" DROP DEFAULT;
ALTER TABLE "users" ALTER COLUMN "role" TYPE "user_role_new"
  USING (CASE WHEN "role" = 'ADMIN' THEN 'ADMIN' ELSE 'USER' END)::"user_role_new";
DROP TYPE "user_role";
ALTER TYPE "user_role_new" RENAME TO "user_role";
ALTER TABLE "users" ALTER COLUMN "role" SET DEFAULT 'USER';

ALTER TABLE "users" DROP COLUMN "first_name";
ALTER TABLE "users" DROP COLUMN "last_name";

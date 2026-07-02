-- Add subscription type support for PREMIUM users

-- Create enum for subscription type
CREATE TYPE "SubscriptionType" AS ENUM ('MONTHLY', 'ANNUAL');

-- Add subscriptionType column to users table
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "subscriptionType" "SubscriptionType" DEFAULT 'MONTHLY';

-- Comment on column
COMMENT ON COLUMN "users"."subscriptionType" IS 'Type d''abonnement PREMIUM: MONTHLY (999 FCFA/mois) ou ANNUAL (10000 FCFA/an)';
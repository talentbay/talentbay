ALTER TYPE "public"."oauth_provider" ADD VALUE 'TELEGRAM';--> statement-breakpoint
ALTER TABLE "users" ALTER COLUMN "email" DROP NOT NULL;
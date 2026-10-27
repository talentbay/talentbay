ALTER TABLE "vacancies" ADD COLUMN "talentbay_published_at" timestamp (3) with time zone;--> statement-breakpoint
ALTER TABLE "vacancies" ADD COLUMN "source_published_at" timestamp (3) with time zone;--> statement-breakpoint
ALTER TABLE "vacancies" ADD COLUMN "source_fetched_at" timestamp (3) with time zone;--> statement-breakpoint
ALTER TABLE "vacancies" ADD COLUMN "last_imported_at" timestamp (3) with time zone;--> statement-breakpoint
ALTER TABLE "vacancies" ADD COLUMN "reviewed_at" timestamp (3) with time zone;--> statement-breakpoint
ALTER TABLE "vacancies" ADD COLUMN "reviewed_by_user_id" integer;--> statement-breakpoint
ALTER TABLE "vacancies" ADD CONSTRAINT "vacancies_reviewed_by_user_id_users_id_fk" FOREIGN KEY ("reviewed_by_user_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;
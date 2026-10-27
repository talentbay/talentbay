ALTER TABLE "relocation_locations" ADD COLUMN "dataset_snapshot" jsonb;--> statement-breakpoint
ALTER TABLE "relocation_locations" ADD COLUMN "imported_at" timestamp (3) with time zone;--> statement-breakpoint
ALTER TABLE "relocation_locations" ADD COLUMN "imported_by_user_id" integer;--> statement-breakpoint
ALTER TABLE "relocation_locations" ADD CONSTRAINT "relocation_locations_imported_by_user_id_users_id_fk" FOREIGN KEY ("imported_by_user_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;
CREATE TYPE "public"."source_run_state" AS ENUM('FETCHING', 'READY', 'IMPORTED', 'FAILED');--> statement-breakpoint
CREATE TABLE "source_imports" (
	"source_key" text PRIMARY KEY NOT NULL,
	"run_id" uuid NOT NULL,
	"config_revision" text NOT NULL,
	"state" "source_run_state" NOT NULL,
	"actor_user_id" integer,
	"expires_at" timestamp with time zone NOT NULL,
	"retry_after_at" timestamp with time zone,
	"next_offset" integer DEFAULT 0 NOT NULL,
	"items" jsonb,
	"preview_revision" text,
	"last_commit_revision" text,
	"last_commit_offset" integer,
	"report" jsonb NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "source_imports_offset_bounds" CHECK ("source_imports"."next_offset" between 0 and 200)
);
--> statement-breakpoint
ALTER TABLE "source_imports" ADD CONSTRAINT "source_imports_actor_user_id_users_id_fk" FOREIGN KEY ("actor_user_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;
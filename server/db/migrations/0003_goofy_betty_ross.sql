CREATE TYPE "public"."application_handling_event_kind" AS ENUM('RECEIVED', 'ASSIGNED', 'STARTED', 'CONTACTED', 'SHARED', 'FOLLOW_UP', 'CLOSED', 'WITHDRAWN');--> statement-breakpoint
CREATE TYPE "public"."application_handling_stage" AS ENUM('RECEIVED', 'IN_PROGRESS', 'CONTACTED', 'SHARED', 'FOLLOW_UP', 'CLOSED');--> statement-breakpoint
CREATE TABLE "application_handling_events" (
	"id" serial PRIMARY KEY NOT NULL,
	"application_id" integer NOT NULL,
	"revision" integer NOT NULL,
	"kind" "application_handling_event_kind" NOT NULL,
	"stage" "application_handling_stage" NOT NULL,
	"actor_user_id" integer,
	"command_key" uuid,
	"command_digest" text,
	"data" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"private_note" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "applications" ADD COLUMN "submission_snapshot" jsonb;--> statement-breakpoint
ALTER TABLE "applications" ADD COLUMN "handling_stage" "application_handling_stage" DEFAULT 'RECEIVED' NOT NULL;--> statement-breakpoint
ALTER TABLE "applications" ADD COLUMN "handling_revision" integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "applications" ADD COLUMN "assigned_user_id" integer;--> statement-breakpoint
ALTER TABLE "application_handling_events" ADD CONSTRAINT "application_handling_events_application_id_applications_id_fk" FOREIGN KEY ("application_id") REFERENCES "public"."applications"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "application_handling_events" ADD CONSTRAINT "application_handling_events_actor_user_id_users_id_fk" FOREIGN KEY ("actor_user_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "application_events_revision_idx" ON "application_handling_events" USING btree ("application_id","revision");--> statement-breakpoint
CREATE UNIQUE INDEX "application_events_command_idx" ON "application_handling_events" USING btree ("application_id","command_key");--> statement-breakpoint
ALTER TABLE "applications" ADD CONSTRAINT "applications_assigned_user_id_users_id_fk" FOREIGN KEY ("assigned_user_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "applications_handling_queue_idx" ON "applications" USING btree ("handling_stage","id");--> statement-breakpoint
CREATE INDEX "applications_assignee_queue_idx" ON "applications" USING btree ("assigned_user_id","id");
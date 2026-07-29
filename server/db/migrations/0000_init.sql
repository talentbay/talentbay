CREATE TYPE "public"."oauth_provider" AS ENUM('GITHUB', 'GOOGLE');--> statement-breakpoint
CREATE TYPE "public"."user_role" AS ENUM('USER', 'ADMIN');--> statement-breakpoint
CREATE TYPE "public"."organisation_member_role" AS ENUM('OWNER', 'ADMIN', 'RECRUITER');--> statement-breakpoint
CREATE TYPE "public"."organisation_status" AS ENUM('DRAFT', 'ACTIVE', 'ARCHIVED');--> statement-breakpoint
CREATE TYPE "public"."employment_type" AS ENUM('FULL_TIME', 'PART_TIME', 'CONTRACT', 'INTERNSHIP');--> statement-breakpoint
CREATE TYPE "public"."salary_period" AS ENUM('YEAR', 'MONTH', 'HOUR');--> statement-breakpoint
CREATE TYPE "public"."vacancy_review_status" AS ENUM('UNREVIEWED', 'VERIFIED', 'FLAGGED');--> statement-breakpoint
CREATE TYPE "public"."vacancy_status" AS ENUM('DRAFT', 'PUBLISHED', 'ARCHIVED');--> statement-breakpoint
CREATE TYPE "public"."workplace_type" AS ENUM('ONSITE', 'HYBRID', 'REMOTE');--> statement-breakpoint
CREATE TYPE "public"."application_status" AS ENUM('NEW', 'VIEWED', 'INTERVIEW', 'OFFER', 'REJECTED', 'WITHDRAWN');--> statement-breakpoint
CREATE TYPE "public"."relocation_data_status" AS ENUM('DRAFT', 'VERIFIED', 'STALE');--> statement-breakpoint
CREATE TABLE "candidate_profiles" (
	"user_id" integer PRIMARY KEY NOT NULL,
	"headline" text,
	"about" text,
	"country_code" text,
	"city" text,
	"phone" text,
	"telegram" text,
	"github_url" text,
	"linkedin_url" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "oauth_accounts" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer NOT NULL,
	"provider" "oauth_provider" NOT NULL,
	"provider_account_id" text NOT NULL,
	"provider_email" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" serial PRIMARY KEY NOT NULL,
	"role" "user_role" DEFAULT 'USER' NOT NULL,
	"name" text NOT NULL,
	"email" text NOT NULL,
	"avatar_url" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"last_login_at" timestamp with time zone,
	CONSTRAINT "users_email_unique" UNIQUE("email")
);
--> statement-breakpoint
CREATE TABLE "organisation_members" (
	"organisation_id" integer NOT NULL,
	"user_id" integer NOT NULL,
	"role" "organisation_member_role" DEFAULT 'RECRUITER' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "organisation_members_organisation_id_user_id_pk" PRIMARY KEY("organisation_id","user_id")
);
--> statement-breakpoint
CREATE TABLE "organisations" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"slug" text NOT NULL,
	"status" "organisation_status" DEFAULT 'DRAFT' NOT NULL,
	"about" text,
	"website_url" text,
	"logo_url" text,
	"country_code" text,
	"city" text,
	"created_by_user_id" integer,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "organisations_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE "vacancies" (
	"id" serial PRIMARY KEY NOT NULL,
	"organisation_id" integer NOT NULL,
	"relocation_location_id" integer,
	"created_by_user_id" integer,
	"slug" text NOT NULL,
	"title" text NOT NULL,
	"summary" text,
	"description" text NOT NULL,
	"status" "vacancy_status" DEFAULT 'DRAFT' NOT NULL,
	"review_status" "vacancy_review_status" DEFAULT 'UNREVIEWED' NOT NULL,
	"employment_type" "employment_type" NOT NULL,
	"workplace_type" "workplace_type" NOT NULL,
	"seniority" text,
	"country_code" text NOT NULL,
	"city" text,
	"salary_min" integer,
	"salary_max" integer,
	"salary_currency" text,
	"salary_period" "salary_period",
	"relocation_offered" boolean DEFAULT false NOT NULL,
	"visa_sponsorship" boolean DEFAULT false NOT NULL,
	"source_name" text,
	"source_url" text,
	"source_external_id" text,
	"published_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "vacancies_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE "applications" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer NOT NULL,
	"vacancy_id" integer NOT NULL,
	"status" "application_status" DEFAULT 'NEW' NOT NULL,
	"cover_letter" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "relocation_locations" (
	"id" serial PRIMARY KEY NOT NULL,
	"country_code" text NOT NULL,
	"city" text NOT NULL,
	"currency" text NOT NULL,
	"status" "relocation_data_status" DEFAULT 'DRAFT' NOT NULL,
	"monthly_costs" jsonb NOT NULL,
	"one_time_costs" jsonb NOT NULL,
	"tax_model" jsonb NOT NULL,
	"sources" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"notes" text,
	"effective_from" timestamp with time zone NOT NULL,
	"reviewed_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "candidate_profiles" ADD CONSTRAINT "candidate_profiles_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "oauth_accounts" ADD CONSTRAINT "oauth_accounts_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "organisation_members" ADD CONSTRAINT "organisation_members_organisation_id_organisations_id_fk" FOREIGN KEY ("organisation_id") REFERENCES "public"."organisations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "organisation_members" ADD CONSTRAINT "organisation_members_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "organisations" ADD CONSTRAINT "organisations_created_by_user_id_users_id_fk" FOREIGN KEY ("created_by_user_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "vacancies" ADD CONSTRAINT "vacancies_organisation_id_organisations_id_fk" FOREIGN KEY ("organisation_id") REFERENCES "public"."organisations"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "vacancies" ADD CONSTRAINT "vacancies_relocation_location_id_relocation_locations_id_fk" FOREIGN KEY ("relocation_location_id") REFERENCES "public"."relocation_locations"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "vacancies" ADD CONSTRAINT "vacancies_created_by_user_id_users_id_fk" FOREIGN KEY ("created_by_user_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "applications" ADD CONSTRAINT "applications_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "applications" ADD CONSTRAINT "applications_vacancy_id_vacancies_id_fk" FOREIGN KEY ("vacancy_id") REFERENCES "public"."vacancies"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "oauth_accounts_user_id_idx" ON "oauth_accounts" USING btree ("user_id");--> statement-breakpoint
CREATE UNIQUE INDEX "oauth_accounts_provider_account_idx" ON "oauth_accounts" USING btree ("provider","provider_account_id");--> statement-breakpoint
CREATE INDEX "users_role_idx" ON "users" USING btree ("role");--> statement-breakpoint
CREATE INDEX "organisation_members_user_id_idx" ON "organisation_members" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "organisations_status_idx" ON "organisations" USING btree ("status");--> statement-breakpoint
CREATE INDEX "vacancies_organisation_id_idx" ON "vacancies" USING btree ("organisation_id");--> statement-breakpoint
CREATE INDEX "vacancies_relocation_location_id_idx" ON "vacancies" USING btree ("relocation_location_id");--> statement-breakpoint
CREATE INDEX "vacancies_status_published_at_idx" ON "vacancies" USING btree ("status","published_at");--> statement-breakpoint
CREATE INDEX "vacancies_location_idx" ON "vacancies" USING btree ("country_code","city");--> statement-breakpoint
CREATE UNIQUE INDEX "vacancies_source_external_id_idx" ON "vacancies" USING btree ("source_name","source_external_id");--> statement-breakpoint
CREATE INDEX "vacancies_search_idx" ON "vacancies" USING gin (to_tsvector('english', "title" || ' ' || coalesce("summary", '') || ' ' || "description"));--> statement-breakpoint
CREATE UNIQUE INDEX "applications_user_vacancy_idx" ON "applications" USING btree ("user_id","vacancy_id");--> statement-breakpoint
CREATE INDEX "applications_vacancy_status_idx" ON "applications" USING btree ("vacancy_id","status");--> statement-breakpoint
CREATE INDEX "applications_user_created_at_idx" ON "applications" USING btree ("user_id","created_at");--> statement-breakpoint
CREATE UNIQUE INDEX "relocation_locations_country_city_idx" ON "relocation_locations" USING btree ("country_code","city");--> statement-breakpoint
CREATE INDEX "relocation_locations_status_idx" ON "relocation_locations" USING btree ("status");
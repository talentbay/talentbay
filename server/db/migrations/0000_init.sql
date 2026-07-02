CREATE TYPE "public"."role" AS ENUM('USER', 'MEMBER', 'ORG', 'ADMIN');--> statement-breakpoint
CREATE TYPE "public"."application_status" AS ENUM('NEW', 'VIEWED', 'INTERVIEW', 'OFFER', 'REJECTED', 'WITHDRAWN');--> statement-breakpoint
CREATE TABLE "users" (
	"id" serial PRIMARY KEY NOT NULL,
	"role" "role" DEFAULT 'USER',
	"name" text NOT NULL,
	"email" text NOT NULL,
	"provider" text NOT NULL,
	"providerID" text NOT NULL,
	"avatar" text,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"password" text,
	"profile" jsonb,
	CONSTRAINT "users_email_unique" UNIQUE("email")
);
--> statement-breakpoint
CREATE TABLE "organisations" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"about" text,
	"country" text,
	"city" text,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"adminID" integer,
	"userID" integer,
	"vacancyID" integer
);
--> statement-breakpoint
CREATE TABLE "vacancies" (
	"id" serial PRIMARY KEY NOT NULL,
	"title" text NOT NULL,
	"orgID" integer
);
--> statement-breakpoint
CREATE TABLE "applications" (
	"id" serial PRIMARY KEY NOT NULL,
	"userID" integer NOT NULL,
	"vacancyID" integer NOT NULL,
	"status" "application_status" DEFAULT 'NEW' NOT NULL,
	"coverLetter" text,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "relocation_data" (
	"id" serial PRIMARY KEY NOT NULL,
	"vacancyID" integer NOT NULL,
	"country" text NOT NULL,
	"city" text,
	"currency" text DEFAULT 'USD' NOT NULL,
	"grossMonthly" integer NOT NULL,
	"taxRateBps" integer DEFAULT 0 NOT NULL,
	"netMonthly" integer,
	"relocationCost" integer,
	"costOfLiving" jsonb,
	"notes" text,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "organisations" ADD CONSTRAINT "organisations_adminID_users_id_fk" FOREIGN KEY ("adminID") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "organisations" ADD CONSTRAINT "organisations_userID_users_id_fk" FOREIGN KEY ("userID") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "organisations" ADD CONSTRAINT "organisations_vacancyID_vacancies_id_fk" FOREIGN KEY ("vacancyID") REFERENCES "public"."vacancies"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "vacancies" ADD CONSTRAINT "vacancies_orgID_users_id_fk" FOREIGN KEY ("orgID") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "applications" ADD CONSTRAINT "applications_userID_users_id_fk" FOREIGN KEY ("userID") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "applications" ADD CONSTRAINT "applications_vacancyID_vacancies_id_fk" FOREIGN KEY ("vacancyID") REFERENCES "public"."vacancies"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "relocation_data" ADD CONSTRAINT "relocation_data_vacancyID_vacancies_id_fk" FOREIGN KEY ("vacancyID") REFERENCES "public"."vacancies"("id") ON DELETE no action ON UPDATE no action;
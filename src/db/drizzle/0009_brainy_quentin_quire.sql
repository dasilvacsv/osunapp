CREATE TYPE "public"."organization_nature" AS ENUM('PUBLIC', 'PRIVATE');--> statement-breakpoint
CREATE TYPE "public"."section_template_status" AS ENUM('COMPLETE', 'INCOMPLETE', 'PENDING');--> statement-breakpoint
CREATE TABLE "cities" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" varchar(255) NOT NULL,
	"state" varchar(255),
	"country" varchar(255) DEFAULT 'Venezuela' NOT NULL,
	"status" "status" DEFAULT 'ACTIVE',
	"created_at" timestamp with time zone DEFAULT now(),
	"updated_at" timestamp with time zone DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "organization_sections" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" varchar(255) NOT NULL,
	"level" varchar(100) NOT NULL,
	"organization_id" uuid NOT NULL,
	"template_link" text,
	"template_status" "section_template_status" DEFAULT 'PENDING',
	"status" "status" DEFAULT 'ACTIVE',
	"created_at" timestamp with time zone DEFAULT now(),
	"updated_at" timestamp with time zone DEFAULT now()
);
--> statement-breakpoint
ALTER TABLE "bundle_beneficiaries" ADD COLUMN "organization_id" uuid;--> statement-breakpoint
ALTER TABLE "organizations" ADD COLUMN "nature" "organization_nature" DEFAULT 'PRIVATE';--> statement-breakpoint
ALTER TABLE "organizations" ADD COLUMN "city_id" uuid;--> statement-breakpoint
ALTER TABLE "organization_sections" ADD CONSTRAINT "organization_sections_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "cities_name_idx" ON "cities" USING btree ("name");--> statement-breakpoint
ALTER TABLE "bundle_beneficiaries" ADD CONSTRAINT "bundle_beneficiaries_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "organizations" ADD CONSTRAINT "organizations_city_id_cities_id_fk" FOREIGN KEY ("city_id") REFERENCES "public"."cities"("id") ON DELETE no action ON UPDATE no action;
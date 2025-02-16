CREATE TABLE "bundle_categories" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" varchar(255) NOT NULL,
	"description" text,
	"organization_id" uuid,
	"status" "status" DEFAULT 'ACTIVE',
	"created_at" timestamp with time zone DEFAULT now(),
	"updated_at" timestamp with time zone DEFAULT now()
);
--> statement-breakpoint
ALTER TABLE "bundles" ADD COLUMN "category_id" uuid;--> statement-breakpoint
ALTER TABLE "bundle_categories" ADD CONSTRAINT "bundle_categories_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "bundles" ADD CONSTRAINT "bundles_category_id_bundle_categories_id_fk" FOREIGN KEY ("category_id") REFERENCES "public"."bundle_categories"("id") ON DELETE no action ON UPDATE no action;
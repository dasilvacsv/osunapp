ALTER TABLE "bundles" ADD COLUMN "currency_type" text DEFAULT 'USD';--> statement-breakpoint
ALTER TABLE "bundles" ADD COLUMN "conversion_rate" text;
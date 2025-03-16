CREATE TABLE "daily_sales_reports" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"date" date NOT NULL,
	"total_direct_sales" numeric DEFAULT '0',
	"total_payments" numeric DEFAULT '0',
	"total_sales_usd" numeric DEFAULT '0',
	"total_sales_bs" numeric DEFAULT '0',
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now(),
	"metadata" jsonb
);
--> statement-breakpoint
ALTER TABLE "payments" ADD COLUMN "currency_type" varchar(10) DEFAULT 'USD';--> statement-breakpoint
ALTER TABLE "payments" ADD COLUMN "original_amount" numeric;--> statement-breakpoint
ALTER TABLE "payments" ADD COLUMN "conversion_rate" numeric DEFAULT '1';--> statement-breakpoint
ALTER TABLE "purchases" ADD COLUMN "vendido" boolean DEFAULT false;--> statement-breakpoint
ALTER TABLE "purchases" ADD COLUMN "is_draft" boolean DEFAULT false;--> statement-breakpoint
ALTER TABLE "purchases" ADD COLUMN "currency_type" varchar(10) DEFAULT 'USD';--> statement-breakpoint
ALTER TABLE "purchases" ADD COLUMN "conversion_rate" numeric DEFAULT '1';
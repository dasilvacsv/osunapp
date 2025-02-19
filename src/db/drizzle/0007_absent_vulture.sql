CREATE TYPE "public"."inventory_item_status" AS ENUM('ACTIVE', 'INACTIVE');--> statement-breakpoint
CREATE TYPE "public"."inventory_item_type" AS ENUM('PHYSICAL', 'DIGITAL', 'SERVICE');--> statement-breakpoint
CREATE TABLE "payment_methods" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" varchar(50) NOT NULL,
	"description" text,
	"status" "status" DEFAULT 'ACTIVE',
	"created_at" timestamp with time zone DEFAULT now(),
	"updated_at" timestamp with time zone DEFAULT now()
);
--> statement-breakpoint
ALTER TABLE "purchases" ALTER COLUMN "payment_method" SET DATA TYPE varchar(50);--> statement-breakpoint
ALTER TABLE "purchases" ALTER COLUMN "payment_method" SET DEFAULT 'CASH';--> statement-breakpoint
ALTER TABLE "purchases" ALTER COLUMN "payment_method" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "purchases" ADD COLUMN "transaction_reference" varchar(255);--> statement-breakpoint
ALTER TABLE "purchases" ADD COLUMN "booking_method" varchar(50);
CREATE TYPE "public"."installment_frequency" AS ENUM('WEEKLY', 'BIWEEKLY', 'MONTHLY');--> statement-breakpoint
CREATE TYPE "public"."payment_status" AS ENUM('PENDING', 'PAID', 'OVERDUE', 'CANCELLED');--> statement-breakpoint
CREATE TYPE "public"."payment_type" AS ENUM('FULL', 'INSTALLMENT', 'DEPOSIT');--> statement-breakpoint
CREATE TYPE "public"."sale_type" AS ENUM('DIRECT', 'PRESALE');--> statement-breakpoint
CREATE TABLE "payment_plans" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"purchase_id" uuid NOT NULL,
	"total_amount" numeric(10, 2) NOT NULL,
	"down_payment" numeric(10, 2),
	"installment_count" integer NOT NULL,
	"installment_frequency" "installment_frequency" DEFAULT 'MONTHLY',
	"start_date" timestamp with time zone NOT NULL,
	"status" "status" DEFAULT 'ACTIVE',
	"created_at" timestamp with time zone DEFAULT now(),
	"updated_at" timestamp with time zone DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "payments" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"purchase_id" uuid NOT NULL,
	"amount" numeric(10, 2) NOT NULL,
	"status" "payment_status" DEFAULT 'PENDING',
	"payment_date" timestamp with time zone,
	"due_date" timestamp with time zone,
	"payment_method" varchar(50),
	"transaction_reference" varchar(255),
	"notes" text,
	"created_at" timestamp with time zone DEFAULT now(),
	"updated_at" timestamp with time zone DEFAULT now()
);
--> statement-breakpoint
ALTER TABLE "purchases" ADD COLUMN "payment_type" text;--> statement-breakpoint
ALTER TABLE "purchases" ADD COLUMN "is_paid" boolean DEFAULT false;--> statement-breakpoint
ALTER TABLE "payment_plans" ADD CONSTRAINT "payment_plans_purchase_id_purchases_id_fk" FOREIGN KEY ("purchase_id") REFERENCES "public"."purchases"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "payments" ADD CONSTRAINT "payments_purchase_id_purchases_id_fk" FOREIGN KEY ("purchase_id") REFERENCES "public"."purchases"("id") ON DELETE no action ON UPDATE no action;
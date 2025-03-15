CREATE TABLE "inventory_purchase_payments" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"purchase_id" uuid NOT NULL,
	"amount" numeric(10, 2) NOT NULL,
	"payment_method" varchar(50) NOT NULL,
	"payment_date" timestamp with time zone NOT NULL,
	"reference" varchar(255),
	"notes" text,
	"created_at" timestamp with time zone DEFAULT now()
);
--> statement-breakpoint
ALTER TABLE "inventory_purchases" ADD COLUMN "is_paid" boolean DEFAULT true;--> statement-breakpoint
ALTER TABLE "inventory_purchases" ADD COLUMN "paid_amount" numeric(10, 2) DEFAULT '0';--> statement-breakpoint
ALTER TABLE "inventory_purchases" ADD COLUMN "status" varchar(20) DEFAULT 'PAID';--> statement-breakpoint
ALTER TABLE "inventory_purchases" ADD COLUMN "due_date" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "inventory_purchases" ADD COLUMN "metadata" jsonb;--> statement-breakpoint
ALTER TABLE "inventory_purchase_payments" ADD CONSTRAINT "inventory_purchase_payments_purchase_id_inventory_purchases_id_fk" FOREIGN KEY ("purchase_id") REFERENCES "public"."inventory_purchases"("id") ON DELETE no action ON UPDATE no action;
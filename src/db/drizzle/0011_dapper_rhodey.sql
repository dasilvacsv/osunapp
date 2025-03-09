CREATE TYPE "public"."transaction_type" AS ENUM('INITIAL', 'IN', 'OUT', 'ADJUSTMENT', 'RESERVATION', 'FULFILLMENT');--> statement-breakpoint
CREATE TABLE "inventory_purchase_items" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"purchase_id" uuid NOT NULL,
	"item_id" uuid NOT NULL,
	"quantity" integer NOT NULL,
	"unit_cost" numeric(10, 2) NOT NULL,
	"total_cost" numeric(10, 2) NOT NULL,
	"created_at" timestamp with time zone DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "inventory_purchases" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"supplier_name" varchar(255) NOT NULL,
	"invoice_number" varchar(100),
	"total_amount" numeric(10, 2) NOT NULL,
	"notes" text,
	"purchase_date" timestamp with time zone DEFAULT now() NOT NULL,
	"created_at" timestamp with time zone DEFAULT now(),
	"updated_at" timestamp with time zone DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "sale_items" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"sale_id" uuid NOT NULL,
	"item_id" uuid NOT NULL,
	"quantity" integer NOT NULL,
	"unit_price" numeric(10, 2) NOT NULL,
	"total_price" numeric(10, 2) NOT NULL,
	"created_at" timestamp with time zone DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "sales" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"order_reference" varchar(100),
	"total_amount" numeric(10, 2) NOT NULL,
	"sale_date" timestamp with time zone DEFAULT now() NOT NULL,
	"created_at" timestamp with time zone DEFAULT now(),
	"updated_at" timestamp with time zone DEFAULT now()
);
--> statement-breakpoint
ALTER TABLE "inventory_transactions" ALTER COLUMN "transaction_type" SET DATA TYPE transaction_type;--> statement-breakpoint
ALTER TABLE "inventory_items" ADD COLUMN "margin" numeric(5, 2) DEFAULT '0.30';--> statement-breakpoint
ALTER TABLE "inventory_items" ADD COLUMN "projected_stock" integer;--> statement-breakpoint
ALTER TABLE "inventory_items" ADD COLUMN "average_daily_sales" numeric(10, 2);--> statement-breakpoint
ALTER TABLE "inventory_transactions" ADD COLUMN "updated_at" timestamp with time zone DEFAULT now();--> statement-breakpoint
ALTER TABLE "inventory_purchase_items" ADD CONSTRAINT "inventory_purchase_items_purchase_id_inventory_purchases_id_fk" FOREIGN KEY ("purchase_id") REFERENCES "public"."inventory_purchases"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "inventory_purchase_items" ADD CONSTRAINT "inventory_purchase_items_item_id_inventory_items_id_fk" FOREIGN KEY ("item_id") REFERENCES "public"."inventory_items"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sale_items" ADD CONSTRAINT "sale_items_sale_id_sales_id_fk" FOREIGN KEY ("sale_id") REFERENCES "public"."sales"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sale_items" ADD CONSTRAINT "sale_items_item_id_inventory_items_id_fk" FOREIGN KEY ("item_id") REFERENCES "public"."inventory_items"("id") ON DELETE no action ON UPDATE no action;
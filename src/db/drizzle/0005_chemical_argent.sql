CREATE TABLE "inventory_transactions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"item_id" uuid NOT NULL,
	"quantity" integer NOT NULL,
	"transaction_type" varchar(50) NOT NULL,
	"reference" jsonb,
	"notes" text,
	"created_at" timestamp with time zone DEFAULT now(),
	"created_by" uuid
);
--> statement-breakpoint
ALTER TABLE "inventory_items" ALTER COLUMN "current_stock" SET DEFAULT 0;--> statement-breakpoint
ALTER TABLE "inventory_items" ALTER COLUMN "current_stock" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "inventory_items" ALTER COLUMN "minimum_stock" SET DEFAULT 0;--> statement-breakpoint
ALTER TABLE "inventory_items" ALTER COLUMN "minimum_stock" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "inventory_items" ADD COLUMN "sku" varchar(100);--> statement-breakpoint
ALTER TABLE "inventory_items" ADD COLUMN "reserved_stock" integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "inventory_items" ADD COLUMN "expected_restock" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "inventory_transactions" ADD CONSTRAINT "inventory_transactions_item_id_inventory_items_id_fk" FOREIGN KEY ("item_id") REFERENCES "public"."inventory_items"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "inventory_transactions" ADD CONSTRAINT "inventory_transactions_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "inventory_items_sku_idx" ON "inventory_items" USING btree ("sku");--> statement-breakpoint
CREATE INDEX "inventory_items_status_idx" ON "inventory_items" USING btree ("status");--> statement-breakpoint
CREATE INDEX "inventory_items_stock_idx" ON "inventory_items" USING btree ("current_stock");--> statement-breakpoint
ALTER TABLE "inventory_items" ADD CONSTRAINT "inventory_items_sku_unique" UNIQUE("sku");
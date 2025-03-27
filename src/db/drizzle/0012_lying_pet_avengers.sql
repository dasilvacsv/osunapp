ALTER TABLE "purchase_items" ALTER COLUMN "unit_price" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "purchase_items" ALTER COLUMN "total_price" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "purchases" ALTER COLUMN "total_amount" DROP NOT NULL;
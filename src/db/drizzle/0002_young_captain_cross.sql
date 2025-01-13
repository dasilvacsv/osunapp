ALTER TABLE "clients" ADD COLUMN "phone" varchar;--> statement-breakpoint
ALTER TABLE "clients" ADD COLUMN "whatsapp" varchar;--> statement-breakpoint
ALTER TABLE "clients" ADD CONSTRAINT "clients_document_unique" UNIQUE("document");
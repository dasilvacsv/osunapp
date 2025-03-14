CREATE TYPE "public"."certificate_status" AS ENUM('GENERATED', 'NOT_GENERATED', 'NEEDS_REVISION', 'APPROVED');--> statement-breakpoint
CREATE TABLE "certificates" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"purchase_id" uuid NOT NULL,
	"beneficiario_id" uuid,
	"status" "certificate_status" DEFAULT 'NOT_GENERATED',
	"file_url" varchar(512),
	"notes" text,
	"generated_at" timestamp with time zone,
	"approved_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now(),
	"updated_at" timestamp with time zone DEFAULT now()
);
--> statement-breakpoint
ALTER TABLE "certificates" ADD CONSTRAINT "certificates_purchase_id_purchases_id_fk" FOREIGN KEY ("purchase_id") REFERENCES "public"."purchases"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "certificates" ADD CONSTRAINT "certificates_beneficiario_id_beneficiarios_id_fk" FOREIGN KEY ("beneficiario_id") REFERENCES "public"."beneficiarios"("id") ON DELETE no action ON UPDATE no action;
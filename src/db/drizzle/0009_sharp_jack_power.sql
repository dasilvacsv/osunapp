CREATE TYPE "public"."client_payment_status" AS ENUM('PAID', 'PARTIAL', 'PENDING', 'OVERDUE');--> statement-breakpoint
CREATE TYPE "public"."payment_transaction_method" AS ENUM('CASH', 'TRANSFER', 'CARD', 'OTHER');--> statement-breakpoint
CREATE TABLE "client_payments" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"client_id" uuid NOT NULL,
	"amount" numeric(10, 2) NOT NULL,
	"date" timestamp with time zone NOT NULL,
	"description" text,
	"status" "client_payment_status" DEFAULT 'PENDING',
	"created_at" timestamp with time zone DEFAULT now(),
	"updated_at" timestamp with time zone DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "payment_transactions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"payment_id" uuid NOT NULL,
	"amount" numeric(10, 2) NOT NULL,
	"date" timestamp with time zone NOT NULL,
	"method" "payment_transaction_method" NOT NULL,
	"reference" varchar(255),
	"notes" text,
	"created_at" timestamp with time zone DEFAULT now(),
	"updated_at" timestamp with time zone DEFAULT now()
);
--> statement-breakpoint
ALTER TABLE "clients" ADD COLUMN "deudor" boolean DEFAULT false;--> statement-breakpoint
ALTER TABLE "client_payments" ADD CONSTRAINT "client_payments_client_id_clients_id_fk" FOREIGN KEY ("client_id") REFERENCES "public"."clients"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "payment_transactions" ADD CONSTRAINT "payment_transactions_payment_id_client_payments_id_fk" FOREIGN KEY ("payment_id") REFERENCES "public"."client_payments"("id") ON DELETE no action ON UPDATE no action;
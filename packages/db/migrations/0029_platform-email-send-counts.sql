CREATE TABLE "platform_email_send_counts" (
	"day" date NOT NULL,
	"email_type" text NOT NULL,
	"count" integer DEFAULT 0 NOT NULL,
	CONSTRAINT "platform_email_send_counts_day_email_type_pk" PRIMARY KEY("day","email_type")
);

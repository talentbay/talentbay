CREATE TABLE "bot_entry_receipts" (
	"bot_id" text NOT NULL,
	"update_id" bigint NOT NULL,
	"prepared_at" timestamp (3) with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "bot_entry_receipts_bot_id_update_id_pk" PRIMARY KEY("bot_id","update_id"),
	CONSTRAINT "bot_entry_receipts_bot_bounds" CHECK ("bot_entry_receipts"."bot_id" ~ '^[1-9][0-9]{0,15}$'),
	CONSTRAINT "bot_entry_receipts_update_bounds" CHECK ("bot_entry_receipts"."update_id" between 0 and 9007199254740991)
);

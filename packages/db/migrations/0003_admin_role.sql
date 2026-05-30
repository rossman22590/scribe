ALTER TABLE "user" ADD COLUMN IF NOT EXISTS "role" text DEFAULT 'user' NOT NULL;
--> statement-breakpoint
UPDATE "user"
SET "role" = 'admin',
    "updated_at" = now()
WHERE lower("email") = 'rcohen@mytsi.org';

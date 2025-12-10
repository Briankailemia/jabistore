-- Add accent color to categories
ALTER TABLE "public"."categories" ADD COLUMN IF NOT EXISTS "accentColor" TEXT;

-- Add primary category context to brands
ALTER TABLE "public"."brands" ADD COLUMN IF NOT EXISTS "primaryCategory" TEXT;

-- NextAuth account support
CREATE TABLE IF NOT EXISTS "public"."accounts" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "provider" TEXT NOT NULL,
    "providerAccountId" TEXT NOT NULL,
    "refresh_token" TEXT,
    "access_token" TEXT,
    "expires_at" INTEGER,
    "token_type" TEXT,
    "scope" TEXT,
    "id_token" TEXT,
    "session_state" TEXT,
    "oauth_token_secret" TEXT,
    "oauth_token" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "accounts_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "accounts_provider_providerAccountId_key"
    ON "public"."accounts"("provider", "providerAccountId");

CREATE INDEX IF NOT EXISTS "accounts_userId_idx"
    ON "public"."accounts"("userId");

ALTER TABLE "public"."accounts"
    ADD CONSTRAINT "accounts_userId_fkey"
    FOREIGN KEY ("userId") REFERENCES "public"."users"("id")
    ON DELETE CASCADE ON UPDATE CASCADE;

-- Verification tokens for passwordless / magic links
CREATE TABLE IF NOT EXISTS "public"."verification_tokens" (
    "identifier" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "expires" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "verification_tokens_pkey" PRIMARY KEY ("identifier", "token")
);

CREATE UNIQUE INDEX IF NOT EXISTS "verification_tokens_identifier_token_key"
    ON "public"."verification_tokens"("identifier", "token");

ALTER TABLE "public"."orders"
    ADD COLUMN IF NOT EXISTS "trackingNumber" TEXT,
    ADD COLUMN IF NOT EXISTS "carrier" TEXT,
    ADD COLUMN IF NOT EXISTS "deliveredAt" TIMESTAMP(3),
    ADD COLUMN IF NOT EXISTS "paymentReference" TEXT,
    ADD COLUMN IF NOT EXISTS "stripePaymentIntentId" TEXT,
    ADD COLUMN IF NOT EXISTS "mpesaReceiptNumber" TEXT;

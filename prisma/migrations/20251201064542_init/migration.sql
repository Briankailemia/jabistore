/*
  Warnings:

  - The primary key for the `verification_tokens` table will be changed. If it partially fails, the table could be left without primary key constraint.

*/
-- CreateEnum
CREATE TYPE "public"."CouponType" AS ENUM ('PERCENTAGE', 'FIXED_AMOUNT', 'FREE_SHIPPING');

-- CreateEnum
CREATE TYPE "public"."CouponStatus" AS ENUM ('ACTIVE', 'INACTIVE', 'EXPIRED');

-- DropForeignKey
ALTER TABLE "public"."products" DROP CONSTRAINT "products_brandId_fkey";

-- DropForeignKey
ALTER TABLE "public"."products" DROP CONSTRAINT "products_categoryId_fkey";

-- AlterTable
ALTER TABLE "public"."accounts" ALTER COLUMN "updatedAt" DROP DEFAULT;

-- AlterTable
ALTER TABLE "public"."orders" ADD COLUMN     "couponId" TEXT,
ADD COLUMN     "discount" DOUBLE PRECISION NOT NULL DEFAULT 0;

-- AlterTable
ALTER TABLE "public"."verification_tokens" DROP CONSTRAINT "verification_tokens_pkey";

-- CreateTable
CREATE TABLE "public"."coupons" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "type" "public"."CouponType" NOT NULL,
    "value" DOUBLE PRECISION NOT NULL,
    "minOrderAmount" DOUBLE PRECISION,
    "maxDiscount" DOUBLE PRECISION,
    "usageLimit" INTEGER,
    "usageCount" INTEGER NOT NULL DEFAULT 0,
    "userUsageLimit" INTEGER,
    "status" "public"."CouponStatus" NOT NULL DEFAULT 'ACTIVE',
    "validFrom" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "validUntil" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "coupons_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."user_coupons" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "couponId" TEXT NOT NULL,
    "usageCount" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "user_coupons_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."newsletter_subscriptions" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "name" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "subscribedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "unsubscribedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "newsletter_subscriptions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."stock_alerts" (
    "id" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "threshold" INTEGER NOT NULL DEFAULT 5,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "notified" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "stock_alerts_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "coupons_code_key" ON "public"."coupons"("code");

-- CreateIndex
CREATE INDEX "coupons_code_idx" ON "public"."coupons"("code");

-- CreateIndex
CREATE INDEX "coupons_status_idx" ON "public"."coupons"("status");

-- CreateIndex
CREATE INDEX "user_coupons_userId_idx" ON "public"."user_coupons"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "user_coupons_userId_couponId_key" ON "public"."user_coupons"("userId", "couponId");

-- CreateIndex
CREATE UNIQUE INDEX "newsletter_subscriptions_email_key" ON "public"."newsletter_subscriptions"("email");

-- CreateIndex
CREATE INDEX "newsletter_subscriptions_email_idx" ON "public"."newsletter_subscriptions"("email");

-- CreateIndex
CREATE INDEX "newsletter_subscriptions_isActive_idx" ON "public"."newsletter_subscriptions"("isActive");

-- CreateIndex
CREATE INDEX "stock_alerts_productId_idx" ON "public"."stock_alerts"("productId");

-- CreateIndex
CREATE INDEX "stock_alerts_userId_idx" ON "public"."stock_alerts"("userId");

-- CreateIndex
CREATE INDEX "stock_alerts_isActive_idx" ON "public"."stock_alerts"("isActive");

-- CreateIndex
CREATE UNIQUE INDEX "stock_alerts_productId_userId_key" ON "public"."stock_alerts"("productId", "userId");

-- AddForeignKey
ALTER TABLE "public"."products" ADD CONSTRAINT "products_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "public"."categories"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."products" ADD CONSTRAINT "products_brandId_fkey" FOREIGN KEY ("brandId") REFERENCES "public"."brands"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."orders" ADD CONSTRAINT "orders_couponId_fkey" FOREIGN KEY ("couponId") REFERENCES "public"."coupons"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."user_coupons" ADD CONSTRAINT "user_coupons_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."user_coupons" ADD CONSTRAINT "user_coupons_couponId_fkey" FOREIGN KEY ("couponId") REFERENCES "public"."coupons"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."stock_alerts" ADD CONSTRAINT "stock_alerts_productId_fkey" FOREIGN KEY ("productId") REFERENCES "public"."products"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."stock_alerts" ADD CONSTRAINT "stock_alerts_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

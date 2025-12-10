-- CreateEnum
CREATE TYPE "public"."ReservationStatus" AS ENUM ('PENDING', 'CONFIRMED', 'SEATED', 'COMPLETED', 'CANCELLED', 'NO_SHOW');

-- CreateTable
CREATE TABLE "public"."Table" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "capacity" INTEGER NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Table_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."Reservation" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "status" "public"."ReservationStatus" NOT NULL DEFAULT 'PENDING',
    "reservedFor" TIMESTAMP(3) NOT NULL,
    "durationMins" INTEGER NOT NULL DEFAULT 90,
    "tableId" TEXT,
    "userId" TEXT,
    "guestName" TEXT NOT NULL,
    "guestPhone" TEXT,
    "partySize" INTEGER NOT NULL,
    "notes" TEXT,
    "createdById" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Reservation_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Table_name_key" ON "public"."Table"("name");

-- CreateIndex
CREATE UNIQUE INDEX "Reservation_code_key" ON "public"."Reservation"("code");

-- CreateIndex
CREATE INDEX "Reservation_reservedFor_idx" ON "public"."Reservation"("reservedFor");

-- CreateIndex
CREATE INDEX "Reservation_status_idx" ON "public"."Reservation"("status");

-- AddForeignKey
ALTER TABLE "public"."Reservation" ADD CONSTRAINT "Reservation_tableId_fkey" FOREIGN KEY ("tableId") REFERENCES "public"."Table"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Reservation" ADD CONSTRAINT "Reservation_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Reservation" ADD CONSTRAINT "Reservation_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "public"."users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- CreateEnum
CREATE TYPE "AbsenceStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED');

-- AlterTable
ALTER TABLE "absences"
  ADD COLUMN "status" "AbsenceStatus" NOT NULL DEFAULT 'PENDING',
  ADD COLUMN "approvedBy" TEXT,
  ADD COLUMN "approvedAt" TIMESTAMP(3),
  ADD COLUMN "rejectionReason" TEXT;

-- CreateIndex
CREATE INDEX "absences_status_idx" ON "absences"("status");

-- AlterTable
ALTER TABLE "absences" ADD COLUMN IF NOT EXISTS "note" TEXT;

-- CreateIndex
CREATE INDEX IF NOT EXISTS "absences_employeeId_idx" ON "absences"("employeeId");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "absences_startDate_idx" ON "absences"("startDate");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "absences_endDate_idx" ON "absences"("endDate");

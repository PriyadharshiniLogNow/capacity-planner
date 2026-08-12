-- CreateIndex
CREATE INDEX IF NOT EXISTS "time_entries_employeeId_idx" ON "time_entries"("employeeId");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "time_entries_projectId_idx" ON "time_entries"("projectId");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "time_entries_projectId_entryDate_idx" ON "time_entries"("projectId", "entryDate");

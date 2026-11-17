-- Add reviewToken to Project
ALTER TABLE "Project" ADD COLUMN IF NOT EXISTS "reviewToken" TEXT;
CREATE UNIQUE INDEX IF NOT EXISTS "Project_reviewToken_key" ON "Project"("reviewToken");

CREATE TABLE IF NOT EXISTS "Storyboard" (
    "id"        TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "shots"     JSONB NOT NULL DEFAULT '[]',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Storyboard_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "Storyboard_projectId_key" ON "Storyboard"("projectId");

ALTER TABLE "Storyboard"
    ADD CONSTRAINT "Storyboard_projectId_fkey"
    FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE CASCADE ON UPDATE CASCADE;

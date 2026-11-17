CREATE TABLE IF NOT EXISTS "Timeline" (
    "id"         TEXT NOT NULL,
    "projectId"  TEXT NOT NULL,
    "shotOrder"  JSONB NOT NULL DEFAULT '[]',
    "voiceTrack" JSONB NOT NULL DEFAULT '[]',
    "musicTrack" JSONB NOT NULL DEFAULT '[]',
    "lockedAt"   TIMESTAMP(3),
    "createdAt"  TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt"  TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Timeline_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "Timeline_projectId_key" ON "Timeline"("projectId");

ALTER TABLE "Timeline"
    ADD CONSTRAINT "Timeline_projectId_fkey"
    FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE CASCADE ON UPDATE CASCADE;

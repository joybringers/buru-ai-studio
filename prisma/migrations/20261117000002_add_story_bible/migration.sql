CREATE TABLE IF NOT EXISTS "StoryBible" (
    "id"         TEXT NOT NULL,
    "projectId"  TEXT NOT NULL,
    "characters" JSONB NOT NULL DEFAULT '[]',
    "locations"  JSONB NOT NULL DEFAULT '[]',
    "props"      JSONB NOT NULL DEFAULT '[]',
    "styleNotes" TEXT NOT NULL DEFAULT '',
    "createdAt"  TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt"  TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "StoryBible_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "StoryBible_projectId_key" ON "StoryBible"("projectId");

ALTER TABLE "StoryBible"
    ADD CONSTRAINT "StoryBible_projectId_fkey"
    FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE CASCADE ON UPDATE CASCADE;

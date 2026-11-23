-- Director Mode tables

CREATE TABLE IF NOT EXISTS "DirectorProject" (
  "id"        TEXT NOT NULL PRIMARY KEY,
  "userId"    TEXT NOT NULL,
  "title"     TEXT NOT NULL,
  "concept"   TEXT NOT NULL,
  "status"    TEXT NOT NULL DEFAULT 'draft',
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "DirectorProject_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE TABLE IF NOT EXISTS "DirectorScene" (
  "id"          TEXT NOT NULL PRIMARY KEY,
  "projectId"   TEXT NOT NULL,
  "order"       INTEGER NOT NULL,
  "title"       TEXT NOT NULL,
  "description" TEXT NOT NULL,
  "videoPrompt" TEXT NOT NULL,
  "duration"    TEXT NOT NULL DEFAULT '5',
  "mood"        TEXT NOT NULL DEFAULT '',
  "status"      TEXT NOT NULL DEFAULT 'idle',
  "videoUrl"    TEXT,
  "jobId"       TEXT,
  "createdAt"   TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt"   TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "DirectorScene_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "DirectorProject"("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE INDEX IF NOT EXISTS "DirectorProject_userId_idx" ON "DirectorProject"("userId");
CREATE INDEX IF NOT EXISTS "DirectorScene_projectId_idx" ON "DirectorScene"("projectId");

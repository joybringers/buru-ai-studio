-- Script table
CREATE TABLE IF NOT EXISTS "Script" (
    "id"        TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "scenes"    JSONB NOT NULL DEFAULT '[]',
    "version"   INTEGER NOT NULL DEFAULT 1,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Script_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "Script_projectId_key" ON "Script"("projectId");

ALTER TABLE "Script"
    ADD CONSTRAINT "Script_projectId_fkey"
    FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- ScriptMessage table
CREATE TABLE IF NOT EXISTS "ScriptMessage" (
    "id"        TEXT NOT NULL,
    "scriptId"  TEXT NOT NULL,
    "role"      TEXT NOT NULL,
    "content"   TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "ScriptMessage_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "ScriptMessage_scriptId_idx" ON "ScriptMessage"("scriptId");

ALTER TABLE "ScriptMessage"
    ADD CONSTRAINT "ScriptMessage_scriptId_fkey"
    FOREIGN KEY ("scriptId") REFERENCES "Script"("id") ON DELETE CASCADE ON UPDATE CASCADE;

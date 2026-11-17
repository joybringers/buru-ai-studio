-- Add projectId to existing tables
ALTER TABLE "CreditLedgerEntry" ADD COLUMN IF NOT EXISTS "projectId" TEXT;
ALTER TABLE "Job" ADD COLUMN IF NOT EXISTS "projectId" TEXT;

-- Create Project table
CREATE TABLE IF NOT EXISTS "Project" (
    "id"           TEXT NOT NULL,
    "userId"       TEXT NOT NULL,
    "title"        TEXT NOT NULL,
    "status"       TEXT NOT NULL DEFAULT 'draft',
    "targetLength" INTEGER NOT NULL DEFAULT 180,
    "createdAt"    TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt"    TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Project_pkey" PRIMARY KEY ("id")
);

-- Create FilmQuote table
CREATE TABLE IF NOT EXISTS "FilmQuote" (
    "id"           TEXT NOT NULL,
    "projectId"    TEXT NOT NULL,
    "totalCredits" INTEGER NOT NULL,
    "hardCap"      INTEGER NOT NULL,
    "spentCredits" INTEGER NOT NULL DEFAULT 0,
    "lockedUntil"  TIMESTAMP(3),
    "acceptedAt"   TIMESTAMP(3),
    "createdAt"    TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "FilmQuote_pkey" PRIMARY KEY ("id")
);

-- Create QuoteLineItem table
CREATE TABLE IF NOT EXISTS "QuoteLineItem" (
    "id"          TEXT NOT NULL,
    "quoteId"     TEXT NOT NULL,
    "stage"       TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "credits"     INTEGER NOT NULL,
    CONSTRAINT "QuoteLineItem_pkey" PRIMARY KEY ("id")
);

-- Unique constraints
CREATE UNIQUE INDEX IF NOT EXISTS "FilmQuote_projectId_key" ON "FilmQuote"("projectId");

-- Indexes for foreign keys
CREATE INDEX IF NOT EXISTS "Project_userId_idx" ON "Project"("userId");
CREATE INDEX IF NOT EXISTS "FilmQuote_projectId_idx" ON "FilmQuote"("projectId");
CREATE INDEX IF NOT EXISTS "QuoteLineItem_quoteId_idx" ON "QuoteLineItem"("quoteId");
CREATE INDEX IF NOT EXISTS "Job_projectId_idx" ON "Job"("projectId");
CREATE INDEX IF NOT EXISTS "CreditLedgerEntry_projectId_idx" ON "CreditLedgerEntry"("projectId");

-- Foreign key constraints
ALTER TABLE "Project"
    ADD CONSTRAINT "Project_userId_fkey"
    FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "FilmQuote"
    ADD CONSTRAINT "FilmQuote_projectId_fkey"
    FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "QuoteLineItem"
    ADD CONSTRAINT "QuoteLineItem_quoteId_fkey"
    FOREIGN KEY ("quoteId") REFERENCES "FilmQuote"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "Job"
    ADD CONSTRAINT "Job_projectId_fkey"
    FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "CreditLedgerEntry"
    ADD CONSTRAINT "CreditLedgerEntry_projectId_fkey"
    FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE SET NULL ON UPDATE CASCADE;

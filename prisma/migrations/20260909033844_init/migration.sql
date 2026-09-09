-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "role" TEXT NOT NULL DEFAULT 'MEMBER',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable
CREATE TABLE "StatusOption" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "color" TEXT NOT NULL DEFAULT '#64748b',
    "order" INTEGER NOT NULL DEFAULT 0,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable
CREATE TABLE "Project" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "description" TEXT NOT NULL DEFAULT '',
    "repoUrl" TEXT,
    "language" TEXT,
    "stack" TEXT NOT NULL DEFAULT '[]',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "statusId" TEXT NOT NULL,
    "ownerId" TEXT NOT NULL,
    "assigneeId" TEXT,
    CONSTRAINT "Project_statusId_fkey" FOREIGN KEY ("statusId") REFERENCES "StatusOption" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Project_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Project_assigneeId_fkey" FOREIGN KEY ("assigneeId") REFERENCES "User" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Task" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL DEFAULT '',
    "type" TEXT NOT NULL DEFAULT 'CAMBIO_PENDIENTE',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "projectId" TEXT NOT NULL,
    "assigneeId" TEXT,
    "sourceDocumentId" TEXT,
    CONSTRAINT "Task_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "Task_assigneeId_fkey" FOREIGN KEY ("assigneeId") REFERENCES "User" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "Task_sourceDocumentId_fkey" FOREIGN KEY ("sourceDocumentId") REFERENCES "Document" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Document" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "filename" TEXT NOT NULL,
    "fileType" TEXT NOT NULL,
    "docType" TEXT NOT NULL DEFAULT 'RESUMEN_PROYECTO',
    "rawText" TEXT NOT NULL DEFAULT '',
    "aiExtractedJson" TEXT,
    "tasksApplied" BOOLEAN NOT NULL DEFAULT false,
    "uploadedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "projectId" TEXT NOT NULL,
    CONSTRAINT "Document_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "HistoryEntry" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "field" TEXT NOT NULL,
    "oldValue" TEXT,
    "newValue" TEXT,
    "changedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "projectId" TEXT NOT NULL,
    "taskId" TEXT,
    "changedById" TEXT,
    CONSTRAINT "HistoryEntry_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "HistoryEntry_taskId_fkey" FOREIGN KEY ("taskId") REFERENCES "Task" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "HistoryEntry_changedById_fkey" FOREIGN KEY ("changedById") REFERENCES "User" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "StatusOption_name_key" ON "StatusOption"("name");

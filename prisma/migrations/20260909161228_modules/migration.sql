-- CreateTable
CREATE TABLE "Module" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "color" TEXT NOT NULL DEFAULT '#56684a',
    "order" INTEGER NOT NULL DEFAULT 0,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "projectId" TEXT NOT NULL,
    CONSTRAINT "Module_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Task" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL DEFAULT '',
    "type" TEXT NOT NULL DEFAULT 'CAMBIO_PENDIENTE',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "projectId" TEXT NOT NULL,
    "assigneeId" TEXT,
    "moduleId" TEXT,
    "sourceDocumentId" TEXT,
    CONSTRAINT "Task_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "Task_assigneeId_fkey" FOREIGN KEY ("assigneeId") REFERENCES "User" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "Task_moduleId_fkey" FOREIGN KEY ("moduleId") REFERENCES "Module" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "Task_sourceDocumentId_fkey" FOREIGN KEY ("sourceDocumentId") REFERENCES "Document" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_Task" ("assigneeId", "createdAt", "description", "id", "projectId", "sourceDocumentId", "title", "type", "updatedAt") SELECT "assigneeId", "createdAt", "description", "id", "projectId", "sourceDocumentId", "title", "type", "updatedAt" FROM "Task";
DROP TABLE "Task";
ALTER TABLE "new_Task" RENAME TO "Task";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;

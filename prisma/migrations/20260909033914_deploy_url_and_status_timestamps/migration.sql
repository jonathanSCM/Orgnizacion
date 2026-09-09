-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Project" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "description" TEXT NOT NULL DEFAULT '',
    "repoUrl" TEXT,
    "deployUrl" TEXT,
    "language" TEXT,
    "stack" TEXT NOT NULL DEFAULT '[]',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "statusId" TEXT NOT NULL,
    "statusChangedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "ownerId" TEXT NOT NULL,
    "assigneeId" TEXT,
    CONSTRAINT "Project_statusId_fkey" FOREIGN KEY ("statusId") REFERENCES "StatusOption" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Project_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Project_assigneeId_fkey" FOREIGN KEY ("assigneeId") REFERENCES "User" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_Project" ("assigneeId", "createdAt", "description", "id", "language", "name", "ownerId", "repoUrl", "stack", "statusId", "updatedAt") SELECT "assigneeId", "createdAt", "description", "id", "language", "name", "ownerId", "repoUrl", "stack", "statusId", "updatedAt" FROM "Project";
DROP TABLE "Project";
ALTER TABLE "new_Project" RENAME TO "Project";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;

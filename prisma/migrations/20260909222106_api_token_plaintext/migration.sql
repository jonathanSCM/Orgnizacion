/*
  Warnings:

  - You are about to drop the column `tokenHash` on the `ApiToken` table. All the data in the column will be lost.
  - You are about to drop the column `tokenLast4` on the `ApiToken` table. All the data in the column will be lost.
  - Added the required column `token` to the `ApiToken` table without a default value. This is not possible if the table is not empty.

*/
-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_ApiToken" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "token" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "lastUsedAt" DATETIME,
    "userId" TEXT NOT NULL,
    CONSTRAINT "ApiToken_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_ApiToken" ("createdAt", "id", "lastUsedAt", "userId") SELECT "createdAt", "id", "lastUsedAt", "userId" FROM "ApiToken";
DROP TABLE "ApiToken";
ALTER TABLE "new_ApiToken" RENAME TO "ApiToken";
CREATE UNIQUE INDEX "ApiToken_token_key" ON "ApiToken"("token");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;

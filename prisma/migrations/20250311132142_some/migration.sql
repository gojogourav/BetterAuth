/*
  Warnings:

  - Changed the type of `refreshTokenExpiry` on the `Session` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.
  - Changed the type of `accessTokenExpiry` on the `Session` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.

*/
-- AlterTable
ALTER TABLE "Session" DROP COLUMN "refreshTokenExpiry",
ADD COLUMN     "refreshTokenExpiry" TIMESTAMP(3) NOT NULL,
DROP COLUMN "accessTokenExpiry",
ADD COLUMN     "accessTokenExpiry" TIMESTAMP(3) NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "Session_refreshTokenExpiry_key" ON "Session"("refreshTokenExpiry");

-- CreateIndex
CREATE UNIQUE INDEX "Session_accessTokenExpiry_key" ON "Session"("accessTokenExpiry");

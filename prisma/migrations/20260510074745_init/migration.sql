/*
  Warnings:

  - A unique constraint covering the columns `[inviteCode]` on the table `Document` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "Document" ADD COLUMN     "inviteCode" TEXT,
ADD COLUMN     "isCollaborative" BOOLEAN NOT NULL DEFAULT false;

-- CreateIndex
CREATE UNIQUE INDEX "Document_inviteCode_key" ON "Document"("inviteCode");

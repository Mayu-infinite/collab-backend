/*
  Warnings:

  - Changed the type of `role` on the `DocumentMember` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.
  - Added the required column `name` to the `User` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "DocumentMember" DROP COLUMN "role",
ADD COLUMN     "role" "Role" NOT NULL;

-- AlterTable
ALTER TABLE "User"
ADD COLUMN "name" TEXT NOT NULL DEFAULT 'User';
-- DropDefault
ALTER TABLE "User"
ALTER COLUMN "name" DROP DEFAULT;


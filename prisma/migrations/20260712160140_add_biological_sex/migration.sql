-- CreateEnum
CREATE TYPE "BiologicalSex" AS ENUM ('MALE', 'FEMALE', 'UNSPECIFIED');

-- AlterTable
ALTER TABLE "UserProfile" ADD COLUMN     "biologicalSex" "BiologicalSex" NOT NULL DEFAULT 'UNSPECIFIED';

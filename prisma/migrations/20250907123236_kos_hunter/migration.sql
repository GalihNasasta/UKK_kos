/*
  Warnings:

  - You are about to drop the column `description` on the `kos` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE `kos` DROP COLUMN `description`,
    ADD COLUMN `desc` TEXT NOT NULL DEFAULT '';

-- AlterTable
ALTER TABLE `kos_facilities` MODIFY `facility` VARCHAR(191) NOT NULL DEFAULT '';

-- AlterTable
ALTER TABLE `kos_img` MODIFY `file` VARCHAR(191) NOT NULL DEFAULT '';

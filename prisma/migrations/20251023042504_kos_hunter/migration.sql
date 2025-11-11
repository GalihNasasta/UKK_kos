/*
  Warnings:

  - You are about to drop the column `status` on the `books` table. All the data in the column will be lost.
  - Added the required column `Status` to the `books` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE `books` DROP COLUMN `status`,
    ADD COLUMN `Status` ENUM('PENDING', 'ACCEPT', 'REJECT') NOT NULL;

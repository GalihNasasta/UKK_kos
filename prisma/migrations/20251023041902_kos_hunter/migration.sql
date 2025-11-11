/*
  Warnings:

  - Added the required column `status` to the `books` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE `books` ADD COLUMN `status` ENUM('PENDING', 'ACCEPT', 'REJECT') NOT NULL;

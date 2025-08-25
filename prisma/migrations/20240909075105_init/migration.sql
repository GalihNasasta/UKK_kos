/*
  Warnings:

  - Added the required column `quantity` to the `OrderList` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE `orderlist` ADD COLUMN `note` TEXT NULL,
    ADD COLUMN `quantity` INTEGER NOT NULL;

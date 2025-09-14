/*
  Warnings:

  - You are about to drop the column `price_per_mont` on the `kos` table. All the data in the column will be lost.
  - Added the required column `price_per_month` to the `Kos` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE `kos` DROP COLUMN `price_per_mont`,
    ADD COLUMN `price_per_month` INTEGER NOT NULL;

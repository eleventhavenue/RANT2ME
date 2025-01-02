/*
  Warnings:

  - A unique constraint covering the columns `[lastActiveConversationId]` on the table `User` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "User" ADD COLUMN     "lastActiveConversationId" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "User_lastActiveConversationId_key" ON "User"("lastActiveConversationId");

-- AddForeignKey
ALTER TABLE "User" ADD CONSTRAINT "User_lastActiveConversationId_fkey" FOREIGN KEY ("lastActiveConversationId") REFERENCES "Conversation"("id") ON DELETE SET NULL ON UPDATE CASCADE;

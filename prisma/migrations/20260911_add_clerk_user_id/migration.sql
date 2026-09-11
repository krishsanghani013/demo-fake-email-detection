-- AlterTable
ALTER TABLE "users" ADD COLUMN "clerkUserId" TEXT NOT NULL;
ALTER TABLE "users" ADD COLUMN "firstName" TEXT;
ALTER TABLE "users" ADD COLUMN "lastName" TEXT;
ALTER TABLE "users" ADD COLUMN "imageUrl" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "users_clerkUserId_key" ON "users"("clerkUserId");

-- CreateIndex
CREATE INDEX "users_clerkUserId_idx" ON "users"("clerkUserId");

-- Sync schema changes missing from baseline migration.

-- Add optional group presentation fields.
ALTER TABLE "groups" ADD COLUMN "imageUrl" TEXT;
ALTER TABLE "groups" ADD COLUMN "themeColor" TEXT;

-- Replace groupItineraryId with groupId on comments.
ALTER TABLE "comments" DROP CONSTRAINT IF EXISTS "comments_groupItineraryId_fkey";
DROP INDEX IF EXISTS "comments_groupItineraryId_idx";
ALTER TABLE "comments" DROP COLUMN "groupItineraryId";
ALTER TABLE "comments" ADD COLUMN "groupId" UUID;
ALTER TABLE "comments" ALTER COLUMN "groupId" SET NOT NULL;
CREATE INDEX "comments_groupId_idx" ON "comments"("groupId");
ALTER TABLE "comments" ADD CONSTRAINT "comments_groupId_fkey" FOREIGN KEY ("groupId") REFERENCES "groups"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Remove unused vote fields and update unique constraint.
ALTER TABLE "votes" DROP CONSTRAINT IF EXISTS "votes_activityId_fkey";
DROP INDEX IF EXISTS "votes_activityId_idx";
DROP INDEX IF EXISTS "votes_groupItineraryId_userId_activityId_key";
ALTER TABLE "votes" DROP COLUMN "activityId";
ALTER TABLE "votes" DROP COLUMN "rating";
CREATE UNIQUE INDEX "votes_groupItineraryId_userId_key" ON "votes"("groupItineraryId", "userId");

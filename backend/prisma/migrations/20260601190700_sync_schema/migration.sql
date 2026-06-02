-- 1. Alter "itineraries" table - add optional "name" column
ALTER TABLE "itineraries" ADD COLUMN "name" TEXT;

-- 2. Alter "groups" table - add "imageUrl" and "themeColor" columns
ALTER TABLE "groups" ADD COLUMN "imageUrl" TEXT;
ALTER TABLE "groups" ADD COLUMN "themeColor" TEXT;

-- 3. Alter "comments" table - replace "groupItineraryId" with "groupId"
ALTER TABLE "comments" DROP CONSTRAINT IF EXISTS "comments_groupItineraryId_fkey";
DROP INDEX IF EXISTS "comments_groupItineraryId_idx";

ALTER TABLE "comments" ADD COLUMN "groupId" UUID NOT NULL;
ALTER TABLE "comments" DROP COLUMN IF EXISTS "groupItineraryId";

CREATE INDEX "comments_groupId_idx" ON "comments"("groupId");
ALTER TABLE "comments" ADD CONSTRAINT "comments_groupId_fkey" FOREIGN KEY ("groupId") REFERENCES "groups"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- 4. Alter "votes" table - remove "activityId" and "rating", and update constraints for unique pair
ALTER TABLE "votes" DROP CONSTRAINT IF EXISTS "votes_activityId_fkey";
DROP INDEX IF EXISTS "votes_activityId_idx";
DROP INDEX IF EXISTS "votes_groupItineraryId_userId_activityId_key";

ALTER TABLE "votes" DROP COLUMN IF EXISTS "activityId";
ALTER TABLE "votes" DROP COLUMN IF EXISTS "rating";

CREATE UNIQUE INDEX "votes_groupItineraryId_userId_key" ON "votes"("groupItineraryId", "userId");

-- 5. Create "comment_reactions" table
CREATE TABLE "comment_reactions" (
    "id" UUID NOT NULL,
    "commentId" UUID NOT NULL,
    "userId" UUID NOT NULL,
    "emoji" VARCHAR(10) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "comment_reactions_pkey" PRIMARY KEY ("id")
);

-- Create indices and constraints for comment_reactions
CREATE UNIQUE INDEX "comment_reactions_commentId_userId_emoji_key" ON "comment_reactions"("commentId", "userId", "emoji");
CREATE INDEX "comment_reactions_commentId_idx" ON "comment_reactions"("commentId");

ALTER TABLE "comment_reactions" ADD CONSTRAINT "comment_reactions_commentId_fkey" FOREIGN KEY ("commentId") REFERENCES "comments"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "comment_reactions" ADD CONSTRAINT "comment_reactions_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

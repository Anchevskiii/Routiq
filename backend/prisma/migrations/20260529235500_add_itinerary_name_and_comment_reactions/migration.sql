-- Add optional itinerary name.
ALTER TABLE "itineraries" ADD COLUMN IF NOT EXISTS "name" TEXT;

-- Add comment reactions table.
CREATE TABLE IF NOT EXISTS "comment_reactions" (
    "id" UUID NOT NULL,
    "commentId" UUID NOT NULL,
    "userId" UUID NOT NULL,
    "emoji" VARCHAR(10) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "comment_reactions_pkey" PRIMARY KEY ("id")
);

-- Indexes for comment reactions.
DROP INDEX IF EXISTS "comment_reactions_commentId_userId_emoji_key";
CREATE UNIQUE INDEX "comment_reactions_commentId_userId_emoji_key" ON "comment_reactions"("commentId", "userId", "emoji");

DROP INDEX IF EXISTS "comment_reactions_commentId_idx";
CREATE INDEX "comment_reactions_commentId_idx" ON "comment_reactions"("commentId");

-- Foreign keys.
ALTER TABLE "comment_reactions" DROP CONSTRAINT IF EXISTS "comment_reactions_commentId_fkey";
ALTER TABLE "comment_reactions" ADD CONSTRAINT "comment_reactions_commentId_fkey" FOREIGN KEY ("commentId") REFERENCES "comments"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "comment_reactions" DROP CONSTRAINT IF EXISTS "comment_reactions_userId_fkey";
ALTER TABLE "comment_reactions" ADD CONSTRAINT "comment_reactions_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

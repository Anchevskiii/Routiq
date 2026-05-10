-- CreateEnum
CREATE TYPE "InvitationStatus" AS ENUM ('PENDING', 'ACCEPTED', 'DECLINED', 'EXPIRED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "VoteType" AS ENUM ('UPVOTE', 'DOWNVOTE');

-- CreateEnum
CREATE TYPE "ActivityType" AS ENUM ('ATTRACTION', 'MEAL', 'TRANSPORT', 'FREE_TIME', 'ACCOMMODATION');

-- CreateEnum
CREATE TYPE "ExportFormat" AS ENUM ('ICS', 'PDF');

-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "GroupRole" ADD VALUE 'OWNER';
ALTER TYPE "GroupRole" ADD VALUE 'MODERATOR';

-- AlterEnum
ALTER TYPE "TravelType" ADD VALUE 'RELAX';

-- DropIndex
DROP INDEX "votes_groupItineraryId_userId_attractionId_key";

-- AlterTable
ALTER TABLE "comments" ADD COLUMN     "parentId" UUID;

-- AlterTable
ALTER TABLE "group_itineraries" ADD COLUMN     "addedById" UUID NOT NULL;

-- AlterTable
ALTER TABLE "group_members" ADD COLUMN     "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "invitedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "invitedById" UUID,
ADD COLUMN     "respondedAt" TIMESTAMP(3),
ADD COLUMN     "status" "InvitationStatus" NOT NULL DEFAULT 'PENDING',
ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL,
ALTER COLUMN "joinedAt" DROP NOT NULL,
ALTER COLUMN "joinedAt" DROP DEFAULT;

-- AlterTable
ALTER TABLE "groups" ADD COLUMN     "createdById" UUID NOT NULL;

-- AlterTable
ALTER TABLE "itineraries" DROP COLUMN "days",
DROP COLUMN "weatherData",
ADD COLUMN     "aiModel" TEXT,
ADD COLUMN     "aiPromptHash" TEXT,
ADD COLUMN     "bestSeason" TEXT,
ADD COLUMN     "estimatedBudget" TEXT,
ADD COLUMN     "generatedAt" TIMESTAMP(3),
ADD COLUMN     "generationTimeMs" INTEGER,
ADD COLUMN     "isPublic" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "totalDays" INTEGER NOT NULL,
ALTER COLUMN "startDate" SET DATA TYPE DATE,
ALTER COLUMN "endDate" SET DATA TYPE DATE;

-- AlterTable
ALTER TABLE "users" ADD COLUMN     "lastLoginAt" TIMESTAMP(3),
ADD COLUMN     "metadata" JSONB DEFAULT '{}';

-- AlterTable
ALTER TABLE "votes" DROP COLUMN "attractionId",
ADD COLUMN     "activityId" UUID,
ADD COLUMN     "rating" INTEGER,
ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL,
ADD COLUMN     "voteType" "VoteType" NOT NULL DEFAULT 'UPVOTE';

-- CreateTable
CREATE TABLE "itinerary_days" (
    "id" UUID NOT NULL,
    "itineraryId" UUID NOT NULL,
    "dayNumber" INTEGER NOT NULL,
    "date" DATE NOT NULL,
    "theme" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "itinerary_days_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "itinerary_activities" (
    "id" UUID NOT NULL,
    "dayId" UUID NOT NULL,
    "activityType" "ActivityType" NOT NULL DEFAULT 'ATTRACTION',
    "sortOrder" INTEGER NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "location" TEXT,
    "address" TEXT,
    "startTime" TEXT,
    "durationMinutes" INTEGER,
    "cost" TEXT,
    "tips" TEXT,
    "latitude" DOUBLE PRECISION,
    "longitude" DOUBLE PRECISION,
    "placeId" TEXT,
    "mealType" TEXT,
    "priceRange" TEXT,
    "transportMethod" TEXT,
    "transportCost" TEXT,
    "transportNotes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "itinerary_activities_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "itinerary_weather_snapshots" (
    "id" UUID NOT NULL,
    "dayId" UUID NOT NULL,
    "condition" TEXT NOT NULL,
    "tempMin" DOUBLE PRECISION,
    "tempMax" DOUBLE PRECISION,
    "humidity" INTEGER,
    "windSpeed" DOUBLE PRECISION,
    "precipitation" DOUBLE PRECISION,
    "iconCode" TEXT,
    "recommendation" TEXT,
    "fetchedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "itinerary_weather_snapshots_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "itinerary_tips" (
    "id" UUID NOT NULL,
    "itineraryId" UUID NOT NULL,
    "sortOrder" INTEGER NOT NULL,
    "content" TEXT NOT NULL,

    CONSTRAINT "itinerary_tips_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "activity_logs" (
    "id" UUID NOT NULL,
    "groupId" UUID NOT NULL,
    "userId" UUID NOT NULL,
    "action" TEXT NOT NULL,
    "details" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "activity_logs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "calendar_exports" (
    "id" UUID NOT NULL,
    "userId" UUID NOT NULL,
    "itineraryId" UUID NOT NULL,
    "format" "ExportFormat" NOT NULL,
    "exportedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "calendar_exports_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "itinerary_days_itineraryId_idx" ON "itinerary_days"("itineraryId");

-- CreateIndex
CREATE UNIQUE INDEX "itinerary_days_itineraryId_dayNumber_key" ON "itinerary_days"("itineraryId", "dayNumber");

-- CreateIndex
CREATE INDEX "itinerary_activities_dayId_idx" ON "itinerary_activities"("dayId");

-- CreateIndex
CREATE INDEX "itinerary_activities_activityType_idx" ON "itinerary_activities"("activityType");

-- CreateIndex
CREATE INDEX "itinerary_activities_placeId_idx" ON "itinerary_activities"("placeId");

-- CreateIndex
CREATE UNIQUE INDEX "itinerary_weather_snapshots_dayId_key" ON "itinerary_weather_snapshots"("dayId");

-- CreateIndex
CREATE INDEX "itinerary_tips_itineraryId_idx" ON "itinerary_tips"("itineraryId");

-- CreateIndex
CREATE INDEX "activity_logs_groupId_idx" ON "activity_logs"("groupId");

-- CreateIndex
CREATE INDEX "activity_logs_userId_idx" ON "activity_logs"("userId");

-- CreateIndex
CREATE INDEX "activity_logs_createdAt_idx" ON "activity_logs"("createdAt");

-- CreateIndex
CREATE INDEX "calendar_exports_userId_idx" ON "calendar_exports"("userId");

-- CreateIndex
CREATE INDEX "calendar_exports_itineraryId_idx" ON "calendar_exports"("itineraryId");

-- CreateIndex
CREATE INDEX "comments_parentId_idx" ON "comments"("parentId");

-- CreateIndex
CREATE UNIQUE INDEX "group_itineraries_groupId_itineraryId_key" ON "group_itineraries"("groupId", "itineraryId");

-- CreateIndex
CREATE INDEX "group_members_status_idx" ON "group_members"("status");

-- CreateIndex
CREATE INDEX "groups_createdById_idx" ON "groups"("createdById");

-- CreateIndex
CREATE INDEX "itineraries_destination_idx" ON "itineraries"("destination");

-- CreateIndex
CREATE INDEX "itineraries_startDate_endDate_idx" ON "itineraries"("startDate", "endDate");

-- CreateIndex
CREATE INDEX "itineraries_createdAt_idx" ON "itineraries"("createdAt");

-- CreateIndex
CREATE INDEX "users_email_idx" ON "users"("email");

-- CreateIndex
CREATE INDEX "users_createdAt_idx" ON "users"("createdAt");

-- CreateIndex
CREATE INDEX "votes_activityId_idx" ON "votes"("activityId");

-- CreateIndex
CREATE UNIQUE INDEX "votes_groupItineraryId_userId_activityId_key" ON "votes"("groupItineraryId", "userId", "activityId");

-- AddForeignKey
ALTER TABLE "itinerary_days" ADD CONSTRAINT "itinerary_days_itineraryId_fkey" FOREIGN KEY ("itineraryId") REFERENCES "itineraries"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "itinerary_activities" ADD CONSTRAINT "itinerary_activities_dayId_fkey" FOREIGN KEY ("dayId") REFERENCES "itinerary_days"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "itinerary_weather_snapshots" ADD CONSTRAINT "itinerary_weather_snapshots_dayId_fkey" FOREIGN KEY ("dayId") REFERENCES "itinerary_days"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "itinerary_tips" ADD CONSTRAINT "itinerary_tips_itineraryId_fkey" FOREIGN KEY ("itineraryId") REFERENCES "itineraries"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "groups" ADD CONSTRAINT "groups_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "group_members" ADD CONSTRAINT "group_members_invitedById_fkey" FOREIGN KEY ("invitedById") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "comments" ADD CONSTRAINT "comments_parentId_fkey" FOREIGN KEY ("parentId") REFERENCES "comments"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "votes" ADD CONSTRAINT "votes_activityId_fkey" FOREIGN KEY ("activityId") REFERENCES "itinerary_activities"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "activity_logs" ADD CONSTRAINT "activity_logs_groupId_fkey" FOREIGN KEY ("groupId") REFERENCES "groups"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "activity_logs" ADD CONSTRAINT "activity_logs_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "calendar_exports" ADD CONSTRAINT "calendar_exports_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "calendar_exports" ADD CONSTRAINT "calendar_exports_itineraryId_fkey" FOREIGN KEY ("itineraryId") REFERENCES "itineraries"("id") ON DELETE CASCADE ON UPDATE CASCADE;

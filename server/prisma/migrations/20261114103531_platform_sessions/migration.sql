-- AlterTable
ALTER TABLE "sessions" ADD COLUMN     "platform_mode" BOOLEAN NOT NULL DEFAULT false,
ALTER COLUMN "membership_id" DROP NOT NULL,
ALTER COLUMN "org_id" DROP NOT NULL;

-- Every org-mode session belongs to a membership and an org; only Platform
-- Admin sessions may have neither.
ALTER TABLE "sessions" ADD CONSTRAINT "sessions_org_unless_platform"
  CHECK ("platform_mode" OR ("membership_id" IS NOT NULL AND "org_id" IS NOT NULL));

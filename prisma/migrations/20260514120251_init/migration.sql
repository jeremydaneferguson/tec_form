-- CreateTable
CREATE TABLE "TECSubmission" (
    "id" TEXT NOT NULL,
    "email" VARCHAR(255) NOT NULL,
    "formData" JSONB NOT NULL DEFAULT '{}',
    "status" TEXT NOT NULL DEFAULT 'draft',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TECSubmission_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "TECSubmission_email_idx" ON "TECSubmission"("email");

-- CreateIndex
CREATE INDEX "TECSubmission_status_idx" ON "TECSubmission"("status");

-- CreateIndex
CREATE INDEX "TECSubmission_createdAt_idx" ON "TECSubmission"("createdAt");

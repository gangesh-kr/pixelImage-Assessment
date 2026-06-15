-- CreateIndex
CREATE INDEX "Comment_issueId_idx" ON "Comment"("issueId");

-- CreateIndex
CREATE INDEX "Issue_status_idx" ON "Issue"("status");

-- CreateIndex
CREATE INDEX "Issue_createdBy_idx" ON "Issue"("createdBy");

-- CreateIndex
CREATE INDEX "Issue_websiteId_idx" ON "Issue"("websiteId");

-- CreateIndex
CREATE INDEX "Issue_severity_idx" ON "Issue"("severity");

-- CreateIndex
CREATE INDEX "Notification_userId_idx" ON "Notification"("userId");

-- CreateIndex
CREATE INDEX "Notification_userId_isRead_idx" ON "Notification"("userId", "isRead");

-- CreateIndex
CREATE INDEX "TimelineEvent_issueId_idx" ON "TimelineEvent"("issueId");

-- CreateIndex
CREATE INDEX "Website_clientId_idx" ON "Website"("clientId");

-- CreateIndex
CREATE INDEX "Website_status_idx" ON "Website"("status");

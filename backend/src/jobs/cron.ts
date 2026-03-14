// backend/src/jobs/cron.ts
// In a real app, you'd use node-cron or similar.
import { runInventoryHealthJob } from './inventoryHealthJob.js';
import { runSoftLockCleanupJob } from './softLockCleanupJob.js';
import { runLeadScoreRecalculationJob } from './leadScoreRecalculationJob.js';
import { runFollowUpReminderJob } from './followUpReminderJob.js';

export const startCronJobs = () => {
  console.log('Starting cron jobs...');
  
  // Job 1: Delete expired soft locks
  setInterval(() => {
    runSoftLockCleanupJob();
  }, 1000 * 60 * 5); // Every 5 minutes

  // Job 2: Recalculate lead scores
  setInterval(() => {
    runLeadScoreRecalculationJob();
  }, 1000 * 60 * 60); // Every hour

  // Job 3: Send follow-up reminders
  setInterval(() => {
    runFollowUpReminderJob();
  }, 1000 * 60 * 60 * 24); // Daily

  // Job 4: Inventory Health
  setInterval(() => {
    runInventoryHealthJob();
  }, 1000 * 60 * 60 * 24 * 7); // Weekly
};

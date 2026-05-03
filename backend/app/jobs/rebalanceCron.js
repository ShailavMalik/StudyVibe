import cron from "node-cron";
import User from "../models/User.js";
import { rebalanceNextDaySchedule } from "../services/adaptiveScheduler.js";

/**
 * Optional cron job to rebalance all users' next-day schedules nightly.
 * Enable by setting ENABLE_CRON=true in environment.
 */
export default function startRebalanceCron() {
  if (process.env.ENABLE_CRON !== "true") {
    console.log("Rebalance cron disabled (ENABLE_CRON!=true)");
    return;
  }

  // Run every day at 23:59 server time
  cron.schedule("59 23 * * *", async () => {
    try {
      console.log("[cron] Starting nightly rebalance for all users...");
      const users = await User.find({ isActive: { $ne: false } }).select("_id");
      for (const u of users) {
        try {
          await rebalanceNextDaySchedule(u._id);
        } catch (e) {
          console.error(
            `[cron] Rebalance failed for user ${u._id}:`,
            e.message,
          );
        }
      }
      console.log("[cron] Nightly rebalance complete.");
    } catch (err) {
      console.error("[cron] Nightly rebalance error:", err);
    }
  });
}

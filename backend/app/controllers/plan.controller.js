import {
  generateAdaptivePlan,
  rebalanceNextDaySchedule,
} from "../services/adaptiveScheduler.js";

export const createAdaptivePlan = async (req, res) => {
  try {
    const userId = req.userId || req.body.userId;
    const { totalAvailableHours } = req.body;
    if (!userId) return res.status(400).json({ error: "Missing userId" });

    const plan = await generateAdaptivePlan(userId, totalAvailableHours || 4);
    res.json({ plan });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
};

export const rebalance = async (req, res) => {
  try {
    const userId = req.userId || req.body.userId;
    if (!userId) return res.status(400).json({ error: "Missing userId" });

    const plan = await rebalanceNextDaySchedule(userId);
    res.json({ plan });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
};

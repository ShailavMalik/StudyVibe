import dayjs from "dayjs";

/**
 * Middleware to ensure session.date is for today (no marking future sessions complete)
 */
export default function validateSessionDate(req, res, next) {
  try {
    const { date } = req.body;
    if (!date) return res.status(400).json({ error: "Missing session date" });

    const sessionDate = dayjs(date).startOf("day");
    const today = dayjs().startOf("day");

    if (!sessionDate.isSame(today)) {
      return res
        .status(400)
        .json({ error: "Can only modify sessions for today" });
    }

    next();
  } catch (err) {
    next(err);
  }
}

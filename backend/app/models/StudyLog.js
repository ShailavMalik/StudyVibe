/**
 * StudyLog Model
 * Records planned and completed study hours per subject per date.
 */

import mongoose from "mongoose";

const StudyLogSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    sessionKey: { type: String },
    subject: { type: String, required: true },
    date: { type: Date, required: true },
    plannedHours: { type: Number, default: 0 },
    completedHours: { type: Number, default: 0 },
    skipped: { type: Boolean, default: false },
  },
  { timestamps: true },
);

const StudyLog =
  mongoose.models.StudyLog ||
  mongoose.model("StudyLog", StudyLogSchema, "study_logs");

export default StudyLog;

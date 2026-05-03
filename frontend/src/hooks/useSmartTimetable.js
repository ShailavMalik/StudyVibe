import { useState } from "react";
import { api } from "../services/api";

const useSmartTimetable = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const generateSmartTimetable = async (
    subjects,
    availableHoursPerDay,
    customPrompt = "",
    modelType = "flash",
  ) => {
    try {
      setLoading(true);
      setError(null);

      // Defensive: ensure subjects is always an array
      const safeSubjects = Array.isArray(subjects) ? subjects : [];

      const payload = {
        subjects: safeSubjects.map((s) => ({
          name: s.subject,
          examDate: s.examDate,
        })),
        availableHoursPerDay: Number(availableHoursPerDay),
        customPrompt: customPrompt.trim(),
        modelType: modelType,
      };

      const resp = await api.post("/api/timetable/generate-smart", payload);
      const data = resp.data;
      console.log("Generated smart timetable:", data);

      return data;
    } catch (err) {
      console.error("Error generating smart timetable:", err);
      setError(err.message);
      return null;
    } finally {
      setLoading(false);
    }
  };

  return { loading, error, generateSmartTimetable };
};

export default useSmartTimetable;

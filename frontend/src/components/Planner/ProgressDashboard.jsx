/**
 * @fileoverview Progress Dashboard Component
 *
 * Core component for tracking daily study progress and maintaining study streaks.
 * Displays today's planned sessions, completion percentages, and study statistics.
 *
 * Features:
 * - Real-time session completion tracking
 * - Automatic streak calculation based on 70% daily threshold
 * - Persistent data with backend integration
 * - Visual progress bars and motivational messages
 * - Responsive design for all device sizes
 *
 * Key Metrics Displayed:
 * - Today's completion percentage
 * - Completed vs planned hours
 * - Current study streak count
 * - Number of sessions planned
 *
 * Integration:
 * - Backend API: GET /api/dashboard, POST /api/dashboard/log-session
 * - LocalStorage: JWT token for authentication
 * - Props: studyPlan object with daily sessions
 *
 * @component
 * @example
 * <ProgressDashboard studyPlan={generatedPlan} />
 */

import React, { useState, useEffect, useMemo } from "react";
import axios from "axios";

/**
 * ProgressDashboard - Track today's study sessions and log completions
 * Focuses on current day sessions only with backend persistence
 */
function ProgressDashboard({ studyPlan }) {
  const [todaySessions, setTodaySessions] = useState([]);
  const [sessionLogs, setSessionLogs] = useState({});
  const [stats, setStats] = useState({
    plannedHours: 0,
    completedHours: 0,
    completionRate: 0,
    studyStreak: 0,
  });
  const [loading, setLoading] = useState(false);
  const [dashboardData, setDashboardData] = useState(null);

  // Get today's date in DD-MMMM-YYYY format (matching AI output)
  const getTodayFormatted = () => {
    const today = new Date();
    const day = String(today.getDate()).padStart(2, "0");
    const months = [
      "January",
      "February",
      "March",
      "April",
      "May",
      "June",
      "July",
      "August",
      "September",
      "October",
      "November",
      "December",
    ];
    const month = months[today.getMonth()];
    const year = today.getFullYear();
    return `${day}-${month}-${year}`;
  };

  // Normalize studyPlan so every date maps to an array of sessions
  const normalizePlan = (plan) => {
    const normalized = {};
    if (!plan || typeof plan !== "object") return normalized;
    Object.entries(plan).forEach(([date, sessions]) => {
      if (Array.isArray(sessions)) {
        normalized[date] = sessions;
      } else if (sessions && typeof sessions === "object") {
        // If sessions is an object map like { subject: hours }
        if (Object.values(sessions).every((v) => typeof v === "number")) {
          normalized[date] = Object.entries(sessions).map(
            ([subject, hours]) => ({ subject, hours }),
          );
        } else {
          // Single session object
          normalized[date] = [sessions];
        }
      } else {
        normalized[date] = [];
      }
    });
    return normalized;
  };

  const safeStudyPlan = useMemo(
    () => normalizePlan(studyPlan || {}),
    [studyPlan],
  );

  /**
   * Fetch dashboard data including streak and today's completion
   */
  const fetchDashboardData = async () => {
    try {
      const token = localStorage.getItem("studyvibe_token");
      if (!token) return;

      const response = await axios.get("http://localhost:3001/api/dashboard", {
        headers: { Authorization: `Bearer ${token}` },
      });
      setDashboardData(response.data);
    } catch (error) {
      console.error("Error fetching dashboard data:", error);
    }
  };

  /**
   * Load today's sessions from study plan and fetch dashboard data from backend on mount
   */
  useEffect(() => {
    const todayKey = getTodayFormatted();
    const today = safeStudyPlan[todayKey] || [];
    setTodaySessions(today);

    // Fetch dashboard data from backend only once on mount
    fetchDashboardData();
  }, []);

  /**
   * Calculate statistics for today's sessions
   */
  useEffect(() => {
    if (!todaySessions || todaySessions.length === 0) return;

    let plannedTotal = 0;
    let completedTotal = 0;

    todaySessions.forEach((session) => {
      const hours = session.hours || session.time?.hours || 0;
      plannedTotal += hours;
      const sessionKey = `${session.subject}`;
      if (sessionLogs[sessionKey]) {
        completedTotal += sessionLogs[sessionKey];
      }
    });

    const completionRate =
      plannedTotal > 0 ? (completedTotal / plannedTotal) * 100 : 0;

    setStats({
      plannedHours: plannedTotal.toFixed(1),
      completedHours: completedTotal.toFixed(1),
      completionRate: Math.round(completionRate),
      studyStreak: dashboardData?.streak || 0,
    });
  }, [todaySessions, sessionLogs, dashboardData]);

  /**
   * Log a study session (mark as completed with hours studied)
   */
  const logStudySession = async (subject, plannedHours) => {
    try {
      setLoading(true);
      const token = localStorage.getItem("studyvibe_token");
      if (!token) {
        alert("Please login to log study sessions");
        return;
      }

      const currentValue = sessionLogs[subject] || 0;
      const newValue = currentValue + plannedHours;

      const response = await axios.post(
        "http://localhost:3001/api/dashboard/log-session",
        {
          subject,
          date: new Date(),
          completedHours: newValue,
          plannedHours: plannedHours,
        },
        { headers: { Authorization: `Bearer ${token}` } },
      );

      if (response.data) {
        setSessionLogs((prev) => ({
          ...prev,
          [subject]: newValue,
        }));
        // Refresh dashboard data
        await fetchDashboardData();
      }
    } catch (error) {
      console.error("Error logging session:", error);
      alert("Failed to log study session");
    } finally {
      setLoading(false);
    }
  };

  /**
   * Mark session as fully completed
   */
  const markSessionComplete = async (subject, plannedHours) => {
    await logStudySession(subject, plannedHours);
  };

  /**
   * Get completion percentage
   */
  const getCompletionPercentage = () => {
    return stats.completionRate;
  };

  if (!todaySessions || todaySessions.length === 0) {
    return (
      <div className="w-full max-w-4xl mx-auto mt-8 bg-gradient-to-br from-purple-100 via-white to-blue-100 rounded-2xl shadow-lg p-8">
        <h2 className="text-2xl font-bold mb-4 bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
          📊 Today's Study Dashboard
        </h2>
        <p className="text-gray-600 text-center py-8">
          No study sessions planned for today. Generate a study plan to get
          started!
        </p>
      </div>
    );
  }

  return (
    <div className="w-full max-w-5xl mx-auto mt-8 mb-8 px-4">
      {/* Header */}
      <div className="mb-8">
        <h2 className="text-4xl font-bold mb-2 bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent flex items-center gap-2">
          📊 Today's Study Dashboard
        </h2>
        <p className="text-gray-600">
          Track your daily progress and maintain your study streak
        </p>
      </div>

      {/* Summary Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        {/* Today's Progress Card */}
        <div className="bg-white rounded-2xl p-8 shadow-lg border border-purple-200 hover:shadow-xl transition-all">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-bold text-gray-800">
              Today's Progress
            </h3>
            <span className="text-3xl">📈</span>
          </div>
          <div className="text-5xl font-bold bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent mb-2">
            {getCompletionPercentage()}%
          </div>
          <p className="text-sm text-gray-600 mb-4">
            <span className="font-semibold text-purple-600">
              {stats.completedHours}
            </span>{" "}
            /{" "}
            <span className="font-semibold text-blue-600">
              {stats.plannedHours}
            </span>{" "}
            hours completed
          </p>
          {/* Progress Bar */}
          <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
            <div
              className="bg-gradient-to-r from-purple-600 to-blue-600 h-3 rounded-full transition-all duration-500"
              style={{ width: `${getCompletionPercentage()}%` }}></div>
          </div>
        </div>

        {/* Study Streak Card */}
        <div className="bg-white rounded-2xl p-8 shadow-lg border border-orange-200 hover:shadow-xl transition-all">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-bold text-gray-800">Study Streak</h3>
            <span className="text-3xl">🔥</span>
          </div>
          <div className="text-5xl font-bold text-orange-600 mb-2">
            {stats.studyStreak}
          </div>
          <p className="text-sm text-gray-600">
            {stats.studyStreak === 0 ?
              "🚀 Start your streak today!"
            : stats.studyStreak === 1 ?
              "💪 Keep it up!"
            : "🎯 Amazing consistency!"}
          </p>
        </div>

        {/* Sessions Count Card */}
        <div className="bg-white rounded-2xl p-8 shadow-lg border border-green-200 hover:shadow-xl transition-all">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-bold text-gray-800">Sessions Today</h3>
            <span className="text-3xl">📚</span>
          </div>
          <div className="text-5xl font-bold text-green-600 mb-2">
            {todaySessions.length}
          </div>
          <p className="text-sm text-gray-600">
            {todaySessions.length === 1 ?
              "1 subject to study"
            : `${todaySessions.length} subjects to study`}
          </p>
        </div>
      </div>

      {/* Study Sessions Section */}
      <div className="bg-white rounded-2xl p-8 shadow-lg border border-blue-200">
        <h3 className="text-2xl font-bold mb-6 text-gray-800 flex items-center gap-2">
          📚 Today's Study Sessions
        </h3>

        {todaySessions.length === 0 ?
          <p className="text-center text-gray-500 py-8">
            No sessions planned for today. Generate a study plan to get started!
          </p>
        : <div className="space-y-4">
            {todaySessions.map((session, idx) => {
              const completed = sessionLogs[session.subject] || 0;
              const planned = session.hours || 0;
              const isComplete = completed >= planned;
              const completionPercent =
                planned > 0 ? (completed / planned) * 100 : 0;

              return (
                <div
                  key={idx}
                  className="p-6 bg-gradient-to-r from-blue-50 to-purple-50 rounded-xl border border-blue-100 hover:shadow-lg transition-all group">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h4 className="text-xl font-bold text-gray-800">
                          {session.subject}
                        </h4>
                        {isComplete && (
                          <span className="inline-block px-3 py-1 bg-green-100 text-green-700 rounded-full text-sm font-semibold">
                            ✅ Completed
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-gray-600">
                        <span className="font-semibold text-blue-600">
                          {completed.toFixed(1)}
                        </span>{" "}
                        of{" "}
                        <span className="font-semibold text-blue-600">
                          {planned.toFixed(1)}
                        </span>{" "}
                        hours completed
                      </p>
                    </div>
                    <button
                      onClick={() =>
                        markSessionComplete(session.subject, planned)
                      }
                      disabled={loading || isComplete}
                      className={`px-6 py-3 rounded-lg font-semibold whitespace-nowrap transition-all transform ${
                        isComplete ?
                          "bg-green-100 text-green-700 cursor-not-allowed"
                        : "bg-gradient-to-r from-blue-500 to-purple-600 text-white hover:shadow-xl hover:scale-105 active:scale-95"
                      }`}>
                      {isComplete ?
                        "✅ Done"
                      : loading ?
                        "⏳ Saving..."
                      : "Mark Done"}
                    </button>
                  </div>

                  {/* Progress Bar */}
                  <div className="w-full bg-gray-300 rounded-full h-3 overflow-hidden">
                    <div
                      className="bg-gradient-to-r from-green-400 to-green-600 h-3 rounded-full transition-all duration-500"
                      style={{ width: `${completionPercent}%` }}></div>
                  </div>
                  <p className="text-xs text-gray-500 mt-2">
                    {completionPercent.toFixed(0)}% complete
                  </p>
                </div>
              );
            })}
          </div>
        }
      </div>

      {/* Motivational Message */}
      <div className="mt-8 p-6 bg-gradient-to-r from-yellow-100 to-orange-100 rounded-xl border border-yellow-200">
        <p className="text-center text-sm font-semibold text-gray-800">
          {getCompletionPercentage() === 100 ?
            "🎉 Outstanding! You've completed all today's sessions! Keep up this momentum!"
          : getCompletionPercentage() >= 70 ?
            "💪 Great progress! You're almost there! Keep up the momentum!"
          : getCompletionPercentage() >= 50 ?
            "🔥 Good pace! Keep going and you'll crush your goals!"
          : getCompletionPercentage() > 0 ?
            "🚀 Off to a great start! Keep the energy up!"
          : "💡 Ready to start? Mark your first session to begin tracking your progress!"
          }
        </p>
      </div>
    </div>
  );
}

export default ProgressDashboard;

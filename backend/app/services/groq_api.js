import dotenv from "dotenv";

dotenv.config();

const GROQ_API_KEY = process.env.GROQ_API_KEY;

if (!GROQ_API_KEY) {
  console.warn("GROQ_API_KEY is not configured. GROQ requests will fail.");
}

const GROQ_ENDPOINT =
  process.env.GROQ_API_URL || "https://api.groq.com/v1/generate";

async function callGroqModel(
  prompt,
  model = "llama-3.3-70b-versatile",
  opts = {},
) {
  try {
    const body = {
      model,
      messages: [
        {
          role: "system",
          content:
            "You are a helpful study planning assistant. Always respond with valid JSON.",
        },
        {
          role: "user",
          content: prompt,
        },
      ],
      max_tokens: opts.max_tokens ?? 8192,
      temperature:
        typeof opts.temperature === "number" ? opts.temperature : 0.1,
    };

    const resp = await fetch(GROQ_ENDPOINT, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${GROQ_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    });

    if (!resp.ok) {
      const text = await resp.text();
      throw new Error(`GROQ API error ${resp.status}: ${text}`);
    }

    const data = await resp.json();

    // Extract content from OpenAI-format response
    if (data.choices && data.choices.length > 0) {
      const message = data.choices[0].message;
      if (message?.content) {
        return message.content;
      }
    }

    // Fallback
    return JSON.stringify(data);
  } catch (err) {
    throw err;
  }
}

function buildSubjectsInfo(subjects) {
  return subjects
    .map((s) => `- ${s.name || s.subject} (Exam Date: ${s.examDate || s.date})`)
    .join("\n");
}

export async function generateSmartTimetable(
  subjects,
  availableHoursPerDay,
  customPrompt,
  modelType = "flash",
) {
  try {
    if (!subjects || subjects.length === 0) {
      throw new Error("No subjects provided");
    }

    const today = new Date().toLocaleDateString("en-GB", {
      day: "2-digit",
      month: "long",
      year: "numeric",
    });

    const subjectsInfo = buildSubjectsInfo(subjects);

    // Calculate subject weights based on custom prompt
    const subjectWeights = {};
    subjects.forEach((s) => {
      const name = s.name || s.subject;
      const weights = {
        name,
        weight: getSubjectWeightForAI(name, customPrompt),
      };
      subjectWeights[name] = weights.weight;
    });

    const weightInfo = Object.entries(subjectWeights)
      .map(
        ([name, weight]) =>
          `- ${name}: ${weight}x (${(weight * 100).toFixed(0)}%)`,
      )
      .join("\n");

    const systemPrompt = `You are an expert AI study planner specializing in personalized, science-backed study schedules.
Your task: Generate an optimized 14-day study timetable in valid JSON format.

=== CRITICAL REQUIREMENTS ===
1. ✓ INCLUDE ALL SUBJECTS in the schedule - NEVER omit any subject
2. ✓ Apply weight multipliers accurately for subject allocation
3. ✓ Generate realistic session durations (25-90 minutes per session)
4. ✓ Respect exam dates - allocate more time closer to exams
5. ✓ Date format MUST be DD-MMMM-YYYY (e.g., 03-May-2026, 15-June-2026)

=== TODAY'S DATE ===
${today}

=== SUBJECTS & WEIGHTS (Higher weight = more study time) ===
${weightInfo}

AVAILABLE STUDY HOURS PER DAY: ${availableHoursPerDay}
CUSTOM INSTRUCTIONS FROM USER: "${customPrompt || "Create a balanced, exam-focused schedule"}"

=== WEIGHT CALCULATION METHODOLOGY ===
Step 1: Sum all subject weights
Step 2: Calculate each subject's daily allocation = (availableHours × subjectWeight) / totalWeight
Step 3: Break allocations into realistic sessions (25-90 minutes)

EXAMPLE with weights Math=1.8, Science=1.0, English=1.0 and 7 available hours:
Total weight = 3.8
Daily allocations:
  - Math: (7 × 1.8) / 3.8 ≈ 3.3 hours = 2 sessions (90 min + 90 min)
  - Science: (7 × 1.0) / 3.8 ≈ 1.8 hours = 2 sessions (50 min + 50 min)
  - English: (7 × 1.0) / 3.8 ≈ 1.8 hours = 2 sessions (50 min + 50 min)

=== SCHEDULING RULES ===
1. Generate 14-day schedule starting from today
2. For each day, distribute ${availableHoursPerDay} hours using weight multipliers
3. Create multiple sessions per subject per day (2-4 sessions recommended)
4. Session duration: 25-90 minutes (respects Pomodoro/study science)
5. Include optional topic/chapter for focus
6. Break down longer sessions (90+ min) with variety (different chapters/types)
7. Gradually increase difficulty as exam dates approach
8. Ensure all subjects appear every day (minimum 25 min per subject daily)

=== SUBJECT EXAM DATE PRIORITY ===
Subjects with closer exam dates should get progressively more allocation.

=== IMPORTANT FORMAT RULES ===
- Date format: DD-MMMM-YYYY (examples: 03-May-2026, 25-Dec-2026, 01-Jan-2026)
- Duration: number in hours (e.g., 1.5, 2.25, 0.75)
- Do NOT include time (no HH:MM format)
- All durations must sum to approximately ${availableHoursPerDay} hours per day

=== JSON OUTPUT REQUIREMENTS ===
Return ONLY valid JSON with NO markdown, NO code blocks, NO explanations:
{
  "schedule": [
    {
      "subject": "Subject Name",
      "date": "03-May-2026",
      "duration": 1.5,
      "topic": "Chapter/Topic Name or specific focus area",
      "difficulty": "beginner|intermediate|advanced"
    }
  ]
}

=== VALIDATION CHECKLIST BEFORE RESPONDING ===
✓ All ${subjects.length} subjects appear in the schedule
✓ Each date is formatted as DD-MMMM-YYYY
✓ All durations are positive numbers
✓ JSON is valid (testable by JSON.parse)
✓ Daily totals approximately equal ${availableHoursPerDay} hours
✓ Schedule covers 14 consecutive days
✓ No syntax errors or markdown formatting`;

    const model = "llama-3.3-70b-versatile";

    const text = await callGroqModel(systemPrompt, model, {
      max_tokens: 8192,
      temperature: 0.1,
    });

    // Try to extract JSON from text
    let cleaned = text?.trim() || "";
    const jsonMatch = cleaned.match(/```(?:json)?\s*([\s\S]*?)\s*```/);
    if (jsonMatch) cleaned = jsonMatch[1].trim();

    // Remove stray characters before/after JSON
    cleaned = cleaned
      .replace(/^\uFEFF/, "")
      .replace(/^[^\{\[]*/, "")
      .replace(/[^\}\]]*$/, "");

    let parsedResponse = null;
    try {
      parsedResponse = JSON.parse(cleaned);
    } catch (err) {
      console.error("JSON Parse Error:", err.message);
      console.error("Raw cleaned text:", cleaned.substring(0, 500));
      throw new Error(`Failed to parse GROQ response as JSON: ${err.message}`);
    }

    // Extract schedule array - handle both formats
    let scheduleArray = null;

    if (parsedResponse && Array.isArray(parsedResponse)) {
      // Direct array format
      scheduleArray = parsedResponse;
    } else if (
      parsedResponse &&
      parsedResponse.schedule &&
      Array.isArray(parsedResponse.schedule)
    ) {
      // Object with schedule key
      scheduleArray = parsedResponse.schedule;
    } else {
      throw new Error(
        "Invalid response format: expected array or object with schedule array",
      );
    }

    // Validate and clean schedule items
    if (!Array.isArray(scheduleArray) || scheduleArray.length === 0) {
      throw new Error("Schedule array is empty");
    }

    // Group by date, aggregate subjects
    const groupedByDate = {};

    scheduleArray.forEach((item) => {
      if (!item.date || !item.subject || typeof item.duration !== "number") {
        console.warn("Skipping invalid schedule item:", item);
        return;
      }

      const date = String(item.date).trim();
      const subject = String(item.subject).trim();
      const hours = Number(item.duration) || 0;

      if (!groupedByDate[date]) {
        groupedByDate[date] = [];
      }

      // Check if subject already exists for this date
      const existingSubject = groupedByDate[date].find(
        (s) => s.subject === subject,
      );
      if (existingSubject) {
        existingSubject.hours += hours;
      } else {
        groupedByDate[date].push({
          subject,
          hours: Math.round(hours * 100) / 100, // Round to 2 decimals
        });
      }
    });

    // Convert to frontend format
    const result = {};
    Object.keys(groupedByDate)
      .sort((a, b) => new Date(a) - new Date(b))
      .forEach((date) => {
        result[date] = groupedByDate[date];
      });

    return result;
  } catch (error) {
    console.error("GROQ generateSmartTimetable error:", error);
    throw error;
  }
}

// Helper function to calculate subject weight for AI
const getSubjectWeightForAI = (subjectName, prompt) => {
  const subject = String(subjectName || "")
    .toLowerCase()
    .trim();
  const text = String(prompt || "").toLowerCase();

  if (!subject || !text) return 1;

  const morePatterns = [
    `focus more on ${subject}`,
    `more on ${subject}`,
    `prioritize ${subject}`,
    `give more time to ${subject}`,
    `spend more time on ${subject}`,
    `extra time on ${subject}`,
  ];

  const lessPatterns = [
    `focus less on ${subject}`,
    `less on ${subject}`,
    `give less time to ${subject}`,
    `reduce time on ${subject}`,
    `less time on ${subject}`,
    `cut time for ${subject}`,
  ];

  if (morePatterns.some((pattern) => text.includes(pattern))) return 1.8;
  if (lessPatterns.some((pattern) => text.includes(pattern))) return 0.7;
  if (text.includes(subject)) return 1.2;

  return 1;
};

export async function generateAdvancedSchedule(advancedData) {
  try {
    const {
      schedule,
      commitments = [],
      preferences = {},
      subjects = [],
    } = advancedData;

    // Extract preferences with defaults
    const subjectDifficulty = preferences.subjectDifficulty || {};
    const pomodoro = preferences.pomodoro || {
      focusDuration: 25,
      breakDuration: 5,
      longBreakDuration: 15,
      sessionsBeforeLongBreak: 4,
    };
    const minSessionLength = preferences.minSessionLength || 25;
    const maxSessionLength = preferences.maxSessionLength || 120;
    const sleepSchedule = preferences.sleepSchedule || { start: 23, end: 7 };
    const preferredTimes = preferences.preferredTimes || [];

    // Build comprehensive prompt with all details
    const subjectsInfo = (subjects || [])
      .map(
        (s) =>
          `- ${s.subject || s.name} (Exam: ${s.examDate || s.date}, Difficulty: ${subjectDifficulty[s.subject || s.name] || 3}/5)`,
      )
      .join("\n");

    const commitmentsList = (commitments || [])
      .map(
        (c) =>
          `- ${c.name} (${c.startTime}-${c.endTime} on ${c.days.join(", ")})`,
      )
      .join("\n");

    const preferredTimesStr =
      preferredTimes.length > 0 ? preferredTimes.join(", ") : "Flexible";

    const advancedPrompt = `You are an expert study scheduler with deep knowledge of learning science, time management, and the Pomodoro Technique.

TASK: Create a detailed, realistic weekly study schedule that respects all constraints and optimizes learning.

=== USER PROFILE ===
SUBJECTS TO STUDY:
${subjectsInfo}

FIXED COMMITMENTS (Cannot study during these times):
${commitmentsList || "None specified - fully flexible"}

STUDY PREFERENCES:
- Preferred Times: ${preferredTimesStr}
- Pomodoro: ${pomodoro.focusDuration}min focus + ${pomodoro.breakDuration}min break
- Long Break: ${pomodoro.longBreakDuration}min after ${pomodoro.sessionsBeforeLongBreak} sessions
- Session Length: ${minSessionLength}-${maxSessionLength} minutes
- Sleep Schedule: ${sleepSchedule.start}:00 to ${sleepSchedule.end}:00

AVAILABLE TIME BLOCKS (Free study windows):
${JSON.stringify(schedule || {}).slice(0, 2000)}

=== SCHEDULING REQUIREMENTS ===
1. ✓ Fill all free time slots efficiently
2. ✓ Respect commitments - NO study during commitment hours
3. ✓ Allocate more time to high-difficulty subjects
4. ✓ Study subjects in preferred time windows when possible
5. ✓ Break long sessions with Pomodoro breaks
6. ✓ Honor sleep schedule - no studying during sleep hours
7. ✓ Create realistic, achievable daily schedules
8. ✓ Include mix of reviewing and new content daily

=== OUTPUT FORMAT ===
Return ONLY valid JSON (no markdown, no code blocks):
{
  "schedule": [
    {
      "day": "Monday",
      "subject": "Subject Name",
      "startTime": "09:00",
      "endTime": "10:30",
      "duration": 1.5,
      "topic": "Specific chapter/topic",
      "sessionType": "learning|review|practice",
      "pomodoroSessions": 1,
      "notes": "Brief motivation/tip"
    }
  ],
  "summary": {
    "totalHours": 21,
    "subjectBreakdown": {"Subject1": 8, "Subject2": 7, "Subject3": 6},
    "optimalityScore": 0.92,
    "warnings": ["Any constraints that couldn't be fully met"]
  }
}

=== QUALITY CRITERIA ===
✓ Every session respects minimum and maximum duration
✓ No overlaps with commitments or sleep
✓ Difficulty-matched content (harder subjects get better time slots)
✓ Pomodoro-friendly durations with natural break points
✓ Realistic and achievable (student won't burn out)
✓ Clear topic focus for each session`;

    const model = "llama-3.3-70b-versatile";

    const text = await callGroqModel(advancedPrompt, model, {
      max_tokens: 8192,
      temperature: 0.3, // More deterministic for scheduling
    });

    let cleaned = text?.trim() || "";
    const jsonMatch = cleaned.match(/```(?:json)?\s*([\s\S]*?)\s*```/);
    if (jsonMatch) cleaned = jsonMatch[1].trim();
    cleaned = cleaned
      .replace(/^\uFEFF/, "")
      .replace(/^[^\{\[]*/, "")
      .replace(/[^\}\]]*$/, "");

    let parsedResponse = null;
    try {
      parsedResponse = JSON.parse(cleaned);
    } catch (err) {
      console.error("Advanced schedule JSON parse error:", err);
      // Return basic fallback schedule
      return {
        schedule: [],
        summary: {
          error: "Failed to parse advanced schedule",
          fallback: "Use the standard smart timetable instead",
        },
      };
    }

    // Validate and enhance response
    if (parsedResponse && parsedResponse.schedule) {
      // Ensure all sessions have required fields
      parsedResponse.schedule = parsedResponse.schedule.map((session) => ({
        day: session.day || "Unknown",
        subject: session.subject || "Study",
        startTime: session.startTime || "09:00",
        endTime: session.endTime || "10:00",
        duration: session.duration || 1,
        topic: session.topic || "General review",
        sessionType: session.sessionType || "learning",
        pomodoroSessions: session.pomodoroSessions || 1,
        notes: session.notes || "",
      }));
    }

    return parsedResponse;
  } catch (error) {
    console.error("GROQ generateAdvancedSchedule error:", error);
    throw error;
  }
}

export default generateSmartTimetable;

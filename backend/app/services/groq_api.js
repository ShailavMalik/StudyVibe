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

    const systemPrompt = `You are a study planner AI. Generate a complete study timetable in JSON format.

CRITICAL REQUIREMENTS:
1. INCLUDE ALL SUBJECTS in EVERY day's schedule
2. Use the provided weight multipliers for each subject
3. NEVER remove any subject from the schedule
4. Dates must be in DD-MMMM-YYYY format exactly
5. Calculate daily hours: (availableHours × subjectWeight) / sum(allWeights)

TODAY: ${today}

SUBJECTS WITH WEIGHTS (higher = more focus):
${weightInfo}

AVAILABLE HOURS/DAY: ${availableHoursPerDay}
CUSTOM INSTRUCTIONS: ${customPrompt || "Balanced plan optimizing exam dates"}

WEIGHT CALCULATION EXAMPLE:
If weights are: Math=1.8, Science=1.0, English=1.0
Total weight = 3.8
Daily allocation for 7 hours:
- Math: (7 × 1.8) / 3.8 = 3.32 hrs
- Science: (7 × 1.0) / 3.8 = 1.84 hrs  
- English: (7 × 1.0) / 3.8 = 1.84 hrs

RULES:
1. Schedule from today for 14 days
2. Apply weight multipliers to each subject daily
3. Sessions: Each subject gets allocated hours
4. Date format MUST be DD-MMMM-YYYY (e.g., 03-May-2026)
5. Distribute ${availableHoursPerDay} hours/day using weights
6. Use REAL dates only

OUTPUT FORMAT - Return ONLY valid JSON:
{
  "schedule": [
    {
      "subject": "Subject Name",
      "date": "03-May-2026",
      "duration": 2.5,
      "topic": "Optional topic"
    },
    {
      "subject": "Other Subject",
      "date": "03-May-2026",
      "duration": 1.8,
      "topic": "Optional topic"
    }
  ]
}`;

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
    const { schedule, commitments, preferences, subjects } = advancedData;

    const subjectDifficulty = preferences?.subjectDifficulty || {};
    const subjectsInfo = (subjects || [])
      .map(
        (s) =>
          `- ${s.subject || s.name} (Exam: ${s.examDate || s.date}, Difficulty: ${subjectDifficulty[s.subject || s.name] || 3}/5)`,
      )
      .join("\n");

    const preferredTimes =
      preferences?.preferredTimes?.join(", ") || "Flexible";
    const pomodoro = preferences?.pomodoro || {};
    const pomodoroInfo = `${pomodoro.focusDuration || 25}min focus + ${pomodoro.breakDuration || 5}min break`;

    const systemPrompt = `You are an advanced AI study scheduler with expertise in time management and Pomodoro technique.\n\nSUBJECTS:\n${subjectsInfo}\n\nAVAILABLE TIME SLOTS:\n${JSON.stringify(schedule).slice(0, 2000)}\n\nUSER PREFERENCES:\n- Preferred Times: ${preferredTimes}\n- Pomodoro: ${pomodoroInfo}\n\nREQUIREMENTS: Provide JSON with top-level 'schedule' array including sessions with exact times and pomodoro breakdown.`;

    const model = "llama-3.3-70b-versatile";

    const text = await callGroqModel(systemPrompt, model, {
      max_tokens: 8192,
      temperature: 0.2,
    });

    let cleaned = text?.trim() || "";
    const jsonMatch = cleaned.match(/```(?:json)?\s*([\s\S]*?)\s*```/);
    if (jsonMatch) cleaned = jsonMatch[1].trim();
    cleaned = cleaned
      .replace(/^\uFEFF/, "")
      .replace(/^[^\{\[]*/, "")
      .replace(/[^\}\]]*$/, "");

    try {
      return JSON.parse(cleaned);
    } catch (err) {
      throw new Error(
        `Failed to parse GROQ advanced schedule JSON: ${err.message} -- raw: ${cleaned.substring(0, 1000)}`,
      );
    }
  } catch (error) {
    console.error("GROQ generateAdvancedSchedule error:", error);
    throw error;
  }
}

export default generateSmartTimetable;

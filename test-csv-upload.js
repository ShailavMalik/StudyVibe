const fs = require("fs");
const FormData = require("form-data");
const axios = require("axios");

async function testCSVUpload() {
  try {
    console.log("🔄 Testing CSV upload to backend...\n");

    const form = new FormData();
    form.append("schedule", fs.createReadStream("./demo_schedule.csv"));

    const response = await axios.post(
      "http://localhost:3001/api/schedule/upload",
      form,
      {
        headers: form.getHeaders(),
      },
    );

    console.log("✅ CSV Upload Successful!");
    console.log("Status Code:", response.status);
    console.log("Parsed Entries Count:", response.data.schedule?.length || 0);
    console.log("Message:", response.data.message || "No message");

    console.log("\n📋 First 5 parsed entries:");
    response.data.schedule?.slice(0, 5).forEach((entry, i) => {
      const display = `[${i + 1}] ${entry.day} - ${entry.subject} (${entry.startTime} to ${entry.endTime})`;
      console.log("  " + display);
    });

    console.log("\n✅ CSV parsing is working correctly!");
    process.exit(0);
  } catch (error) {
    console.error(
      "❌ Upload Error:",
      error.response?.data?.message || error.message,
    );
    if (error.response?.data) {
      console.error("Full Error Response:", error.response.data);
    }
    process.exit(1);
  }
}

testCSVUpload();

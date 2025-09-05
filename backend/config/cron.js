import cron from "cron";
import https from "https";
import "dotenv/config";

function sendHealthCheck(retries = 2) {
  const req = https.get(process.env.SERVER_HEALTH_URL, (res) => {
    if (res.statusCode === 200) {
      console.log("✅ Health check successful");
    } else {
      console.error(`⚠️ Health check failed: ${res.statusCode}`);
      if (retries > 0) {
        console.log(`🔄 Retrying... (${3 - retries + 1})`);
        setTimeout(() => sendHealthCheck(retries - 1), 5000);
      }
    }
  });

  req.on("error", (err) => {
    console.error("❌ Request error:", err.message);
    if (retries > 0) {
      console.log(`🔄 Retrying after error... (${3 - retries + 1})`);
      setTimeout(() => sendHealthCheck(retries - 1), 5000);
    }
  });

  req.end();
}

// Run every 12 minutes instead of 14 to avoid Render idle timeout
const job = new cron.CronJob("*/12 * * * *", function () {
  console.log("⏳ Sending health check...");
  sendHealthCheck();
});

export default job;

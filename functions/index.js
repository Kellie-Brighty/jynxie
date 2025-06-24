const functions = require("firebase-functions");
const express = require("express");
const cors = require("cors");

// Import bot components directly
const TelegramBot = require("node-telegram-bot-api");
const admin = require("firebase-admin");

// Initialize Express app
const app = express();
app.use(cors({ origin: true }));
app.use(express.json());

// Initialize Firebase Admin if not already initialized
if (!admin.apps.length) {
  admin.initializeApp();
}

// Initialize bot instance
let botInstance = null;

// Initialize bot function
async function initializeBot() {
  if (!botInstance) {
    try {
      const token =
        functions.config().telegram?.bot_token ||
        process.env.TELEGRAM_BOT_TOKEN;

      if (!token) {
        throw new Error("TELEGRAM_BOT_TOKEN not configured");
      }

      // Create bot instance without polling (webhook mode)
      botInstance = new TelegramBot(token, { polling: false });

      console.log("✅ Bot initialized for webhook mode");
    } catch (error) {
      console.error("❌ Failed to initialize bot:", error);
      throw error;
    }
  }
  return botInstance;
}

// Webhook handler for Telegram
app.post("/webhook", async (req, res) => {
  try {
    if (!botInstance) {
      await initializeBot();
    }

    // Process the update
    await botInstance.processUpdate(req.body);
    res.status(200).send("OK");
  } catch (error) {
    console.error("❌ Webhook error:", error);
    res.status(500).send("Internal Server Error");
  }
});

// Health check endpoint
app.get("/health", (req, res) => {
  res.status(200).json({
    status: "OK",
    timestamp: new Date().toISOString(),
    bot: botInstance ? "initialized" : "not initialized",
  });
});

// Bot info endpoint
app.get("/bot-info", async (req, res) => {
  try {
    if (!botInstance) {
      await initializeBot();
    }

    const me = await botInstance.getMe();
    res.status(200).json({
      bot: me,
      status: "active",
    });
  } catch (error) {
    console.error("❌ Bot info error:", error);
    res.status(500).json({ error: "Failed to get bot info" });
  }
});

// Set webhook endpoint (for admin use)
app.post("/set-webhook", async (req, res) => {
  try {
    const { url, secret } = req.body;

    // Basic security check
    if (!secret || secret !== process.env.WEBHOOK_SECRET) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    if (!botInstance) {
      await initializeBot();
    }

    await botInstance.setWebHook(url);
    res.status(200).json({ message: "Webhook set successfully", url });
  } catch (error) {
    console.error("❌ Set webhook error:", error);
    res.status(500).json({ error: "Failed to set webhook" });
  }
});

// Delete webhook endpoint (for admin use)
app.post("/delete-webhook", async (req, res) => {
  try {
    const { secret } = req.body;

    // Basic security check
    if (!secret || secret !== process.env.WEBHOOK_SECRET) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    if (!botInstance) {
      await initializeBot();
    }

    await botInstance.deleteWebHook();
    res.status(200).json({ message: "Webhook deleted successfully" });
  } catch (error) {
    console.error("❌ Delete webhook error:", error);
    res.status(500).json({ error: "Failed to delete webhook" });
  }
});

// Export the Express app as a Firebase Function
exports.webhookHandler = functions.https.onRequest(app);

// Basic scheduled function to clean up expired data
exports.scheduledCleanup = functions.pubsub
  .schedule("every 24 hours")
  .onRun(async (context) => {
    try {
      console.log("🧹 Starting scheduled cleanup...");

      const db = admin.firestore();
      const now = new Date();

      // Clean up expired sessions
      const expiredSessions = await db
        .collection("sessions")
        .where("expiresAt", "<", now)
        .get();

      const batch = db.batch();
      expiredSessions.forEach((doc) => {
        batch.delete(doc.ref);
      });

      await batch.commit();
      console.log(`✅ Cleaned up ${expiredSessions.size} expired sessions`);

      return null;
    } catch (error) {
      console.error("❌ Scheduled cleanup error:", error);
      throw error;
    }
  });

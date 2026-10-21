// setup-webhook.mjs
const BOT_TOKEN = "8954408184:AAEQ5fXqqQDvVa6IkXOqGKUPhdkCGB471Eo"; // ⚠️ Make sure this is your real bot token from BotFather

// 👇 This is the exact URL you confirmed works
const WORKER_URL = "https://tigerslair-api.ehisferguson.workers.dev/api/telegram/webhook";

// 👇 Make sure this matches the TG_WEBHOOK_SECRET in your wrangler.toml
const SECRET_TOKEN = "Tigerslair-secret-webhook-119"; 

async function setup() {
  console.log("Registering webhook with Telegram...");
  
  try {
    const response = await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/setWebhook`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        url: WORKER_URL,
        secret_token: SECRET_TOKEN,
        allowed_updates: ["message", "callback_query"],
        drop_pending_updates: true
      })
    });
    
    const data = await response.json();
    
    if (data.ok) {
      console.log("✅ Webhook registered successfully!");
      console.log("Your bot is now live and listening to messages.");
    } else {
      console.error("❌ Telegram rejected the setup:", data);
    }
  } catch (error) {
    console.error("❌ Network error:", error.message);
  }
}

setup();
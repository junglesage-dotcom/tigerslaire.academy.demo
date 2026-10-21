// setup-webhook.mjs
const BOT_TOKEN = "8954408184:AAEQ5fXqqQDvVa6IkXOqGKUPhdkCGB471Eo"; // Replace with your actual token
const WORKER_URL = "https://tigerslair-api.ehisferguson.workers.dev/api/telegram/webhook"; // Replace with your actual worker URL
const SECRET_TOKEN = "Tigerslair-secret-webhook-119"; // Must match the TG_WEBHOOK_SECRET you just set

async function setup() {
  console.log("Registering webhook with Telegram...");
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
  } else {
    console.error("❌ Failed:", data);
  }
}
setup();
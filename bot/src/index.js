// bot/src/index.js
// Tiger's Lair Telegram Bot — runs on Cloudflare Workers

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    
    // Telegram sends POST requests to your webhook URL
    if (url.pathname === '/webhook' && request.method === 'POST') {
      try {
        const update = await request.json();
        await handleUpdate(update, env);
        return new Response('OK', { status: 200 });
      } catch (err) {
        return new Response(err.message, { status: 500 });
      }
    }
    
    // Set webhook endpoint (run this URL once in your browser after deploying)
    if (url.pathname === '/set-webhook') {
      const webhookUrl = `${url.origin}/webhook`;
      const res = await fetch(`https://api.telegram.org/bot${env.BOT_TOKEN}/setWebhook`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          url: webhookUrl,
          allowed_updates: ['message', 'callback_query']
        })
      });
      const data = await res.json();
      return new Response(JSON.stringify(data), { 
        headers: { 'Content-Type': 'application/json' } 
      });
    }
    
    return new Response('Tiger\'s Lair Bot is running 🐯', { status: 200 });
  }
};

async function handleUpdate(update, env) {
  // Handle regular messages
  if (update.message) {
    const chatId = update.message.chat.id;
    const text = update.message.text || '';
    const userId = update.message.from.id;
    const username = update.message.from.username || 'unknown';
    
    // /start command with deep link (e.g., /start VERIFY_abc123)
    if (text.startsWith('/start')) {
      const payload = text.split(' ')[1];
      
      if (payload && payload.startsWith('VERIFY_')) {
        const token = payload.replace('VERIFY_', '');
        await handleVerification(chatId, token, userId, username, env);
      } else {
        await sendMessage(chatId, 
          `🐯 *Welcome to Tiger's Lair!*\n\n` +
          `I'm your learning companion. Here's what I can do:\n\n` +
          `📚 Deliver your daily lessons\n` +
          `📅 Remind you of sessions\n` +
          `💬 Connect you with your mentor\n` +
          `🎓 Track your progress\n\n` +
          `Use /help to see all commands.`,
          env
        );
      }
      return;
    }
    
    // /help command
    if (text === '/help') {
      await sendMessage(chatId,
        `*Available Commands:*\n\n` +
        `/start - Begin or verify your account\n` +
        `/mycourses - View your enrolled courses\n` +
        `/nextlesson - Get your next lesson\n` +
        `/mysessions - View upcoming sessions\n` +
        `/mentor - Contact your mentor\n` +
        `/progress - Check your learning progress\n` +
        `/help - Show this message`,
        env
      );
      return;
    }
    
    // /mycourses
    if (text === '/mycourses') {
      const user = await env.DB.prepare(
        'SELECT * FROM users WHERE telegram_id = ?'
      ).bind(String(userId)).first();
      
      if (!user) {
        await sendMessage(chatId, 
          `🔗 *Link your account first!*\n\n` +
          `Visit the Tiger's Lair website and click "Connect Telegram" in your dashboard.`,
          env
        );
        return;
      }
      
      const enrollments = await env.DB.prepare(`
        SELECT c.code, c.title FROM enrollments e 
        JOIN courses c ON e.course_id = c.id 
        WHERE e.user_id = ?
      `).bind(user.id).all();
      
      if (enrollments.results.length === 0) {
        await sendMessage(chatId, `You're not enrolled in any courses yet. Visit the website to browse!`, env);
        return;
      }
      
      const list = enrollments.results.map(e => `• *${e.code}* — ${e.title}`).join('\n');
      await sendMessage(chatId, `*Your Courses:*\n\n${list}`, env);
      return;
    }
    
    // /progress
    if (text === '/progress') {
      const user = await env.DB.prepare(
        'SELECT * FROM users WHERE telegram_id = ?'
      ).bind(String(userId)).first();
      
      if (!user) {
        await sendMessage(chatId, `Please link your account first via the website dashboard.`, env);
        return;
      }
      
      const stats = await env.DB.prepare(`
        SELECT 
          COUNT(DISTINCT e.course_id) as enrolled,
          COUNT(DISTINCT CASE WHEN e.quiz_passed = 1 THEN e.course_id END) as completed
        FROM enrollments e
        WHERE e.user_id = ?
      `).bind(user.id).first();
      
      await sendMessage(chatId,
        `*📊 Your Progress*\n\n` +
        `📚 Courses enrolled: *${stats.enrolled}*\n` +
        `✅ Courses completed: *${stats.completed}*\n\n` +
        `Keep going, ${user.name.split(' ')[0]}! 🐯`,
        env
      );
      return;
    }

    // ========================================================================
    // PAYMENT PROOF LOGIC (Handles incoming images)
    // ========================================================================
    if (update.message.photo) {
      const fileId = update.message.photo[update.message.photo.length - 1].file_id;
      const adminChannelId = env.ADMIN_CHANNEL_ID; 
      
      console.log(`Attempting to send photo to channel: ${adminChannelId}`);

      // Send photo to admin channel WITH ERROR LOGGING
      const tgRes = await fetch(`https://api.telegram.org/bot${env.BOT_TOKEN}/sendPhoto`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chat_id: adminChannelId,
          photo: fileId,
          caption: `🧾 *New Payment Proof Received*\n\nTelegram User ID: \`${userId}\`\nUsername: @${username}\n\nPlease verify the bank transfer and approve in the Admin Dashboard.`,
          parse_mode: 'Markdown',
          reply_markup: {
            inline_keyboard: [[
              { text: "✅ Approve Payment", callback_data: `approve_payment_${userId}` }
            ]]
          }
        })
      });

      // Read the response to see if Telegram rejected it
      const tgData = await tgRes.json();
      
      if (!tgRes.ok) {
        // THIS WILL SHOW UP IN YOUR WRANGLER TAIL!
        console.error("❌ TELEGRAM API ERROR:", JSON.stringify(tgData));
      } else {
        console.log("✅ Photo sent to channel successfully!");
      }
      
      // Reply to the student
      await sendMessage(chatId, "✅ Thank you! Your payment slip has been forwarded to the admin team for verification. You will be enrolled shortly.", env);
      return; // Exit early
    }
    // ========================================================================

    // Default response
    await sendMessage(chatId, 
      `I'm not sure what you mean. Try /help to see what I can do! 🐯`,
      env
    );
  }
  
  // Handle button callbacks (e.g., the "Approve" button in the admin channel)
  if (update.callback_query) {
    const chatId = update.callback_query.message.chat.id;
    const data = update.callback_query.data;
    
    if (data.startsWith('approve_payment_')) {
      const telegramUserId = data.replace('approve_payment_', '');
      await sendMessage(chatId, `⚠️ Admin Action Required: Please open the Tiger's Lair Admin Dashboard, go to the "Payments" tab, find the user with Telegram ID \`${telegramUserId}\`, and click "Approve & Enroll".`, env);
    } else {
      await sendMessage(chatId, `You pressed: ${data}`, env);
    }
  }
}

// Link Telegram account to website user
async function handleVerification(chatId, token, telegramUserId, username, env) {
  const user = await env.DB.prepare(
    'SELECT * FROM users WHERE id = ?'
  ).bind(token).first();
  
  if (!user) {
    await sendMessage(chatId, `❌ Invalid verification link. Please try again from the website.`, env);
    return;
  }
  
  await env.DB.prepare(
    'UPDATE users SET telegram_id = ? WHERE id = ?'
  ).bind(String(telegramUserId), token).run();
  
  await sendMessage(chatId,
    `✅ *Account Linked!*\n\n` +
    `Welcome, ${user.name}! Your Telegram is now connected to your Tiger's Lair account.\n\n` +
    `I'll send you:\n` +
    `• Daily lesson deliveries\n` +
    `• Session reminders\n` +
    `• Mentorship updates\n\n` +
    `Use /help to see all commands. 🐯`,
    env
  );
}

// Helper: send message to Telegram
async function sendMessage(chatId, text, env, options = {}) {
  await fetch(`https://api.telegram.org/bot${env.BOT_TOKEN}/sendMessage`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      chat_id: chatId,
      text: text,
      parse_mode: 'Markdown',
      ...options
    })
  });
}
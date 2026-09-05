// bot/src/index.js
export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    
    if (url.pathname === '/webhook' && request.method === 'POST') {
      try {
        const update = await request.json();
        await handleUpdate(update, env);
        return new Response('OK', { status: 200 });
      } catch (err) {
        return new Response(err.message, { status: 500 });
      }
    }
    
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
      return new Response(JSON.stringify(data), { headers: { 'Content-Type': 'application/json' } });
    }
    
    return new Response('Tiger\'s Lair Bot is running 🐯', { status: 200 });
  }
};

async function handleUpdate(update, env) {
  if (update.message) {
    const chatId = update.message.chat.id;
    const text = update.message.text || '';
    const userId = update.message.from.id;
    const username = update.message.from.username || 'unknown';
    
    if (text.startsWith('/start')) {
      const payload = text.split(' ')[1];
      
      if (payload && payload.startsWith('INST_')) {
        const instId = payload.replace('INST_', '');
        await sendMessage(chatId, 
          `📸 *Installment Proof Upload*\n\n` +
          `Please send a photo of your payment slip.\n\n` +
          `⚠️ *CRITICAL:* You must include the code \`${instId}\` in the photo caption so we can track it.\n\n` +
          `Example caption: "Payment for ${instId}"`, 
          env
        );
        return;
      } else if (payload && payload.startsWith('VERIFY_')) {
         await sendMessage(chatId, `✅ Verification code received.`, env);
         return;
      } else {
        await sendMessage(chatId, 
          `🐯 *Welcome to Tiger's Lair!*\n\n` +
          `I'm your learning companion. Use /help to see all commands.`,
          env
        );
      }
      return;
    }
    
    if (text === '/help') {
      await sendMessage(chatId,
        `*Available Commands:*\n\n` +
        `/start - Begin or verify your account\n` +
        `/mycourses - View your enrolled courses\n` +
        `/help - Show this message`,
        env
      );
      return;
    }

    // Handle incoming images (Payment Proofs with Caption Tracking)
    if (update.message.photo) {
      const fileId = update.message.photo[update.message.photo.length - 1].file_id;
      const caption = update.message.caption || '';
      const adminChannelId = env.ADMIN_CHANNEL_ID; 
      
      // Look for INST-<id> in the caption
      const match = caption.match(/INST-([a-zA-Z0-9_]+)/);
      const instId = match ? match[1] : null;

      let captionText = `🧾 *New Payment Proof Received*\n\nTelegram User ID: \`${userId}\`\nUsername: @${username}`;
      
      let keyboard = [];

      if (instId) {
        captionText += `\n\n✅ *Installment ID Detected:* \`${instId}\`\n\nPlease verify in the Admin Dashboard.`;
        keyboard = [[
          { text: "✅ Approve Installment", callback_data: `approve_inst_${instId}` }
        ]];
      } else {
        captionText += `\n\n⚠️ *No Installment ID found in caption.*\nPlease ask the student to resend with the correct ID.`;
      }

      await fetch(`https://api.telegram.org/bot${env.BOT_TOKEN}/sendPhoto`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chat_id: adminChannelId,
          photo: fileId,
          caption: captionText,
          parse_mode: 'Markdown',
          reply_markup: keyboard.length > 0 ? { inline_keyboard: keyboard } : undefined
        })
      });
      
      await sendMessage(chatId, "✅ Thank you! Your payment slip has been forwarded to the admin team. If you included the correct ID, you will be approved shortly.", env);
      return;
    }

    await sendMessage(chatId, `I'm not sure what you mean. Try /help to see what I can do! 🐯`, env);
  }
  
  if (update.callback_query) {
    const chatId = update.callback_query.message.chat.id;
    const data = update.callback_query.data;
    
    if (data.startsWith('approve_inst_')) {
      const instId = data.replace('approve_inst_', '');
      // Note: The actual approval happens in the Admin Dashboard for security, 
      // but this button acknowledges the admin's intent.
      await sendMessage(chatId, `⚠️ To finalize approval, please open the Tiger's Lair Admin Dashboard, go to the "Installments" tab, and approve ID: \`${instId}\`.`, env);
    } else if (data.startsWith('approve_payment_')) {
      const telegramUserId = data.replace('approve_payment_', '');
      await sendMessage(chatId, `⚠️ Admin Action: Please open the Tiger's Lair Admin Dashboard to approve user \`${telegramUserId}\`.`, env);
    }
  }
}

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
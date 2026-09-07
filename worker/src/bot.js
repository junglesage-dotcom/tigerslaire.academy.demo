// worker/src/bot.js — Telegram bot update handler (webhook-driven)

const tg = (env, method, body) =>
  fetch(`https://api.telegram.org/bot${env.BOT_TOKEN}/${method}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  }).then((r) => r.json());

const send = (env, chat_id, text, extra = {}) =>
  tg(env, 'sendMessage', { chat_id, text, parse_mode: 'Markdown', disable_web_page_preview: true, ...extra });

const miniAppUrl = (env) => env.MINI_APP_URL || `https://t.me/${env.BOT_USERNAME || 'jsagebutlerbot'}/app`;
const siteUrl = (env) => env.SITE_URL || 'https://tigerslair-api.ehisferguson.workers.dev/';

const HELP_TEXT = [
  "🐯 *Tiger's Lair Academy Bot*",
  '',
  '/app — Launch the Academy Mini App',
  '/mycourses — Your courses & progress',
  '/channel <CODE> — Invite link to a course channel',
  '/proof <REF> — Submit a bank-transfer proof',
  '/status — Account & payment status',
  '/help — This message',
].join('\n');

function normalizeChat(value) {
  const s = String(value || '').trim();
  if (!s) return null;
  if (/^-?\d/.test(s)) return s;
  const clean = s.replace(/^https?:\/\//, '').replace(/^t\.me\//, '').replace(/^@/, '');
  return '@' + clean;
}

const userByTg = (env, telegramId) =>
  env.DB.prepare('SELECT * FROM users WHERE telegram_id = ?').bind(String(telegramId)).first();

async function isAdminActor(env, cb) {
  const chatId = String(cb?.message?.chat?.id || '');
  if (env.ADMIN_CHANNEL_ID && chatId === String(env.ADMIN_CHANNEL_ID)) return true;
  const ids = String(env.ADMIN_IDS || '').split(',').map((s) => s.trim()).filter(Boolean);
  return ids.includes(String(cb?.from?.id || ''));
}

async function notifyUser(env, userId, text) {
  const user = await env.DB.prepare('SELECT telegram_id FROM users WHERE id = ?').bind(userId).first();
  if (user && user.telegram_id) await send(env, user.telegram_id, text);
}

// ============================================
// WEBHOOK ENTRY
// ============================================
export async function handleTelegramUpdate(request, env) {
  const secret = request.headers.get('x-telegram-bot-api-secret-token');
  if (env.TG_WEBHOOK_SECRET && secret !== env.TG_WEBHOOK_SECRET) return new Response('Unauthorized', { status: 403 });
  const update = await request.json();
  try {
    if (update.callback_query) await handleCallback(update.callback_query, env);
    else if (update.message) await handleMessage(update.message, env);
  } catch (e) {
    console.error('Bot update error:', e);
  }
  return new Response('ok');
}

// ============================================
// MESSAGES
// ============================================
async function handleMessage(msg, env) {
  const chatId = msg.chat.id;
  if (msg.chat.type !== 'private') return;

  // PHOTO = payment proof (if a proof session is open)
  if (msg.photo && msg.photo.length) {
    const session = await env.DB.prepare('SELECT * FROM bot_sessions WHERE telegram_id = ?').bind(String(chatId)).first();
    if (!session) return send(env, chatId, 'No pending proof request. Use /proof <REFERENCE> first, or tap "Upload Proof" from your dashboard.');
    const photo = msg.photo[msg.photo.length - 1];
    return forwardProof(env, session, photo.file_id);
  }

  const text = (msg.text || '').trim();
  if (!text) return;

  if (text === '/start' || text.startsWith('/start ')) {
    return handleStart(env, chatId, text.replace('/start', '').trim());
  }

  const cmd = text.split(' ')[0];
  if (cmd === '/app' || cmd === '/launch') {
    return send(env, chatId, "🚀 Tiger's Lair Academy — learn, track progress, get certified.", {
      reply_markup: { inline_keyboard: [
        [{ text: '🚀 Launch Academy App', web_app: { url: miniAppUrl(env) } }],
        [{ text: '🌐 Open Website', url: siteUrl(env) }],
      ] },
    });
  }
  if (cmd === '/mycourses') return myCourses(env, chatId);
  if (cmd === '/channel' || cmd === '/group') return channelByCode(env, chatId, text.split(' ')[1] || '');
  if (cmd === '/proof') {
    const ref = text.split(' ')[1];
    if (!ref) return send(env, chatId, 'Usage: /proof <PAYMENT-REFERENCE>');
    return startProofSession(env, chatId, ref);
  }
  if (cmd === '/status') return status(env, chatId);
  return send(env, chatId, HELP_TEXT, {
    reply_markup: { inline_keyboard: [
      [{ text: '🚀 Launch App', web_app: { url: miniAppUrl(env) } }],
      [{ text: '📚 My Courses', callback_data: 'nav:mycourses' }],
      [{ text: '🔗 Link Website Account', url: `${siteUrl(env)}/?link=1` }],
    ] },
  });
}

async function handleStart(env, chatId, payload) {
  if (!payload) {
    return send(env, chatId, "Welcome to the Tiger's Lair Academy Bot! 🐯\nUse /help to see everything I can do.", {
      reply_markup: { inline_keyboard: [
        [{ text: '🚀 Launch Academy App', web_app: { url: miniAppUrl(env) } }],
        [{ text: '📚 My Courses', callback_data: 'nav:mycourses' }],
        [{ text: '🔗 Link Website Account', url: `${siteUrl(env)}/?link=1` }],
      ] },
    });
  }
  if (payload.startsWith('link_')) {
    const userId = payload.slice(5);
    const user = await env.DB.prepare('SELECT * FROM users WHERE id = ?').bind(userId).first();
    if (!user) return send(env, chatId, 'Account not found. Start the link again from your dashboard.');
    await env.DB.prepare('UPDATE users SET telegram_id = ? WHERE id = ?').bind(String(chatId), userId).run();
    return send(env, chatId, `✅ Linked! Welcome, ${user.name}. You'll now receive lesson drops, reminders and payment updates here.`);
  }
  if (payload.startsWith('chan_')) return channelById(env, chatId, payload.slice(5));
  if (payload.startsWith('INST_PROOF_')) return startProofSession(env, chatId, payload.slice(11));
  if (payload.startsWith('PROOF_')) return startProofSession(env, chatId, payload.slice(6));
  if (payload.startsWith('INST_')) return startProofSession(env, chatId, payload.slice(5));
  return send(env, chatId, HELP_TEXT);
}

// ============================================
// PAYMENT PROOF FLOW
// ============================================
async function startProofSession(env, chatId, reference) {
  const payment = await env.DB.prepare('SELECT * FROM payments WHERE reference = ?').bind(reference).first();
  const installment = !payment ? await env.DB.prepare('SELECT * FROM installments WHERE id = ?').bind(reference).first() : null;
  if (!payment && !installment) return send(env, chatId, `Reference "${reference}" not found. Check your dashboard for the exact reference.`);
  const userId = payment ? payment.user_id : installment.user_id;

  await env.DB.prepare('INSERT OR REPLACE INTO bot_sessions (telegram_id, user_id, purpose, reference, created_at) VALUES (?, ?, ?, ?, ?)')
    .bind(String(chatId), userId, payment ? 'payment' : 'installment', reference, Date.now()).run();
  if (payment) await env.DB.prepare("UPDATE payments SET status = 'proof_submitted' WHERE reference = ? AND status = 'pending'").bind(reference).run();
  if (installment) await env.DB.prepare("UPDATE installments SET status = 'proof_submitted' WHERE id = ? AND status = 'pending'").bind(reference).run();

  return send(env, chatId, '📸 Proof request opened.\nNow send the PHOTO of your payment receipt here (as a photo, not a file).');
}

async function forwardProof(env, session, fileId) {
  const chatId = session.telegram_id;
  let caption = '';
  let keyboard = [];

  if (session.purpose === 'payment') {
    const row = await env.DB.prepare(`SELECT p.*, u.name, u.email, c.title AS course_title FROM payments p JOIN users u ON u.id = p.user_id LEFT JOIN courses c ON c.id = p.course_id WHERE p.reference = ?`).bind(session.reference).first();
    if (!row) return send(env, chatId, 'Payment reference expired. Use /proof <REF> again.');
    caption = [
      '🧾 PAYMENT PROOF — FULL',
      `Student: ${row.name} (${row.user_id})`,
      `Email: ${row.email}`,
      `Reference: ${row.reference}`,
      `Amount: ${row.currency === 'USD' ? '$' : '₦'}${Number(row.amount).toLocaleString()}`,
      `Course: ${row.course_title || 'Mentorship'}`,
      `Plan: ${row.payment_plan || 'full'}`,
      '',
      'Approve to enroll the student.',
    ].join('\n');
    keyboard = [[{ text: '✅ Approve', callback_data: `payA:${row.reference}` }, { text: '❌ Reject', callback_data: `payR:${row.reference}` }]];
  } else {
    const row = await env.DB.prepare(`SELECT i.*, u.name, u.email, c.title AS course_title FROM installments i JOIN users u ON u.id = i.user_id LEFT JOIN courses c ON c.id = i.course_id WHERE i.id = ?`).bind(session.reference).first();
    if (!row) return send(env, chatId, 'Installment reference expired. Use /proof <REF> again.');
    caption = [
      '🧾 PAYMENT PROOF — INSTALLMENT',
      `Student: ${row.name} (${row.user_id})`,
      `Email: ${row.email}`,
      `Installment: ${row.id}`,
      `Amount: ₦${Number(row.amount).toLocaleString()}`,
      `Course: ${row.course_title || 'Course'}`,
      '',
      'Approve to mark this installment paid.',
    ].join('\n');
    keyboard = [[{ text: '✅ Approve', callback_data: `instA:${row.id}` }, { text: '❌ Reject', callback_data: `instR:${row.id}` }]];
  }

  if (!env.ADMIN_CHANNEL_ID) return send(env, chatId, 'Admin channel not configured. Contact support.');
  await tg(env, 'sendPhoto', { chat_id: env.ADMIN_CHANNEL_ID, photo: fileId, caption, reply_markup: { inline_keyboard: keyboard } });
  await env.DB.prepare('DELETE FROM bot_sessions WHERE telegram_id = ?').bind(String(chatId)).run();
  return send(env, chatId, "✅ Proof forwarded to the admin team. You'll get a notification here once it's approved.");
}

// ============================================
// COURSE CHANNEL ACCESS
// ============================================
async function channelByCode(env, chatId, code) {
  const course = await env.DB.prepare('SELECT * FROM courses WHERE UPPER(code) = UPPER(?)').bind(code).first();
  if (!course) return send(env, chatId, `No course found with code "${code}". Use /mycourses to see your courses.`);
  return channelById(env, chatId, course.id);
}

async function channelById(env, chatId, courseId, cb) {
  const user = await userByTg(env, chatId);
  if (!user) return send(env, chatId, 'Link your account first from the website dashboard.');
  const enrolled = await env.DB.prepare('SELECT 1 AS ok FROM enrollments WHERE user_id = ? AND course_id = ?').bind(user.id, courseId).first();
  if (!enrolled) return send(env, chatId, "🔒 You're not enrolled in this course, so I can't share its private channel.");
  const course = await env.DB.prepare('SELECT * FROM courses WHERE id = ?').bind(courseId).first();
  const chat = normalizeChat(course.channel);
  if (!chat) return send(env, chatId, "This course doesn't have a Telegram channel configured yet.");
  const link = await tg(env, 'createChatInviteLink', {
    chat_id: chat,
    member_limit: 1,
    expire_date: Math.floor(Date.now() / 1000) + 3600,
    name: `${user.name} — ${course.code}`,
  });
  if (!link.ok) return send(env, chatId, `Couldn't create an invite (${link.description}). Is the bot an admin of the channel with invite rights?`);
  const text = `🔑 One-time invite to ${course.code} channel (valid 1 hour, 1 use):\n${link.result.invite_link}`;
  if (cb) return tg(env, 'editMessageText', { chat_id: cb.message.chat.id, message_id: cb.message.message_id, text });
  return send(env, chatId, text);
}

// ============================================
// MY COURSES / STATUS
// ============================================
async function myCourses(env, chatId, cb) {
  const user = await userByTg(env, chatId);
  if (!user) return send(env, chatId, "Your Telegram isn't linked to a student account. Open the dashboard and tap \"Link Telegram\".", {
    reply_markup: { inline_keyboard: [[{ text: '🔗 Link Account', url: `${siteUrl(env)}/?link=1` }]] },
  });
  const rows = await env.DB.prepare(`SELECT c.id, c.code, c.title, c.channel, e.quiz_passed,
      (SELECT COUNT(*) FROM lessons l WHERE l.course_id = c.id) AS total,
      (SELECT COUNT(*) FROM lesson_completions lc JOIN lessons l ON l.id = lc.lesson_id WHERE l.course_id = c.id AND lc.user_id = ?) AS done
    FROM enrollments e JOIN courses c ON c.id = e.course_id WHERE e.user_id = ? ORDER BY e.enrolled_at DESC`).bind(user.id, user.id).all();
  if (!rows.results.length) return send(env, chatId, "You haven't enrolled in any course yet. Browse the catalogue in the app.");
  const lines = rows.results.map((r, i) => {
    const pct = r.total ? Math.round((r.done / r.total) * 100) : 0;
    return `${i + 1}. ${r.code} — ${r.title}\n   Progress: ${r.done}/${r.total} lessons (${pct}%)${r.quiz_passed ? ' · ✅ Completed' : ''}`;
  });
  const keyboard = rows.results.map((r) => [
    { text: `📖 ${r.code} — Open`, web_app: { url: `${miniAppUrl(env)}?startapp=course_${r.id}` } },
    ...(r.channel ? [{ text: '🔑 Channel', callback_data: `chan:${r.id}` }] : []),
  ]);
  const text = '📚 Your courses:\n\n' + lines.join('\n\n');
  if (cb) return tg(env, 'editMessageText', { chat_id: cb.message.chat.id, message_id: cb.message.message_id, text, reply_markup: { inline_keyboard: keyboard } });
  return send(env, chatId, text, { reply_markup: { inline_keyboard: keyboard } });
}

async function status(env, chatId) {
  const user = await userByTg(env, chatId);
  if (!user) return send(env, chatId, 'Not linked. Open the website dashboard and tap "Link Telegram".');
  const enrolled = await env.DB.prepare('SELECT COUNT(*) AS n FROM enrollments WHERE user_id = ?').bind(user.id).first();
  const due = await env.DB.prepare("SELECT COUNT(*) AS n, COALESCE(SUM(amount),0) AS sum FROM installments WHERE user_id = ? AND status = 'pending' AND due_date <= ?").bind(user.id, Date.now()).first();
  const pendingProofs = await env.DB.prepare("SELECT COUNT(*) AS n FROM payments WHERE user_id = ? AND status = 'proof_submitted'").bind(user.id).first();
  return send(env, chatId, [
    `👤 ${user.name} (${user.role})`,
    `📚 Enrolled courses: ${enrolled.n}`,
    `🧾 Proofs awaiting approval: ${pendingProofs.n}`,
    due.n ? `⚠️ Due installments: ${due.n} (₦${Number(due.sum).toLocaleString()})` : '✅ No overdue installments',
  ].join('\n'));
}

// ============================================
// CALLBACKS (admin approvals + navigation)
// ============================================
async function handleCallback(cb, env) {
  const data = cb.data || '';
  const fromId = cb.from.id;

  if (data === 'nav:mycourses') { await tg(env, 'answerCallbackQuery', { callback_query_id: cb.id }); return myCourses(env, fromId, cb); }
  if (data.startsWith('chan:')) { await tg(env, 'answerCallbackQuery', { callback_query_id: cb.id }); return channelById(env, fromId, data.slice(5), cb); }

  if (data.startsWith('payA:') || data.startsWith('payR:') || data.startsWith('instA:') || data.startsWith('instR:')) {
    if (!(await isAdminActor(env, cb))) {
      return tg(env, 'answerCallbackQuery', { callback_query_id: cb.id, text: 'Admins only', show_alert: true });
    }
    await tg(env, 'answerCallbackQuery', { callback_query_id: cb.id });
    const approve = data[3] === 'A';
    const ref = data.slice(4);
    const resultText = data.startsWith('pay')
      ? await settlePayment(env, ref, approve, cb.from.first_name)
      : await settleInstallment(env, ref, approve, cb.from.first_name);
    return tg(env, 'editMessageText', { chat_id: cb.message.chat.id, message_id: cb.message.message_id, text: resultText });
  }
  return tg(env, 'answerCallbackQuery', { callback_query_id: cb.id });
}

async function settlePayment(env, reference, approve, adminName) {
  const payment = await env.DB.prepare('SELECT * FROM payments WHERE reference = ?').bind(reference).first();
  if (!payment) return `Payment ${reference} not found.`;
  if (payment.status === 'paid') return `Payment ${reference} was already approved.`;
  if (approve) {
    await env.DB.prepare("UPDATE payments SET status = 'paid', updated_at = ? WHERE id = ?").bind(Date.now(), payment.id).run();
    if (payment.course_id) await env.DB.prepare('INSERT OR IGNORE INTO enrollments (user_id, course_id, enrolled_at) VALUES (?, ?, ?)').bind(payment.user_id, payment.course_id, Date.now()).run();
    await notifyUser(env, payment.user_id, `✅ Your payment (${reference}) was approved by ${adminName}. You're enrolled — open the app to start learning!`);
    return `✅ APPROVED by ${adminName}\nPayment: ${reference}\nStudent enrolled.`;
  }
  await env.DB.prepare("UPDATE payments SET status = 'rejected', updated_at = ? WHERE id = ?").bind(Date.now(), payment.id).run();
  await notifyUser(env, payment.user_id, `❌ Your payment proof (${reference}) was rejected. Please re-upload a clearer receipt or contact support.`);
  return `❌ REJECTED by ${adminName}\nPayment: ${reference}`;
}

async function settleInstallment(env, installmentId, approve, adminName) {
  const inst = await env.DB.prepare('SELECT * FROM installments WHERE id = ?').bind(installmentId).first();
  if (!inst) return `Installment ${installmentId} not found.`;
  if (inst.status === 'paid') return `Installment ${installmentId} was already approved.`;
  if (approve) {
    await env.DB.prepare("UPDATE installments SET status = 'paid' WHERE id = ?").bind(installmentId).run();
    // Grant course access immediately on first approved installment
    if (inst.course_id) await env.DB.prepare('INSERT OR IGNORE INTO enrollments (user_id, course_id, enrolled_at) VALUES (?, ?, ?)').bind(inst.user_id, inst.course_id, Date.now()).run();
    const remaining = await env.DB.prepare("SELECT COUNT(*) AS n FROM installments WHERE payment_id = ? AND status != 'paid'").bind(inst.payment_id).first();
    if (remaining.n === 0) await env.DB.prepare("UPDATE payments SET status = 'paid', updated_at = ? WHERE id = ?").bind(Date.now(), inst.payment_id).run();
    await notifyUser(env, inst.user_id, `✅ Installment (${inst.id}) approved by ${adminName}. ${remaining.n === 0 ? 'Plan fully paid — thank you!' : 'Keep learning — next due date applies.'}`);
    return `✅ APPROVED by ${adminName}\nInstallment: ${inst.id}\nRemaining: ${remaining.n}`;
  }
  await env.DB.prepare("UPDATE installments SET status = 'rejected' WHERE id = ?").bind(installmentId).run();
  await notifyUser(env, inst.user_id, `❌ Your installment proof (${inst.id}) was rejected. Re-upload a clearer receipt or contact support.`);
  return `❌ REJECTED by ${adminName}\nInstallment: ${inst.id}`;
}
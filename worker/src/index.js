// worker/src/index.js

// ============================================
// HELPER FUNCTIONS
// ============================================
async function verifyTelegramInitData(initData, botToken) {
  try {
    const urlParams = new URLSearchParams(initData);
    const hash = urlParams.get('hash');
    urlParams.delete('hash');
    const sortedParams = Array.from(urlParams.entries()).sort(([a], [b]) => a.localeCompare(b));
    const dataCheckString = sortedParams.map(([key, value]) => `${key}=${value}`).join('\n');
    const encoder = new TextEncoder();
    const secretKey = await crypto.subtle.importKey('raw', encoder.encode('WebAppData'), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']);
    const secret = await crypto.subtle.sign('HMAC', secretKey, encoder.encode(botToken));
    const key = await crypto.subtle.importKey('raw', secret, { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']);
    const computedHash = await crypto.subtle.sign('HMAC', key, encoder.encode(dataCheckString));
    const hashArray = Array.from(new Uint8Array(computedHash));
    const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
    return hashHex === hash;
  } catch (e) { return false; }
}

function getEmbedUrl(url, type) {
  if (!url) return null;
  const ytMatch = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([^&\s?]+)/);
  if (ytMatch) return `https://www.youtube.com/embed/${ytMatch[1]}?rel=0&modestbranding=1`;
  const vimeoMatch = url.match(/vimeo\.com\/(\d+)/);
  if (vimeoMatch) return `https://player.vimeo.com/video/${vimeoMatch[1]}`;
  if (url.includes('drive.google.com')) {
    const driveMatch = url.match(/\/file\/d\/([^/]+)/);
    if (driveMatch) return `https://docs.google.com/viewer?url=https://drive.google.com/uc?id=${driveMatch[1]}&embedded=true`;
  }
  if (type === 'document' && url.endsWith('.pdf')) {
    return `https://docs.google.com/viewer?url=${encodeURIComponent(url)}&embedded=true`;
  }
  return url;
}

async function logAudit(env, adminId, action, details) {
  try {
    const id = 'audit_' + Math.random().toString(36).slice(2, 10);
    await env.DB.prepare('INSERT INTO audit_logs (id, admin_id, action, details, created_at) VALUES (?, ?, ?, ?, ?)').bind(id, adminId, action, details, Date.now()).run();
  } catch (e) { console.error('Failed to log audit:', e); }
}

// ✅ UPDATED: Secure Password Hashing (PBKDF2 with Salt)
async function hashPassword(password) {
  const encoder = new TextEncoder();
  const salt = crypto.getRandomValues(new Uint8Array(16));
  const keyMaterial = await crypto.subtle.importKey(
    'raw', encoder.encode(password), { name: 'PBKDF2' }, false, ['deriveBits']
  );
  const derivedBits = await crypto.subtle.deriveBits(
    { name: 'PBKDF2', salt, iterations: 100000, hash: 'SHA-256' },
    keyMaterial, 256
  );
  const hashArray = Array.from(new Uint8Array(derivedBits));
  const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  const saltHex = Array.from(salt).map(b => b.toString(16).padStart(2, '0')).join('');
  return `${saltHex}:${hashHex}`;
}

// ✅ NEW: Secure Password Verification (Null-safe)
async function verifyPassword(password, storedHash) {
  if (!storedHash) return false; // ✅ Prevent crash if user has no password (e.g., Telegram-only)
  try {
    const [saltHex, hashHex] = storedHash.split(':');
    const salt = new Uint8Array(saltHex.match(/.{1,2}/g).map(byte => parseInt(byte, 16)));
    const encoder = new TextEncoder();
    const keyMaterial = await crypto.subtle.importKey(
      'raw', encoder.encode(password), { name: 'PBKDF2' }, false, ['deriveBits']
    );
    const derivedBits = await crypto.subtle.deriveBits(
      { name: 'PBKDF2', salt, iterations: 100000, hash: 'SHA-256' },
      keyMaterial, 256
    );
    const computedHash = Array.from(new Uint8Array(derivedBits)).map(b => b.toString(16).padStart(2, '0')).join('');
    return computedHash === hashHex;
  } catch (e) {
    return false;
  }
}

// ✅ NEW: Cookie Helpers for HttpOnly Sessions
function getCookie(request, name) {
  const cookie = request.headers.get('Cookie') || '';
  const match = cookie.match(new RegExp(`(?:^|; )${name}=([^;]*)`));
  return match ? decodeURIComponent(match[1]) : null;
}

// ✅ FIXED: Changed SameSite=Strict to SameSite=None for cross-site fetch requests to work
function setCookie(name, value, maxAge) {
  return `${name}=${encodeURIComponent(value)}; Path=/; Max-Age=${maxAge}; HttpOnly; Secure; SameSite=None`;
}

// ✅ NEW: Rate Limiting Helper (with graceful fallback)
async function checkRateLimit(env, identifier, limit = 10, windowMs = 3600000) {
  try {
    const now = Date.now();
    const windowStart = now - windowMs;
    await env.DB.prepare('DELETE FROM rate_limits WHERE identifier = ? AND timestamp < ?').bind(identifier, windowStart).run();
    const count = await env.DB.prepare('SELECT COUNT(*) as c FROM rate_limits WHERE identifier = ?').bind(identifier).first();
    if (count.c >= limit) return false;
    await env.DB.prepare('INSERT INTO rate_limits (identifier, timestamp) VALUES (?, ?)').bind(identifier, now).run();
    return true;
  } catch (e) {
    // If rate_limits table doesn't exist, fail open (allow the request)
    console.error('Rate limit check failed:', e);
    return true;
  }
}

// ============================================
// BADGE ENGINE (server-side, integrity-safe)
// ============================================
async function evaluateBadges(env, userId, courseId) {
  const awarded = [];
  const earned = new Set((await env.DB.prepare('SELECT badge_id FROM user_badges WHERE user_id = ?').bind(userId).all()).results.map(r => r.badge_id));
  
  const grant = async (id) => {
    if (earned.has(id)) return;
    await env.DB.prepare('INSERT OR IGNORE INTO user_badges (user_id, badge_id, earned_at) VALUES (?, ?, ?)').bind(userId, id, Date.now()).run();
    earned.add(id); 
    awarded.push(id);
  };

  const done = (await env.DB.prepare('SELECT COUNT(*) n FROM lesson_completions WHERE user_id = ?').bind(userId).first()).n;
  if (done >= 1) await grant('first_steps');

  const w7 = (await env.DB.prepare('SELECT COUNT(DISTINCT completed_at / 86400000) n FROM lesson_completions WHERE user_id = ? AND completed_at > ?').bind(userId, Date.now() - 7 * 86400000).first()).n;
  if (w7 >= 7) await grant('streak_7');
  
  const w30 = (await env.DB.prepare('SELECT COUNT(DISTINCT completed_at / 86400000) n FROM lesson_completions WHERE user_id = ? AND completed_at > ?').bind(userId, Date.now() - 30 * 86400000).first()).n;
  if (w30 >= 30) await grant('streak_30');

  if (courseId) {
    const mod = await env.DB.prepare(`SELECT m.id FROM modules m WHERE m.course_id = ?
      AND (SELECT COUNT(*) FROM lessons l WHERE l.module_id = m.id) > 0
      AND (SELECT COUNT(*) FROM lessons l WHERE l.module_id = m.id) =
          (SELECT COUNT(*) FROM lesson_completions lc JOIN lessons l ON l.id = lc.lesson_id WHERE l.module_id = m.id AND lc.user_id = ?)
      LIMIT 1`).bind(courseId, userId).first();
    if (mod) await grant('module_master');

    const enr = await env.DB.prepare('SELECT quiz_passed, quiz_score, quiz_total FROM enrollments WHERE user_id = ? AND course_id = ?').bind(userId, courseId).first();
    if (enr && enr.quiz_passed) {
      await grant('gate_keeper');
      if (enr.quiz_total > 0 && enr.quiz_score === enr.quiz_total) await grant('perfect_gate');
    }
    
    const tot = await env.DB.prepare(`SELECT (SELECT COUNT(*) FROM lessons WHERE course_id = ?) total,
      (SELECT COUNT(*) FROM lesson_completions lc JOIN lessons l ON l.id = lc.lesson_id WHERE l.course_id = ? AND lc.user_id = ?) done`).bind(courseId, courseId, userId).first();
    if (tot && tot.total > 0 && tot.done >= tot.total && enr && enr.quiz_passed) await grant('course_conqueror');
    
    const cert = await env.DB.prepare('SELECT 1 ok FROM certificates WHERE user_id = ? AND course_id = ?').bind(userId, courseId).first();
    if (cert) await grant('certified');
  }

  const pay = await env.DB.prepare(`SELECT 1 ok FROM payments WHERE user_id = ? AND status = 'paid' AND payment_plan = 'full' LIMIT 1`).bind(userId).first();
  if (pay) await grant('settled');
  
  const meet = await env.DB.prepare(`SELECT 1 ok FROM meetup_attendees WHERE user_id = ? LIMIT 1`).bind(userId).first();
  if (meet) await grant('community');
  
  const ment = await env.DB.prepare(`SELECT 1 ok FROM mentorship_applications WHERE user_id = ? AND status = 'agreed' LIMIT 1`).bind(userId).first();
  if (ment) await grant('mentored');

  return awarded;
}

// ============================================
// TELEGRAM BOT LOGIC (INLINED)
// ============================================
const tgApi = (env, method, body) =>
  fetch(`https://api.telegram.org/bot${env.BOT_TOKEN}/${method}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  }).then((r) => r.json());

const sendMsg = (env, chat_id, text, extra = {}) =>
  tgApi(env, 'sendMessage', { chat_id, text, parse_mode: 'Markdown', disable_web_page_preview: true, ...extra });

const getMiniAppUrl = (env) => env.MINI_APP_URL || `https://t.me/${env.BOT_USERNAME || 'jsagebutlerbot'}/app`;
const getSiteUrl = (env) => env.SITE_URL || 'https://tigerslair.academy';

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
  if (user && user.telegram_id) await sendMsg(env, user.telegram_id, text);
}

async function handleTelegramUpdate(request, env) {
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

async function handleMessage(msg, env) {
  const chatId = msg.chat.id;
  if (msg.chat.type !== 'private') return;

  if (msg.photo && msg.photo.length) {
    const session = await env.DB.prepare('SELECT * FROM bot_sessions WHERE telegram_id = ?').bind(String(chatId)).first();
    if (!session) return sendMsg(env, chatId, 'No pending proof request. Use /proof <REFERENCE> first, or tap "Upload Proof" from your dashboard.');
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
    return sendMsg(env, chatId, "🚀 Tiger's Lair Academy — learn, track progress, get certified.", {
      reply_markup: { inline_keyboard: [
        [{ text: '🚀 Launch Academy App', web_app: { url: getMiniAppUrl(env) } }],
        [{ text: '🌐 Open Website', url: getSiteUrl(env) }],
      ] },
    });
  }
  if (cmd === '/mycourses') return myCourses(env, chatId);
  if (cmd === '/channel' || cmd === '/group') return channelByCode(env, chatId, text.split(' ')[1] || '');
  if (cmd === '/proof') {
    const ref = text.split(' ')[1];
    if (!ref) return sendMsg(env, chatId, 'Usage: /proof <PAYMENT-REFERENCE>');
    return startProofSession(env, chatId, ref);
  }
  if (cmd === '/status') return status(env, chatId);
  return sendMsg(env, chatId, HELP_TEXT, {
    reply_markup: { inline_keyboard: [
      [{ text: '🚀 Launch App', web_app: { url: getMiniAppUrl(env) } }],
      [{ text: '📚 My Courses', callback_data: 'nav:mycourses' }],
      [{ text: '🔗 Link Website Account', url: `${getSiteUrl(env)}/?link=1` }],
    ] },
  });
}

async function handleStart(env, chatId, payload) {
  if (!payload) {
    return sendMsg(env, chatId, "Welcome to the Tiger's Lair Academy Bot! 🐯\nUse /help to see everything I can do.", {
      reply_markup: { inline_keyboard: [
        [{ text: '🚀 Launch Academy App', web_app: { url: getMiniAppUrl(env) } }],
        [{ text: '📚 My Courses', callback_data: 'nav:mycourses' }],
        [{ text: '🔗 Link Website Account', url: `${getSiteUrl(env)}/?link=1` }],
      ] },
    });
  }
  if (payload.startsWith('link_')) {
    const userId = payload.slice(5);
    const user = await env.DB.prepare('SELECT * FROM users WHERE id = ?').bind(userId).first();
    if (!user) return sendMsg(env, chatId, 'Account not found. Start the link again from your dashboard.');
    await env.DB.prepare('UPDATE users SET telegram_id = ? WHERE id = ?').bind(String(chatId), userId).run();
    return sendMsg(env, chatId, `✅ Linked! Welcome, ${user.name}. You'll now receive lesson drops, reminders and payment updates here.`);
  }
  if (payload.startsWith('chan_')) return channelById(env, chatId, payload.slice(5));
  if (payload.startsWith('INST_PROOF_')) return startProofSession(env, chatId, payload.slice(11));
  if (payload.startsWith('PROOF_')) return startProofSession(env, chatId, payload.slice(6));
  if (payload.startsWith('INST_')) return startProofSession(env, chatId, payload.slice(5));
  return sendMsg(env, chatId, HELP_TEXT);
}

async function startProofSession(env, chatId, reference) {
  const payment = await env.DB.prepare('SELECT * FROM payments WHERE reference = ?').bind(reference).first();
  const installment = !payment ? await env.DB.prepare('SELECT * FROM installments WHERE id = ?').bind(reference).first() : null;
  if (!payment && !installment) return sendMsg(env, chatId, `Reference "${reference}" not found. Check your dashboard for the exact reference.`);
  const userId = payment ? payment.user_id : installment.user_id;

  await env.DB.prepare('INSERT OR REPLACE INTO bot_sessions (telegram_id, user_id, purpose, reference, created_at) VALUES (?, ?, ?, ?, ?)')
    .bind(String(chatId), userId, payment ? 'payment' : 'installment', reference, Date.now()).run();
  if (payment) await env.DB.prepare("UPDATE payments SET status = 'proof_submitted' WHERE reference = ? AND status = 'pending'").bind(reference).run();
  if (installment) await env.DB.prepare("UPDATE installments SET status = 'proof_submitted' WHERE id = ? AND status = 'pending'").bind(reference).run();

  return sendMsg(env, chatId, '📸 Proof request opened.\nNow send the PHOTO of your payment receipt here (as a photo, not a file).');
}

async function forwardProof(env, session, fileId) {
  const chatId = session.telegram_id;
  let caption = '';
  let keyboard = [];

  if (session.purpose === 'payment') {
    const row = await env.DB.prepare(`SELECT p.*, u.name, u.email, c.title AS course_title FROM payments p JOIN users u ON u.id = p.user_id LEFT JOIN courses c ON c.id = p.course_id WHERE p.reference = ?`).bind(session.reference).first();
    if (!row) return sendMsg(env, chatId, 'Payment reference expired. Use /proof <REF> again.');
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
    if (!row) return sendMsg(env, chatId, 'Installment reference expired. Use /proof <REF> again.');
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

  if (!env.ADMIN_CHANNEL_ID) return sendMsg(env, chatId, 'Admin channel not configured. Contact support.');
  await tgApi(env, 'sendPhoto', { chat_id: env.ADMIN_CHANNEL_ID, photo: fileId, caption, reply_markup: { inline_keyboard: keyboard } });
  await env.DB.prepare('DELETE FROM bot_sessions WHERE telegram_id = ?').bind(String(chatId)).run();
  return sendMsg(env, chatId, "✅ Proof forwarded to the admin team. You'll get a notification here once it's approved.");
}

async function channelByCode(env, chatId, code) {
  const course = await env.DB.prepare('SELECT * FROM courses WHERE UPPER(code) = UPPER(?)').bind(code).first();
  if (!course) return sendMsg(env, chatId, `No course found with code "${code}". Use /mycourses to see your courses.`);
  return channelById(env, chatId, course.id);
}

async function channelById(env, chatId, courseId, cb) {
  const user = await userByTg(env, chatId);
  if (!user) return sendMsg(env, chatId, 'Link your account first from the website dashboard.');
  const enrolled = await env.DB.prepare('SELECT 1 AS ok FROM enrollments WHERE user_id = ? AND course_id = ?').bind(user.id, courseId).first();
  if (!enrolled) return sendMsg(env, chatId, "🔒 You're not enrolled in this course, so I can't share its private channel.");
  const course = await env.DB.prepare('SELECT * FROM courses WHERE id = ?').bind(courseId).first();
  const chat = normalizeChat(course.channel);
  if (!chat) return sendMsg(env, chatId, "This course doesn't have a Telegram channel configured yet.");
  const link = await tgApi(env, 'createChatInviteLink', {
    chat_id: chat,
    member_limit: 1,
    expire_date: Math.floor(Date.now() / 1000) + 3600,
    name: `${user.name} — ${course.code}`,
  });
  if (!link.ok) return sendMsg(env, chatId, `Couldn't create an invite (${link.description}). Is the bot an admin of the channel with invite rights?`);
  const text = `🔑 One-time invite to ${course.code} channel (valid 1 hour, 1 use):\n${link.result.invite_link}`;
  if (cb) return tgApi(env, 'editMessageText', { chat_id: cb.message.chat.id, message_id: cb.message.message_id, text });
  return sendMsg(env, chatId, text);
}

async function myCourses(env, chatId, cb) {
  const user = await userByTg(env, chatId);
  if (!user) return sendMsg(env, chatId, "Your Telegram isn't linked to a student account. Open the dashboard and tap \"Link Telegram\".", {
    reply_markup: { inline_keyboard: [[{ text: '🔗 Link Account', url: `${getSiteUrl(env)}/?link=1` }]] },
  });
  const rows = await env.DB.prepare(`SELECT c.id, c.code, c.title, c.channel, e.quiz_passed,
      (SELECT COUNT(*) FROM lessons l WHERE l.course_id = c.id) AS total,
      (SELECT COUNT(*) FROM lesson_completions lc JOIN lessons l ON l.id = lc.lesson_id WHERE l.course_id = c.id AND lc.user_id = ?) AS done
    FROM enrollments e JOIN courses c ON c.id = e.course_id WHERE e.user_id = ? ORDER BY e.enrolled_at DESC`).bind(user.id, user.id).all();
  if (!rows.results.length) return sendMsg(env, chatId, "You haven't enrolled in any course yet. Browse the catalogue in the app.");
  const lines = rows.results.map((r, i) => {
    const pct = r.total ? Math.round((r.done / r.total) * 100) : 0;
    return `${i + 1}. ${r.code} — ${r.title}\n   Progress: ${r.done}/${r.total} lessons (${pct}%)${r.quiz_passed ? ' · ✅ Completed' : ''}`;
  });
  const keyboard = rows.results.map((r) => [
    { text: `📖 ${r.code} — Open`, web_app: { url: `${getMiniAppUrl(env)}?startapp=course_${r.id}` } },
    ...(r.channel ? [{ text: '🔑 Channel', callback_data: `chan:${r.id}` }] : []),
  ]);
  const text = '📚 Your courses:\n\n' + lines.join('\n\n');
  if (cb) return tgApi(env, 'editMessageText', { chat_id: cb.message.chat.id, message_id: cb.message.message_id, text, reply_markup: { inline_keyboard: keyboard } });
  return sendMsg(env, chatId, text, { reply_markup: { inline_keyboard: keyboard } });
}

async function status(env, chatId) {
  const user = await userByTg(env, chatId);
  if (!user) return sendMsg(env, chatId, 'Not linked. Open the website dashboard and tap "Link Telegram".');
  const enrolled = await env.DB.prepare('SELECT COUNT(*) AS n FROM enrollments WHERE user_id = ?').bind(user.id).first();
  const due = await env.DB.prepare("SELECT COUNT(*) AS n, COALESCE(SUM(amount),0) AS sum FROM installments WHERE user_id = ? AND status = 'pending' AND due_date <= ?").bind(user.id, Date.now()).first();
  const pendingProofs = await env.DB.prepare("SELECT COUNT(*) AS n FROM payments WHERE user_id = ? AND status = 'proof_submitted'").bind(user.id).first();
  return sendMsg(env, chatId, [
    `👤 ${user.name} (${user.role})`,
    `📚 Enrolled courses: ${enrolled.n}`,
    `🧾 Proofs awaiting approval: ${pendingProofs.n}`,
    due.n ? `⚠️ Due installments: ${due.n} (₦${Number(due.sum).toLocaleString()})` : '✅ No overdue installments',
  ].join('\n'));
}

async function handleCallback(cb, env) {
  const data = cb.data || '';
  const fromId = cb.from.id;

  if (data === 'nav:mycourses') { await tgApi(env, 'answerCallbackQuery', { callback_query_id: cb.id }); return myCourses(env, fromId, cb); }
  if (data.startsWith('chan:')) { await tgApi(env, 'answerCallbackQuery', { callback_query_id: cb.id }); return channelById(env, fromId, data.slice(5), cb); }

  if (data.startsWith('payA:') || data.startsWith('payR:') || data.startsWith('instA:') || data.startsWith('instR:')) {
    if (!(await isAdminActor(env, cb))) {
      return tgApi(env, 'answerCallbackQuery', { callback_query_id: cb.id, text: 'Admins only', show_alert: true });
    }
    await tgApi(env, 'answerCallbackQuery', { callback_query_id: cb.id });
    const approve = data[3] === 'A';
    const ref = data.slice(4);
    const resultText = data.startsWith('pay')
      ? await settlePayment(env, ref, approve, cb.from.first_name)
      : await settleInstallment(env, ref, approve, cb.from.first_name);
    return tgApi(env, 'editMessageText', { chat_id: cb.message.chat.id, message_id: cb.message.message_id, text: resultText });
  }
  return tgApi(env, 'answerCallbackQuery', { callback_query_id: cb.id });
}

async function settlePayment(env, reference, approve, adminName) {
  const payment = await env.DB.prepare('SELECT * FROM payments WHERE reference = ?').bind(reference).first();
  if (!payment) return `Payment ${reference} not found.`;
  if (payment.status === 'paid') return `Payment ${reference} was already approved.`;
  if (approve) {
    await env.DB.prepare("UPDATE payments SET status = 'paid', updated_at = ? WHERE id = ?").bind(Date.now(), payment.id).run();
    if (payment.course_id) await env.DB.prepare('INSERT OR IGNORE INTO enrollments (user_id, course_id, enrolled_at) VALUES (?, ?, ?)').bind(payment.user_id, payment.course_id, Date.now()).run();
    
    await evaluateBadges(env, payment.user_id, payment.course_id);
    
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
    if (inst.course_id) await env.DB.prepare('INSERT OR IGNORE INTO enrollments (user_id, course_id, enrolled_at) VALUES (?, ?, ?)').bind(inst.user_id, inst.course_id, Date.now()).run();
    const remaining = await env.DB.prepare("SELECT COUNT(*) AS n FROM installments WHERE payment_id = ? AND status != 'paid'").bind(inst.payment_id).first();
    if (remaining.n === 0) await env.DB.prepare("UPDATE payments SET status = 'paid', updated_at = ? WHERE id = ?").bind(Date.now(), inst.payment_id).run();
    
    await evaluateBadges(env, inst.user_id, inst.course_id);
    
    await notifyUser(env, inst.user_id, `✅ Installment (${inst.id}) approved by ${adminName}. ${remaining.n === 0 ? 'Plan fully paid — thank you!' : 'Keep learning — next due date applies.'}`);
    return `✅ APPROVED by ${adminName}\nInstallment: ${inst.id}\nRemaining: ${remaining.n}`;
  }
  await env.DB.prepare("UPDATE installments SET status = 'rejected' WHERE id = ?").bind(installmentId).run();
  await notifyUser(env, inst.user_id, `❌ Your installment proof (${inst.id}) was rejected. Re-upload a clearer receipt or contact support.`);
  return `❌ REJECTED by ${adminName}\nInstallment: ${inst.id}`;
}

// ============================================
// MAIN WORKER EXPORT
// ============================================
export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    const path = url.pathname;
    const method = request.method;

    const parts = path.split('/').filter(Boolean);

    const origin = request.headers.get('Origin') || '';
    const allowedOrigins = [
      'https://tigerslair.academy',
      'https://tigerslair-api.ehisferguson.workers.dev',
      'http://localhost:5173',
      'http://localhost:3000',
      'http://localhost:4173'
    ];
    const isAllowedOrigin = allowedOrigins.includes(origin) || origin.endsWith('.telegram.org') || origin.endsWith('.pages.dev');
    
    const corsHeaders = {
      'Access-Control-Allow-Origin': isAllowedOrigin ? origin : allowedOrigins[0],
      'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization, Cookie',
      'Access-Control-Allow-Credentials': 'true',
      'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0',
      'Pragma': 'no-cache',
      'Expires': '0',
      'Surrogate-Control': 'no-store'
    };

    if (method === 'OPTIONS') return new Response(null, { headers: corsHeaders });

    const uid = () => Math.random().toString(36).slice(2, 10);
    
    // ✅ UPDATED: Get token from HttpOnly cookie instead of Authorization header
    const getToken = () => getCookie(request, 'tigerslair.session');
    const json = (data, status = 200) => Response.json(data, { status, headers: corsHeaders });
    const error = (msg, status) => json({ error: msg }, status);

    // Helper for auth responses with cookies
    const authResponse = (data, status = 200, cookies = []) => {
      const headers = new Headers(corsHeaders);
      cookies.forEach(c => headers.append('Set-Cookie', c));
      return new Response(JSON.stringify(data), { status, headers });
    };

    try {
      // ============================================
      // TELEGRAM BOT WEBHOOK + SETUP
      // ============================================
      if (path === '/api/telegram/webhook' && method === 'POST') {
        return handleTelegramUpdate(request, env);
      }

      if (path === '/api/telegram/setup-webhook' && method === 'POST') {
        const token = getToken();
        const admin = await env.DB.prepare('SELECT role FROM users WHERE id = ?').bind(token).first();
        if (!admin || admin.role !== 'admin') return error('Forbidden', 403);
        const webhookUrl = `${url.origin}/api/telegram/webhook`;
        const appUrl = env.MINI_APP_URL || `https://t.me/${env.BOT_USERNAME || 'jsagebutlerbot'}/app`;
        const setWebhook = await fetch(`https://api.telegram.org/bot${env.BOT_TOKEN}/setWebhook`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ url: webhookUrl, secret_token: env.TG_WEBHOOK_SECRET || '', drop_pending_updates: true, allowed_updates: ['message', 'callback_query'] }) }).then(r => r.json());
        const setCommands = await fetch(`https://api.telegram.org/bot${env.BOT_TOKEN}/setMyCommands`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ commands: [
          { command: 'start', description: 'Start & main menu' },
          { command: 'app', description: 'Launch the Academy Mini App' },
          { command: 'mycourses', description: 'My courses & progress' },
          { command: 'channel', description: 'Course channel invite (/channel CODE)' },
          { command: 'proof', description: 'Send bank-transfer proof (/proof REF)' },
          { command: 'status', description: 'My account status' },
          { command: 'help', description: 'Help & commands' },
        ] }) }).then(r => r.json());
        const setMenu = await fetch(`https://api.telegram.org/bot${env.BOT_TOKEN}/setChatMenuButton`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ menu_button: { type: 'web_app', text: 'Launch Academy', web_app: { url: appUrl } } }) }).then(r => r.json());
        return json({ setWebhook, setCommands, setMenu });
      }

      // ============================================
      // PAYSTACK WEBHOOK
      // ============================================
      if (path === '/api/webhooks/paystack' && method === 'POST') {
        const bodyText = await request.text();
        const signature = request.headers.get('x-paystack-signature');
        const encoder = new TextEncoder();
        const key = await crypto.subtle.importKey('raw', encoder.encode(env.PAYSTACK_SECRET_KEY), { name: 'HMAC', hash: 'SHA-512' }, false, ['sign']);
        const hashBuffer = await crypto.subtle.sign('HMAC', key, encoder.encode(bodyText));
        const hashArray = Array.from(new Uint8Array(hashBuffer));
        const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
        if (hashHex !== signature) return error('Invalid signature', 400);
        const body = JSON.parse(bodyText);
        if (body.event === 'charge.success') {
          const data = body.data;
          const reference = data.reference;
          const payment = await env.DB.prepare('SELECT * FROM payments WHERE reference = ?').bind(reference).first();
          if (payment && payment.status === 'pending') {
            await env.DB.prepare('UPDATE payments SET status = ?, paystack_ref = ?, updated_at = ? WHERE id = ?').bind('paid', data.reference, Date.now(), payment.id).run();
            if (payment.course_id) await env.DB.prepare('INSERT OR IGNORE INTO enrollments (user_id, course_id, enrolled_at) VALUES (?, ?, ?)').bind(payment.user_id, payment.course_id, Date.now()).run();
          }
        }
        return json({ status: 'success' });
      }

      // ============================================
      // PAYMENTS API
      // ============================================
      if (path === '/api/payments/initiate' && method === 'POST') {
        const token = getToken();
        if (!token) return error('Unauthorized', 401);
        const { courseId, mentorshipAppId, amount, method, currency, paymentPlan, months } = await request.json();
        const reference = 'TL-' + Date.now() + '-' + uid();
        const now = Date.now();
        await env.DB.prepare('INSERT INTO payments (id, user_id, course_id, mentorship_app_id, amount, method, currency, payment_plan, reference, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)').bind(reference, token, courseId || null, mentorshipAppId || null, amount, method, currency || 'NGN', paymentPlan || 'full', reference, now, now).run();
        if (paymentPlan === 'installment' && months > 1) {
          const monthlyAmount = Math.ceil(amount / months);
          for (let i = 1; i <= months; i++) {
            const instId = 'inst_' + uid();
            const dueDate = now + (i * 30 * 24 * 60 * 60 * 1000);
            await env.DB.prepare('INSERT INTO installments (id, payment_id, user_id, course_id, amount, due_date, created_at) VALUES (?, ?, ?, ?, ?, ?, ?)').bind(instId, reference, token, courseId || null, monthlyAmount, dueDate, now).run();
          }
        }
        return json({ data: { reference, amount, currency: currency || 'NGN', paymentPlan, months } });
      }

      if (path === '/api/payments/submit-proof' && method === 'POST') {
        const token = getToken();
        if (!token) return error('Unauthorized', 401);
        const { reference, proofUrl } = await request.json();
        await env.DB.prepare('UPDATE payments SET status = ?, proof_url = ?, updated_at = ? WHERE reference = ? AND user_id = ?').bind('proof_submitted', proofUrl, Date.now(), reference, token).run();
        return json({ success: true });
      }

      if (path === '/api/payments/approve' && method === 'POST') {
        const { reference } = await request.json();
        const adminId = getToken(); // ✅ Reads from HttpOnly cookie
        if (!adminId) return error('Unauthorized', 401);

        const admin = await env.DB.prepare('SELECT role FROM users WHERE id = ?').bind(adminId).first();
        if (!admin || admin.role !== 'admin') return error('Forbidden', 403);
        
        const payment = await env.DB.prepare('SELECT * FROM payments WHERE reference = ?').bind(reference).first();
        if (!payment) return error('Payment not found', 404);
        
        await env.DB.prepare('UPDATE payments SET status = ?, updated_at = ? WHERE id = ?').bind('paid', Date.now(), payment.id).run();
        if (payment.course_id) await env.DB.prepare('INSERT OR IGNORE INTO enrollments (user_id, course_id, enrolled_at) VALUES (?, ?, ?)').bind(payment.user_id, payment.course_id, Date.now()).run();
        
        await evaluateBadges(env, payment.user_id, payment.course_id);
        await logAudit(env, adminId, 'PAYMENT_APPROVED', `Approved payment reference: ${reference}`);
        
        return json({ success: true });
      }

      // ============================================
      // INSTALLMENTS API
      // ============================================
      if (path === '/api/installments/my' && method === 'GET') {
        const token = getToken();
        if (!token) return error('Unauthorized', 401);
        const installments = await env.DB.prepare(`SELECT i.*, c.title as course_title FROM installments i LEFT JOIN courses c ON i.course_id = c.id WHERE i.user_id = ? AND i.status != 'paid' ORDER BY i.due_date ASC`).bind(token).all();
        return json({ data: installments.results });
      }

      if (path === '/api/installments/submit-proof' && method === 'POST') {
        const token = getToken();
        if (!token) return error('Unauthorized', 401);
        const { installmentId, proofUrl } = await request.json();
        await env.DB.prepare('UPDATE installments SET status = ?, proof_url = ? WHERE id = ? AND user_id = ?').bind('proof_submitted', proofUrl, installmentId, token).run();
        return json({ success: true });
      }

      if (path === '/api/installments/approve' && method === 'POST') {
        const { installmentId } = await request.json();
        const adminId = getToken(); // ✅ Reads from HttpOnly cookie
        if (!adminId) return error('Unauthorized', 401);

        const admin = await env.DB.prepare('SELECT role FROM users WHERE id = ?').bind(adminId).first();
        if (!admin || admin.role !== 'admin') return error('Forbidden', 403);
        
        const inst = await env.DB.prepare('SELECT * FROM installments WHERE id = ?').bind(installmentId).first();
        if (!inst) return error('Installment not found', 404);
        
        await env.DB.prepare('UPDATE installments SET status = ? WHERE id = ?').bind('paid', installmentId).run();
        const pendingCount = await env.DB.prepare('SELECT COUNT(*) as count FROM installments WHERE payment_id = ? AND status != ?', inst.payment_id, 'paid').first();
        if (pendingCount.count === 0) {
          await env.DB.prepare('UPDATE payments SET status = ? WHERE id = ?').bind('paid', inst.payment_id).run();
          if (inst.course_id) await env.DB.prepare('INSERT OR IGNORE INTO enrollments (user_id, course_id, enrolled_at) VALUES (?, ?, ?)').bind(inst.user_id, inst.course_id, Date.now()).run();
        }
        
        await evaluateBadges(env, inst.user_id, inst.course_id);
        await logAudit(env, adminId, 'INSTALLMENT_APPROVED', `Approved installment ID: ${installmentId}`);
        
        return json({ success: true });
      }
      if (path === '/api/admin/installments' && method === 'GET') {
        const token = getToken();
        const admin = await env.DB.prepare('SELECT role FROM users WHERE id = ?').bind(token).first();
        if (!admin || admin.role !== 'admin') return error('Forbidden', 403);
        const installments = await env.DB.prepare(`SELECT i.*, u.name as user_name, u.email as user_email, c.title as course_title FROM installments i JOIN users u ON i.user_id = u.id LEFT JOIN courses c ON i.course_id = c.id WHERE i.status = 'proof_submitted' ORDER BY i.created_at DESC`).all();
        return json({ data: installments.results });
      }

      if (path === '/api/admin/payments' && method === 'GET') {
        const token = getToken();
        const admin = await env.DB.prepare('SELECT role FROM users WHERE id = ?').bind(token).first();
        if (!admin || admin.role !== 'admin') return error('Forbidden', 403);
        const payments = await env.DB.prepare(`SELECT p.*, u.name as user_name, u.email as user_email, c.title as course_title FROM payments p JOIN users u ON p.user_id = u.id LEFT JOIN courses c ON p.course_id = c.id ORDER BY p.created_at DESC`).all();
        return json({ data: payments.results });
      }

      // ============================================
      // COURSES API (With Safe JSON Parsing)
      // ============================================
      if (path === '/api/courses' && method === 'GET') {
        const courses = await env.DB.prepare('SELECT * FROM courses ORDER BY created_at DESC').all();
        return json({ data: courses.results });
      }

      if (path.match(/^\/api\/courses\/[^/]+$/) && method === 'GET') {
        const courseId = parts[2];
        const course = await env.DB.prepare('SELECT * FROM courses WHERE id = ?').bind(courseId).first();
        if (!course) return error('Course not found', 404);

        const modules = await env.DB.prepare('SELECT * FROM modules WHERE course_id = ? ORDER BY order_index, rowid').bind(courseId).all();
        const lessons = await env.DB.prepare('SELECT * FROM lessons WHERE course_id = ? ORDER BY order_index, rowid').bind(courseId).all();
        const quiz = await env.DB.prepare('SELECT * FROM quiz_questions WHERE course_id = ? ORDER BY order_index, rowid').bind(courseId).all();

        try { course.outcomes = JSON.parse(course.outcomes); } catch { course.outcomes = []; }
        try { course.skills = JSON.parse(course.skills); } catch { course.skills = []; }

        modules.results.forEach(m => {
          m.lessons = lessons.results.filter(l => l.module_id === m.id).map(l => {
            let safeTags = []; try { safeTags = JSON.parse(l.tags); } catch {}
            let safeBullets = []; try { safeBullets = JSON.parse(l.bullets); } catch {}
            return { ...l, tags: safeTags, bullets: safeBullets };
          });
        });

        quiz.results.forEach(q => {
          try { q.options = JSON.parse(q.options); } catch { q.options = []; }
        });

        return json({ data: { ...course, modules: modules.results, quiz: quiz.results } });
      }

      // ============================================
      // PUBLIC CERTIFICATE VERIFICATION (no auth required)
      // ============================================
      if (path.startsWith('/api/certificates/') && method === 'GET') {
        const certId = decodeURIComponent(parts[2] || '');
        const cert = await env.DB.prepare(`SELECT c.id, c.holder_name, c.score, c.total, c.issued_at, co.code AS course_code, co.title AS course_title
          FROM certificates c JOIN courses co ON co.id = c.course_id WHERE c.id = ?`).bind(certId).first();
        if (!cert) return json({ valid: false });
        return json({ valid: true, data: cert });
      }

      // ============================================
      // PASSWORD RESET FLOW
      // ============================================
      if (path === '/api/auth/forgot-password' && method === 'POST') {
        const { email } = await request.json();
        const user = await env.DB.prepare('SELECT id, name FROM users WHERE email = ?').bind(email).first();
        if (user) {
          const otp = Math.floor(100000 + Math.random() * 900000).toString();
          const expires = Date.now() + 15 * 60 * 1000;
          await env.DB.prepare('INSERT OR REPLACE INTO password_resets (user_id, token, expires_at) VALUES (?, ?, ?)').bind(user.id, otp, expires).run();
          console.log(`🔐 OTP for ${email}: ${otp}`); 
          return json({ success: true, message: 'If an account exists, an OTP has been sent.', dev_otp: otp });
        }
        return json({ success: true, message: 'If an account exists, an OTP has been sent.' });
      }

      if (path === '/api/auth/reset-password' && method === 'POST') {
        const { email, otp, newPassword } = await request.json();
        if (!newPassword || newPassword.length < 6) return error('Password must be at least 6 characters', 400);
        const user = await env.DB.prepare('SELECT id FROM users WHERE email = ?').bind(email).first();
        if (!user) return error('Invalid OTP or expired', 400);
        const reset = await env.DB.prepare('SELECT * FROM password_resets WHERE user_id = ? AND token = ? AND expires_at > ?').bind(user.id, otp, Date.now()).first();
        if (!reset) return error('Invalid OTP or expired', 400);
        const passwordHash = await hashPassword(newPassword);
        await env.DB.prepare('UPDATE users SET password_hash = ? WHERE id = ?').bind(passwordHash, user.id).run();
        await env.DB.prepare('DELETE FROM password_resets WHERE user_id = ?').bind(user.id).run();
        return json({ success: true });
      }

      // ============================================
      // AUTH API (With Secure Hashing & Rate Limiting)
      // ============================================
      if (path === '/api/auth/register' && method === 'POST') {
        const { name, email, password } = await request.json();
        if (!password || password.length < 6) return error('Password must be at least 6 characters', 400);
        
        const clientIP = request.headers.get('CF-Connecting-IP') || 'unknown';
        const isAllowed = await checkRateLimit(env, `register_${clientIP}`, 5, 3600000);
        if (!isAllowed) return error('Too many registration attempts. Please try again in an hour.', 429);

        const id = 'st_' + uid();
        const passwordHash = await hashPassword(password);
        try {
          await env.DB.prepare('INSERT INTO users (id, name, email, password_hash, joined_at) VALUES (?, ?, ?, ?, ?)').bind(id, name, email, passwordHash, Date.now()).run();
          const user = await env.DB.prepare('SELECT id, name, email, role, joined_at FROM users WHERE id = ?').bind(id).first();
          
          const cookies = [
            setCookie('tigerslair.session', id, 7 * 24 * 60 * 60),
            setCookie('tigerslair.refresh', id, 30 * 24 * 60 * 60)
          ];
          return authResponse({ data: user, success: true }, 200, cookies);
        } catch (e) { return error('Email already registered', 400); }
      }

      if (path === '/api/auth/login' && method === 'POST') {
        try {
          const { email, password } = await request.json();
          
          const clientIP = request.headers.get('CF-Connecting-IP') || 'unknown';
          const isAllowed = await checkRateLimit(env, `login_${clientIP}`, 10, 3600000);
          if (!isAllowed) return error('Too many login attempts. Please try again in an hour.', 429);

          const user = await env.DB.prepare('SELECT * FROM users WHERE email = ?').bind(email).first();
          if (!user) return error('Invalid email or password', 401);
          
          let isValid = await verifyPassword(password, user.password_hash);
          
          // ✅ Backward compatibility: migrate old SHA-256 hashes on first login
          if (!isValid && user.password_hash && user.password_hash.length === 64 && !user.password_hash.includes(':')) {
            const encoder = new TextEncoder();
            const data = encoder.encode(password);
            const hashBuffer = await crypto.subtle.digest('SHA-256', data);
            const hashArray = Array.from(new Uint8Array(hashBuffer));
            const oldHash = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
            
            if (oldHash === user.password_hash) {
              isValid = true;
              const newHash = await hashPassword(password);
              await env.DB.prepare('UPDATE users SET password_hash = ? WHERE id = ?').bind(newHash, user.id).run();
            }
          }

          if (!isValid) return error('Invalid email or password', 401);
          
          const { password_hash, ...safeUser } = user;
          
          const cookies = [
            setCookie('tigerslair.session', user.id, 7 * 24 * 60 * 60),
            setCookie('tigerslair.refresh', user.id, 30 * 24 * 60 * 60)
          ];
          return authResponse({ data: safeUser, success: true }, 200, cookies);
        } catch (loginErr) {
          console.error('Login error:', loginErr);
          return error('Login failed: ' + loginErr.message, 500);
        }
      }

      // ✅ NEW: Refresh Token Endpoint
      if (path === '/api/auth/refresh' && method === 'POST') {
        const refreshToken = getCookie(request, 'tigerslair.refresh');
        if (!refreshToken) return error('Unauthorized', 401);
        
        const user = await env.DB.prepare('SELECT id, name, email, role, joined_at FROM users WHERE id = ?').bind(refreshToken).first();
        if (!user) return error('Unauthorized', 401);
        
        const cookies = [setCookie('tigerslair.session', user.id, 7 * 24 * 60 * 60)];
        return authResponse({ data: user, success: true }, 200, cookies);
      }

      // ✅ NEW: Logout Endpoint
      if (path === '/api/auth/logout' && method === 'POST') {
        const cookies = [
          setCookie('tigerslair.session', '', 0),
          setCookie('tigerslair.refresh', '', 0)
        ];
        return authResponse({ success: true }, 200, cookies);
      }

      if (path === '/api/auth/demo' && method === 'POST') {
        const demoId = 'st_demo214';
        let user = await env.DB.prepare('SELECT * FROM users WHERE id = ?').bind(demoId).first();
        if (!user) {
          const now = Date.now();
          await env.DB.prepare('INSERT INTO users (id, name, email, telegram_id, role, joined_at) VALUES (?, ?, ?, ?, ?, ?)').bind(demoId, 'Ada Eze', 'ada@example.com', '784512390', 'student', now - 19 * 86400000).run();
          await env.DB.prepare('INSERT INTO enrollments (user_id, course_id, enrolled_at) VALUES (?, ?, ?)').bind(demoId, 'py101', now - 18 * 86400000).run();
          user = await env.DB.prepare('SELECT * FROM users WHERE id = ?').bind(demoId).first();
        }
        return json({ data: user, token: demoId }); // Note: demo still returns token for simplicity, or you can update it to use cookies
      }

      if (path === '/api/user/me' && method === 'GET') {
        const token = getToken();
        if (!token) return error('Unauthorized', 401);
        const user = await env.DB.prepare('SELECT id, name, email, role, telegram_id, joined_at FROM users WHERE id = ?').bind(token).first();
        if (!user) return error('User not found', 404);
        return json({ data: user });
      }

      // ✅ NEW: Update Profile
      if (path === '/api/user/me' && method === 'PUT') {
        const token = getToken();
        if (!token) return error('Unauthorized', 401);
        const { name, email } = await request.json();
        if (!name || !email) return error('Name and email are required', 400);
        
        try {
          await env.DB.prepare('UPDATE users SET name = ?, email = ? WHERE id = ?').bind(name, email, token).run();
          return json({ success: true });
        } catch (e) {
          return error('Email already in use', 400);
        }
      }

      // ✅ NEW: Change Password
      if (path === '/api/user/password' && method === 'PUT') {
        const token = getToken();
        if (!token) return error('Unauthorized', 401);
        const { currentPassword, newPassword } = await request.json();
        
        if (!currentPassword || !newPassword) return error('Both passwords are required', 400);
        if (newPassword.length < 6) return error('New password must be at least 6 characters', 400);
        
        const user = await env.DB.prepare('SELECT password_hash FROM users WHERE id = ?').bind(token).first();
        if (!user) return error('User not found', 404);
        
        const isValid = await verifyPassword(currentPassword, user.password_hash);
        if (!isValid) return error('Current password is incorrect', 401);
        
        const newHash = await hashPassword(newPassword);
        await env.DB.prepare('UPDATE users SET password_hash = ? WHERE id = ?').bind(newHash, token).run();
        
        return json({ success: true });
      }

      // ============================================
      // ENROLLMENTS & LESSONS
      // ============================================
      if (path === '/api/enroll' && method === 'POST') {
        const token = getToken();
        if (!token) return error('Unauthorized', 401);
        const { courseId } = await request.json();
        try {
          await env.DB.prepare('INSERT INTO enrollments (user_id, course_id, enrolled_at) VALUES (?, ?, ?)').bind(token, courseId, Date.now()).run();
          return json({ success: true });
        } catch (e) { return error('Already enrolled', 400); }
      }

      if (path === '/api/enrollments' && method === 'GET') {
        const token = getToken();
        if (!token) return error('Unauthorized', 401);
        const enrollments = await env.DB.prepare('SELECT * FROM enrollments WHERE user_id = ?').bind(token).all();
        return json({ data: enrollments.results });
      }

      if (path === '/api/lessons/complete' && method === 'POST') {
        const token = getToken();
        if (!token) return error('Unauthorized', 401);
        const { lessonId, courseId } = await request.json();
        try {
          await env.DB.prepare('INSERT INTO lesson_completions (user_id, lesson_id, completed_at) VALUES (?, ?, ?)').bind(token, lessonId, Date.now()).run();
          
          const awarded = await evaluateBadges(env, token, courseId);
          return json({ success: true, awarded });
        } catch (e) { return error('Already completed', 400); }
      }

      if (path === '/api/quiz/submit' && method === 'POST') {
        const token = getToken();
        if (!token) return error('Unauthorized', 401);
        const { courseId, score, total } = await request.json();
        const passed = score / total >= 0.7 ? 1 : 0;
        await env.DB.prepare('UPDATE enrollments SET quiz_score = ?, quiz_total = ?, quiz_passed = ? WHERE user_id = ? AND course_id = ?').bind(score, total, passed, token, courseId).run();

        if (passed) {
          try {
            const course = await env.DB.prepare('SELECT code FROM courses WHERE id = ?').bind(courseId).first();
            const totals = await env.DB.prepare('SELECT (SELECT COUNT(*) FROM lessons WHERE course_id = ?) AS lessons, (SELECT COUNT(*) FROM lesson_completions lc JOIN lessons l ON l.id = lc.lesson_id WHERE l.course_id = ? AND lc.user_id = ?) AS done').bind(courseId, courseId, token).first();
            if (course && totals && totals.lessons > 0 && totals.done >= totals.lessons) {
              const serial = (token + courseId).split('').reduce((a, ch) => a + ch.charCodeAt(0), 0);
              const certId = 'TL-' + course.code + '-' + String(serial * 7).slice(-6);
              const holder = await env.DB.prepare('SELECT name FROM users WHERE id = ?').bind(token).first();
              await env.DB.prepare('INSERT OR IGNORE INTO certificates (id, user_id, course_id, holder_name, score, total, issued_at) VALUES (?, ?, ?, ?, ?, ?, ?)').bind(certId, token, courseId, holder?.name || 'Student', score, total, Date.now()).run();
            }
          } catch (e) { console.error('Certificate issue failed:', e); }
        }
        
        const awarded = await evaluateBadges(env, token, courseId);
        return json({ passed: !!passed, awarded });
      }

      if (path === '/api/activity' && method === 'GET') {
        const token = getToken();
        if (!token) return error('Unauthorized', 401);
        const activity = await env.DB.prepare('SELECT * FROM activity_logs WHERE user_id = ? ORDER BY at DESC LIMIT 40').bind(token).all();
        return json({ data: activity.results });
      }

      // ============================================
      // TELEGRAM API (WEB)
      // ============================================
      if (path === '/api/telegram/link-mini-app' && method === 'POST') {
        const token = getToken();
        if (!token) return error('Unauthorized', 401);
        const user = await env.DB.prepare('SELECT id FROM users WHERE id = ?').bind(token).first();
        if (!user) return error('User not found', 404);
        const { initData } = await request.json();
        if (!initData) return error('Missing initData', 400);
        const isValid = await verifyTelegramInitData(initData, env.BOT_TOKEN);
        if (!isValid) return error('Invalid Telegram data', 403);
        const urlParams = new URLSearchParams(initData);
        const userData = JSON.parse(urlParams.get('user') || '{}');
        const telegramId = String(userData.id);
        if (!telegramId) return error('No Telegram ID found', 400);
        await env.DB.prepare('UPDATE users SET telegram_id = ? WHERE id = ?').bind(telegramId, user.id).run();
        return json({ success: true, telegramId });
      }

      if (path === '/api/telegram/link' && method === 'POST') {
        const token = getToken();
        if (!token) return error('Unauthorized', 401);
        const tgId = '78' + String(Math.floor(1000000 + Math.random() * 8999999));
        await env.DB.prepare('UPDATE users SET telegram_id = ? WHERE id = ?').bind(tgId, token).run();
        return json({ telegramId: tgId });
      }

      if (path === '/api/telegram/unlink' && method === 'POST') {
        const token = getToken();
        if (!token) return error('Unauthorized', 401);
        await env.DB.prepare('UPDATE users SET telegram_id = NULL WHERE id = ?').bind(token).run();
        return json({ success: true });
      }

      // ============================================
      // MENTORSHIP API
      // ============================================
      if (path === '/api/mentorship/categories' && method === 'GET') {
        const categories = await env.DB.prepare('SELECT * FROM mentorship_categories ORDER BY is_custom, name').all();
        return json({ data: categories.results });
      }

      if (path === '/api/mentors' && method === 'GET') {
        const mentors = await env.DB.prepare('SELECT * FROM mentors WHERE is_available = 1').all();
        mentors.results.forEach(m => { try { m.specialties = JSON.parse(m.specialties); } catch { m.specialties = []; } });
        return json({ data: mentors.results });
      }

      if (path === '/api/mentorship/apply' && method === 'POST') {
        const token = getToken();
        if (!token) return error('Unauthorized', 401);
        const { categoryId, customCategory, goals, experience, availability, preferredFormat } = await request.json();
        const id = 'app_' + uid();
        const paidEnrollments = await env.DB.prepare('SELECT COUNT(*) as count FROM enrollments WHERE user_id = ?').bind(token).first();
        const paymentStatus = paidEnrollments.count > 0 ? 'waived' : 'not_applicable';
        await env.DB.prepare('INSERT INTO mentorship_applications (id, user_id, category_id, custom_category, goals, experience, availability, preferred_format, payment_status, applied_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)').bind(id, token, categoryId, customCategory, goals, experience, availability, preferredFormat, paymentStatus, Date.now()).run();
        return json({ data: { id, status: 'pending', paymentStatus } });
      }

      if (path === '/api/mentorship/my-applications' && method === 'GET') {
        const token = getToken();
        if (!token) return error('Unauthorized', 401);
        const apps = await env.DB.prepare(`SELECT a.*, c.name as category_name FROM mentorship_applications a LEFT JOIN mentorship_categories c ON a.category_id = c.id WHERE a.user_id = ? ORDER BY a.applied_at DESC`).bind(token).all();
        return json({ data: apps.results });
      }

      if (path.match(/\/api\/mentorship\/application\/[^/]+\/propose/) && method === 'PUT') {
        const token = getToken();
        const appId = parts[3];
        const { price, mentorId, firstSessionDate, notes } = await request.json();
        await env.DB.prepare('UPDATE mentorship_applications SET mentor_id = ?, proposed_price = ?, start_date = ?, review_notes = ?, status = ? WHERE id = ?').bind(mentorId, price, firstSessionDate ? new Date(firstSessionDate).getTime() : null, notes, 'proposal_sent', appId).run();
        return json({ success: true });
      }

      if (path.match(/\/api\/mentorship\/application\/[^/]+\/agree/) && method === 'PUT') {
        const token = getToken();
        const appId = parts[3];
        const app = await env.DB.prepare('SELECT * FROM mentorship_applications WHERE id = ? AND user_id = ?').bind(appId, token).first();
        if (!app) return error('Application not found', 404);
        await env.DB.prepare('UPDATE mentorship_applications SET agreed_price = ?, status = ?, agreed_at = ? WHERE id = ?').bind(app.proposed_price, 'agreed', Date.now(), appId).run();
        
        await evaluateBadges(env, token, null);
        
        return json({ success: true });
      }

      // ============================================
      // COUNSELING & MEETUPS
      // ============================================
      if (path === '/api/counseling/book' && method === 'POST') {
        const token = getToken();
        if (!token) return error('Unauthorized', 401);
        const { topic, description, format, meetingLink, location, scheduledAt, duration, mentorId } = await request.json();
        const id = 'ses_' + uid();
        await env.DB.prepare('INSERT INTO counseling_sessions (id, user_id, mentor_id, topic, description, format, meeting_link, location, scheduled_at, duration_minutes, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)').bind(id, token, mentorId, topic, description, format, meetingLink, location, scheduledAt, duration || 60, Date.now()).run();
        return json({ data: { id } });
      }

      if (path === '/api/counseling/my-sessions' && method === 'GET') {
        const token = getToken();
        if (!token) return error('Unauthorized', 401);
        const sessions = await env.DB.prepare('SELECT * FROM counseling_sessions WHERE user_id = ? ORDER BY scheduled_at DESC').bind(token).all();
        return json({ data: sessions.results });
      }

      if (path === '/api/meetups' && method === 'GET') {
        const meetups = await env.DB.prepare('SELECT * FROM meetups WHERE scheduled_at > ? ORDER BY scheduled_at ASC LIMIT 20').bind(Date.now()).all();
        return json({ data: meetups.results });
      }

      if (path === '/api/meetups' && method === 'POST') {
        const token = getToken();
        if (!token) return error('Unauthorized', 401);
        const { title, description, format, meetingLink, location, scheduledAt, duration, maxAttendees, mentorId } = await request.json();
        const id = 'meet_' + uid();
        await env.DB.prepare('INSERT INTO meetups (id, title, description, mentor_id, format, meeting_link, location, scheduled_at, duration_minutes, max_attendees, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)').bind(id, title, description, mentorId, format, meetingLink, location, scheduledAt, duration, maxAttendees, Date.now()).run();
        return json({ data: { id } });
      }

      if (path.match(/\/api\/meetups\/[^/]+\/rsvp/) && method === 'POST') {
        const token = getToken();
        if (!token) return error('Unauthorized', 401);
        const meetupId = parts[2];
        const { status } = await request.json();
        await env.DB.prepare('INSERT INTO meetup_attendees (meetup_id, user_id, status, rsvp_at) VALUES (?, ?, ?, ?) ON CONFLICT(meetup_id, user_id) DO UPDATE SET status = ?, rsvp_at = ?').bind(meetupId, token, status, Date.now(), status, Date.now()).run();
        
        await evaluateBadges(env, token, null);
        
        return json({ success: true });
      }

      if (path === '/api/meetups/my-rsvps' && method === 'GET') {
        const token = getToken();
        if (!token) return error('Unauthorized', 401);
        const rsvps = await env.DB.prepare(`SELECT m.*, r.status as rsvp_status FROM meetups m JOIN meetup_attendees r ON m.id = r.meetup_id WHERE r.user_id = ? AND m.scheduled_at > ? ORDER BY m.scheduled_at ASC`).bind(token, Date.now()).all();
        return json({ data: rsvps.results });
      }

      // ============================================
      // ADMIN ANALYTICS & PROGRESS
      // ============================================
      if (path === '/api/admin/analytics' && method === 'GET') {
        const token = getToken();
        const admin = await env.DB.prepare('SELECT role FROM users WHERE id = ?').bind(token).first();
        if (!admin || admin.role !== 'admin') return error('Forbidden', 403);
        const [revenueData, studentsData, coursesData, appsData, recentUsers] = await Promise.all([
          env.DB.prepare("SELECT SUM(amount) as total FROM payments WHERE status = 'paid'").first(),
          env.DB.prepare("SELECT COUNT(*) as count FROM users WHERE role = 'student'").first(),
          env.DB.prepare("SELECT COUNT(*) as count FROM courses").first(),
          env.DB.prepare("SELECT COUNT(*) as count FROM mentorship_applications WHERE status = 'pending'").first(),
          env.DB.prepare("SELECT id, name, email, joined_at FROM users WHERE role = 'student' ORDER BY joined_at DESC LIMIT 5").all()
        ]);
        return json({ data: { totalRevenue: revenueData.total || 0, totalStudents: studentsData.count || 0, totalCourses: coursesData.count || 0, pendingApplications: appsData.count || 0, recentStudents: recentUsers.results || [] } });
      }

      if (path === '/api/admin/student-progress' && method === 'GET') {
        const token = getToken();
        const admin = await env.DB.prepare('SELECT role FROM users WHERE id = ?').bind(token).first();
        if (!admin || admin.role !== 'admin') return error('Forbidden', 403);
        const progress = await env.DB.prepare(`SELECT u.id as user_id, u.name as user_name, u.email as user_email, c.id as course_id, c.title as course_title, c.code as course_code, e.enrolled_at, e.quiz_passed, e.quiz_score, e.quiz_total FROM enrollments e JOIN users u ON e.user_id = u.id JOIN courses c ON e.course_id = c.id ORDER BY e.enrolled_at DESC`).all();
        return json({ data: progress.results });
      }

      // ============================================
      // ADMIN API (With Full Audit Logging)
      // ============================================
      if (path === '/api/admin/mentors' && method === 'POST') {
        const token = getToken();
        const admin = await env.DB.prepare('SELECT role FROM users WHERE id = ?').bind(token).first();
        if (!admin || admin.role !== 'admin') return error('Forbidden', 403);
        const { userId, name, bio, specialties, hourlyRate, imageUrl } = await request.json();
        const id = 'mentor_' + uid();
        await env.DB.prepare('INSERT INTO mentors (id, user_id, name, bio, specialties, hourly_rate, image_url, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)').bind(id, userId, name, bio, JSON.stringify(specialties), hourlyRate, imageUrl, Date.now()).run();
        await logAudit(env, token, 'MENTOR_CREATED', `Created mentor: ${name}`);
        return json({ data: { id } });
      }

      if (path === '/api/admin/instructors' && method === 'POST') {
        const token = getToken();
        const admin = await env.DB.prepare('SELECT role FROM users WHERE id = ?').bind(token).first();
        if (!admin || admin.role !== 'admin') return error('Forbidden', 403);
        const { userId, name, bio, courseIds } = await request.json();
        const id = 'inst_' + uid();
        await env.DB.prepare('INSERT INTO instructors (id, user_id, name, bio, created_at) VALUES (?, ?, ?, ?, ?)').bind(id, userId, name, bio, Date.now()).run();
        for (const courseId of (courseIds || [])) await env.DB.prepare('INSERT INTO course_instructors (course_id, instructor_id) VALUES (?, ?)').bind(courseId, id).run();
        await logAudit(env, token, 'INSTRUCTOR_CREATED', `Created instructor: ${name}`);
        return json({ data: { id } });
      }

      if (path === '/api/admin/instructors' && method === 'GET') {
        const token = getToken();
        const admin = await env.DB.prepare('SELECT role FROM users WHERE id = ?').bind(token).first();
        if (!admin || admin.role !== 'admin') return error('Forbidden', 403);
        const instructors = await env.DB.prepare('SELECT * FROM instructors ORDER BY created_at DESC').all();
        return json({ data: instructors.results });
      }

      if (path.startsWith('/api/admin/instructors/') && method === 'DELETE') {
        const token = getToken();
        const admin = await env.DB.prepare('SELECT role FROM users WHERE id = ?').bind(token).first();
        if (!admin || admin.role !== 'admin') return error('Forbidden', 403);
        const instId = parts[3];
        await env.DB.prepare('DELETE FROM course_instructors WHERE instructor_id = ?').bind(instId).run();
        await env.DB.prepare('DELETE FROM instructors WHERE id = ?').bind(instId).run();
        await logAudit(env, token, 'INSTRUCTOR_DELETED', `Deleted instructor ID: ${instId}`);
        return json({ success: true });
      }

      if (path === '/api/admin/applications' && method === 'GET') {
        const token = getToken();
        const admin = await env.DB.prepare('SELECT role FROM users WHERE id = ?').bind(token).first();
        if (!admin || admin.role !== 'admin') return error('Forbidden', 403);
        const apps = await env.DB.prepare(`SELECT a.*, u.name as user_name, u.email as user_email, c.name as category_name FROM mentorship_applications a JOIN users u ON a.user_id = u.id LEFT JOIN mentorship_categories c ON a.category_id = c.id ORDER BY a.applied_at DESC`).all();
        return json({ data: apps.results });
      }

      // ✅ UPDATED: Added 'category' to destructuring and INSERT statement
      if (path === '/api/admin/courses' && method === 'POST') {
        const token = getToken();
        const admin = await env.DB.prepare('SELECT role FROM users WHERE id = ?').bind(token).first();
        if (!admin || admin.role !== 'admin') return error('Forbidden', 403);
        const { id, code, title, tagline, level, path: coursePath, weeks, price, priceUsd, hue, icon, summary, outcomes, skills, channel, category } = await request.json();
        const courseId = id || 'course_' + uid();
        await env.DB.prepare(`INSERT INTO courses (id, code, title, tagline, level, path, weeks, price, price_usd, hue, icon, summary, outcomes, skills, channel, category, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`).bind(courseId, code, title, tagline, level, coursePath, weeks, price, priceUsd || 0, hue, icon, summary, JSON.stringify(outcomes), JSON.stringify(skills), channel, category || 'General', Date.now()).run();
        await logAudit(env, token, 'COURSE_CREATED', `Created course: ${title} (${courseId})`);
        return json({ data: { id: courseId } });
      }

      // ✅ UPDATED: Added 'category' to the allowed fields array for updates
      if (path.startsWith('/api/admin/courses/') && method === 'PUT' && !path.includes('/modules') && !path.includes('/lessons') && !path.includes('/quiz')) {
        const token = getToken();
        const admin = await env.DB.prepare('SELECT role FROM users WHERE id = ?').bind(token).first();
        if (!admin || admin.role !== 'admin') return error('Forbidden', 403);
        const courseId = parts[3];
        const data = await request.json();
        const fields = []; const values = [];
        for (const [key, val] of Object.entries(data)) {
          if (['outcomes', 'skills'].includes(key)) { fields.push(`${key} = ?`); values.push(JSON.stringify(val)); } 
          else if (['code', 'title', 'tagline', 'level', 'path', 'weeks', 'price', 'price_usd', 'hue', 'icon', 'summary', 'channel', 'category'].includes(key)) { fields.push(`${key} = ?`); values.push(val); }
        }
        if (fields.length > 0) { 
          values.push(courseId); 
          const result = await env.DB.prepare(`UPDATE courses SET ${fields.join(', ')} WHERE id = ?`).bind(...values).run();
          if (result.meta.changes === 0) return error(`No changes made. Course ID "${courseId}" might not exist.`, 404);
        }
        await logAudit(env, token, 'COURSE_UPDATED', `Updated course ID: ${courseId}`);
        return json({ success: true });
      }

      if (path.match(/\/api\/admin\/courses\/[^/]+\/modules/) && method === 'POST') {
        const token = getToken();
        const admin = await env.DB.prepare('SELECT role FROM users WHERE id = ?').bind(token).first();
        if (!admin || admin.role !== 'admin') return error('Forbidden', 403);
        const courseId = parts[3];
        const { title } = await request.json();
        const next = await env.DB.prepare('SELECT COALESCE(MAX(order_index), -1) + 1 AS n FROM modules WHERE course_id = ?').bind(courseId).first();
        const result = await env.DB.prepare('INSERT INTO modules (course_id, title, order_index) VALUES (?, ?, ?)').bind(courseId, title, next.n).run();
        await logAudit(env, token, 'MODULE_CREATED', `Created module in course ID: ${courseId}`);
        return json({ data: { id: result.meta.last_row_id } });
      }

      if (path.match(/^\/api\/admin\/modules\/[^/]+$/) && method === 'PUT') {
        const token = getToken();
        const admin = await env.DB.prepare('SELECT role FROM users WHERE id = ?').bind(token).first();
        if (!admin || admin.role !== 'admin') return error('Forbidden', 403);
        const moduleId = parts[3];
        const { title } = await request.json();
        await env.DB.prepare('UPDATE modules SET title = ? WHERE id = ?').bind(title, moduleId).run();
        await logAudit(env, token, 'MODULE_UPDATED', `Renamed module ID: ${moduleId}`);
        return json({ success: true });
      }

      if (path.match(/^\/api\/admin\/modules\/[^/]+$/) && method === 'DELETE') {
        const token = getToken();
        const admin = await env.DB.prepare('SELECT role FROM users WHERE id = ?').bind(token).first();
        if (!admin || admin.role !== 'admin') return error('Forbidden', 403);
        const moduleId = parts[3];
        const lessonRows = await env.DB.prepare('SELECT id FROM lessons WHERE module_id = ?').bind(moduleId).all();
        for (const l of lessonRows.results) {
          await env.DB.prepare('DELETE FROM resources WHERE lesson_id = ?').bind(l.id).run();
          await env.DB.prepare('DELETE FROM lesson_completions WHERE lesson_id = ?').bind(l.id).run();
        }
        await env.DB.prepare('DELETE FROM lessons WHERE module_id = ?').bind(moduleId).run();
        await env.DB.prepare('DELETE FROM modules WHERE id = ?').bind(moduleId).run();
        await logAudit(env, token, 'MODULE_DELETED', `Deleted module ID: ${moduleId}`);
        return json({ success: true });
      }

      if (path.match(/\/api\/admin\/courses\/[^/]+\/lessons/) && method === 'POST') {
        const token = getToken();
        const admin = await env.DB.prepare('SELECT role FROM users WHERE id = ?').bind(token).first();
        if (!admin || admin.role !== 'admin') return error('Forbidden', 403);
        const courseId = parts[3];
        const { id, moduleId, title, minutes, tags, bullets, msg, youtubeUrl } = await request.json();
        const lessonId = id || 'les_' + uid();
        const next = await env.DB.prepare('SELECT COALESCE(MAX(order_index), -1) + 1 AS n FROM lessons WHERE module_id = ?').bind(moduleId).first();
        await env.DB.prepare(`INSERT INTO lessons (id, module_id, course_id, title, minutes, tags, bullets, msg, youtube_url, order_index) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`).bind(lessonId, moduleId, courseId, title, minutes, JSON.stringify(tags || []), JSON.stringify(bullets || []), msg || 0, youtubeUrl || null, next.n).run();
        await logAudit(env, token, 'LESSON_CREATED', `Created lesson in course ID: ${courseId}`);

        try {
          const course = await env.DB.prepare('SELECT code, title, channel FROM courses WHERE id = ?').bind(courseId).first();
          if (course && course.channel) {
            const raw = course.channel.trim();
            const target = /^@/.test(raw) || /^-?\d/.test(raw) ? raw : '@' + raw.replace(/^https?:\/\//, '').replace(/^t\.me\//, '');
            await tgApi(env, 'sendMessage', {
              chat_id: target,
              parse_mode: 'Markdown',
              disable_web_page_preview: true,
              text: `📚 *New Lesson Drop — ${course.code}*\n\n*${title}*\n_Course: ${course.title}_\n\nOpen the Academy Mini App or dashboard to start learning. 🐯`,
            });
          }
        } catch (e) { console.error('Lesson broadcast failed:', e); }

        return json({ data: { id: lessonId } });
      }

      if (path.startsWith('/api/admin/lessons/') && method === 'PUT') {
        const token = getToken();
        const admin = await env.DB.prepare('SELECT role FROM users WHERE id = ?').bind(token).first();
        if (!admin || admin.role !== 'admin') return error('Forbidden', 403);
        const lessonId = parts[3];
        const data = await request.json();
        const fields = []; const values = [];
        for (const [key, val] of Object.entries(data)) {
          if (['tags', 'bullets'].includes(key)) { fields.push(`${key} = ?`); values.push(JSON.stringify(val)); } 
          else if (['title', 'minutes', 'module_id', 'msg', 'youtube_url', 'order_index'].includes(key)) { fields.push(`${key} = ?`); values.push(val); }
        }
        if (fields.length > 0) { values.push(lessonId); await env.DB.prepare(`UPDATE lessons SET ${fields.join(', ')} WHERE id = ?`).bind(...values).run(); }
        await logAudit(env, token, 'LESSON_UPDATED', `Updated lesson ID: ${lessonId}`);
        return json({ success: true });
      }

      if (path.startsWith('/api/admin/lessons/') && method === 'DELETE') {
        const token = getToken();
        const admin = await env.DB.prepare('SELECT role FROM users WHERE id = ?').bind(token).first();
        if (!admin || admin.role !== 'admin') return error('Forbidden', 403);
        const lessonId = parts[3];
        await env.DB.prepare('DELETE FROM resources WHERE lesson_id = ?').bind(lessonId).run();
        await env.DB.prepare('DELETE FROM lesson_completions WHERE lesson_id = ?').bind(lessonId).run();
        await env.DB.prepare('DELETE FROM lessons WHERE id = ?').bind(lessonId).run();
        await logAudit(env, token, 'LESSON_DELETED', `Deleted lesson ID: ${lessonId}`);
        return json({ success: true });
      }

      if (path.match(/\/api\/admin\/courses\/[^/]+\/quiz/) && method === 'POST') {
        const token = getToken();
        const admin = await env.DB.prepare('SELECT role FROM users WHERE id = ?').bind(token).first();
        if (!admin || admin.role !== 'admin') return error('Forbidden', 403);
        const courseId = parts[3];
        const { question, options, answer } = await request.json();
        const next = await env.DB.prepare('SELECT COALESCE(MAX(order_index), -1) + 1 AS n FROM quiz_questions WHERE course_id = ?').bind(courseId).first();
        await env.DB.prepare('INSERT INTO quiz_questions (course_id, question, options, answer, order_index) VALUES (?, ?, ?, ?, ?)').bind(courseId, question, JSON.stringify(options), answer, next.n).run();
        await logAudit(env, token, 'QUIZ_QUESTION_CREATED', `Added quiz question to course ID: ${courseId}`);
        return json({ success: true });
      }

      if (path.match(/\/api\/admin\/courses\/[^/]+\/quiz\/[^/]+/) && method === 'PUT') {
        const token = getToken();
        const admin = await env.DB.prepare('SELECT role FROM users WHERE id = ?').bind(token).first();
        if (!admin || admin.role !== 'admin') return error('Forbidden', 403);
        const questionId = parts[5];
        const { question, options, answer } = await request.json();
        await env.DB.prepare('UPDATE quiz_questions SET question = ?, options = ?, answer = ? WHERE id = ?').bind(question, JSON.stringify(options), answer, questionId).run();
        await logAudit(env, token, 'QUIZ_QUESTION_UPDATED', `Updated quiz question ID: ${questionId}`);
        return json({ success: true });
      }

      if (path.match(/\/api\/admin\/courses\/[^/]+\/quiz\/[^/]+/) && method === 'DELETE') {
        const token = getToken();
        const admin = await env.DB.prepare('SELECT role FROM users WHERE id = ?').bind(token).first();
        if (!admin || admin.role !== 'admin') return error('Forbidden', 403);
        const questionId = parts[5];
        await env.DB.prepare('DELETE FROM quiz_questions WHERE id = ?').bind(questionId).run();
        await logAudit(env, token, 'QUIZ_QUESTION_DELETED', `Deleted quiz question ID: ${questionId}`);
        return json({ success: true });
      }

      if (path === '/api/admin/resources' && method === 'POST') {
        const token = getToken();
        const admin = await env.DB.prepare('SELECT role FROM users WHERE id = ?').bind(token).first();
        if (!admin || admin.role !== 'admin') return error('Forbidden', 403);
        const { lessonId, courseId, type, title, description, sourceUrl, thumbnailUrl, durationSeconds, fileSizeBytes, metadata, accessLevel, orderIndex, sourceType, key } = await request.json();
        const id = 'res_' + uid();
        try {
          await env.DB.prepare(`INSERT INTO resources (id, lesson_id, course_id, type, title, description, source_url, thumbnail_url, duration_seconds, file_size_bytes, metadata, access_level, order_index, source_type, key, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`).bind(id, lessonId, courseId, type, title, description || null, sourceUrl, thumbnailUrl || null, durationSeconds || null, fileSizeBytes || null, metadata ? JSON.stringify(metadata) : null, accessLevel || 'enrolled', orderIndex || 0, sourceType || 'external', key || null, Date.now()).run();
        } catch (e) {
          await env.DB.prepare(`INSERT INTO resources (id, lesson_id, course_id, type, title, description, source_url, thumbnail_url, duration_seconds, file_size_bytes, metadata, access_level, order_index, source_type, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`).bind(id, lessonId, courseId, type, title, description || null, sourceUrl, thumbnailUrl || null, durationSeconds || null, fileSizeBytes || null, metadata ? JSON.stringify(metadata) : null, accessLevel || 'enrolled', orderIndex || 0, sourceType || 'external', Date.now()).run();
        }
        await logAudit(env, token, 'RESOURCE_CREATED', `Created resource for lesson ID: ${lessonId}`);
        return json({ data: { id } });
      }

      if (path.startsWith('/api/admin/resources/') && method === 'PUT') {
        const token = getToken();
        const admin = await env.DB.prepare('SELECT role FROM users WHERE id = ?').bind(token).first();
        if (!admin || admin.role !== 'admin') return error('Forbidden', 403);
        const resourceId = parts[3];
        const data = await request.json();
        const fields = []; const values = [];
        for (const [key, val] of Object.entries(data)) {
          if (key === 'metadata') { fields.push(`${key} = ?`); values.push(JSON.stringify(val)); } 
          else if (['type', 'title', 'description', 'source_url', 'thumbnail_url', 'duration_seconds', 'file_size_bytes', 'access_level', 'order_index', 'source_type'].includes(key)) { fields.push(`${key} = ?`); values.push(val); }
        }
        if (fields.length > 0) { values.push(resourceId); await env.DB.prepare(`UPDATE resources SET ${fields.join(', ')} WHERE id = ?`).bind(...values).run(); }
        await logAudit(env, token, 'RESOURCE_UPDATED', `Updated resource ID: ${resourceId}`);
        return json({ success: true });
      }

      if (path.startsWith('/api/admin/resources/') && method === 'DELETE') {
        const token = getToken();
        const admin = await env.DB.prepare('SELECT role FROM users WHERE id = ?').bind(token).first();
        if (!admin || admin.role !== 'admin') return error('Forbidden', 403);
        const resourceId = parts[3];
        await env.DB.prepare('DELETE FROM resources WHERE id = ?').bind(resourceId).run();
        await logAudit(env, token, 'RESOURCE_DELETED', `Deleted resource ID: ${resourceId}`);
        return json({ success: true });
      }

      if (path.match(/\/api\/courses\/[^/]+\/lessons\/[^/]+\/resources/) && method === 'GET') {
        const courseId = parts[2];
        const lessonId = parts[4];
        const token = getToken();
        const isEnrolled = token ? await env.DB.prepare('SELECT 1 FROM enrollments WHERE user_id = ? AND course_id = ?').bind(token, courseId).first() : null;
        const resources = await env.DB.prepare('SELECT * FROM resources WHERE lesson_id = ? ORDER BY order_index ASC').bind(lessonId).all();
        const filtered = resources.results.filter(r => {
          if (r.access_level === 'public') return true;
          if (r.access_level === 'enrolled' && isEnrolled) return true;
          return false;
        }).map(r => ({ ...r, metadata: r.metadata ? JSON.parse(r.metadata) : null }));
        return json({ data: filtered });
      }

      // ============================================
      // R2 RESOURCE UPLOAD
      // ============================================
      if (path === '/api/admin/resources/upload' && method === 'POST') {
        const token = getToken();
        const admin = await env.DB.prepare('SELECT role FROM users WHERE id = ?').bind(token).first();
        if (!admin || admin.role !== 'admin') return error('Forbidden', 403);
        if (!env.R2_BUCKET) return error('R2 bucket not configured yet. Please add it to wrangler.toml', 500);
        const formData = await request.formData();
        const file = formData.get('file');
        const courseId = formData.get('courseId');
        const lessonId = formData.get('lessonId');
        const type = formData.get('type') || 'document';
        if (!file || !(file instanceof File)) return error('No valid file provided', 400);
        const safeName = file.name.replace(/[^a-zA-Z0-9.]/g, '_');
        const key = `courses/${courseId}/lessons/${lessonId}/${Date.now()}_${safeName}`;
        await env.R2_BUCKET.put(key, file, { httpMetadata: { contentType: file.type } });
        const publicUrl = env.R2_PUBLIC_URL ? `${env.R2_PUBLIC_URL.replace(/\/$/, '')}/${key}` : `https://pub-xxxxxxxxxxxxxxxx.r2.dev/${key}`;
        return json({ success: true, data: { url: publicUrl, key, type, size: file.size, name: file.name, sourceType: 'r2' } });
      }

      // ============================================
      // SECURE RESOURCE STREAMING
      // ============================================
      if (path.startsWith('/api/resources/stream/') && method === 'GET') {
        const resourceId = parts[3];
        const token = getToken() || url.searchParams.get('token');
        const resource = await env.DB.prepare('SELECT * FROM resources WHERE id = ?').bind(resourceId).first();
        if (!resource) return error('Resource not found', 404);
        if (resource.access_level === 'enrolled') {
          if (!token) return error('Unauthorized', 401);
          const enrollment = await env.DB.prepare('SELECT 1 FROM enrollments WHERE user_id = ? AND course_id = ?').bind(token, resource.course_id).first();
          if (!enrollment) return error('Forbidden: Please enroll in this course to access this resource', 403);
        }
        if (resource.source_type === 'r2' || !resource.source_type) {
          if (!env.R2_BUCKET) return error('R2 not configured', 500);
          let objectKey = resource.key;
          if (!objectKey && resource.source_url) {
            const idx = resource.source_url.indexOf('.r2.dev/');
            if (idx !== -1) objectKey = resource.source_url.slice(idx + 8);
            else { try { objectKey = new URL(resource.source_url).pathname.replace(/^\//, ''); } catch (e) {} }
          }
          if (!objectKey) return error('File missing from storage', 404);
          const object = await env.R2_BUCKET.get(objectKey);
          if (!object) return error('File missing from storage', 404);
          const headers = new Headers();
          object.writeHttpMetadata(headers);
          headers.set('etag', object.httpEtag);
          headers.set('Content-Disposition', 'inline');
          return new Response(object.body, { headers });
        } else if (resource.source_type === 'external') {
          return json({ data: { type: resource.type, originalUrl: resource.source_url, embedUrl: getEmbedUrl(resource.source_url, resource.type) } });
        }
        return error('Unknown resource type', 400);
      }

      // ============================================
      // DELETE & USER MANAGEMENT
      // ============================================
      if (path.startsWith('/api/admin/mentors/') && method === 'DELETE') {
        const token = getToken();
        const admin = await env.DB.prepare('SELECT role FROM users WHERE id = ?').bind(token).first();
        if (!admin || admin.role !== 'admin') return error('Forbidden', 403);
        const mentorId = parts[3];
        await env.DB.prepare('DELETE FROM mentors WHERE id = ?').bind(mentorId).run();
        await logAudit(env, token, 'MENTOR_DELETED', `Deleted mentor ID: ${mentorId}`);
        return json({ success: true });
      }

      if (path.startsWith('/api/admin/courses/') && method === 'DELETE' && !path.includes('/modules') && !path.includes('/lessons') && !path.includes('/quiz')) {
        const token = getToken();
        const admin = await env.DB.prepare('SELECT role FROM users WHERE id = ?').bind(token).first();
        if (!admin || admin.role !== 'admin') return error('Forbidden', 403);
        const courseId = parts[3];

        const lessonRows = await env.DB.prepare('SELECT id FROM lessons WHERE course_id = ?').bind(courseId).all();
        for (const l of lessonRows.results) {
          await env.DB.prepare('DELETE FROM lesson_completions WHERE lesson_id = ?').bind(l.id).run();
          await env.DB.prepare('DELETE FROM resources WHERE lesson_id = ?').bind(l.id).run();
        }

        await env.DB.prepare('DELETE FROM lessons WHERE course_id = ?').bind(courseId).run();
        await env.DB.prepare('DELETE FROM modules WHERE course_id = ?').bind(courseId).run();
        await env.DB.prepare('DELETE FROM quiz_questions WHERE course_id = ?').bind(courseId).run();
        await env.DB.prepare('DELETE FROM enrollments WHERE course_id = ?').bind(courseId).run();
        await env.DB.prepare('DELETE FROM installments WHERE course_id = ?').bind(courseId).run();
        await env.DB.prepare('DELETE FROM payments WHERE course_id = ?').bind(courseId).run();
        await env.DB.prepare('DELETE FROM course_instructors WHERE course_id = ?').bind(courseId).run();
        await env.DB.prepare('DELETE FROM resources WHERE course_id = ?').bind(courseId).run();

        await env.DB.prepare('DELETE FROM courses WHERE id = ?').bind(courseId).run();
        await logAudit(env, token, 'COURSE_DELETED', `Deleted course ID: ${courseId}`);
        return json({ success: true });
      }

      if (path === '/api/admin/audit-logs' && method === 'GET') {
        const token = getToken();
        const admin = await env.DB.prepare('SELECT role FROM users WHERE id = ?').bind(token).first();
        if (!admin || admin.role !== 'admin') return error('Forbidden', 403);
        const logs = await env.DB.prepare('SELECT * FROM audit_logs ORDER BY created_at DESC LIMIT 100').all();
        return json({ data: logs.results });
      }

      if (path === '/api/admin/users' && method === 'GET') {
        const token = getToken();
        const admin = await env.DB.prepare('SELECT role FROM users WHERE id = ?').bind(token).first();
        if (!admin || admin.role !== 'admin') return error('Forbidden', 403);
        const search = url.searchParams.get('search') || '';
        const users = await env.DB.prepare('SELECT id, name, email, role, telegram_id, joined_at FROM users WHERE name LIKE ? OR email LIKE ? ORDER BY joined_at DESC').bind(`%${search}%`, `%${search}%`).all();
        return json({ data: users.results });
      }

      if (path.startsWith('/api/admin/users/') && method === 'DELETE') {
        const token = getToken();
        const admin = await env.DB.prepare('SELECT role FROM users WHERE id = ?').bind(token).first();
        if (!admin || admin.role !== 'admin') return error('Forbidden', 403);
        const userId = parts[3];
        if (userId === token) return error('Cannot delete yourself', 400);

        const mentorRows = await env.DB.prepare('SELECT id FROM mentors WHERE user_id = ?').bind(userId).all();
        for (const m of mentorRows.results) {
          await env.DB.prepare('DELETE FROM meetup_attendees WHERE meetup_id IN (SELECT id FROM meetups WHERE mentor_id = ?)').bind(m.id).run();
          await env.DB.prepare('DELETE FROM meetups WHERE mentor_id = ?').bind(m.id).run();
          await env.DB.prepare('DELETE FROM counseling_sessions WHERE mentor_id = ?').bind(m.id).run();
          await env.DB.prepare('UPDATE mentorship_applications SET mentor_id = NULL WHERE mentor_id = ?').bind(m.id).run();
        }
        await env.DB.prepare('DELETE FROM mentors WHERE user_id = ?').bind(userId).run();

        await env.DB.prepare('DELETE FROM course_instructors WHERE instructor_id IN (SELECT id FROM instructors WHERE user_id = ?)').bind(userId).run();
        await env.DB.prepare('DELETE FROM instructors WHERE user_id = ?').bind(userId).run();

        await env.DB.prepare('DELETE FROM lesson_completions WHERE user_id = ?').bind(userId).run();
        await env.DB.prepare('DELETE FROM activity_logs WHERE user_id = ?').bind(userId).run();
        await env.DB.prepare('DELETE FROM meetup_attendees WHERE user_id = ?').bind(userId).run();
        await env.DB.prepare('DELETE FROM counseling_sessions WHERE user_id = ?').bind(userId).run();
        await env.DB.prepare('DELETE FROM enrollments WHERE user_id = ?').bind(userId).run();
        await env.DB.prepare('DELETE FROM installments WHERE user_id = ?').bind(userId).run();
        await env.DB.prepare('DELETE FROM payments WHERE user_id = ?').bind(userId).run();
        await env.DB.prepare('DELETE FROM mentorship_applications WHERE user_id = ?').bind(userId).run();
        await env.DB.prepare('DELETE FROM audit_logs WHERE admin_id = ?').bind(userId).run();

        await env.DB.prepare('DELETE FROM users WHERE id = ?').bind(userId).run();
        await logAudit(env, token, 'USER_DELETED', `Deleted user ID: ${userId}`);
        return json({ success: true });
      }

      // ============================================
      // BADGES API
      // ============================================
      if (path === '/api/badges/mine' && method === 'GET') {
        const token = getToken();
        if (!token) return error('Unauthorized', 401);
        const rows = await env.DB.prepare('SELECT badge_id, earned_at FROM user_badges WHERE user_id = ? ORDER BY earned_at DESC').bind(token).all();
        return json({ data: rows.results });
      }

      // ============================================
      // ADMIN BACKFILL BADGES
      // ============================================
      if (path === '/api/admin/backfill-badges' && method === 'POST') {
        const adminHeader = request.headers.get('x-admin-secret');
        if (adminHeader !== env.ADMIN_SECRET) {
          return error('Unauthorized: Invalid admin secret', 403);
        }

        const body = await request.json().catch(() => ({}));
        const offset = body.offset || 0;
        const batchSize = 50;

        const enrollments = await env.DB.prepare(`
          SELECT user_id, course_id FROM enrollments 
          LIMIT ? OFFSET ?
        `).bind(batchSize, offset).all();

        if (enrollments.results.length === 0) {
          return json({ 
            message: "Backfill complete. No more enrollments to process.", 
            processed: 0, 
            badges_awarded: 0,
            finished: true 
          });
        }

        let totalAwarded = 0;
        const processedUsers = new Set();

        for (const row of enrollments.results) {
          if (processedUsers.has(row.user_id)) continue;
          
          const awarded = await evaluateBadges(env, row.user_id, row.course_id);
          totalAwarded += awarded.length;
          processedUsers.add(row.user_id);
        }

        return json({
          message: `Processed batch starting at offset ${offset}`,
          processed: enrollments.results.length,
          badges_awarded: totalAwarded,
          next_offset: offset + batchSize,
          finished: enrollments.results.length < batchSize
        });
      }

      return error('Not found', 404);
    } catch (err) {
      return error(err.message, 500);
    }
  },

  async scheduled(event, env) {
    const now = Date.now();
    const pending = await env.DB.prepare(`SELECT i.*, u.name, u.telegram_id, c.title as course_title FROM installments i JOIN users u ON i.user_id = u.id LEFT JOIN courses c ON i.course_id = c.id WHERE i.due_date <= ? AND i.status = 'pending' AND i.reminder_sent = 0`).bind(now).all();
    for (const inst of pending.results) {
      if (inst.telegram_id) {
        const amount = inst.amount.toLocaleString();
        const message = `🐯 Hello ${inst.name},\n\nYour installment of ₦${amount} for *${inst.course_title || 'your course'}* is now due.\n\nPlease complete the payment to continue your learning journey without interruption.\n\nOpen the app to pay or upload your proof.`;
        await fetch(`https://api.telegram.org/bot${env.BOT_TOKEN}/sendMessage`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ chat_id: inst.telegram_id, text: message, parse_mode: 'Markdown' }) });
      }
      await env.DB.prepare('UPDATE installments SET reminder_sent = 1 WHERE id = ?').bind(inst.id).run();
    }
  }
};
// worker/src/index.js

// Helper to verify Telegram Web App initData cryptographically
async function verifyTelegramInitData(initData, botToken) {
  try {
    const urlParams = new URLSearchParams(initData);
    const hash = urlParams.get('hash');
    urlParams.delete('hash');
    
    const sortedParams = Array.from(urlParams.entries()).sort(([a], [b]) => a.localeCompare(b));
    const dataCheckString = sortedParams.map(([key, value]) => `${key}=${value}`).join('\n');
    
    const encoder = new TextEncoder();
    const secretKey = await crypto.subtle.importKey(
      'raw', encoder.encode('WebAppData'),
      { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']
    );
    const secret = await crypto.subtle.sign('HMAC', secretKey, encoder.encode(botToken));
    
    const key = await crypto.subtle.importKey(
      'raw', secret,
      { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']
    );
    const computedHash = await crypto.subtle.sign('HMAC', key, encoder.encode(dataCheckString));
    
    const hashArray = Array.from(new Uint8Array(computedHash));
    const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
    
    return hashHex === hash;
  } catch (e) {
    return false;
  }
}

// Helper function to convert raw links to secure embed links
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

// Helper to log admin actions for security and accountability
async function logAudit(env, adminId, action, details) {
  try {
    const id = 'audit_' + Math.random().toString(36).slice(2, 10);
    await env.DB.prepare(
      'INSERT INTO audit_logs (id, admin_id, action, details, created_at) VALUES (?, ?, ?, ?, ?)'
    ).bind(id, adminId, action, details, Date.now()).run();
  } catch (e) {
    console.error('Failed to log audit:', e);
  }
}

// NEW: Helper to securely hash passwords using SHA-256
async function hashPassword(password) {
  const encoder = new TextEncoder();
  const data = encoder.encode(password);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    const path = url.pathname;
    const method = request.method;

    const corsHeaders = {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    };

    if (method === 'OPTIONS') {
      return new Response(null, { headers: corsHeaders });
    }

    const uid = () => Math.random().toString(36).slice(2, 10);
    const getToken = () => request.headers.get('Authorization')?.replace('Bearer ', '');
    
    const json = (data, status = 200) => Response.json(data, { status, headers: corsHeaders });
    const error = (msg, status) => json({ error: msg }, status);

    try {
      // ============================================
      // PAYSTACK WEBHOOK (Secure Live Mode)
      // ============================================
      if (path === '/api/webhooks/paystack' && method === 'POST') {
        const bodyText = await request.text();
        const signature = request.headers.get('x-paystack-signature');
        
        const encoder = new TextEncoder();
        const key = await crypto.subtle.importKey(
          'raw', encoder.encode(env.PAYSTACK_SECRET_KEY),
          { name: 'HMAC', hash: 'SHA-512' }, false, ['sign']
        );
        const hashBuffer = await crypto.subtle.sign('HMAC', key, encoder.encode(bodyText));
        const hashArray = Array.from(new Uint8Array(hashBuffer));
        const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
        
        if (hashHex !== signature) {
          return error('Invalid signature', 400);
        }

        const body = JSON.parse(bodyText);

        if (body.event === 'charge.success') {
          const data = body.data;
          const reference = data.reference;
          
          const payment = await env.DB.prepare('SELECT * FROM payments WHERE reference = ?').bind(reference).first();
          
          if (payment && payment.status === 'pending') {
            await env.DB.prepare('UPDATE payments SET status = ?, paystack_ref = ?, updated_at = ? WHERE id = ?')
              .bind('paid', data.reference, Date.now(), payment.id).run();
            
            if (payment.course_id) {
              await env.DB.prepare('INSERT OR IGNORE INTO enrollments (user_id, course_id, enrolled_at) VALUES (?, ?, ?)')
                .bind(payment.user_id, payment.course_id, Date.now()).run();
            }
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
        
        await env.DB.prepare('INSERT INTO payments (id, user_id, course_id, mentorship_app_id, amount, method, currency, payment_plan, reference, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)')
          .bind(reference, token, courseId || null, mentorshipAppId || null, amount, method, currency || 'NGN', paymentPlan || 'full', reference, now, now).run();
        
        if (paymentPlan === 'installment' && months > 1) {
          const monthlyAmount = Math.ceil(amount / months);
          for (let i = 1; i <= months; i++) {
            const instId = 'inst_' + uid();
            const dueDate = now + (i * 30 * 24 * 60 * 60 * 1000);
            await env.DB.prepare('INSERT INTO installments (id, payment_id, user_id, course_id, amount, due_date, created_at) VALUES (?, ?, ?, ?, ?, ?, ?)')
              .bind(instId, reference, token, courseId || null, monthlyAmount, dueDate, now).run();
          }
        }
        
        return json({ data: { reference, amount, currency: currency || 'NGN', paymentPlan, months } });
      }

      if (path === '/api/payments/submit-proof' && method === 'POST') {
        const token = getToken();
        if (!token) return error('Unauthorized', 401);
        const { reference, proofUrl } = await request.json();
        await env.DB.prepare('UPDATE payments SET status = ?, proof_url = ?, updated_at = ? WHERE reference = ? AND user_id = ?')
          .bind('proof_submitted', proofUrl, Date.now(), reference, token).run();
        return json({ success: true });
      }

      if (path === '/api/payments/approve' && method === 'POST') {
        const { reference, adminToken } = await request.json();
        const admin = await env.DB.prepare('SELECT role FROM users WHERE id = ?').bind(adminToken).first();
        if (!admin || admin.role !== 'admin') return error('Forbidden', 403);

        const payment = await env.DB.prepare('SELECT * FROM payments WHERE reference = ?').bind(reference).first();
        if (!payment) return error('Payment not found', 404);

        await env.DB.prepare('UPDATE payments SET status = ?, updated_at = ? WHERE id = ?').bind('paid', Date.now(), payment.id).run();
        if (payment.course_id) {
          await env.DB.prepare('INSERT OR IGNORE INTO enrollments (user_id, course_id, enrolled_at) VALUES (?, ?, ?)').bind(payment.user_id, payment.course_id, Date.now()).run();
        }
        
        await logAudit(env, adminToken, 'PAYMENT_APPROVED', `Approved payment reference: ${reference}`);
        return json({ success: true });
      }

      // ============================================
      // INSTALLMENTS API
      // ============================================
      if (path === '/api/installments/my' && method === 'GET') {
        const token = getToken();
        if (!token) return error('Unauthorized', 401);
        const installments = await env.DB.prepare(`
          SELECT i.*, c.title as course_title FROM installments i LEFT JOIN courses c ON i.course_id = c.id WHERE i.user_id = ? AND i.status != 'paid' ORDER BY i.due_date ASC
        `).bind(token).all();
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
        const { installmentId, adminToken } = await request.json();
        const admin = await env.DB.prepare('SELECT role FROM users WHERE id = ?').bind(adminToken).first();
        if (!admin || admin.role !== 'admin') return error('Forbidden', 403);

        const inst = await env.DB.prepare('SELECT * FROM installments WHERE id = ?').bind(installmentId).first();
        if (!inst) return error('Installment not found', 404);

        await env.DB.prepare('UPDATE installments SET status = ? WHERE id = ?').bind('paid', installmentId).run();
        const pendingCount = await env.DB.prepare('SELECT COUNT(*) as count FROM installments WHERE payment_id = ? AND status != ?', inst.payment_id, 'paid').first();
        if (pendingCount.count === 0) {
          await env.DB.prepare('UPDATE payments SET status = ? WHERE id = ?').bind('paid', inst.payment_id).run();
          if (inst.course_id) {
             await env.DB.prepare('INSERT OR IGNORE INTO enrollments (user_id, course_id, enrolled_at) VALUES (?, ?, ?)').bind(inst.user_id, inst.course_id, Date.now()).run();
          }
        }
        
        await logAudit(env, adminToken, 'INSTALLMENT_APPROVED', `Approved installment ID: ${installmentId}`);
        return json({ success: true });
      }

      if (path === '/api/admin/installments' && method === 'GET') {
        const token = getToken();
        const admin = await env.DB.prepare('SELECT role FROM users WHERE id = ?').bind(token).first();
        if (!admin || admin.role !== 'admin') return error('Forbidden', 403);
        const installments = await env.DB.prepare(`
          SELECT i.*, u.name as user_name, u.email as user_email, c.title as course_title FROM installments i JOIN users u ON i.user_id = u.id LEFT JOIN courses c ON i.course_id = c.id WHERE i.status = 'proof_submitted' ORDER BY i.created_at DESC
        `).all();
        return json({ data: installments.results });
      }

      if (path === '/api/admin/payments' && method === 'GET') {
        const token = getToken();
        const admin = await env.DB.prepare('SELECT role FROM users WHERE id = ?').bind(token).first();
        if (!admin || admin.role !== 'admin') return error('Forbidden', 403);
        const payments = await env.DB.prepare(`
          SELECT p.*, u.name as user_name, u.email as user_email, c.title as course_title FROM payments p JOIN users u ON p.user_id = u.id LEFT JOIN courses c ON p.course_id = c.id ORDER BY p.created_at DESC
        `).all();
        return json({ data: payments.results });
      }

      // ============================================
      // COURSES API
      // ============================================
      if (path === '/api/courses' && method === 'GET') {
        const courses = await env.DB.prepare('SELECT * FROM courses ORDER BY created_at DESC').all();
        return json({ data: courses.results });
      }

      if (path.startsWith('/api/courses/') && method === 'GET') {
        const courseId = path.split('/').pop();
        const course = await env.DB.prepare('SELECT * FROM courses WHERE id = ?').bind(courseId).first();
        if (!course) return error('Course not found', 404);

        const modules = await env.DB.prepare('SELECT * FROM modules WHERE course_id = ? ORDER BY order_index').bind(courseId).all();
        const lessons = await env.DB.prepare('SELECT * FROM lessons WHERE course_id = ? ORDER BY order_index').bind(courseId).all();
        const quiz = await env.DB.prepare('SELECT * FROM quiz_questions WHERE course_id = ? ORDER BY order_index').bind(courseId).all();

        course.outcomes = JSON.parse(course.outcomes);
        course.skills = JSON.parse(course.skills);
        modules.results.forEach(m => {
          m.lessons = lessons.results.filter(l => l.module_id === m.id).map(l => ({
            ...l, tags: JSON.parse(l.tags), bullets: JSON.parse(l.bullets)
          }));
        });
        quiz.results.forEach(q => q.options = JSON.parse(q.options));

        return json({ data: { ...course, modules: modules.results, quiz: quiz.results } });
      }

      // ============================================
      // AUTH API (UPDATED WITH PASSWORD HASHING)
      // ============================================
      if (path === '/api/auth/register' && method === 'POST') {
        const { name, email, password } = await request.json();
        if (!password || password.length < 6) return error('Password must be at least 6 characters', 400);
        
        const id = 'st_' + uid();
        const passwordHash = await hashPassword(password);
        
        try {
          await env.DB.prepare('INSERT INTO users (id, name, email, password_hash, joined_at) VALUES (?, ?, ?, ?, ?)')
            .bind(id, name, email, passwordHash, Date.now()).run();
          const user = await env.DB.prepare('SELECT id, name, email, role, joined_at FROM users WHERE id = ?').bind(id).first();
          return json({ data: user, token: id });
        } catch (e) {
          return error('Email already registered', 400);
        }
      }

      if (path === '/api/auth/login' && method === 'POST') {
        const { email, password } = await request.json();
        const user = await env.DB.prepare('SELECT * FROM users WHERE email = ?').bind(email).first();
        
        if (!user) return error('Invalid email or password', 401);
        
        const inputHash = await hashPassword(password);
        if (inputHash !== user.password_hash) {
          return error('Invalid email or password', 401);
        }
        
        const { password_hash, ...safeUser } = user;
        return json({ data: safeUser, token: user.id });
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
        return json({ data: user, token: demoId });
      }

      if (path === '/api/user/me' && method === 'GET') {
        const token = getToken();
        if (!token) return error('Unauthorized', 401);
        const user = await env.DB.prepare('SELECT id, name, email, role, telegram_id, joined_at FROM users WHERE id = ?').bind(token).first();
        if (!user) return error('User not found', 404);
        return json({ data: user });
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
        } catch (e) {
          return error('Already enrolled', 400);
        }
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
          return json({ success: true });
        } catch (e) {
          return error('Already completed', 400);
        }
      }

      if (path === '/api/quiz/submit' && method === 'POST') {
        const token = getToken();
        if (!token) return error('Unauthorized', 401);
        const { courseId, score, total } = await request.json();
        const passed = score / total >= 0.7 ? 1 : 0;
        await env.DB.prepare('UPDATE enrollments SET quiz_score = ?, quiz_total = ?, quiz_passed = ? WHERE user_id = ? AND course_id = ?').bind(score, total, passed, token, courseId).run();
        return json({ passed: !!passed });
      }

      if (path === '/api/activity' && method === 'GET') {
        const token = getToken();
        if (!token) return error('Unauthorized', 401);
        const activity = await env.DB.prepare('SELECT * FROM activity_logs WHERE user_id = ? ORDER BY at DESC LIMIT 40').bind(token).all();
        return json({ data: activity.results });
      }

      // ============================================
      // TELEGRAM API
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
        mentors.results.forEach(m => m.specialties = JSON.parse(m.specialties));
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
        const appId = path.split('/')[3];
        const { price, mentorId, firstSessionDate, notes } = await request.json();
        await env.DB.prepare('UPDATE mentorship_applications SET mentor_id = ?, proposed_price = ?, start_date = ?, review_notes = ?, status = ? WHERE id = ?').bind(mentorId, price, firstSessionDate ? new Date(firstSessionDate).getTime() : null, notes, 'proposal_sent', appId).run();
        return json({ success: true });
      }

      if (path.match(/\/api\/mentorship\/application\/[^/]+\/agree/) && method === 'PUT') {
        const token = getToken();
        const appId = path.split('/')[3];
        const app = await env.DB.prepare('SELECT * FROM mentorship_applications WHERE id = ? AND user_id = ?').bind(appId, token).first();
        if (!app) return error('Application not found', 404);
        await env.DB.prepare('UPDATE mentorship_applications SET agreed_price = ?, status = ?, agreed_at = ? WHERE id = ?').bind(app.proposed_price, 'agreed', Date.now(), appId).run();
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
        const meetupId = path.split('/')[2];
        const { status } = await request.json();
        await env.DB.prepare('INSERT INTO meetup_attendees (meetup_id, user_id, status, rsvp_at) VALUES (?, ?, ?, ?) ON CONFLICT(meetup_id, user_id) DO UPDATE SET status = ?, rsvp_at = ?').bind(meetupId, token, status, Date.now(), status, Date.now()).run();
        return json({ success: true });
      }

      if (path === '/api/meetups/my-rsvps' && method === 'GET') {
        const token = getToken();
        if (!token) return error('Unauthorized', 401);
        const rsvps = await env.DB.prepare(`SELECT m.*, r.status as rsvp_status FROM meetups m JOIN meetup_attendees r ON m.id = r.meetup_id WHERE r.user_id = ? AND m.scheduled_at > ? ORDER BY m.scheduled_at ASC`).bind(token, Date.now()).all();
        return json({ data: rsvps.results });
      }

      // ============================================
      // ADMIN ANALYTICS DASHBOARD
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

        return json({
          data: {
            totalRevenue: revenueData.total || 0,
            totalStudents: studentsData.count || 0,
            totalCourses: coursesData.count || 0,
            pendingApplications: appsData.count || 0,
            recentStudents: recentUsers.results || []
          }
        });
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
        for (const courseId of courseIds) {
          await env.DB.prepare('INSERT INTO course_instructors (course_id, instructor_id) VALUES (?, ?)').bind(courseId, id).run();
        }
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
        const instId = path.split('/')[3];
        await env.DB.prepare('DELETE FROM instructors WHERE id = ?').bind(instId).run();
        await env.DB.prepare('DELETE FROM course_instructors WHERE instructor_id = ?').bind(instId).run();
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

      if (path === '/api/admin/courses' && method === 'POST') {
        const token = getToken();
        const admin = await env.DB.prepare('SELECT role FROM users WHERE id = ?').bind(token).first();
        if (!admin || admin.role !== 'admin') return error('Forbidden', 403);
        const { id, code, title, tagline, level, path: coursePath, weeks, price, priceUsd, hue, icon, summary, outcomes, skills, channel } = await request.json();
        const courseId = id || 'course_' + uid();
        await env.DB.prepare(`INSERT INTO courses (id, code, title, tagline, level, path, weeks, price, price_usd, hue, icon, summary, outcomes, skills, channel, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`).bind(courseId, code, title, tagline, level, coursePath, weeks, price, priceUsd || 0, hue, icon, summary, JSON.stringify(outcomes), JSON.stringify(skills), channel, Date.now()).run();
        await logAudit(env, token, 'COURSE_CREATED', `Created course: ${title} (${courseId})`);
        return json({ data: { id: courseId } });
      }

      if (path.startsWith('/api/admin/courses/') && method === 'PUT' && !path.includes('/modules') && !path.includes('/lessons') && !path.includes('/quiz')) {
        const token = getToken();
        const admin = await env.DB.prepare('SELECT role FROM users WHERE id = ?').bind(token).first();
        if (!admin || admin.role !== 'admin') return error('Forbidden', 403);
        const courseId = path.split('/')[3];
        const data = await request.json();
        const fields = []; const values = [];
        for (const [key, val] of Object.entries(data)) {
          if (['outcomes', 'skills'].includes(key)) { fields.push(`${key} = ?`); values.push(JSON.stringify(val)); } 
          else if (['code', 'title', 'tagline', 'level', 'path', 'weeks', 'price', 'price_usd', 'hue', 'icon', 'summary', 'channel'].includes(key)) { fields.push(`${key} = ?`); values.push(val); }
        }
        if (fields.length > 0) { values.push(courseId); await env.DB.prepare(`UPDATE courses SET ${fields.join(', ')} WHERE id = ?`).bind(...values).run(); }
        await logAudit(env, token, 'COURSE_UPDATED', `Updated course ID: ${courseId}`);
        return json({ success: true });
      }

      if (path.match(/\/api\/admin\/courses\/[^/]+\/modules/) && method === 'POST') {
        const token = getToken();
        const admin = await env.DB.prepare('SELECT role FROM users WHERE id = ?').bind(token).first();
        if (!admin || admin.role !== 'admin') return error('Forbidden', 403);
        const courseId = path.split('/')[3];
        const { title, orderIndex } = await request.json();
        const result = await env.DB.prepare('INSERT INTO modules (course_id, title, order_index) VALUES (?, ?, ?)').bind(courseId, title, orderIndex || 99).run();
        await logAudit(env, token, 'MODULE_CREATED', `Created module in course ID: ${courseId}`);
        return json({ data: { id: result.meta.last_row_id } });
      }

      if (path.match(/\/api\/admin\/courses\/[^/]+\/lessons/) && method === 'POST') {
        const token = getToken();
        const admin = await env.DB.prepare('SELECT role FROM users WHERE id = ?').bind(token).first();
        if (!admin || admin.role !== 'admin') return error('Forbidden', 403);
        const courseId = path.split('/')[3];
        const { id, moduleId, title, minutes, tags, bullets, msg, youtubeUrl, orderIndex } = await request.json();
        const lessonId = id || 'les_' + uid();
        await env.DB.prepare(`INSERT INTO lessons (id, module_id, course_id, title, minutes, tags, bullets, msg, youtube_url, order_index) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`).bind(lessonId, moduleId, courseId, title, minutes, JSON.stringify(tags || []), JSON.stringify(bullets || []), msg || 0, youtubeUrl || null, orderIndex || 99).run();
        await logAudit(env, token, 'LESSON_CREATED', `Created lesson in course ID: ${courseId}`);
        return json({ data: { id: lessonId } });
      }

      if (path.startsWith('/api/admin/lessons/') && method === 'PUT') {
        const token = getToken();
        const admin = await env.DB.prepare('SELECT role FROM users WHERE id = ?').bind(token).first();
        if (!admin || admin.role !== 'admin') return error('Forbidden', 403);
        const lessonId = path.split('/')[3];
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
        const lessonId = path.split('/')[3];
        await env.DB.prepare('DELETE FROM lessons WHERE id = ?').bind(lessonId).run();
        await logAudit(env, token, 'LESSON_DELETED', `Deleted lesson ID: ${lessonId}`);
        return json({ success: true });
      }

      if (path.match(/\/api\/admin\/courses\/[^/]+\/quiz/) && method === 'POST') {
        const token = getToken();
        const admin = await env.DB.prepare('SELECT role FROM users WHERE id = ?').bind(token).first();
        if (!admin || admin.role !== 'admin') return error('Forbidden', 403);
        const courseId = path.split('/')[3];
        const { question, options, answer, orderIndex } = await request.json();
        await env.DB.prepare('INSERT INTO quiz_questions (course_id, question, options, answer, order_index) VALUES (?, ?, ?, ?, ?)').bind(courseId, question, JSON.stringify(options), answer, orderIndex || 99).run();
        await logAudit(env, token, 'QUIZ_QUESTION_CREATED', `Added quiz question to course ID: ${courseId}`);
        return json({ success: true });
      }

      if (path === '/api/admin/resources' && method === 'POST') {
        const token = getToken();
        const admin = await env.DB.prepare('SELECT role FROM users WHERE id = ?').bind(token).first();
        if (!admin || admin.role !== 'admin') return error('Forbidden', 403);
        const { lessonId, courseId, type, title, description, sourceUrl, thumbnailUrl, durationSeconds, fileSizeBytes, metadata, accessLevel, orderIndex, sourceType } = await request.json();
        const id = 'res_' + uid();
        await env.DB.prepare(`INSERT INTO resources (id, lesson_id, course_id, type, title, description, source_url, thumbnail_url, duration_seconds, file_size_bytes, metadata, access_level, order_index, source_type, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`).bind(id, lessonId, courseId, type, title, description || null, sourceUrl, thumbnailUrl || null, durationSeconds || null, fileSizeBytes || null, metadata ? JSON.stringify(metadata) : null, accessLevel || 'enrolled', orderIndex || 0, sourceType || 'external', Date.now()).run();
        await logAudit(env, token, 'RESOURCE_CREATED', `Created resource for lesson ID: ${lessonId}`);
        return json({ data: { id } });
      }

      if (path.startsWith('/api/admin/resources/') && method === 'PUT') {
        const token = getToken();
        const admin = await env.DB.prepare('SELECT role FROM users WHERE id = ?').bind(token).first();
        if (!admin || admin.role !== 'admin') return error('Forbidden', 403);
        const resourceId = path.split('/')[3];
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
        const resourceId = path.split('/')[3];
        await env.DB.prepare('DELETE FROM resources WHERE id = ?').bind(resourceId).run();
        await logAudit(env, token, 'RESOURCE_DELETED', `Deleted resource ID: ${resourceId}`);
        return json({ success: true });
      }

      if (path.match(/\/api\/courses\/[^/]+\/lessons\/[^/]+\/resources/) && method === 'GET') {
        const parts = path.split('/');
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
      // R2 RESOURCE UPLOAD (HYBRID: R2 + External URLs)
      // ============================================
      if (path === '/api/admin/resources/upload' && method === 'POST') {
        const token = getToken();
        const admin = await env.DB.prepare('SELECT role FROM users WHERE id = ?').bind(token).first();
        if (!admin || admin.role !== 'admin') return error('Forbidden', 403);

        if (!env.R2_BUCKET) {
          return error('R2 bucket not configured yet. Please add it to wrangler.toml', 500);
        }

        const formData = await request.formData();
        const file = formData.get('file');
        const courseId = formData.get('courseId');
        const lessonId = formData.get('lessonId');
        const type = formData.get('type') || 'document';

        if (!file || !(file instanceof File)) {
          return error('No valid file provided', 400);
        }

        const ext = file.name.split('.').pop();
        const safeName = file.name.replace(/[^a-zA-Z0-9.]/g, '_');
        const key = `courses/${courseId}/lessons/${lessonId}/${Date.now()}_${safeName}`;

        await env.R2_BUCKET.put(key, file, { httpMetadata: { contentType: file.type } });

        const publicUrl = `https://pub-xxxxxxxxxxxxxxxx.r2.dev/${key}`; 

        return json({ 
          success: true, 
          data: { url: publicUrl, key, type, size: file.size, name: file.name, sourceType: 'r2' } 
        });
      }

      // ============================================
      // SECURE RESOURCE STREAMING (Hides Raw Links)
      // ============================================
      if (path.startsWith('/api/resources/stream/') && method === 'GET') {
        const resourceId = path.split('/').pop();
        const token = getToken();
        
        const resource = await env.DB.prepare('SELECT * FROM resources WHERE id = ?').bind(resourceId).first();
        if (!resource) return error('Resource not found', 404);

        if (resource.access_level === 'enrolled') {
          if (!token) return error('Unauthorized', 401);
          const enrollment = await env.DB.prepare('SELECT 1 FROM enrollments WHERE user_id = ? AND course_id = ?').bind(token, resource.course_id).first();
          if (!enrollment) return error('Forbidden: Please enroll in this course to access this resource', 403);
        }

        if (resource.source_type === 'r2' || !resource.source_type) {
          if (!env.R2_BUCKET) return error('R2 not configured', 500);
          
          const object = await env.R2_BUCKET.get(resource.key);
          if (!object) return error('File missing from storage', 404);

          const headers = new Headers();
          object.writeHttpMetadata(headers);
          headers.set('etag', object.httpEtag);
          headers.set('Content-Disposition', 'inline'); 

          return new Response(object.body, { headers });
        } 
        
        else if (resource.source_type === 'external') {
          return json({ 
            data: { 
              type: resource.type, 
              originalUrl: resource.source_url,
              embedUrl: getEmbedUrl(resource.source_url, resource.type)
            } 
          });
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
        const mentorId = path.split('/')[3];
        await env.DB.prepare('DELETE FROM mentors WHERE id = ?').bind(mentorId).run();
        await logAudit(env, token, 'MENTOR_DELETED', `Deleted mentor ID: ${mentorId}`);
        return json({ success: true });
      }

      if (path.startsWith('/api/admin/courses/') && method === 'DELETE' && !path.includes('/modules') && !path.includes('/lessons') && !path.includes('/quiz')) {
        const token = getToken();
        const admin = await env.DB.prepare('SELECT role FROM users WHERE id = ?').bind(token).first();
        if (!admin || admin.role !== 'admin') return error('Forbidden', 403);
        const courseId = path.split('/')[3];
        await env.DB.prepare('DELETE FROM courses WHERE id = ?').bind(courseId).run();
        await logAudit(env, token, 'COURSE_DELETED', `Deleted course ID: ${courseId}`);
        return json({ success: true });
      }

      if (path === '/api/admin/users' && method === 'GET') {
        const token = getToken();
        const admin = await env.DB.prepare('SELECT role FROM users WHERE id = ?').bind(token).first();
        if (!admin || admin.role !== 'admin') return error('Forbidden', 403);
        const users = await env.DB.prepare('SELECT id, name, email, role, telegram_id, joined_at FROM users ORDER BY joined_at DESC').all();
        return json({ data: users.results });
      }

      if (path.startsWith('/api/admin/users/') && method === 'DELETE') {
        const token = getToken();
        const admin = await env.DB.prepare('SELECT role FROM users WHERE id = ?').bind(token).first();
        if (!admin || admin.role !== 'admin') return error('Forbidden', 403);
        const userId = path.split('/')[3];
        if (userId === token) return error('Cannot delete yourself', 400);
        await env.DB.prepare('DELETE FROM users WHERE id = ?').bind(userId).run();
        await logAudit(env, token, 'USER_DELETED', `Deleted user ID: ${userId}`);
        return json({ success: true });
      }

      return error('Not found', 404);
    } catch (err) {
      return error(err.message, 500);
    }
  },

  // ============================================
  // SCHEDULED CRON JOB (Daily Installment Reminders)
  // ============================================
  async scheduled(event, env) {
    const now = Date.now();
    const pending = await env.DB.prepare(`
      SELECT i.*, u.name, u.telegram_id, c.title as course_title
      FROM installments i JOIN users u ON i.user_id = u.id LEFT JOIN courses c ON i.course_id = c.id
      WHERE i.due_date <= ? AND i.status = 'pending' AND i.reminder_sent = 0
    `).bind(now).all();
    
    for (const inst of pending.results) {
      if (inst.telegram_id) {
        const amount = inst.amount.toLocaleString();
        const message = `🐯 Hello ${inst.name},\n\nYour installment of ₦${amount} for *${inst.course_title || 'your course'}* is now due.\n\nPlease complete the payment to continue your learning journey without interruption.\n\nOpen the app to pay or upload your proof.`;
        await fetch(`https://api.telegram.org/bot${env.BOT_TOKEN}/sendMessage`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ chat_id: inst.telegram_id, text: message, parse_mode: 'Markdown' })
        });
      }
      await env.DB.prepare('UPDATE installments SET reminder_sent = 1 WHERE id = ?').bind(inst.id).run();
    }
  }
};
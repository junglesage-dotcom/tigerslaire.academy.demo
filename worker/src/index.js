// worker/src/index.js
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
      // PAYSTACK WEBHOOK (Must be first to avoid auth checks)
      // ============================================
      if (path === '/api/webhooks/paystack' && method === 'POST') {
        const body = await request.json();
        
        // In production, verify the hash: 
        // const hash = crypto.createHmac('sha512', env.PAYSTACK_SECRET_KEY).update(JSON.stringify(body)).digest('hex');
        // if (hash !== request.headers.get('x-paystack-signature')) return error('Invalid signature', 400);

        if (body.event === 'charge.success') {
          const data = body.data;
          const reference = data.reference;
          
          const payment = await env.DB.prepare('SELECT * FROM payments WHERE reference = ?').bind(reference).first();
          
          if (payment && payment.status === 'pending') {
            await env.DB.prepare('UPDATE payments SET status = ?, paystack_ref = ?, updated_at = ? WHERE id = ?')
              .bind('paid', data.reference, Date.now(), payment.id).run();
            
            // Fulfill the order
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
        
        const { courseId, mentorshipAppId, amount, method, currency } = await request.json();
        const reference = 'TL-' + Date.now() + '-' + uid();
        
        await env.DB.prepare('INSERT INTO payments (id, user_id, course_id, mentorship_app_id, amount, method, currency, reference, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)')
          .bind(reference, token, courseId || null, mentorshipAppId || null, amount, method, currency || 'NGN', reference, Date.now(), Date.now()).run();
        
        return json({ data: { reference, amount, currency: currency || 'NGN' } });
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

        await env.DB.prepare('UPDATE payments SET status = ?, updated_at = ? WHERE id = ?')
          .bind('paid', Date.now(), payment.id).run();
        
        if (payment.course_id) {
          await env.DB.prepare('INSERT OR IGNORE INTO enrollments (user_id, course_id, enrolled_at) VALUES (?, ?, ?)')
            .bind(payment.user_id, payment.course_id, Date.now()).run();
        }
        
        return json({ success: true });
      }

      if (path === '/api/admin/payments' && method === 'GET') {
        const token = getToken();
        const admin = await env.DB.prepare('SELECT role FROM users WHERE id = ?').bind(token).first();
        if (!admin || admin.role !== 'admin') return error('Forbidden', 403);
        
        const payments = await env.DB.prepare(`
          SELECT p.*, u.name as user_name, u.email as user_email, c.title as course_title 
          FROM payments p 
          JOIN users u ON p.user_id = u.id 
          LEFT JOIN courses c ON p.course_id = c.id 
          ORDER BY p.created_at DESC
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
      // AUTH API
      // ============================================
      if (path === '/api/auth/register' && method === 'POST') {
        const { name, email } = await request.json();
        const id = 'st_' + uid();
        try {
          await env.DB.prepare('INSERT INTO users (id, name, email, joined_at) VALUES (?, ?, ?, ?)')
            .bind(id, name, email, Date.now()).run();
          const user = await env.DB.prepare('SELECT * FROM users WHERE id = ?').bind(id).first();
          return json({ data: user, token: id });
        } catch (e) {
          return error('Email already registered', 400);
        }
      }

      if (path === '/api/auth/login' && method === 'POST') {
        const { email } = await request.json();
        const user = await env.DB.prepare('SELECT * FROM users WHERE email = ?').bind(email).first();
        if (!user) return error('User not found', 404);
        return json({ data: user, token: user.id });
      }

      if (path === '/api/auth/demo' && method === 'POST') {
        const demoId = 'st_demo214';
        let user = await env.DB.prepare('SELECT * FROM users WHERE id = ?').bind(demoId).first();
        if (!user) {
          const now = Date.now();
          await env.DB.prepare('INSERT INTO users (id, name, email, telegram_id, role, joined_at) VALUES (?, ?, ?, ?, ?, ?)')
            .bind(demoId, 'Ada Eze', 'ada@example.com', '784512390', 'student', now - 19 * 86400000).run();
          await env.DB.prepare('INSERT INTO enrollments (user_id, course_id, enrolled_at) VALUES (?, ?, ?)')
            .bind(demoId, 'py101', now - 18 * 86400000).run();
          user = await env.DB.prepare('SELECT * FROM users WHERE id = ?').bind(demoId).first();
        }
        return json({ data: user, token: demoId });
      }

      if (path === '/api/user/me' && method === 'GET') {
        const token = getToken();
        if (!token) return error('Unauthorized', 401);
        const user = await env.DB.prepare('SELECT * FROM users WHERE id = ?').bind(token).first();
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
          await env.DB.prepare('INSERT INTO enrollments (user_id, course_id, enrolled_at) VALUES (?, ?, ?)')
            .bind(token, courseId, Date.now()).run();
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
          await env.DB.prepare('INSERT INTO lesson_completions (user_id, lesson_id, completed_at) VALUES (?, ?, ?)')
            .bind(token, lessonId, Date.now()).run();
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
        await env.DB.prepare('UPDATE enrollments SET quiz_score = ?, quiz_total = ?, quiz_passed = ? WHERE user_id = ? AND course_id = ?')
          .bind(score, total, passed, token, courseId).run();
        return json({ passed: !!passed });
      }

      if (path === '/api/activity' && method === 'GET') {
        const token = getToken();
        if (!token) return error('Unauthorized', 401);
        const activity = await env.DB.prepare('SELECT * FROM activity_logs WHERE user_id = ? ORDER BY at DESC LIMIT 40').bind(token).all();
        return json({ data: activity.results });
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
        
        await env.DB.prepare('INSERT INTO mentorship_applications (id, user_id, category_id, custom_category, goals, experience, availability, preferred_format, payment_status, applied_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)')
          .bind(id, token, categoryId, customCategory, goals, experience, availability, preferredFormat, paymentStatus, Date.now()).run();
        
        return json({ data: { id, status: 'pending', paymentStatus } });
      }

      if (path === '/api/mentorship/my-applications' && method === 'GET') {
        const token = getToken();
        if (!token) return error('Unauthorized', 401);
        const apps = await env.DB.prepare(`
          SELECT a.*, c.name as category_name 
          FROM mentorship_applications a 
          LEFT JOIN mentorship_categories c ON a.category_id = c.id 
          WHERE a.user_id = ? 
          ORDER BY a.applied_at DESC
        `).bind(token).all();
        return json({ data: apps.results });
      }

      if (path.match(/\/api\/mentorship\/application\/[^/]+\/propose/) && method === 'PUT') {
        const token = getToken();
        const appId = path.split('/')[3];
        const { price, mentorId, firstSessionDate, notes } = await request.json();
        await env.DB.prepare('UPDATE mentorship_applications SET mentor_id = ?, proposed_price = ?, start_date = ?, review_notes = ?, status = ? WHERE id = ?')
          .bind(mentorId, price, firstSessionDate ? new Date(firstSessionDate).getTime() : null, notes, 'proposal_sent', appId).run();
        return json({ success: true });
      }

      if (path.match(/\/api\/mentorship\/application\/[^/]+\/agree/) && method === 'PUT') {
        const token = getToken();
        const appId = path.split('/')[3];
        const app = await env.DB.prepare('SELECT * FROM mentorship_applications WHERE id = ? AND user_id = ?').bind(appId, token).first();
        if (!app) return error('Application not found', 404);
        await env.DB.prepare('UPDATE mentorship_applications SET agreed_price = ?, status = ?, agreed_at = ? WHERE id = ?')
          .bind(app.proposed_price, 'agreed', Date.now(), appId).run();
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
        await env.DB.prepare('INSERT INTO counseling_sessions (id, user_id, mentor_id, topic, description, format, meeting_link, location, scheduled_at, duration_minutes, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)')
          .bind(id, token, mentorId, topic, description, format, meetingLink, location, scheduledAt, duration || 60, Date.now()).run();
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
        await env.DB.prepare('INSERT INTO meetups (id, title, description, mentor_id, format, meeting_link, location, scheduled_at, duration_minutes, max_attendees, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)')
          .bind(id, title, description, mentorId, format, meetingLink, location, scheduledAt, duration, maxAttendees, Date.now()).run();
        return json({ data: { id } });
      }

      if (path.match(/\/api\/meetups\/[^/]+\/rsvp/) && method === 'POST') {
        const token = getToken();
        if (!token) return error('Unauthorized', 401);
        const meetupId = path.split('/')[2];
        const { status } = await request.json();
        await env.DB.prepare('INSERT INTO meetup_attendees (meetup_id, user_id, status, rsvp_at) VALUES (?, ?, ?, ?) ON CONFLICT(meetup_id, user_id) DO UPDATE SET status = ?, rsvp_at = ?')
          .bind(meetupId, token, status, Date.now(), status, Date.now()).run();
        return json({ success: true });
      }

      if (path === '/api/meetups/my-rsvps' && method === 'GET') {
        const token = getToken();
        if (!token) return error('Unauthorized', 401);
        const rsvps = await env.DB.prepare(`
          SELECT m.*, r.status as rsvp_status 
          FROM meetups m JOIN meetup_attendees r ON m.id = r.meetup_id 
          WHERE r.user_id = ? AND m.scheduled_at > ?
          ORDER BY m.scheduled_at ASC
        `).bind(token, Date.now()).all();
        return json({ data: rsvps.results });
      }

      // ============================================
      // ADMIN API
      // ============================================
      if (path === '/api/admin/mentors' && method === 'POST') {
        const token = getToken();
        const admin = await env.DB.prepare('SELECT role FROM users WHERE id = ?').bind(token).first();
        if (!admin || admin.role !== 'admin') return error('Forbidden', 403);
        const { userId, name, bio, specialties, hourlyRate, imageUrl } = await request.json();
        const id = 'mentor_' + uid();
        await env.DB.prepare('INSERT INTO mentors (id, user_id, name, bio, specialties, hourly_rate, image_url, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)')
          .bind(id, userId, name, bio, JSON.stringify(specialties), hourlyRate, imageUrl, Date.now()).run();
        return json({ data: { id } });
      }

      if (path === '/api/admin/instructors' && method === 'POST') {
        const token = getToken();
        const admin = await env.DB.prepare('SELECT role FROM users WHERE id = ?').bind(token).first();
        if (!admin || admin.role !== 'admin') return error('Forbidden', 403);
        const { userId, name, bio, courseIds } = await request.json();
        const id = 'inst_' + uid();
        await env.DB.prepare('INSERT INTO instructors (id, user_id, name, bio, created_at) VALUES (?, ?, ?, ?, ?)')
          .bind(id, userId, name, bio, Date.now()).run();
        for (const courseId of courseIds) {
          await env.DB.prepare('INSERT INTO course_instructors (course_id, instructor_id) VALUES (?, ?)').bind(courseId, id).run();
        }
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
        return json({ success: true });
      }

      if (path === '/api/admin/applications' && method === 'GET') {
        const token = getToken();
        const admin = await env.DB.prepare('SELECT role FROM users WHERE id = ?').bind(token).first();
        if (!admin || admin.role !== 'admin') return error('Forbidden', 403);
        const apps = await env.DB.prepare(`
          SELECT a.*, u.name as user_name, u.email as user_email, c.name as category_name
          FROM mentorship_applications a
          JOIN users u ON a.user_id = u.id
          LEFT JOIN mentorship_categories c ON a.category_id = c.id
          ORDER BY a.applied_at DESC
        `).all();
        return json({ data: apps.results });
      }

      if (path === '/api/admin/courses' && method === 'POST') {
        const token = getToken();
        const admin = await env.DB.prepare('SELECT role FROM users WHERE id = ?').bind(token).first();
        if (!admin || admin.role !== 'admin') return error('Forbidden', 403);
        const { id, code, title, tagline, level, path: coursePath, weeks, price, priceUsd, hue, icon, summary, outcomes, skills, channel } = await request.json();
        const courseId = id || 'course_' + uid();
        await env.DB.prepare(`INSERT INTO courses (id, code, title, tagline, level, path, weeks, price, price_usd, hue, icon, summary, outcomes, skills, channel, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`)
          .bind(courseId, code, title, tagline, level, coursePath, weeks, price, priceUsd || 0, hue, icon, summary, JSON.stringify(outcomes), JSON.stringify(skills), channel, Date.now()).run();
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
        return json({ success: true });
      }

      if (path.match(/\/api\/admin\/courses\/[^/]+\/modules/) && method === 'POST') {
        const token = getToken();
        const admin = await env.DB.prepare('SELECT role FROM users WHERE id = ?').bind(token).first();
        if (!admin || admin.role !== 'admin') return error('Forbidden', 403);
        const courseId = path.split('/')[3];
        const { title, orderIndex } = await request.json();
        const result = await env.DB.prepare('INSERT INTO modules (course_id, title, order_index) VALUES (?, ?, ?)').bind(courseId, title, orderIndex || 99).run();
        return json({ data: { id: result.meta.last_row_id } });
      }

      if (path.match(/\/api\/admin\/courses\/[^/]+\/lessons/) && method === 'POST') {
        const token = getToken();
        const admin = await env.DB.prepare('SELECT role FROM users WHERE id = ?').bind(token).first();
        if (!admin || admin.role !== 'admin') return error('Forbidden', 403);
        const courseId = path.split('/')[3];
        const { id, moduleId, title, minutes, tags, bullets, msg, youtubeUrl, orderIndex } = await request.json();
        const lessonId = id || 'les_' + uid();
        await env.DB.prepare(`INSERT INTO lessons (id, module_id, course_id, title, minutes, tags, bullets, msg, youtube_url, order_index) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`)
          .bind(lessonId, moduleId, courseId, title, minutes, JSON.stringify(tags || []), JSON.stringify(bullets || []), msg || 0, youtubeUrl || null, orderIndex || 99).run();
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
        return json({ success: true });
      }

      if (path.startsWith('/api/admin/lessons/') && method === 'DELETE') {
        const token = getToken();
        const admin = await env.DB.prepare('SELECT role FROM users WHERE id = ?').bind(token).first();
        if (!admin || admin.role !== 'admin') return error('Forbidden', 403);
        const lessonId = path.split('/')[3];
        await env.DB.prepare('DELETE FROM lessons WHERE id = ?').bind(lessonId).run();
        return json({ success: true });
      }

      if (path.match(/\/api\/admin\/courses\/[^/]+\/quiz/) && method === 'POST') {
        const token = getToken();
        const admin = await env.DB.prepare('SELECT role FROM users WHERE id = ?').bind(token).first();
        if (!admin || admin.role !== 'admin') return error('Forbidden', 403);
        const courseId = path.split('/')[3];
        const { question, options, answer, orderIndex } = await request.json();
        await env.DB.prepare('INSERT INTO quiz_questions (course_id, question, options, answer, order_index) VALUES (?, ?, ?, ?, ?)').bind(courseId, question, JSON.stringify(options), answer, orderIndex || 99).run();
        return json({ success: true });
      }

      if (path === '/api/admin/resources' && method === 'POST') {
        const token = getToken();
        const admin = await env.DB.prepare('SELECT role FROM users WHERE id = ?').bind(token).first();
        if (!admin || admin.role !== 'admin') return error('Forbidden', 403);
        const { lessonId, courseId, type, title, description, sourceUrl, thumbnailUrl, durationSeconds, fileSizeBytes, metadata, accessLevel, orderIndex } = await request.json();
        const id = 'res_' + uid();
        await env.DB.prepare(`INSERT INTO resources (id, lesson_id, course_id, type, title, description, source_url, thumbnail_url, duration_seconds, file_size_bytes, metadata, access_level, order_index, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`)
          .bind(id, lessonId, courseId, type, title, description || null, sourceUrl, thumbnailUrl || null, durationSeconds || null, fileSizeBytes || null, metadata ? JSON.stringify(metadata) : null, accessLevel || 'enrolled', orderIndex || 0, Date.now()).run();
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
          else if (['type', 'title', 'description', 'source_url', 'thumbnail_url', 'duration_seconds', 'file_size_bytes', 'access_level', 'order_index'].includes(key)) { fields.push(`${key} = ?`); values.push(val); }
        }
        if (fields.length > 0) { values.push(resourceId); await env.DB.prepare(`UPDATE resources SET ${fields.join(', ')} WHERE id = ?`).bind(...values).run(); }
        return json({ success: true });
      }

      if (path.startsWith('/api/admin/resources/') && method === 'DELETE') {
        const token = getToken();
        const admin = await env.DB.prepare('SELECT role FROM users WHERE id = ?').bind(token).first();
        if (!admin || admin.role !== 'admin') return error('Forbidden', 403);
        const resourceId = path.split('/')[3];
        await env.DB.prepare('DELETE FROM resources WHERE id = ?').bind(resourceId).run();
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
      // NEW: DELETE MENTOR
      // ============================================
      if (path.startsWith('/api/admin/mentors/') && method === 'DELETE') {
        const token = getToken();
        const admin = await env.DB.prepare('SELECT role FROM users WHERE id = ?').bind(token).first();
        if (!admin || admin.role !== 'admin') return error('Forbidden', 403);
        const mentorId = path.split('/')[3];
        await env.DB.prepare('DELETE FROM mentors WHERE id = ?').bind(mentorId).run();
        return json({ success: true });
      }

      // ============================================
      // NEW: DELETE COURSE
      // ============================================
      if (path.startsWith('/api/admin/courses/') && method === 'DELETE' && !path.includes('/modules') && !path.includes('/lessons') && !path.includes('/quiz')) {
        const token = getToken();
        const admin = await env.DB.prepare('SELECT role FROM users WHERE id = ?').bind(token).first();
        if (!admin || admin.role !== 'admin') return error('Forbidden', 403);
        const courseId = path.split('/')[3];
        await env.DB.prepare('DELETE FROM courses WHERE id = ?').bind(courseId).run();
        return json({ success: true });
      }

      // ============================================
      // NEW: GET ALL USERS
      // ============================================
      if (path === '/api/admin/users' && method === 'GET') {
        const token = getToken();
        const admin = await env.DB.prepare('SELECT role FROM users WHERE id = ?').bind(token).first();
        if (!admin || admin.role !== 'admin') return error('Forbidden', 403);
        const users = await env.DB.prepare('SELECT id, name, email, role, telegram_id, joined_at FROM users ORDER BY joined_at DESC').all();
        return json({ data: users.results });
      }

      // ============================================
      // NEW: DELETE USER
      // ============================================
      if (path.startsWith('/api/admin/users/') && method === 'DELETE') {
        const token = getToken();
        const admin = await env.DB.prepare('SELECT role FROM users WHERE id = ?').bind(token).first();
        if (!admin || admin.role !== 'admin') return error('Forbidden', 403);
        const userId = path.split('/')[3];
        if (userId === token) return error('Cannot delete yourself', 400);
        
        await env.DB.prepare('DELETE FROM users WHERE id = ?').bind(userId).run();
        return json({ success: true });
      }

      return error('Not found', 404);
    } catch (err) {
      return error(err.message, 500);
    }
  }
};
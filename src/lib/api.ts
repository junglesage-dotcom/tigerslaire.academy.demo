// src/lib/api.ts
const API_BASE = (import.meta.env.VITE_API_BASE as string | undefined) || 'https://tigerslair-academy.ehisferguson.workers.dev';

function getToken(): string | null {
  return localStorage.getItem('tigerslair.token');
}

function setToken(token: string) {
  localStorage.setItem('tigerslair.token', token);
}

export function clearToken() {
  localStorage.removeItem('tigerslair.token');
}

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const token = getToken();
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string> || {}),
  };
  if (token) headers['Authorization'] = `Bearer ${token}`;

  const res = await fetch(`${API_BASE}${path}`, { ...options, headers });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Request failed');
  return data;
}

export const api = {
  getCourses: () => request<{ data: any[] }>('/api/courses'),
  getCourse: (id: string) => request<{ data: any }>(`/api/courses/${id}`),

  register: (name: string, email: string, password: string) =>
    request<{ data: any; token: string }>('/api/auth/register', {
      method: 'POST', body: JSON.stringify({ name, email, password })
    }).then(res => { setToken(res.token); return res; }),

  login: (email: string, password: string) =>
    request<{ data: any; token: string }>('/api/auth/login', {
      method: 'POST', body: JSON.stringify({ email, password })
    }).then(res => { setToken(res.token); return res; }),

  loginDemo: () =>
    request<{ data: any; token: string }>('/api/auth/demo', { method: 'POST' })
      .then(res => { setToken(res.token); return res; }),

  createAdmin: (name: string, email: string) =>
    request<{ data: any; token: string }>('/api/auth/admin', {
      method: 'POST', body: JSON.stringify({ name, email })
    }).then(res => { setToken(res.token); return res; }),

  // ✅ Password Reset Flow
  forgotPassword: (email: string) =>
    request<{ success: boolean; message: string; dev_otp?: string }>('/api/auth/forgot-password', {
      method: 'POST', body: JSON.stringify({ email })
    }),
  resetPassword: (email: string, otp: string, newPassword: string) =>
    request<{ success: boolean }>('/api/auth/reset-password', {
      method: 'POST', body: JSON.stringify({ email, otp, newPassword })
    }),

  getMe: () => request<{ data: any }>('/api/user/me'),

  enroll: (courseId: string) =>
    request<{ success: boolean }>('/api/enroll', {
      method: 'POST', body: JSON.stringify({ courseId })
    }),
  getEnrollments: () => request<{ data: any[] }>('/api/enrollments'),

  completeLesson: (courseId: string, lessonId: string) =>
    request<{ success: boolean }>('/api/lessons/complete', {
      method: 'POST', body: JSON.stringify({ courseId, lessonId })
    }),

  submitQuiz: (courseId: string, score: number, total: number) =>
    request<{ passed: boolean }>('/api/quiz/submit', {
      method: 'POST', body: JSON.stringify({ courseId, score, total })
    }),

  getActivity: () => request<{ data: any[] }>('/api/activity'),

  linkTelegramMiniApp: (initData: string) =>
    request<{ success: boolean; telegramId: string }>('/api/telegram/link-mini-app', {
      method: 'POST', body: JSON.stringify({ initData })
    }),
  
  linkTelegram: () => request<{ telegramId: string }>('/api/telegram/link', { method: 'POST' }),
  unlinkTelegram: () => request<{ success: boolean }>('/api/telegram/unlink', { method: 'POST' }),
  getCommunity: () => request<{ data: any }>('/api/telegram/community'),

  setupTelegramBot: () =>
    request<{ setWebhook: any; setCommands: any; setMenu: any }>('/api/telegram/setup-webhook', {
      method: 'POST'
    }),

  getCategories: () => request<{ data: any[] }>('/api/mentorship/categories'),
  getMentors: () => request<{ data: any[] }>('/api/mentors'),
  applyMentorship: (data: any) =>
    request<{ data: any }>('/api/mentorship/apply', {
      method: 'POST', body: JSON.stringify(data)
    }),
  getMyApplications: () => request<{ data: any[] }>('/api/mentorship/my-applications'),
  agreeToProposal: (appId: string) =>
    request<{ success: boolean }>(`/api/mentorship/application/${appId}/agree`, { method: 'PUT' }),

  bookCounseling: (data: any) =>
    request<{ data: any }>('/api/counseling/book', {
      method: 'POST', body: JSON.stringify(data)
    }),
  getMySessions: () => request<{ data: any[] }>('/api/counseling/my-sessions'),

  getMeetups: () => request<{ data: any[] }>('/api/meetups'),
  createMeetup: (data: any) =>
    request<{ data: any }>('/api/meetups', {
      method: 'POST', body: JSON.stringify(data)
    }),
  rsvpMeetup: (meetupId: string, status: string) =>
    request<{ success: boolean }>(`/api/meetups/${meetupId}/rsvp`, {
      method: 'POST', body: JSON.stringify({ status })
    }),
  getMyRsvps: () => request<{ data: any[] }>('/api/meetups/my-rsvps'),

  addMentor: (data: any) =>
    request<{ data: any }>('/api/admin/mentors', {
      method: 'POST', body: JSON.stringify(data)
    }),
  deleteMentor: (id: string) =>
    request<{ success: boolean }>(`/api/admin/mentors/${id}`, { method: 'DELETE' }),
  
  addInstructor: (data: any) =>
    request<{ data: any }>('/api/admin/instructors', {
      method: 'POST', body: JSON.stringify(data)
    }),
  getInstructors: () => request<{ data: any[] }>('/api/admin/instructors'),
  deleteInstructor: (id: string) =>
    request<{ success: boolean }>(`/api/admin/instructors/${id}`, { method: 'DELETE' }),
  assignInstructorToCourse: (instId: string, courseId: string) =>
    request<{ success: boolean }>(`/api/admin/instructors/${instId}/assign-course`, {
      method: 'POST', body: JSON.stringify({ courseId })
    }),
  updateTelegram: (data: any) =>
    request<{ success: boolean }>('/api/admin/telegram/update', {
      method: 'POST', body: JSON.stringify(data)
    }),
  getAllApplications: () => request<{ data: any[] }>('/api/admin/applications'),
  proposePrice: (appId: string, price: number, mentorId: string, firstSessionDate?: string, notes?: string) =>
    request<{ success: boolean }>(`/api/mentorship/application/${appId}/propose`, {
      method: 'PUT', body: JSON.stringify({ price, mentorId, firstSessionDate, notes })
    }),

  // ✅ User Search
  getUsers: (search?: string) => 
    request<{ data: any[] }>(`/api/admin/users${search ? `?search=${encodeURIComponent(search)}` : ''}`),
  deleteUser: (id: string) =>
    request<{ success: boolean }>(`/api/admin/users/${id}`, { method: 'DELETE' }),

  createCourse: (data: any) =>
    request<{ data: any }>('/api/admin/courses', {
      method: 'POST', body: JSON.stringify(data)
    }),
  updateCourse: (id: string, data: any) =>
    request<{ success: boolean }>(`/api/admin/courses/${id}`, {
      method: 'PUT', body: JSON.stringify(data)
    }),
  deleteCourse: (id: string) =>
    request<{ success: boolean }>(`/api/admin/courses/${id}`, { method: 'DELETE' }),
  addModule: (courseId: string, data: any) =>
    request<{ data: any }>(`/api/admin/courses/${courseId}/modules`, {
      method: 'POST', body: JSON.stringify(data)
    }),
  // ✅ NEW: Rename and Delete Module (cascades to units + resources)
  renameModule: (moduleId: string, title: string) =>
    request<{ success: boolean }>(`/api/admin/modules/${moduleId}`, {
      method: 'PUT', body: JSON.stringify({ title })
    }),
  deleteModule: (moduleId: string) =>
    request<{ success: boolean }>(`/api/admin/modules/${moduleId}`, { method: 'DELETE' }),
  addLesson: (courseId: string, data: any) =>
    request<{ data: any }>(`/api/admin/courses/${courseId}/lessons`, {
      method: 'POST', body: JSON.stringify(data)
    }),
  updateLesson: (lessonId: string, data: any) =>
    request<{ success: boolean }>(`/api/admin/lessons/${lessonId}`, {
      method: 'PUT', body: JSON.stringify(data)
    }),
  deleteLesson: (lessonId: string) =>
    request<{ success: boolean }>(`/api/admin/lessons/${lessonId}`, { method: 'DELETE' }),
  
  addQuizQuestion: (courseId: string, data: any) =>
    request<{ success: boolean }>(`/api/admin/courses/${courseId}/quiz`, {
      method: 'POST', body: JSON.stringify(data)
    }),
  // ✅ Quiz Question Editor
  updateQuizQuestion: (courseId: string, questionId: string, data: any) =>
    request<{ success: boolean }>(`/api/admin/courses/${courseId}/quiz/${questionId}`, {
      method: 'PUT', body: JSON.stringify(data)
    }),
  deleteQuizQuestion: (courseId: string, questionId: string) =>
    request<{ success: boolean }>(`/api/admin/courses/${courseId}/quiz/${questionId}`, { method: 'DELETE' }),

  getResources: (courseId: string, lessonId: string) =>
    request<{ data: any[] }>(`/api/courses/${courseId}/lessons/${lessonId}/resources`),
  
  uploadResource: async (file: File | null, externalUrl: string | null, courseId: string, lessonId: string, type: string) => {
    const token = getToken();
    if (externalUrl) return { success: true, data: { url: externalUrl, type, name: 'External Link', sourceType: 'external' } };
    if (!file) throw new Error('No file or URL provided');
    const formData = new FormData();
    formData.append('file', file);
    formData.append('courseId', courseId);
    formData.append('lessonId', lessonId);
    formData.append('type', type);
    const headers: Record<string, string> = {};
    if (token) headers['Authorization'] = `Bearer ${token}`;
    const res = await fetch(`${API_BASE}/api/admin/resources/upload`, { method: 'POST', headers, body: formData });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Upload failed');
    return data;
  },

  getResourceStreamData: (resourceId: string) =>
    request<{ data: any }>(`/api/resources/stream/${resourceId}`),

  getResourceStreamUrl: (resourceId: string) => {
    const token = getToken();
    return `${API_BASE}/api/resources/stream/${resourceId}${token ? `?token=${encodeURIComponent(token)}` : ''}`;
  },

  createResource: (data: any) =>
    request<{ data: any }>('/api/admin/resources', {
      method: 'POST', body: JSON.stringify(data)
    }),
  updateResource: (id: string, data: any) =>
    request<{ success: boolean }>(`/api/admin/resources/${id}`, {
      method: 'PUT', body: JSON.stringify(data)
    }),
  deleteResource: (id: string) =>
    request<{ success: boolean }>(`/api/admin/resources/${id}`, { method: 'DELETE' }),

  initiatePayment: (data: any) =>
    request<{ data: any }>('/api/payments/initiate', {
      method: 'POST', body: JSON.stringify(data)
    }),
  
  submitProof: (reference: string, proofUrl: string) =>
    request<{ success: boolean }>('/api/payments/submit-proof', {
      method: 'POST', body: JSON.stringify({ reference, proofUrl })
    }),

  getPendingPayments: () => request<{ data: any[] }>('/api/admin/payments'),
  approvePayment: (reference: string) =>
    request<{ success: boolean }>('/api/payments/approve', {
      method: 'POST', body: JSON.stringify({ reference, adminToken: getToken() })
    }),

  getMyInstallments: () => request<{ data: any[] }>('/api/installments/my'),
  submitInstallmentProof: (installmentId: string, proofUrl: string) =>
    request<{ success: boolean }>('/api/installments/submit-proof', {
      method: 'POST', body: JSON.stringify({ installmentId, proofUrl })
    }),

  getAdminInstallments: () => request<{ data: any[] }>('/api/admin/installments'),
  approveInstallment: (installmentId: string) =>
    request<{ success: boolean }>('/api/installments/approve', {
      method: 'POST', body: JSON.stringify({ installmentId, adminToken: getToken() })
    }),

  getAnalytics: () => request<{ data: any }>('/api/admin/analytics'),
  getStudentProgress: () => request<{ data: any[] }>('/api/admin/student-progress'),
  
  // ✅ Audit Logs
  getAuditLogs: () => request<{ data: any[] }>('/api/admin/audit-logs'),

  // ✅ NEW: Public Certificate Verification (No auth required)
  verifyCertificate: (certId: string) =>
    request<{ valid: boolean; data?: any }>(`/api/certificates/${encodeURIComponent(certId)}`),
};
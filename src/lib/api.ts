// src/lib/api.ts
const API_BASE = 'https://tigerslair-api.ehisferguson.workers.dev'; // REPLACE WITH YOUR URL

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
  // Courses
  getCourses: () => request<{ data: any[] }>('/api/courses'),
  getCourse: (id: string) => request<{ data: any }>(`/api/courses/${id}`),

  // Auth
  register: (name: string, email: string) =>
    request<{ data: any; token: string }>('/api/auth/register', {
      method: 'POST', body: JSON.stringify({ name, email })
    }).then(res => { setToken(res.token); return res; }),

  login: (email: string) =>
    request<{ data: any; token: string }>('/api/auth/login', {
      method: 'POST', body: JSON.stringify({ email })
    }).then(res => { setToken(res.token); return res; }),

  loginDemo: () =>
    request<{ data: any; token: string }>('/api/auth/demo', { method: 'POST' })
      .then(res => { setToken(res.token); return res; }),

  createAdmin: (name: string, email: string) =>
    request<{ data: any; token: string }>('/api/auth/admin', {
      method: 'POST', body: JSON.stringify({ name, email })
    }).then(res => { setToken(res.token); return res; }),

  getMe: () => request<{ data: any }>('/api/user/me'),

  // Enrollments
  enroll: (courseId: string) =>
    request<{ success: boolean }>('/api/enroll', {
      method: 'POST', body: JSON.stringify({ courseId })
    }),
  getEnrollments: () => request<{ data: any[] }>('/api/enrollments'),

  // Lessons
  completeLesson: (courseId: string, lessonId: string) =>
    request<{ success: boolean }>('/api/lessons/complete', {
      method: 'POST', body: JSON.stringify({ courseId, lessonId })
    }),

  // Quiz
  submitQuiz: (courseId: string, score: number, total: number) =>
    request<{ passed: boolean }>('/api/quiz/submit', {
      method: 'POST', body: JSON.stringify({ courseId, score, total })
    }),

  // Activity
  getActivity: () => request<{ data: any[] }>('/api/activity'),

  // Telegram
  linkTelegram: () => request<{ telegramId: string }>('/api/telegram/link', { method: 'POST' }),
  unlinkTelegram: () => request<{ success: boolean }>('/api/telegram/unlink', { method: 'POST' }),
  getCommunity: () => request<{ data: any }>('/api/telegram/community'),

  // Mentorship
  getCategories: () => request<{ data: any[] }>('/api/mentorship/categories'),
  getMentors: () => request<{ data: any[] }>('/api/mentors'),
  applyMentorship: (data: any) =>
    request<{ data: any }>('/api/mentorship/apply', {
      method: 'POST', body: JSON.stringify(data)
    }),
  getMyApplications: () => request<{ data: any[] }>('/api/mentorship/my-applications'),
  agreeToProposal: (appId: string) =>
    request<{ success: boolean }>(`/api/mentorship/application/${appId}/agree`, { method: 'PUT' }),

  // Counseling
  bookCounseling: (data: any) =>
    request<{ data: any }>('/api/counseling/book', {
      method: 'POST', body: JSON.stringify(data)
    }),
  getMySessions: () => request<{ data: any[] }>('/api/counseling/my-sessions'),

  // Meetups
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

  // Admin
  addMentor: (data: any) =>
    request<{ data: any }>('/api/admin/mentors', {
      method: 'POST', body: JSON.stringify(data)
    }),
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

  // Admin: Courses
  createCourse: (data: any) =>
    request<{ data: any }>('/api/admin/courses', {
      method: 'POST', body: JSON.stringify(data)
    }),
  updateCourse: (id: string, data: any) =>
    request<{ success: boolean }>(`/api/admin/courses/${id}`, {
      method: 'PUT', body: JSON.stringify(data)
    }),
  addModule: (courseId: string, data: any) =>
    request<{ data: any }>(`/api/admin/courses/${courseId}/modules`, {
      method: 'POST', body: JSON.stringify(data)
    }),
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

  // Resources
  getResources: (courseId: string, lessonId: string) =>
    request<{ data: any[] }>(`/api/courses/${courseId}/lessons/${lessonId}/resources`),
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
  getUploadUrl: (filename: string, contentType: string) =>
    request<{ data: any }>('/api/admin/resources/upload-url', {
      method: 'POST', body: JSON.stringify({ filename, contentType })
    }),
};
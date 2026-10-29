import { useEffect, useState, useMemo } from "react";
import { api } from "../lib/api";
import { sanitizeObject } from "../lib/sanitize";
import { useStore } from "../lib/store";
import ConfirmDialog from "../components/ConfirmDialog";
import { 
  BarChart3, TrendingUp, FileText, CreditCard, Calendar, 
  GraduationCap, UserCheck, BookOpen, Users, Shield, 
  ExternalLink, CheckCircle, Clock, AlertTriangle, Trash2, Pencil, Search, Plus
} from "lucide-react";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from "recharts";

export default function AdminPanel() {
  const { user, go, toast } = useStore();
  
  const [activeTab, setActiveTab] = useState<'analytics' | 'progress' | 'applications' | 'payments' | 'installments' | 'mentors' | 'instructors' | 'courses' | 'users' | 'audit' | 'meetups'>('analytics');
  
  const [apps, setApps] = useState<any[]>([]);
  const [payments, setPayments] = useState<any[]>([]);
  const [installments, setInstallments] = useState<any[]>([]);
  const [mentors, setMentors] = useState<any[]>([]);
  const [instructors, setInstructors] = useState<any[]>([]);
  const [courses, setCourses] = useState<any[]>([]);
  const [users, setUsers] = useState<any[]>([]);
  const [progress, setProgress] = useState<any[]>([]);
  const [auditLogs, setAuditLogs] = useState<any[]>([]);
  const [meetups, setMeetups] = useState<any[]>([]);

  // ✅ NEW: Meetup Attendees State
  const [expandedMeetup, setExpandedMeetup] = useState<string | null>(null);
  const [meetupAttendees, setMeetupAttendees] = useState<Record<string, any[]>>({});
  const [loadingAttendees, setLoadingAttendees] = useState<string | null>(null);

  const [userSearch, setUserSearch] = useState("");
  const [courseSearch, setCourseSearch] = useState("");

  const [analytics, setAnalytics] = useState<any>({ 
    totalRevenue: 0, 
    totalStudents: 0, 
    totalCourses: 0, 
    pendingApplications: 0, 
    recentStudents: [],
    completionRate: 0,
    topCourses: []
  });

  const [newMentor, setNewMentor] = useState({ name: "", bio: "", specialties: "tech", hourlyRate: 0, imageUrl: "" });
  const [newInstructor, setNewInstructor] = useState({ name: "", bio: "", courseIds: [] as string[] });
  const [newCourse, setNewCourse] = useState({
    code: "", title: "", tagline: "", level: "Beginner", path: "Beginner → Intermediate",
    weeks: 8, price: 0, priceUsd: 0, hue: "#ffa41b", icon: "python", summary: "", outcomes: "", skills: "", channel: ""
  });
  
  const [newMeetup, setNewMeetup] = useState({
    title: "", description: "", format: "Virtual", meetingLink: "", location: "", 
    scheduledAt: "", duration: 60, maxAttendees: 20, mentorId: ""
  });

  const [confirmDialog, setConfirmDialog] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    isDestructive: boolean;
    onConfirm: () => Promise<void> | void;
  }>({ isOpen: false, title: "", message: "", isDestructive: false, onConfirm: () => {} });
  
  const [isDialogLoading, setIsDialogLoading] = useState(false);

  useEffect(() => {
    if (user?.role !== 'admin') {
      toast("Access denied");
      go({ view: "home" });
      return;
    }
    loadAll();
  }, [user, go, toast]);

  const loadAll = async () => {
    try {
      const [analyticsRes, appsRes, payRes, adminInstallmentsRes, mentorsRes, instructorsRes, coursesRes, usersRes, progressRes, auditRes, meetupsRes] = await Promise.all([
        api.getAnalytics(),
        api.getAllApplications(),
        api.getPendingPayments(),
        api.getAdminInstallments(),
        api.getMentors(),
        api.getInstructors(),
        api.getCourses(),
        api.getUsers(),
        api.getStudentProgress(),
        api.getAuditLogs(),
        api.getMeetups()
      ]);
      
      setAnalytics(analyticsRes.data);
      setApps(appsRes.data);
      setPayments(payRes.data);
      setInstallments(adminInstallmentsRes.data);
      setMentors(mentorsRes.data);
      setInstructors(instructorsRes.data);
      setCourses(coursesRes.data);
      setUsers(usersRes.data);
      setProgress(progressRes.data);
      setAuditLogs(auditRes.data);
      setMeetups(meetupsRes.data || []);
    } catch (e) {
      toast("Failed to load admin data");
    }
  };

  const filteredUsers = useMemo(() => {
    if (!userSearch) return users;
    const term = userSearch.toLowerCase();
    return users.filter(u => 
      u.name.toLowerCase().includes(term) || 
      u.email.toLowerCase().includes(term)
    );
  }, [users, userSearch]);

  const filteredCourses = useMemo(() => {
    if (!courseSearch) return courses;
    const term = courseSearch.toLowerCase();
    return courses.filter(c =>
      c.code.toLowerCase().includes(term) ||
      c.title.toLowerCase().includes(term)
    );
  }, [courses, courseSearch]);

  const handlePropose = async (appId: string, price: number) => {
    try {
      await api.proposePrice(appId, price, mentors[0]?.id || "mentor_primary");
      toast("Price proposed");
      loadAll();
    } catch (e: any) {
      toast(e.message);
    }
  };

  const handleAddMentor = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.addMentor({
        ...sanitizeObject(newMentor),
        specialties: newMentor.specialties.split(",").map(s => s.trim()),
        userId: user?.id
      });
      toast("Mentor added successfully");
      setNewMentor({ name: "", bio: "", specialties: "tech", hourlyRate: 0, imageUrl: "" });
      loadAll();
    } catch (e: any) {
      toast(e.message);
    }
  };

  const promptDeleteMentor = (id: string, name: string) => {
    setConfirmDialog({
      isOpen: true,
      title: "Delete Mentor",
      message: `Are you sure you want to delete ${name}? This action cannot be undone.`,
      isDestructive: true,
      onConfirm: async () => {
        setIsDialogLoading(true);
        try {
          await api.deleteMentor(id);
          toast("Mentor deleted");
          await new Promise(r => setTimeout(r, 300));
          loadAll();
        } catch (e: any) {
          toast(e.message);
        } finally {
          setIsDialogLoading(false);
          setConfirmDialog(prev => ({ ...prev, isOpen: false }));
        }
      }
    });
  };

  const handleAddInstructor = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.addInstructor({
        ...sanitizeObject(newInstructor),
        courseIds: newInstructor.courseIds,
        userId: user?.id
      });
      toast("Instructor added successfully");
      setNewInstructor({ name: "", bio: "", courseIds: [] });
      loadAll();
    } catch (e: any) {
      toast(e.message);
    }
  };

  const promptDeleteInstructor = (id: string, name: string) => {
    setConfirmDialog({
      isOpen: true,
      title: "Delete Instructor",
      message: `Are you sure you want to delete ${name}? This action cannot be undone.`,
      isDestructive: true,
      onConfirm: async () => {
        setIsDialogLoading(true);
        try {
          await api.deleteInstructor(id);
          toast("Instructor deleted");
          await new Promise(r => setTimeout(r, 300));
          loadAll();
        } catch (e: any) {
          toast(e.message);
        } finally {
          setIsDialogLoading(false);
          setConfirmDialog(prev => ({ ...prev, isOpen: false }));
        }
      }
    });
  };

  const handleAddCourse = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await api.createCourse({
        ...sanitizeObject(newCourse),
        outcomes: newCourse.outcomes.split("\n").filter(o => o.trim()),
        skills: newCourse.skills.split(",").map(s => s.trim())
      });
      toast("Course created! Redirecting to editor...");
      go({ view: "course-editor", courseId: res.data.id } as any);
    } catch (e: any) {
      toast(e.message);
    }
  };

  const promptDeleteCourse = (id: string, code: string) => {
    setConfirmDialog({
      isOpen: true,
      title: "Delete Course",
      message: `Are you sure you want to delete course ${code}? This will permanently remove it and all its units, enrollments, and payments.`,
      isDestructive: true,
      onConfirm: async () => {
        setIsDialogLoading(true);
        try {
          await api.deleteCourse(id);
          toast("Course and all associated data deleted");
          await new Promise(r => setTimeout(r, 500)); 
          loadAll();
        } catch (e: any) {
          toast(e.message);
        } finally {
          setIsDialogLoading(false);
          setConfirmDialog(prev => ({ ...prev, isOpen: false }));
        }
      }
    });
  };

  const promptDeleteUser = (id: string, name: string) => {
    setConfirmDialog({
      isOpen: true,
      title: "Delete User Account",
      message: `Are you sure you want to permanently delete ${name}'s account? This will wipe all their enrollments, payments, and progress.`,
      isDestructive: true,
      onConfirm: async () => {
        setIsDialogLoading(true);
        try {
          await api.deleteUser(id);
          toast("User account and associated data deleted");
          await new Promise(r => setTimeout(r, 500)); 
          loadAll();
        } catch (e: any) {
          toast(e.message);
        } finally {
          setIsDialogLoading(false);
          setConfirmDialog(prev => ({ ...prev, isOpen: false }));
        }
      }
    });
  };

  const handleAddMeetup = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.createMeetup({
        ...sanitizeObject(newMeetup),
        scheduledAt: new Date(newMeetup.scheduledAt).getTime(),
        duration: parseInt(newMeetup.duration as any) || 60,
        maxAttendees: parseInt(newMeetup.maxAttendees as any) || 20,
        mentorId: newMeetup.mentorId === "" ? null : newMeetup.mentorId
      });
      toast("Meetup scheduled successfully!");
      setNewMeetup({ title: "", description: "", format: "Virtual", meetingLink: "", location: "", scheduledAt: "", duration: 60, maxAttendees: 20, mentorId: "" });
      loadAll();
    } catch (e: any) {
      toast(e.message);
    }
  };

  const promptDeleteMeetup = (id: string, title: string) => {
    setConfirmDialog({
      isOpen: true,
      title: "Cancel Meetup",
      message: `Are you sure you want to cancel and delete "${title}"? This will remove all associated RSVPs.`,
      isDestructive: true,
      onConfirm: async () => {
        setIsDialogLoading(true);
        try {
          await api.deleteMeetup(id);
          toast("Meetup canceled and deleted");
          await new Promise(r => setTimeout(r, 300));
          loadAll();
        } catch (e: any) {
          toast(e.message);
        } finally {
          setIsDialogLoading(false);
          setConfirmDialog(prev => ({ ...prev, isOpen: false }));
        }
      }
    });
  };

  // ✅ NEW: Load Attendees for a Specific Meetup
  const loadAttendees = async (meetupId: string) => {
    if (meetupAttendees[meetupId]) {
      // Already loaded, just toggle visibility
      setExpandedMeetup(expandedMeetup === meetupId ? null : meetupId);
      return;
    }
    
    setLoadingAttendees(meetupId);
    try {
      const res = await api.getMeetupAttendees(meetupId);
      setMeetupAttendees(prev => ({ ...prev, [meetupId]: res.data }));
      setExpandedMeetup(meetupId);
    } catch (e: any) {
      toast(e.message || "Failed to load attendees");
    } finally {
      setLoadingAttendees(null);
    }
  };

  const tabs: { 
    id: typeof activeTab; 
    label: string; 
    count?: number; 
    icon?: React.ReactNode 
  }[] = [
    { id: 'analytics', label: 'Analytics', icon: <BarChart3 className="h-4 w-4" /> },
    { id: 'progress', label: 'Student Progress', count: progress.length, icon: <TrendingUp className="h-4 w-4" /> },
    { id: 'applications', label: 'Applications', count: apps.filter(a => a.status === 'pending').length, icon: <FileText className="h-4 w-4" /> },
    { id: 'payments', label: 'Payments', count: payments.filter(p => p.status === 'proof_submitted').length, icon: <CreditCard className="h-4 w-4" /> },
    { id: 'installments', label: 'Installments', count: installments.length, icon: <Calendar className="h-4 w-4" /> },
    { id: 'mentors', label: 'Mentors', count: mentors.length, icon: <GraduationCap className="h-4 w-4" /> },
    { id: 'instructors', label: 'Instructors', count: instructors.length, icon: <UserCheck className="h-4 w-4" /> },
    { id: 'courses', label: 'Courses', count: courses.length, icon: <BookOpen className="h-4 w-4" /> },
    { id: 'meetups', label: 'Meetups', count: meetups.length, icon: <Users className="h-4 w-4" /> },
    { id: 'users', label: 'Users', count: users.length, icon: <Users className="h-4 w-4" /> },
    { id: 'audit', label: 'Audit Logs', icon: <Shield className="h-4 w-4" /> },
  ];

  return (
    <div className="mx-auto max-w-7xl px-5 py-12 sm:px-8">
      <h1 className="font-display text-3xl font-extrabold text-bone mb-8">Admin Control Panel</h1>

      <div className="mb-8 flex gap-2 border-b border-bone/10 overflow-x-auto">
        {tabs.map(t => (
          <button
            key={t.id}
            onClick={() => setActiveTab(t.id)}
            className={`flex items-center gap-2 px-4 py-2 font-display text-sm font-bold transition-colors whitespace-nowrap ${
              activeTab === t.id ? 'text-amber border-b-2 border-amber' : 'text-smoke hover:text-bone'
            }`}
          >
            {t.icon && <span className="flex items-center">{t.icon}</span>}
            {t.label} {t.count !== undefined && t.count > 0 && <span className="ml-1 rounded bg-amber/20 px-1.5 py-0.5 text-[10px] text-amber">{t.count}</span>}
          </button>
        ))}
      </div>

      {activeTab === 'analytics' && (
        <div className="space-y-8">
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            <div className="rounded-xl border border-bone/10 bg-coal p-6">
              <CreditCard className="h-5 w-5 text-mint mb-2" />
              <p className="text-xs font-bold uppercase tracking-widest text-smoke mb-2">Total Revenue</p>
              <p className="font-display text-3xl font-extrabold text-mint">₦{analytics.totalRevenue.toLocaleString()}</p>
              <p className="text-xs text-smoke mt-2">From successful payments</p>
            </div>
            <div className="rounded-xl border border-bone/10 bg-coal p-6">
              <Users className="h-5 w-5 text-tgsky mb-2" />
              <p className="text-xs font-bold uppercase tracking-widest text-smoke mb-2">Total Students</p>
              <p className="font-display text-3xl font-extrabold text-tgsky">{analytics.totalStudents.toLocaleString()}</p>
              <p className="text-xs text-smoke mt-2">Registered learners</p>
            </div>
            <div className="rounded-xl border border-bone/10 bg-coal p-6">
              <BookOpen className="h-5 w-5 text-amber mb-2" />
              <p className="text-xs font-bold uppercase tracking-widest text-smoke mb-2">Active Courses</p>
              <p className="font-display text-3xl font-extrabold text-amber">{analytics.totalCourses}</p>
              <p className="text-xs text-smoke mt-2">Published to catalog</p>
            </div>
            <div className="rounded-xl border border-bone/10 bg-coal p-6">
              <FileText className="h-5 w-5 text-ember mb-2" />
              <p className="text-xs font-bold uppercase tracking-widest text-smoke mb-2">Pending Mentorships</p>
              <p className="font-display text-3xl font-extrabold text-ember">{analytics.pendingApplications}</p>
              <p className="text-xs text-smoke mt-2">Awaiting your review</p>
            </div>
          </div>

          <div className="grid gap-6 lg:grid-cols-2">
            <div className="rounded-xl border border-bone/10 bg-coal p-6">
              <h3 className="font-display text-lg font-bold text-amber mb-4">Course Completion Rate</h3>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={[
                        { name: 'Completed', value: analytics.completionRate || 0 },
                        { name: 'In Progress', value: 100 - (analytics.completionRate || 0) }
                      ]}
                      cx="50%" cy="50%" innerRadius={60} outerRadius={80}
                      paddingAngle={5} dataKey="value"
                    >
                      <Cell fill="#f59e0b" />
                      <Cell fill="#334155" />
                    </Pie>
                    <Tooltip contentStyle={{ backgroundColor: '#1a120a', border: '1px solid #334155', color: '#e2e8f0' }} />
                  </PieChart>
                </ResponsiveContainer>
                <p className="text-center text-2xl font-bold text-amber">{analytics.completionRate || 0}%</p>
                <p className="text-center text-xs text-smoke">of enrolled students complete their courses</p>
              </div>
            </div>

            <div className="rounded-xl border border-bone/10 bg-coal p-6">
              <h3 className="font-display text-lg font-bold text-amber mb-4">Top Enrolled Courses</h3>
              <div className="space-y-4">
                {analytics.topCourses?.length > 0 ? analytics.topCourses.map((course: any, idx: number) => (
                  <div key={course.code || idx} className="flex items-center justify-between p-3 rounded-lg bg-ink/50 border border-bone/5">
                    <div className="flex items-center gap-3">
                      <span className="flex h-8 w-8 items-center justify-center rounded-full bg-amber/20 text-amber font-bold text-sm">
                        {idx + 1}
                      </span>
                      <div>
                        <p className="font-bold text-bone text-sm">{course.title}</p>
                        <p className="text-xs text-smoke">{course.code}</p>
                      </div>
                    </div>
                    <span className="text-sm font-bold text-mint">{course.enrollments} students</span>
                  </div>
                )) : (
                  <p className="text-sm text-smoke text-center py-8">No course enrollment data yet.</p>
                )}
              </div>
            </div>
          </div>

          <div className="rounded-xl border border-bone/10 bg-coal p-6">
            <h2 className="font-display text-xl font-bold text-amber mb-4">Recent Student Signups</h2>
            {analytics.recentStudents.length === 0 ? (
              <p className="text-sm text-smoke text-center py-4">No recent signups.</p>
            ) : (
              <div className="space-y-3">
                {analytics.recentStudents.map((student: any) => (
                  <div key={student.id} className="flex items-center justify-between rounded-lg border border-bone/5 bg-ink p-4">
                    <div className="flex items-center gap-4">
                      <div className="flex h-10 w-10 items-center justify-center rounded-full bg-amber/20 text-amber font-bold">
                        {student.name.charAt(0)}
                      </div>
                      <div>
                        <p className="font-bold text-bone">{student.name}</p>
                        <p className="text-xs text-smoke">{student.email}</p>
                      </div>
                    </div>
                    <p className="text-xs text-smoke">Joined {new Date(student.joined_at).toLocaleDateString()}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {activeTab === 'progress' && (
        <div className="rounded-lg border border-bone/10 bg-coal p-6">
          <h2 className="font-display text-xl font-bold text-amber mb-4">Student Engagement & Progress</h2>
          {progress.length === 0 ? (
            <p className="text-sm text-smoke text-center py-8">No students have enrolled in courses yet.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead className="text-xs text-smoke uppercase border-b border-bone/10">
                  <tr>
                    <th className="py-3 px-2">Student</th>
                    <th className="py-3 px-2">Course</th>
                    <th className="py-3 px-2">Enrolled</th>
                    <th className="py-3 px-2">Quiz Status</th>
                    <th className="py-3 px-2 text-right">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {progress.map((p, idx) => (
                    <tr key={idx} className="border-b border-bone/5 hover:bg-ink/50 transition-colors">
                      <td className="py-3 px-2">
                        <p className="font-bold text-bone">{p.user_name}</p>
                        <p className="text-xs text-smoke">{p.user_email}</p>
                      </td>
                      <td className="py-3 px-2">
                        <p className="font-bold text-bone">{p.course_code}</p>
                        <p className="text-xs text-smoke truncate max-w-[200px]">{p.course_title}</p>
                      </td>
                      <td className="py-3 px-2 text-smoke">{new Date(p.enrolled_at).toLocaleDateString()}</td>
                      <td className="py-3 px-2">
                        {p.quiz_passed === 1 ? (
                          <span className="rounded bg-mint/20 px-2 py-1 text-[10px] font-bold uppercase text-mint flex items-center gap-1 w-fit"><CheckCircle className="h-3 w-3" /> Passed ({p.quiz_score}/{p.quiz_total})</span>
                        ) : p.quiz_score ? (
                          <span className="rounded bg-amber/20 px-2 py-1 text-[10px] font-bold uppercase text-amber flex items-center gap-1 w-fit"><Clock className="h-3 w-3" /> In Progress ({p.quiz_score}/{p.quiz_total})</span>
                        ) : (
                          <span className="rounded bg-bone/5 px-2 py-1 text-[10px] font-bold uppercase text-smoke flex items-center gap-1 w-fit"><AlertTriangle className="h-3 w-3" /> Not Started</span>
                        )}
                      </td>
                      <td className="py-3 px-2 text-right">
                        <button onClick={() => go({ view: 'course', courseId: p.course_id })} className="text-xs text-tgsky hover:underline font-bold flex items-center gap-1 ml-auto"><ExternalLink className="h-3 w-3" /> View Course</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {activeTab === 'applications' && (
        <div className="rounded-lg border border-bone/10 bg-coal p-6">
          <h2 className="font-display text-xl font-bold text-amber mb-4">Pending Applications</h2>
          <div className="space-y-4">
            {apps.filter(a => a.status === 'pending').map((app) => (
              <div key={app.id} className="rounded border border-bone/5 bg-ink p-4">
                <div className="flex justify-between">
                  <div>
                    <p className="font-bold text-bone">{app.user_name}</p>
                    <p className="text-xs text-smoke">{app.category_name || app.custom_category}</p>
                    <p className="mt-2 text-sm text-bone/80 italic">"{app.goals}"</p>
                  </div>
                  <p className="text-xs text-smoke">Payment: {app.payment_status}</p>
                </div>
                <div className="mt-4 flex gap-2">
                  <input type="number" placeholder="Propose Price (₦)" className="flex-1 rounded border border-bone/10 bg-coal p-2 text-sm text-bone" id={`price-${app.id}`} />
                  <button onClick={() => { const price = parseInt((document.getElementById(`price-${app.id}`) as HTMLInputElement).value); if (price) handlePropose(app.id, price); }} className="rounded bg-amber px-4 py-2 text-xs font-bold uppercase text-ink hover:bg-amber/90 transition-colors flex items-center gap-1"><CheckCircle className="h-3 w-3" /> Propose</button>
                </div>
              </div>
            ))}
            {apps.filter(a => a.status === 'pending').length === 0 && <p className="text-sm text-smoke text-center py-8">No pending applications.</p>}
          </div>
        </div>
      )}

      {activeTab === 'payments' && (
        <div className="rounded-lg border border-bone/10 bg-coal p-6">
          <h2 className="font-display text-xl font-bold text-amber mb-4">Pending Bank Transfers</h2>
          <div className="space-y-4">
            {payments.filter(p => p.status === 'proof_submitted').map((p) => (
              <div key={p.reference} className="rounded border border-bone/5 bg-ink p-4 flex flex-col sm:flex-row justify-between gap-4">
                <div>
                  <p className="font-bold text-bone">{p.user_name} - {p.course_title || 'Mentorship'}</p>
                  <p className="text-xs text-smoke mt-1">Ref: {p.reference}</p>
                  <p className="text-sm text-amber font-bold mt-2">{p.currency === 'USD' ? '$' : '₦'}{p.amount.toLocaleString()}</p>
                  {p.proof_url && <a href={p.proof_url} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 mt-2 text-xs text-tgsky underline hover:text-tgsky/80">View Payment Slip <ExternalLink className="h-3 w-3" /></a>}
                </div>
                <button onClick={() => { setConfirmDialog({ isOpen: true, title: "Approve Payment", message: `Approve this payment and enroll ${p.user_name}?`, isDestructive: false, onConfirm: async () => { setIsDialogLoading(true); try { await api.approvePayment(p.reference); toast("Payment approved and user enrolled!"); loadAll(); } catch (e: any) { toast(e.message); } finally { setIsDialogLoading(false); setConfirmDialog(prev => ({ ...prev, isOpen: false })); } } }); }} className="self-start rounded bg-mint px-6 py-2 text-xs font-bold uppercase text-ink hover:bg-mint/90 transition-colors flex items-center gap-1"><CheckCircle className="h-3 w-3" /> Approve & Enroll</button>
              </div>
            ))}
            {payments.filter(p => p.status === 'proof_submitted').length === 0 && <p className="text-sm text-smoke text-center py-8">No pending bank transfer proofs to review.</p>}
          </div>
        </div>
      )}

      {activeTab === 'installments' && (
        <div className="rounded-lg border border-bone/10 bg-coal p-6">
          <h2 className="font-display text-xl font-bold text-amber mb-4">Pending Installment Proofs</h2>
          <div className="space-y-4">
            {installments.map((inst) => (
              <div key={inst.id} className="rounded border border-bone/5 bg-ink p-4 flex flex-col sm:flex-row justify-between gap-4">
                <div>
                  <p className="font-bold text-bone">{inst.user_name} - {inst.course_title || 'Course Installment'}</p>
                  <p className="text-xs text-smoke mt-1">Installment ID: {inst.id}</p>
                  <p className="text-sm text-amber font-bold mt-2">₦{inst.amount.toLocaleString()}</p>
                  {inst.proof_url && <a href={inst.proof_url} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 mt-2 text-xs text-tgsky underline hover:text-tgsky/80">View Payment Slip <ExternalLink className="h-3 w-3" /></a>}
                </div>
                <button onClick={() => { setConfirmDialog({ isOpen: true, title: "Approve Installment", message: `Mark this installment as paid for ${inst.user_name}?`, isDestructive: false, onConfirm: async () => { setIsDialogLoading(true); try { await api.approveInstallment(inst.id); toast("Installment approved!"); loadAll(); } catch (e: any) { toast(e.message); } finally { setIsDialogLoading(false); setConfirmDialog(prev => ({ ...prev, isOpen: false })); } } }); }} className="self-start rounded bg-mint px-6 py-2 text-xs font-bold uppercase text-ink hover:bg-mint/90 transition-colors flex items-center gap-1"><CheckCircle className="h-3 w-3" /> Approve</button>
              </div>
            ))}
            {installments.length === 0 && <p className="text-sm text-smoke text-center py-8">No pending installment proofs to review.</p>}
          </div>
        </div>
      )}

      {activeTab === 'mentors' && (
        <div className="grid gap-6 lg:grid-cols-2">
          <div className="rounded-lg border border-bone/10 bg-coal p-6">
            <h2 className="font-display text-xl font-bold text-amber mb-4">Add Mentor</h2>
            <form onSubmit={handleAddMentor} className="space-y-3">
              <input required placeholder="Name" className="w-full rounded border border-bone/10 bg-ink p-2 text-sm text-bone focus:border-amber outline-none" value={newMentor.name} onChange={e => setNewMentor({...newMentor, name: e.target.value})} />
              <input placeholder="Image URL" className="w-full rounded border border-bone/10 bg-ink p-2 text-sm text-bone focus:border-amber outline-none" value={newMentor.imageUrl} onChange={e => setNewMentor({...newMentor, imageUrl: e.target.value})} />
              <textarea required placeholder="Bio" rows={3} className="w-full rounded border border-bone/10 bg-ink p-2 text-sm text-bone focus:border-amber outline-none" value={newMentor.bio} onChange={e => setNewMentor({...newMentor, bio: e.target.value})} />
              <input placeholder="Specialties (comma-separated)" className="w-full rounded border border-bone/10 bg-ink p-2 text-sm text-bone focus:border-amber outline-none" value={newMentor.specialties} onChange={e => setNewMentor({...newMentor, specialties: e.target.value})} />
              <input type="number" placeholder="Hourly Rate (₦)" className="w-full rounded border border-bone/10 bg-ink p-2 text-sm text-bone focus:border-amber outline-none" value={newMentor.hourlyRate} onChange={e => setNewMentor({...newMentor, hourlyRate: parseInt(e.target.value) || 0})} />
              <button type="submit" className="w-full rounded bg-mint py-2 text-xs font-bold uppercase text-ink hover:bg-mint/90 transition-colors flex items-center justify-center gap-1"><Plus className="h-3 w-3" /> Add Mentor</button>
            </form>
          </div>
          <div className="rounded-lg border border-bone/10 bg-coal p-6">
            <h2 className="font-display text-xl font-bold text-amber mb-4">Current Mentors</h2>
            <div className="space-y-3">
              {mentors.map(m => (
                <div key={m.id} className="rounded border border-bone/5 bg-ink p-3 flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3 flex-1 min-w-0">
                    {m.image_url ? <img src={m.image_url} alt={m.name} className="h-10 w-10 rounded-full object-cover shrink-0" /> : <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-amber/20 text-amber font-bold">{m.name.charAt(0)}</div>}
                    <div className="flex-1 min-w-0">
                      <p className="font-bold text-bone truncate">{m.name}</p>
                      <p className="text-xs text-smoke truncate">{m.specialties?.join(', ')}</p>
                      <p className="text-xs text-amber mt-1">₦{m.hourly_rate?.toLocaleString()}/hr</p>
                    </div>
                  </div>
                  <button onClick={() => promptDeleteMentor(m.id, m.name)} className="shrink-0 text-xs text-alert hover:underline font-bold flex items-center gap-1"><Trash2 className="h-3 w-3" /> Delete</button>
                </div>
              ))}
              {mentors.length === 0 && <p className="text-sm text-smoke text-center py-4">No mentors added yet.</p>}
            </div>
          </div>
        </div>
      )}

      {activeTab === 'instructors' && (
        <div className="grid gap-6 lg:grid-cols-2">
          <div className="rounded-lg border border-bone/10 bg-coal p-6">
            <h2 className="font-display text-xl font-bold text-amber mb-4">Add Instructor</h2>
            <form onSubmit={handleAddInstructor} className="space-y-3">
              <input required placeholder="Name" className="w-full rounded border border-bone/10 bg-ink p-2 text-sm text-bone focus:border-amber outline-none" value={newInstructor.name} onChange={e => setNewInstructor({...newInstructor, name: e.target.value})} />
              <textarea required placeholder="Bio" rows={3} className="w-full rounded border border-bone/10 bg-ink p-2 text-sm text-bone focus:border-amber outline-none" value={newInstructor.bio} onChange={e => setNewInstructor({...newInstructor, bio: e.target.value})} />
              <div>
                <p className="text-xs text-smoke mb-2">Assign to courses:</p>
                <div className="space-y-1 max-h-40 overflow-y-auto pr-2">
                  {courses.map(c => (
                    <label key={c.id} className="flex items-center gap-2 text-sm text-bone cursor-pointer hover:text-amber">
                      <input type="checkbox" checked={newInstructor.courseIds.includes(c.id)} onChange={e => { if (e.target.checked) setNewInstructor({...newInstructor, courseIds: [...newInstructor.courseIds, c.id]}); else setNewInstructor({...newInstructor, courseIds: newInstructor.courseIds.filter(id => id !== c.id)}); }} className="accent-amber" />
                      {c.code} - {c.title}
                    </label>
                  ))}
                </div>
              </div>
              <button type="submit" className="w-full rounded bg-mint py-2 text-xs font-bold uppercase text-ink hover:bg-mint/90 transition-colors flex items-center justify-center gap-1"><Plus className="h-3 w-3" /> Add Instructor</button>
            </form>
          </div>
          <div className="rounded-lg border border-bone/10 bg-coal p-6">
            <h2 className="font-display text-xl font-bold text-amber mb-4">Current Instructors</h2>
            <div className="space-y-3">
              {instructors.map(i => (
                <div key={i.id} className="rounded border border-bone/5 bg-ink p-3 flex justify-between items-center">
                  <div className="min-w-0 flex-1">
                    <p className="font-bold text-bone truncate">{i.name}</p>
                    <p className="text-xs text-smoke mt-1 truncate">{i.bio}</p>
                  </div>
                  <button onClick={() => promptDeleteInstructor(i.id, i.name)} className="shrink-0 ml-2 text-xs text-alert hover:underline font-bold flex items-center gap-1"><Trash2 className="h-3 w-3" /> Delete</button>
                </div>
              ))}
              {instructors.length === 0 && <p className="text-sm text-smoke text-center py-4">No instructors added yet.</p>}
            </div>
          </div>
        </div>
      )}

      {activeTab === 'courses' && (
        <div className="grid gap-6 lg:grid-cols-2">
          <div className="rounded-lg border border-bone/10 bg-coal p-6">
            <h2 className="font-display text-xl font-bold text-amber mb-4">Create New Course</h2>
            <form onSubmit={handleAddCourse} className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <input required placeholder="Code (e.g., DS401)" className="rounded border border-bone/10 bg-ink p-2 text-sm text-bone focus:border-amber outline-none" value={newCourse.code} onChange={e => setNewCourse({...newCourse, code: e.target.value})} />
                <input required placeholder="Title" className="rounded border border-bone/10 bg-ink p-2 text-sm text-bone focus:border-amber outline-none" value={newCourse.title} onChange={e => setNewCourse({...newCourse, title: e.target.value})} />
              </div>
              <input required placeholder="Tagline" className="w-full rounded border border-bone/10 bg-ink p-2 text-sm text-bone focus:border-amber outline-none" value={newCourse.tagline} onChange={e => setNewCourse({...newCourse, tagline: e.target.value})} />
              <div className="grid grid-cols-3 gap-3">
                <select className="rounded border border-bone/10 bg-ink p-2 text-sm text-bone focus:border-amber outline-none" value={newCourse.level} onChange={e => setNewCourse({...newCourse, level: e.target.value})}><option>Beginner</option><option>Intermediate</option><option>Advanced</option></select>
                <input type="number" placeholder="Weeks" className="rounded border border-bone/10 bg-ink p-2 text-sm text-bone focus:border-amber outline-none" value={newCourse.weeks} onChange={e => setNewCourse({...newCourse, weeks: parseInt(e.target.value) || 0})} />
                <input placeholder="Telegram Channel" className="rounded border border-bone/10 bg-ink p-2 text-sm text-bone focus:border-amber outline-none" value={newCourse.channel} onChange={e => setNewCourse({...newCourse, channel: e.target.value})} />
              </div>
              
              <div className="grid grid-cols-2 gap-3 p-3 rounded-lg border border-amber/30 bg-amber/5">
                <div>
                  <label className="text-[10px] font-bold uppercase text-amber block mb-1">Price (₦ NGN)</label>
                  <input type="number" required placeholder="e.g. 50000" className="w-full rounded border border-bone/10 bg-ink p-2 text-sm text-bone" value={newCourse.price} onChange={e => setNewCourse({...newCourse, price: parseInt(e.target.value) || 0})} />
                </div>
                <div>
                  <label className="text-[10px] font-bold uppercase text-amber block mb-1">Price ($ USD)</label>
                  <input type="number" required placeholder="e.g. 65" className="w-full rounded border border-bone/10 bg-ink p-2 text-sm text-bone" value={newCourse.priceUsd} onChange={e => setNewCourse({...newCourse, priceUsd: parseInt(e.target.value) || 0})} />
                </div>
              </div>

              <textarea required placeholder="Summary" rows={2} className="w-full rounded border border-bone/10 bg-ink p-2 text-sm text-bone focus:border-amber outline-none" value={newCourse.summary} onChange={e => setNewCourse({...newCourse, summary: e.target.value})} />
              <textarea placeholder="Outcomes (one per line)" rows={3} className="w-full rounded border border-bone/10 bg-ink p-2 text-sm text-bone focus:border-amber outline-none" value={newCourse.outcomes} onChange={e => setNewCourse({...newCourse, outcomes: e.target.value})} />
              <input placeholder="Skills (comma-separated)" className="w-full rounded border border-bone/10 bg-ink p-2 text-sm text-bone focus:border-amber outline-none" value={newCourse.skills} onChange={e => setNewCourse({...newCourse, skills: e.target.value})} />
              <button type="submit" className="w-full rounded bg-amber py-2 text-xs font-bold uppercase text-ink hover:bg-amber/90 transition-colors flex items-center justify-center gap-1"><Plus className="h-3 w-3" /> Create Course</button>
            </form>
          </div>
          <div className="rounded-lg border border-bone/10 bg-coal p-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
              <h2 className="font-display text-xl font-bold text-amber">Existing Courses</h2>
              <div className="relative w-full sm:w-64">
                <Search className="absolute left-3 top-2.5 h-4 w-4 text-smoke" />
                <input 
                  type="text" 
                  placeholder="Search courses..." 
                  className="w-full rounded border border-bone/10 bg-ink p-2 pl-9 text-sm text-bone focus:border-amber outline-none"
                  value={courseSearch}
                  onChange={e => setCourseSearch(e.target.value)}
                />
              </div>
            </div>
            <div className="space-y-3">
              {filteredCourses.length === 0 ? (
                <p className="text-sm text-smoke text-center py-4">No courses found.</p>
              ) : filteredCourses.map(c => (
                <div key={c.id} className="rounded border border-bone/5 bg-ink p-3 flex justify-between items-center">
                  <div className="min-w-0 flex-1">
                    <p className="font-bold text-bone truncate">{c.code} - {c.title}</p>
                    <p className="text-xs text-smoke truncate">{c.weeks} weeks · ₦{c.price?.toLocaleString()} / ${c.price_usd?.toLocaleString()}</p>
                  </div>
                  <div className="flex gap-2 shrink-0 ml-2">
                    <button onClick={() => go({ view: "course-editor", courseId: c.id } as any)} className="rounded bg-amber/20 px-3 py-1 text-xs font-bold text-amber hover:bg-amber/30 transition-colors flex items-center gap-1"><Pencil className="h-3 w-3" /> Edit</button>
                    <button onClick={() => promptDeleteCourse(c.id, c.code)} className="rounded bg-alert/10 px-3 py-1 text-xs font-bold text-alert hover:bg-alert/20 transition-colors flex items-center gap-1"><Trash2 className="h-3 w-3" /> Delete</button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {activeTab === 'meetups' && (
        <div className="grid gap-6 lg:grid-cols-2">
          <div className="rounded-lg border border-bone/10 bg-coal p-6">
            <h2 className="font-display text-xl font-bold text-amber mb-4">Schedule New Meetup</h2>
            <form onSubmit={handleAddMeetup} className="space-y-3">
              <input required placeholder="Meetup Title" className="w-full rounded border border-bone/10 bg-ink p-2 text-sm text-bone focus:border-amber outline-none" value={newMeetup.title} onChange={e => setNewMeetup({...newMeetup, title: e.target.value})} />
              <textarea required placeholder="Description" rows={3} className="w-full rounded border border-bone/10 bg-ink p-2 text-sm text-bone focus:border-amber outline-none" value={newMeetup.description} onChange={e => setNewMeetup({...newMeetup, description: e.target.value})} />
              
              <div className="grid grid-cols-2 gap-3">
                <select className="rounded border border-bone/10 bg-ink p-2 text-sm text-bone focus:border-amber outline-none" value={newMeetup.format} onChange={e => setNewMeetup({...newMeetup, format: e.target.value})}>
                  <option value="Virtual">Virtual</option>
                  <option value="In-Person">In-Person</option>
                  <option value="Hybrid">Hybrid</option>
                </select>
                <input type="number" placeholder="Max Attendees" className="rounded border border-bone/10 bg-ink p-2 text-sm text-bone focus:border-amber outline-none" value={newMeetup.maxAttendees} onChange={e => setNewMeetup({...newMeetup, maxAttendees: parseInt(e.target.value) || 0})} />
              </div>

              <input placeholder="Meeting Link (if Virtual)" className="w-full rounded border border-bone/10 bg-ink p-2 text-sm text-bone focus:border-amber outline-none" value={newMeetup.meetingLink} onChange={e => setNewMeetup({...newMeetup, meetingLink: e.target.value})} />
              <input placeholder="Physical Location (if In-Person)" className="w-full rounded border border-bone/10 bg-ink p-2 text-sm text-bone focus:border-amber outline-none" value={newMeetup.location} onChange={e => setNewMeetup({...newMeetup, location: e.target.value})} />
              
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[10px] font-bold uppercase text-smoke block mb-1">Date & Time</label>
                  <input type="datetime-local" required className="w-full rounded border border-bone/10 bg-ink p-2 text-sm text-bone focus:border-amber outline-none" value={newMeetup.scheduledAt} onChange={e => setNewMeetup({...newMeetup, scheduledAt: e.target.value})} />
                </div>
                <div>
                  <label className="text-[10px] font-bold uppercase text-smoke block mb-1">Duration (mins)</label>
                  <input type="number" required className="w-full rounded border border-bone/10 bg-ink p-2 text-sm text-bone focus:border-amber outline-none" value={newMeetup.duration} onChange={e => setNewMeetup({...newMeetup, duration: parseInt(e.target.value) || 60})} />
                </div>
              </div>

              <div>
                <label className="text-[10px] font-bold uppercase text-smoke block mb-1">Host / Mentor (Optional)</label>
                <select 
                  className="w-full rounded border border-bone/10 bg-ink p-2 text-sm text-bone focus:border-amber outline-none" 
                  value={newMeetup.mentorId} 
                  onChange={e => setNewMeetup({...newMeetup, mentorId: e.target.value})}
                >
                  <option value="">None (General Meetup)</option>
                  {mentors.map(m => (
                    <option key={m.id} value={m.id}>{m.name}</option>
                  ))}
                </select>
              </div>

              <button type="submit" className="w-full rounded bg-mint py-2 text-xs font-bold uppercase text-ink hover:bg-mint/90 transition-colors flex items-center justify-center gap-1 mt-2"><Plus className="h-3 w-3" /> Schedule Meetup</button>
            </form>
          </div>

          {/* ✅ UPDATED: Existing Meetups List with Attendees Viewer */}
          <div className="rounded-lg border border-bone/10 bg-coal p-6">
            <h2 className="font-display text-xl font-bold text-amber mb-4">Upcoming & Past Meetups</h2>
            <div className="space-y-3 max-h-[600px] overflow-y-auto pr-2">
              {meetups.length === 0 ? (
                <p className="text-sm text-smoke text-center py-8">No meetups scheduled yet.</p>
              ) : (
                meetups.sort((a, b) => b.scheduled_at - a.scheduled_at).map((m) => {
                  const isPast = m.scheduled_at < Date.now();
                  const attendees = meetupAttendees[m.id] || [];
                  const isExpanded = expandedMeetup === m.id;
                  const isLoading = loadingAttendees === m.id;

                  return (
                    <div key={m.id} className={`rounded border p-3 flex flex-col gap-2 ${isPast ? 'border-bone/5 bg-ink/30 opacity-70' : 'border-bone/5 bg-ink'}`}>
                      <div className="flex justify-between items-start">
                        <div>
                          <p className="font-bold text-bone">{m.title}</p>
                          <p className="text-xs text-smoke mt-1">
                            {new Date(m.scheduled_at).toLocaleDateString()} at {new Date(m.scheduled_at).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})} · {m.duration} mins
                          </p>
                          <p className="text-xs text-amber mt-1">{m.format} {m.format === 'Virtual' && m.meeting_link ? `· Link Available` : ''}</p>
                        </div>
                        <button 
                          onClick={() => promptDeleteMeetup(m.id, m.title)} 
                          className="shrink-0 text-xs text-alert hover:underline font-bold flex items-center gap-1"
                        >
                          <Trash2 className="h-3 w-3" /> Cancel
                        </button>
                      </div>

                      {/* ✅ NEW: Attendees Toggle & List */}
                      <div className="mt-2 pt-2 border-t border-bone/10">
                        <button 
                          onClick={() => loadAttendees(m.id)}
                          disabled={isLoading}
                          className="text-xs font-bold text-tgsky hover:text-tgsky/80 flex items-center gap-1 transition-colors"
                        >
                          {isLoading ? (
                            <span className="animate-pulse">Loading attendees...</span>
                          ) : (
                            <>
                              <Users className="h-3 w-3" /> 
                              View Attendees ({attendees.length}) 
                              <span className={`transform transition-transform ${isExpanded ? 'rotate-180' : ''}`}>▼</span>
                            </>
                          )}
                        </button>

                        {isExpanded && (
                          <div className="mt-2 space-y-1 max-h-40 overflow-y-auto pr-1">
                            {attendees.length === 0 ? (
                              <p className="text-xs text-smoke italic py-1">No students have RSVP'd yet.</p>
                            ) : (
                              attendees.map((att: any, idx: number) => (
                                <div key={idx} className="flex items-center justify-between text-xs p-1.5 rounded bg-coal/50 border border-bone/5">
                                  <div>
                                    <p className="font-bold text-bone">{att.name}</p>
                                    <p className="text-smoke">{att.email}</p>
                                  </div>
                                  <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold uppercase ${
                                    att.status === 'going' ? 'bg-mint/20 text-mint' : 
                                    att.status === 'maybe' ? 'bg-amber/20 text-amber' : 'bg-alert/20 text-alert'
                                  }`}>
                                    {att.status}
                                  </span>
                                </div>
                              ))
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>
      )}

      {activeTab === 'users' && (
        <div className="rounded-lg border border-bone/10 bg-coal p-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
            <h2 className="font-display text-xl font-bold text-amber">Registered Users ({users.length})</h2>
            <div className="relative w-full sm:w-64">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-smoke" />
              <input 
                type="text" 
                placeholder="Search by name or email..." 
                className="w-full rounded border border-bone/10 bg-ink p-2 pl-9 text-sm text-bone focus:border-amber outline-none"
                value={userSearch}
                onChange={e => setUserSearch(e.target.value)}
              />
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="text-xs text-smoke uppercase border-b border-bone/10">
                <tr>
                  <th className="py-3 px-2">Name</th>
                  <th className="py-3 px-2">Email</th>
                  <th className="py-3 px-2">Role</th>
                  <th className="py-3 px-2">Telegram</th>
                  <th className="py-3 px-2 text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredUsers.length === 0 ? (
                  <tr><td colSpan={5} className="text-sm text-smoke text-center py-8">No users found.</td></tr>
                ) : filteredUsers.map(u => (
                  <tr key={u.id} className="border-b border-bone/5 hover:bg-ink/50 transition-colors">
                    <td className="py-3 px-2 font-bold text-bone">{u.name}</td>
                    <td className="py-3 px-2 text-smoke">{u.email}</td>
                    <td className="py-3 px-2"><span className={`rounded px-2 py-0.5 text-[10px] font-bold uppercase ${u.role === 'admin' ? 'bg-amber/20 text-amber' : 'bg-bone/5 text-bone'}`}>{u.role}</span></td>
                    <td className="py-3 px-2 text-smoke">{u.telegram_id ? 'Linked' : '-'}</td>
                    <td className="py-3 px-2 text-right">{u.id !== user?.id && <button onClick={() => promptDeleteUser(u.id, u.name)} className="text-xs text-alert hover:underline font-bold flex items-center gap-1 ml-auto"><Trash2 className="h-3 w-3" /> Delete</button>}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {activeTab === 'audit' && (
        <div className="rounded-lg border border-bone/10 bg-coal p-6">
          <h2 className="font-display text-xl font-bold text-amber mb-2 flex items-center gap-2"><Shield className="h-5 w-5" /> System Audit Logs</h2>
          <p className="text-xs text-smoke mb-6">A secure record of all administrative actions and system events.</p>
          <div className="space-y-2 max-h-[600px] overflow-y-auto pr-2">
            {auditLogs.length === 0 ? (
              <p className="text-sm text-smoke text-center py-8">No audit logs recorded yet.</p>
            ) : (
              auditLogs.map((log) => (
                <div key={log.id} className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 rounded-lg border border-bone/5 bg-ink p-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                      <span className="rounded bg-amber/20 px-2 py-0.5 text-[10px] font-bold uppercase text-amber">{log.action.replace(/_/g, ' ')}</span>
                      <span className="text-xs text-smoke truncate">by {log.admin_id}</span>
                    </div>
                    <p className="text-sm text-bone break-words">{log.details}</p>
                  </div>
                  <span className="text-xs text-smoke whitespace-nowrap sm:text-right flex items-center gap-1">
                    <Clock className="h-3 w-3" /> {new Date(log.created_at).toLocaleString()}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      <ConfirmDialog isOpen={confirmDialog.isOpen} title={confirmDialog.title} message={confirmDialog.message} isDestructive={confirmDialog.isDestructive} onConfirm={confirmDialog.onConfirm} onCancel={() => setConfirmDialog(prev => ({ ...prev, isOpen: false }))} isLoading={isDialogLoading} />
    </div>
  );
}
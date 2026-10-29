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
  const [meetups, setMeetups] = useState<any[]>([]); // ✅ NEW

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
  
  // ✅ NEW: Meetup Form State
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
        api.getMeetups() // ✅ NEW
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
      setMeetups(meetupsRes.data || []); // ✅ NEW
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

  // ✅ NEW: Handle Meetup Creation
  const handleAddMeetup = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.createMeetup({
        ...sanitizeObject(newMeetup),
        scheduledAt: new Date(newMeetup.scheduledAt).getTime(), // Convert to timestamp
        duration: parseInt(newMeetup.duration as any) || 60,
        maxAttendees: parseInt(newMeetup.maxAttendees as any) || 20
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
      title: "Delete Meetup",
      message: `Are you sure you want to cancel and delete "${title}"? This will remove all associated RSVPs.`,
      isDestructive: true,
      onConfirm: async () => {
        setIsDialogLoading(true);
        try {
          await api.deleteMeetup(id);
          toast("Meetup deleted");
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
    { id: 'meetups', label: 'Meetups', count: meetups.length, icon: <Users className="h-4 w-4" /> }, // ✅ NEW
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

      {/* ... [Keep all your existing activeTab === 'analytics' through 'users' blocks exactly as they were] ... */}
      
      {/* ✅ NEW: Meetups Tab */}
      {activeTab === 'meetups' && (
        <div className="grid gap-6 lg:grid-cols-2">
          {/* Create Meetup Form */}
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

              <button type="submit" className="w-full rounded bg-mint py-2 text-xs font-bold uppercase text-ink hover:bg-mint/90 transition-colors flex items-center justify-center gap-1 mt-2"><Plus className="h-3 w-3" /> Schedule Meetup</button>
            </form>
          </div>

          {/* Existing Meetups List */}
          <div className="rounded-lg border border-bone/10 bg-coal p-6">
            <h2 className="font-display text-xl font-bold text-amber mb-4">Upcoming & Past Meetups</h2>
            <div className="space-y-3 max-h-[600px] overflow-y-auto pr-2">
              {meetups.length === 0 ? (
                <p className="text-sm text-smoke text-center py-8">No meetups scheduled yet.</p>
              ) : (
                meetups.sort((a, b) => b.scheduled_at - a.scheduled_at).map((m) => {
                  const isPast = m.scheduled_at < Date.now();
                  return (
                    <div key={m.id} className={`rounded border p-3 flex flex-col gap-2 ${isPast ? 'border-bone/5 bg-ink/30 opacity-70' : 'border-bone/5 bg-ink'}`}>
                      <div className="flex justify-between items-start">
                        <div>
                          <p className="font-bold text-bone">{m.title}</p>
                          <p className="text-xs text-smoke mt-1">
                            {new Date(m.scheduled_at).toLocaleDateString()} at {new Date(m.scheduled_at).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})} · {m.duration} mins
                          </p>
                          <p className="text-xs text-amber mt-1">{m.format} {m.format === 'Virtual' && m.meeting_link ? `· ${m.meeting_link}` : ''}</p>
                        </div>
                        <button onClick={() => promptDeleteMeetup(m.id, m.title)} className="shrink-0 text-xs text-alert hover:underline font-bold flex items-center gap-1"><Trash2 className="h-3 w-3" /> Cancel</button>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
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
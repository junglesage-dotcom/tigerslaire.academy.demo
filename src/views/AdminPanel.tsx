import { useEffect, useState } from "react";
import { api } from "../lib/api";
import { sanitizeObject } from "../lib/sanitize";
import { useStore } from "../lib/store";
import ConfirmDialog from "../components/ConfirmDialog";

export default function AdminPanel() {
  const { user, go, toast } = useStore();
  
  // Added 'analytics' to the activeTab type
  const [activeTab, setActiveTab] = useState<'analytics' | 'applications' | 'payments' | 'installments' | 'mentors' | 'instructors' | 'courses' | 'users'>('analytics');
  
  const [apps, setApps] = useState<any[]>([]);
  const [payments, setPayments] = useState<any[]>([]);
  const [installments, setInstallments] = useState<any[]>([]);
  const [mentors, setMentors] = useState<any[]>([]);
  const [instructors, setInstructors] = useState<any[]>([]);
  const [courses, setCourses] = useState<any[]>([]);
  const [users, setUsers] = useState<any[]>([]);
  
  // NEW: Analytics State
  const [analytics, setAnalytics] = useState<any>({ 
    totalRevenue: 0, 
    totalStudents: 0, 
    totalCourses: 0, 
    pendingApplications: 0, 
    recentStudents: [] 
  });

  // Form states
  const [newMentor, setNewMentor] = useState({ name: "", bio: "", specialties: "tech", hourlyRate: 0, imageUrl: "" });
  const [newInstructor, setNewInstructor] = useState({ name: "", bio: "", courseIds: [] as string[] });
  const [newCourse, setNewCourse] = useState({
    code: "", title: "", tagline: "", level: "Beginner", path: "Beginner → Intermediate",
    weeks: 8, price: 0, priceUsd: 0, hue: "#ffa41b", icon: "python", summary: "", outcomes: "", skills: "", channel: ""
  });

  // Dialog states
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
      // Added api.getAnalytics() to the Promise.all array
      const [analyticsRes, appsRes, payRes, adminInstallmentsRes, mentorsRes, instructorsRes, coursesRes, usersRes] = await Promise.all([
        api.getAnalytics(),
        api.getAllApplications(),
        api.getPendingPayments(),
        api.getAdminInstallments(),
        api.getMentors(),
        api.getInstructors(),
        api.getCourses(),
        api.getUsers()
      ]);
      
      setAnalytics(analyticsRes.data);
      setApps(appsRes.data);
      setPayments(payRes.data);
      setInstallments(adminInstallmentsRes.data);
      setMentors(mentorsRes.data);
      setInstructors(instructorsRes.data);
      setCourses(coursesRes.data);
      setUsers(usersRes.data);
    } catch (e) {
      toast("Failed to load admin data");
    }
  };

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
      message: `Are you sure you want to delete course ${code}? This will remove it from the catalog and cannot be undone.`,
      isDestructive: true,
      onConfirm: async () => {
        setIsDialogLoading(true);
        try {
          await api.deleteCourse(id);
          toast("Course deleted");
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
      message: `Are you sure you want to permanently delete ${name}'s account and all associated data? This cannot be undone.`,
      isDestructive: true,
      onConfirm: async () => {
        setIsDialogLoading(true);
        try {
          await api.deleteUser(id);
          toast("User account deleted");
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

  const tabs = [
    { id: 'analytics', label: 'Analytics', icon: '📊' }, // NEW
    { id: 'applications', label: 'Applications', count: apps.filter(a => a.status === 'pending').length },
    { id: 'payments', label: 'Payments', count: payments.filter(p => p.status === 'proof_submitted').length },
    { id: 'installments', label: 'Installments', count: installments.length },
    { id: 'mentors', label: 'Mentors', count: mentors.length },
    { id: 'instructors', label: 'Instructors', count: instructors.length },
    { id: 'courses', label: 'Courses', count: courses.length },
    { id: 'users', label: 'Users', count: users.length },
  ] as const;

  return (
    <div className="mx-auto max-w-7xl px-5 py-12 sm:px-8">
      <h1 className="font-display text-3xl font-extrabold text-bone mb-8">Admin Control Panel</h1>

      {/* Tabs */}
      <div className="mb-8 flex gap-2 border-b border-bone/10 overflow-x-auto">
        {tabs.map(t => (
          <button
            key={t.id}
            onClick={() => setActiveTab(t.id)}
            className={`flex items-center gap-2 px-4 py-2 font-display text-sm font-bold transition-colors whitespace-nowrap ${
              activeTab === t.id ? 'text-amber border-b-2 border-amber' : 'text-smoke hover:text-bone'
            }`}
          >
            {t.icon && <span>{t.icon}</span>}
            {t.label} {t.count > 0 && <span className="ml-1 rounded bg-amber/20 px-1.5 py-0.5 text-[10px] text-amber">{t.count}</span>}
          </button>
        ))}
      </div>

      {/* ==========================================
          ANALYTICS TAB (NEW)
      ========================================== */}
      {activeTab === 'analytics' && (
        <div className="space-y-8">
          {/* Key Metrics Grid */}
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            <div className="rounded-xl border border-bone/10 bg-coal p-6">
              <p className="text-xs font-bold uppercase tracking-widest text-smoke mb-2">Total Revenue</p>
              <p className="font-display text-3xl font-extrabold text-mint">
                ₦{analytics.totalRevenue.toLocaleString()}
              </p>
              <p className="text-xs text-smoke mt-2">From successful payments</p>
            </div>
            
            <div className="rounded-xl border border-bone/10 bg-coal p-6">
              <p className="text-xs font-bold uppercase tracking-widest text-smoke mb-2">Total Students</p>
              <p className="font-display text-3xl font-extrabold text-tgsky">
                {analytics.totalStudents.toLocaleString()}
              </p>
              <p className="text-xs text-smoke mt-2">Registered learners</p>
            </div>

            <div className="rounded-xl border border-bone/10 bg-coal p-6">
              <p className="text-xs font-bold uppercase tracking-widest text-smoke mb-2">Active Courses</p>
              <p className="font-display text-3xl font-extrabold text-amber">
                {analytics.totalCourses}
              </p>
              <p className="text-xs text-smoke mt-2">Published to catalog</p>
            </div>

            <div className="rounded-xl border border-bone/10 bg-coal p-6">
              <p className="text-xs font-bold uppercase tracking-widest text-smoke mb-2">Pending Mentorships</p>
              <p className="font-display text-3xl font-extrabold text-ember">
                {analytics.pendingApplications}
              </p>
              <p className="text-xs text-smoke mt-2">Awaiting your review</p>
            </div>
          </div>

          {/* Recent Activity / Signups */}
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
                    <p className="text-xs text-smoke">
                      Joined {new Date(student.joined_at).toLocaleDateString()}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Applications Tab */}
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
                  <input
                    type="number"
                    placeholder="Propose Price (₦)"
                    className="flex-1 rounded border border-bone/10 bg-coal p-2 text-sm text-bone"
                    id={`price-${app.id}`}
                  />
                  <button
                    onClick={() => {
                      const price = parseInt((document.getElementById(`price-${app.id}`) as HTMLInputElement).value);
                      if (price) handlePropose(app.id, price);
                    }}
                    className="rounded bg-amber px-4 py-2 text-xs font-bold uppercase text-ink hover:bg-amber/90 transition-colors"
                  >
                    Propose
                  </button>
                </div>
              </div>
            ))}
            {apps.filter(a => a.status === 'pending').length === 0 && (
              <p className="text-sm text-smoke text-center py-8">No pending applications.</p>
            )}
          </div>
        </div>
      )}

      {/* Payments Tab */}
      {activeTab === 'payments' && (
        <div className="rounded-lg border border-bone/10 bg-coal p-6">
          <h2 className="font-display text-xl font-bold text-amber mb-4">Pending Bank Transfers</h2>
          <div className="space-y-4">
            {payments.filter(p => p.status === 'proof_submitted').map((p) => (
              <div key={p.reference} className="rounded border border-bone/5 bg-ink p-4 flex flex-col sm:flex-row justify-between gap-4">
                <div>
                  <p className="font-bold text-bone">{p.user_name} - {p.course_title || 'Mentorship'}</p>
                  <p className="text-xs text-smoke mt-1">Ref: {p.reference}</p>
                  <p className="text-sm text-amber font-bold mt-2">
                    {p.currency === 'USD' ? '$' : '₦'}{p.amount.toLocaleString()}
                  </p>
                  {p.proof_url && (
                    <a href={p.proof_url} target="_blank" rel="noreferrer" className="inline-block mt-2 text-xs text-tgsky underline hover:text-tgsky/80">
                      View Payment Slip ↗
                    </a>
                  )}
                </div>
                <button
                  onClick={() => {
                    setConfirmDialog({
                      isOpen: true,
                      title: "Approve Payment",
                      message: `Approve this payment and enroll ${p.user_name}?`,
                      isDestructive: false,
                      onConfirm: async () => {
                        setIsDialogLoading(true);
                        try {
                          await api.approvePayment(p.reference);
                          toast("Payment approved and user enrolled!");
                          loadAll();
                        } catch (e: any) {
                          toast(e.message);
                        } finally {
                          setIsDialogLoading(false);
                          setConfirmDialog(prev => ({ ...prev, isOpen: false }));
                        }
                      }
                    });
                  }}
                  className="self-start rounded bg-mint px-6 py-2 text-xs font-bold uppercase text-ink hover:bg-mint/90 transition-colors"
                >
                  Approve & Enroll
                </button>
              </div>
            ))}
            {payments.filter(p => p.status === 'proof_submitted').length === 0 && (
              <p className="text-sm text-smoke text-center py-8">No pending bank transfer proofs to review.</p>
            )}
          </div>
        </div>
      )}

      {/* Installments Tab */}
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
                  {inst.proof_url && (
                    <a href={inst.proof_url} target="_blank" rel="noreferrer" className="inline-block mt-2 text-xs text-tgsky underline hover:text-tgsky/80">
                      View Payment Slip ↗
                    </a>
                  )}
                </div>
                <button
                  onClick={() => {
                    setConfirmDialog({
                      isOpen: true,
                      title: "Approve Installment",
                      message: `Mark this installment as paid for ${inst.user_name}?`,
                      isDestructive: false,
                      onConfirm: async () => {
                        setIsDialogLoading(true);
                        try {
                          await api.approveInstallment(inst.id);
                          toast("Installment approved!");
                          loadAll();
                        } catch (e: any) {
                          toast(e.message);
                        } finally {
                          setIsDialogLoading(false);
                          setConfirmDialog(prev => ({ ...prev, isOpen: false }));
                        }
                      }
                    });
                  }}
                  className="self-start rounded bg-mint px-6 py-2 text-xs font-bold uppercase text-ink hover:bg-mint/90 transition-colors"
                >
                  Approve & Continue Access
                </button>
              </div>
            ))}
            {installments.length === 0 && (
              <p className="text-sm text-smoke text-center py-8">No pending installment proofs to review.</p>
            )}
          </div>
        </div>
      )}

      {/* Mentors Tab */}
      {activeTab === 'mentors' && (
        <div className="grid gap-6 lg:grid-cols-2">
          <div className="rounded-lg border border-bone/10 bg-coal p-6">
            <h2 className="font-display text-xl font-bold text-amber mb-4">Add Mentor</h2>
            <form onSubmit={handleAddMentor} className="space-y-3">
              <input required placeholder="Name" className="w-full rounded border border-bone/10 bg-ink p-2 text-sm text-bone focus:border-amber outline-none"
                value={newMentor.name} onChange={e => setNewMentor({...newMentor, name: e.target.value})} />
              <input placeholder="Image URL (e.g., https://imgur.com/...)" className="w-full rounded border border-bone/10 bg-ink p-2 text-sm text-bone focus:border-amber outline-none"
                value={newMentor.imageUrl} onChange={e => setNewMentor({...newMentor, imageUrl: e.target.value})} />
              <textarea required placeholder="Bio" rows={3} className="w-full rounded border border-bone/10 bg-ink p-2 text-sm text-bone focus:border-amber outline-none"
                value={newMentor.bio} onChange={e => setNewMentor({...newMentor, bio: e.target.value})} />
              <input placeholder="Specialties (comma-separated)" className="w-full rounded border border-bone/10 bg-ink p-2 text-sm text-bone focus:border-amber outline-none"
                value={newMentor.specialties} onChange={e => setNewMentor({...newMentor, specialties: e.target.value})} />
              <input type="number" placeholder="Hourly Rate (₦)" className="w-full rounded border border-bone/10 bg-ink p-2 text-sm text-bone focus:border-amber outline-none"
                value={newMentor.hourlyRate} onChange={e => setNewMentor({...newMentor, hourlyRate: parseInt(e.target.value) || 0})} />
              <button type="submit" className="w-full rounded bg-mint py-2 text-xs font-bold uppercase text-ink hover:bg-mint/90 transition-colors">Add Mentor</button>
            </form>
          </div>
          <div className="rounded-lg border border-bone/10 bg-coal p-6">
            <h2 className="font-display text-xl font-bold text-amber mb-4">Current Mentors</h2>
            <div className="space-y-3">
              {mentors.map(m => (
                <div key={m.id} className="rounded border border-bone/5 bg-ink p-3 flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3 flex-1 min-w-0">
                    {m.image_url ? (
                      <img src={m.image_url} alt={m.name} className="h-10 w-10 rounded-full object-cover shrink-0" />
                    ) : (
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-amber/20 text-amber font-bold">
                        {m.name.charAt(0)}
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="font-bold text-bone truncate">{m.name}</p>
                      <p className="text-xs text-smoke truncate">{m.specialties?.join(', ')}</p>
                      <p className="text-xs text-amber mt-1">₦{m.hourly_rate?.toLocaleString()}/hr</p>
                    </div>
                  </div>
                  <button onClick={() => promptDeleteMentor(m.id, m.name)} className="shrink-0 text-xs text-alert hover:underline font-bold">Delete</button>
                </div>
              ))}
              {mentors.length === 0 && <p className="text-sm text-smoke text-center py-4">No mentors added yet.</p>}
            </div>
          </div>
        </div>
      )}

      {/* Instructors Tab */}
      {activeTab === 'instructors' && (
        <div className="grid gap-6 lg:grid-cols-2">
          <div className="rounded-lg border border-bone/10 bg-coal p-6">
            <h2 className="font-display text-xl font-bold text-amber mb-4">Add Instructor</h2>
            <form onSubmit={handleAddInstructor} className="space-y-3">
              <input required placeholder="Name" className="w-full rounded border border-bone/10 bg-ink p-2 text-sm text-bone focus:border-amber outline-none"
                value={newInstructor.name} onChange={e => setNewInstructor({...newInstructor, name: e.target.value})} />
              <textarea required placeholder="Bio" rows={3} className="w-full rounded border border-bone/10 bg-ink p-2 text-sm text-bone focus:border-amber outline-none"
                value={newInstructor.bio} onChange={e => setNewInstructor({...newInstructor, bio: e.target.value})} />
              <div>
                <p className="text-xs text-smoke mb-2">Assign to courses:</p>
                <div className="space-y-1 max-h-40 overflow-y-auto pr-2">
                  {courses.map(c => (
                    <label key={c.id} className="flex items-center gap-2 text-sm text-bone cursor-pointer hover:text-amber">
                      <input
                        type="checkbox"
                        checked={newInstructor.courseIds.includes(c.id)}
                        onChange={e => {
                          if (e.target.checked) {
                            setNewInstructor({...newInstructor, courseIds: [...newInstructor.courseIds, c.id]});
                          } else {
                            setNewInstructor({...newInstructor, courseIds: newInstructor.courseIds.filter(id => id !== c.id)});
                          }
                        }}
                        className="accent-amber"
                      />
                      {c.code} - {c.title}
                    </label>
                  ))}
                </div>
              </div>
              <button type="submit" className="w-full rounded bg-mint py-2 text-xs font-bold uppercase text-ink hover:bg-mint/90 transition-colors">Add Instructor</button>
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
                  <button onClick={() => promptDeleteInstructor(i.id, i.name)} className="shrink-0 ml-2 text-xs text-alert hover:underline font-bold">Delete</button>
                </div>
              ))}
              {instructors.length === 0 && <p className="text-sm text-smoke text-center py-4">No instructors added yet.</p>}
            </div>
          </div>
        </div>
      )}

      {/* Courses Tab */}
      {activeTab === 'courses' && (
        <div className="grid gap-6 lg:grid-cols-2">
          <div className="rounded-lg border border-bone/10 bg-coal p-6">
            <h2 className="font-display text-xl font-bold text-amber mb-4">Create New Course</h2>
            <form onSubmit={handleAddCourse} className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <input required placeholder="Code (e.g., DS401)" className="rounded border border-bone/10 bg-ink p-2 text-sm text-bone focus:border-amber outline-none"
                  value={newCourse.code} onChange={e => setNewCourse({...newCourse, code: e.target.value})} />
                <input required placeholder="Title" className="rounded border border-bone/10 bg-ink p-2 text-sm text-bone focus:border-amber outline-none"
                  value={newCourse.title} onChange={e => setNewCourse({...newCourse, title: e.target.value})} />
              </div>
              <input required placeholder="Tagline" className="w-full rounded border border-bone/10 bg-ink p-2 text-sm text-bone focus:border-amber outline-none"
                value={newCourse.tagline} onChange={e => setNewCourse({...newCourse, tagline: e.target.value})} />
              <div className="grid grid-cols-3 gap-3">
                <select className="rounded border border-bone/10 bg-ink p-2 text-sm text-bone focus:border-amber outline-none"
                  value={newCourse.level} onChange={e => setNewCourse({...newCourse, level: e.target.value})}>
                  <option>Beginner</option><option>Intermediate</option><option>Advanced</option>
                </select>
                <input type="number" placeholder="Weeks" className="rounded border border-bone/10 bg-ink p-2 text-sm text-bone focus:border-amber outline-none"
                  value={newCourse.weeks} onChange={e => setNewCourse({...newCourse, weeks: parseInt(e.target.value) || 0})} />
                <input type="number" placeholder="Price (₦)" className="rounded border border-bone/10 bg-ink p-2 text-sm text-bone focus:border-amber outline-none"
                  value={newCourse.price} onChange={e => setNewCourse({...newCourse, price: parseInt(e.target.value) || 0})} />
              </div>
              <div className="grid grid-cols-1 gap-3">
                <input type="number" placeholder="Price ($ USD)" className="rounded border border-bone/10 bg-ink p-2 text-sm text-bone focus:border-amber outline-none"
                  value={newCourse.priceUsd} onChange={e => setNewCourse({...newCourse, priceUsd: parseInt(e.target.value) || 0})} />
              </div>
              <textarea required placeholder="Summary" rows={2} className="w-full rounded border border-bone/10 bg-ink p-2 text-sm text-bone focus:border-amber outline-none"
                value={newCourse.summary} onChange={e => setNewCourse({...newCourse, summary: e.target.value})} />
              <textarea placeholder="Outcomes (one per line)" rows={3} className="w-full rounded border border-bone/10 bg-ink p-2 text-sm text-bone focus:border-amber outline-none"
                value={newCourse.outcomes} onChange={e => setNewCourse({...newCourse, outcomes: e.target.value})} />
              <input placeholder="Skills (comma-separated)" className="w-full rounded border border-bone/10 bg-ink p-2 text-sm text-bone focus:border-amber outline-none"
                value={newCourse.skills} onChange={e => setNewCourse({...newCourse, skills: e.target.value})} />
              <input placeholder="Telegram channel (e.g., t.me/lair_ds401)" className="w-full rounded border border-bone/10 bg-ink p-2 text-sm text-bone focus:border-amber outline-none"
                value={newCourse.channel} onChange={e => setNewCourse({...newCourse, channel: e.target.value})} />
              <button type="submit" className="w-full rounded bg-amber py-2 text-xs font-bold uppercase text-ink hover:bg-amber/90 transition-colors">Create Course</button>
            </form>
          </div>
          <div className="rounded-lg border border-bone/10 bg-coal p-6">
            <h2 className="font-display text-xl font-bold text-amber mb-4">Existing Courses</h2>
            <div className="space-y-3">
              {courses.map(c => (
                <div key={c.id} className="rounded border border-bone/5 bg-ink p-3 flex justify-between items-center">
                  <div className="min-w-0 flex-1">
                    <p className="font-bold text-bone truncate">{c.code} - {c.title}</p>
                    <p className="text-xs text-smoke truncate">{c.weeks} weeks · ₦{c.price?.toLocaleString()}</p>
                  </div>
                  <div className="flex gap-2 shrink-0 ml-2">
                    <button
                      onClick={() => go({ view: "course-editor", courseId: c.id } as any)}
                      className="rounded bg-amber/20 px-3 py-1 text-xs font-bold text-amber hover:bg-amber/30 transition-colors"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => promptDeleteCourse(c.id, c.code)}
                      className="rounded bg-alert/10 px-3 py-1 text-xs font-bold text-alert hover:bg-alert/20 transition-colors"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              ))}
              {courses.length === 0 && <p className="text-sm text-smoke text-center py-4">No courses created yet.</p>}
            </div>
          </div>
        </div>
      )}

      {/* Users Tab */}
      {activeTab === 'users' && (
        <div className="rounded-lg border border-bone/10 bg-coal p-6">
          <h2 className="font-display text-xl font-bold text-amber mb-4">Registered Users ({users.length})</h2>
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
                {users.map(u => (
                  <tr key={u.id} className="border-b border-bone/5 hover:bg-ink/50 transition-colors">
                    <td className="py-3 px-2 font-bold text-bone">{u.name}</td>
                    <td className="py-3 px-2 text-smoke">{u.email}</td>
                    <td className="py-3 px-2">
                      <span className={`rounded px-2 py-0.5 text-[10px] font-bold uppercase ${u.role === 'admin' ? 'bg-amber/20 text-amber' : 'bg-bone/5 text-bone'}`}>
                        {u.role}
                      </span>
                    </td>
                    <td className="py-3 px-2 text-smoke">{u.telegram_id ? 'Linked' : '-'}</td>
                    <td className="py-3 px-2 text-right">
                      {u.id !== user?.id && (
                        <button 
                          onClick={() => promptDeleteUser(u.id, u.name)}
                          className="text-xs text-alert hover:underline font-bold"
                        >
                          Delete
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {users.length === 0 && <p className="text-sm text-smoke text-center py-8">No users found.</p>}
          </div>
        </div>
      )}

      {/* Global Confirm Dialog */}
      <ConfirmDialog
        isOpen={confirmDialog.isOpen}
        title={confirmDialog.title}
        message={confirmDialog.message}
        isDestructive={confirmDialog.isDestructive}
        onConfirm={confirmDialog.onConfirm}
        onCancel={() => setConfirmDialog(prev => ({ ...prev, isOpen: false }))}
        isLoading={isDialogLoading}
      />
    </div>
  );
}
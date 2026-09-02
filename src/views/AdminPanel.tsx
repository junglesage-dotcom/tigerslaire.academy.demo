import { useEffect, useState } from "react";
import { api } from "../lib/api";
import { useStore } from "../lib/store";

export default function AdminPanel() {
  const { user, go, toast } = useStore();
  const [activeTab, setActiveTab] = useState<'applications' | 'mentors' | 'instructors' | 'courses'>('applications');
  const [apps, setApps] = useState<any[]>([]);
  const [mentors, setMentors] = useState<any[]>([]);
  const [instructors, setInstructors] = useState<any[]>([]);
  const [courses, setCourses] = useState<any[]>([]);

  // Form states
  const [newMentor, setNewMentor] = useState({ name: "", bio: "", specialties: "tech", hourlyRate: 0, imageUrl: "" });
  const [newInstructor, setNewInstructor] = useState({ name: "", bio: "", courseIds: [] as string[] });
  const [newCourse, setNewCourse] = useState({
    code: "", title: "", tagline: "", level: "Beginner", path: "Beginner → Intermediate",
    weeks: 8, price: 0, hue: "#ffa41b", icon: "python", summary: "", outcomes: "", skills: "", channel: ""
  });

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
      const [appsRes, mentorsRes, instRes, coursesRes] = await Promise.all([
        api.getAllApplications(),
        api.getMentors(),
        api.getInstructors(),
        api.getCourses()
      ]);
      setApps(appsRes.data);
      setMentors(mentorsRes.data);
      setInstructors(instRes.data);
      setCourses(coursesRes.data);
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
        ...newMentor,
        specialties: newMentor.specialties.split(",").map(s => s.trim()),
        userId: user?.id
      });
      toast("Mentor added");
      setNewMentor({ name: "", bio: "", specialties: "tech", hourlyRate: 0, imageUrl: "" });
      loadAll();
    } catch (e: any) {
      toast(e.message);
    }
  };

  const handleAddInstructor = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.addInstructor({
        name: newInstructor.name,
        bio: newInstructor.bio,
        courseIds: newInstructor.courseIds,
        userId: user?.id
      });
      toast("Instructor added");
      setNewInstructor({ name: "", bio: "", courseIds: [] });
      loadAll();
    } catch (e: any) {
      toast(e.message);
    }
  };

  const handleAddCourse = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await api.createCourse({
        ...newCourse,
        outcomes: newCourse.outcomes.split("\n").filter(o => o.trim()),
        skills: newCourse.skills.split(",").map(s => s.trim())
      });
      toast("Course created! You can now edit its content.");
      go({ view: "course-editor", courseId: res.data.id } as any);
    } catch (e: any) {
      toast(e.message);
    }
  };

  const handleDeleteInstructor = async (id: string) => {
    if (!confirm("Delete this instructor?")) return;
    try {
      await api.deleteInstructor(id);
      toast("Instructor deleted");
      loadAll();
    } catch (e: any) {
      toast(e.message);
    }
  };

  const tabs = [
    { id: 'applications', label: 'Applications', count: apps.filter(a => a.status === 'pending').length },
    { id: 'mentors', label: 'Mentors', count: mentors.length },
    { id: 'instructors', label: 'Instructors', count: instructors.length },
    { id: 'courses', label: 'Courses', count: courses.length },
  ] as const;

  return (
    <div className="mx-auto max-w-7xl px-5 py-12 sm:px-8">
      <h1 className="font-display text-3xl font-extrabold text-bone mb-8">Admin Control Panel</h1>

      {/* Tabs */}
      <div className="mb-8 flex gap-2 border-b border-bone/10">
        {tabs.map(t => (
          <button
            key={t.id}
            onClick={() => setActiveTab(t.id)}
            className={`px-4 py-2 font-display text-sm font-bold transition-colors ${activeTab === t.id ? 'text-amber border-b-2 border-amber' : 'text-smoke hover:text-bone'}`}
          >
            {t.label} {t.count > 0 && <span className="ml-1 rounded bg-amber/20 px-1.5 py-0.5 text-[10px] text-amber">{t.count}</span>}
          </button>
        ))}
      </div>

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
                    className="rounded bg-amber px-4 py-2 text-xs font-bold uppercase text-ink"
                  >
                    Propose
                  </button>
                </div>
              </div>
            ))}
            {apps.filter(a => a.status === 'pending').length === 0 && (
              <p className="text-sm text-smoke">No pending applications.</p>
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
              <input required placeholder="Name" className="w-full rounded border border-bone/10 bg-ink p-2 text-sm text-bone"
                value={newMentor.name} onChange={e => setNewMentor({...newMentor, name: e.target.value})} />
              <input placeholder="Image URL (e.g., @url:`https://imgur.com/...`)" className="w-full rounded border border-bone/10 bg-ink p-2 text-sm text-bone"
                value={newMentor.imageUrl} onChange={e => setNewMentor({...newMentor, imageUrl: e.target.value})} />
              <textarea required placeholder="Bio" rows={3} className="w-full rounded border border-bone/10 bg-ink p-2 text-sm text-bone"
                value={newMentor.bio} onChange={e => setNewMentor({...newMentor, bio: e.target.value})} />
              <input placeholder="Specialties (comma-separated)" className="w-full rounded border border-bone/10 bg-ink p-2 text-sm text-bone"
                value={newMentor.specialties} onChange={e => setNewMentor({...newMentor, specialties: e.target.value})} />
              <input type="number" placeholder="Hourly Rate (₦)" className="w-full rounded border border-bone/10 bg-ink p-2 text-sm text-bone"
                value={newMentor.hourlyRate} onChange={e => setNewMentor({...newMentor, hourlyRate: parseInt(e.target.value) || 0})} />
              <button type="submit" className="w-full rounded bg-mint py-2 text-xs font-bold uppercase text-ink">Add Mentor</button>
            </form>
          </div>
          <div className="rounded-lg border border-bone/10 bg-coal p-6">
            <h2 className="font-display text-xl font-bold text-amber mb-4">Current Mentors</h2>
            <div className="space-y-3">
              {mentors.map(m => (
                <div key={m.id} className="rounded border border-bone/5 bg-ink p-3 flex items-center gap-3">
                  {m.image_url ? (
                    <img src={m.image_url} alt={m.name} className="h-10 w-10 rounded-full object-cover" />
                  ) : (
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-amber/20 text-amber font-bold">
                      {m.name.charAt(0)}
                    </div>
                  )}
                  <div className="flex-1">
                    <p className="font-bold text-bone">{m.name}</p>
                    <p className="text-xs text-smoke">{m.specialties?.join(', ')}</p>
                    <p className="text-xs text-amber mt-1">₦{m.hourly_rate?.toLocaleString()}/hr</p>
                  </div>
                </div>
              ))}
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
              <input required placeholder="Name" className="w-full rounded border border-bone/10 bg-ink p-2 text-sm text-bone"
                value={newInstructor.name} onChange={e => setNewInstructor({...newInstructor, name: e.target.value})} />
              <textarea required placeholder="Bio" rows={3} className="w-full rounded border border-bone/10 bg-ink p-2 text-sm text-bone"
                value={newInstructor.bio} onChange={e => setNewInstructor({...newInstructor, bio: e.target.value})} />
              <div>
                <p className="text-xs text-smoke mb-2">Assign to courses:</p>
                <div className="space-y-1 max-h-40 overflow-y-auto">
                  {courses.map(c => (
                    <label key={c.id} className="flex items-center gap-2 text-sm text-bone">
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
                      />
                      {c.code} - {c.title}
                    </label>
                  ))}
                </div>
              </div>
              <button type="submit" className="w-full rounded bg-mint py-2 text-xs font-bold uppercase text-ink">Add Instructor</button>
            </form>
          </div>
          <div className="rounded-lg border border-bone/10 bg-coal p-6">
            <h2 className="font-display text-xl font-bold text-amber mb-4">Current Instructors</h2>
            <div className="space-y-3">
              {instructors.map(i => (
                <div key={i.id} className="rounded border border-bone/5 bg-ink p-3 flex justify-between">
                  <div>
                    <p className="font-bold text-bone">{i.name}</p>
                    <p className="text-xs text-smoke mt-1">{i.bio}</p>
                  </div>
                  <button onClick={() => handleDeleteInstructor(i.id)} className="text-xs text-alert hover:underline">Delete</button>
                </div>
              ))}
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
                <input required placeholder="Code (e.g., DS401)" className="rounded border border-bone/10 bg-ink p-2 text-sm text-bone"
                  value={newCourse.code} onChange={e => setNewCourse({...newCourse, code: e.target.value})} />
                <input required placeholder="Title" className="rounded border border-bone/10 bg-ink p-2 text-sm text-bone"
                  value={newCourse.title} onChange={e => setNewCourse({...newCourse, title: e.target.value})} />
              </div>
              <input required placeholder="Tagline" className="w-full rounded border border-bone/10 bg-ink p-2 text-sm text-bone"
                value={newCourse.tagline} onChange={e => setNewCourse({...newCourse, tagline: e.target.value})} />
              <div className="grid grid-cols-3 gap-3">
                <select className="rounded border border-bone/10 bg-ink p-2 text-sm text-bone"
                  value={newCourse.level} onChange={e => setNewCourse({...newCourse, level: e.target.value})}>
                  <option>Beginner</option><option>Intermediate</option><option>Advanced</option>
                </select>
                <input type="number" placeholder="Weeks" className="rounded border border-bone/10 bg-ink p-2 text-sm text-bone"
                  value={newCourse.weeks} onChange={e => setNewCourse({...newCourse, weeks: parseInt(e.target.value)})} />
                <input type="number" placeholder="Price (₦)" className="rounded border border-bone/10 bg-ink p-2 text-sm text-bone"
                  value={newCourse.price} onChange={e => setNewCourse({...newCourse, price: parseInt(e.target.value)})} />
              </div>
              <textarea required placeholder="Summary" rows={2} className="w-full rounded border border-bone/10 bg-ink p-2 text-sm text-bone"
                value={newCourse.summary} onChange={e => setNewCourse({...newCourse, summary: e.target.value})} />
              <textarea placeholder="Outcomes (one per line)" rows={3} className="w-full rounded border border-bone/10 bg-ink p-2 text-sm text-bone"
                value={newCourse.outcomes} onChange={e => setNewCourse({...newCourse, outcomes: e.target.value})} />
              <input placeholder="Skills (comma-separated)" className="w-full rounded border border-bone/10 bg-ink p-2 text-sm text-bone"
                value={newCourse.skills} onChange={e => setNewCourse({...newCourse, skills: e.target.value})} />
              <input placeholder="Telegram channel (e.g., t.me/lair_ds401)" className="w-full rounded border border-bone/10 bg-ink p-2 text-sm text-bone"
                value={newCourse.channel} onChange={e => setNewCourse({...newCourse, channel: e.target.value})} />
              <button type="submit" className="w-full rounded bg-amber py-2 text-xs font-bold uppercase text-ink">Create Course</button>
            </form>
          </div>
          <div className="rounded-lg border border-bone/10 bg-coal p-6">
            <h2 className="font-display text-xl font-bold text-amber mb-4">Existing Courses</h2>
            <div className="space-y-3">
              {courses.map(c => (
                <div key={c.id} className="rounded border border-bone/5 bg-ink p-3 flex justify-between items-center">
                  <div>
                    <p className="font-bold text-bone">{c.code} - {c.title}</p>
                    <p className="text-xs text-smoke">{c.weeks} weeks · ₦{c.price?.toLocaleString()}</p>
                  </div>
                  <button
                    onClick={() => go({ view: "course-editor", courseId: c.id } as any)}
                    className="rounded bg-amber/20 px-3 py-1 text-xs font-bold text-amber hover:bg-amber/30"
                  >
                    Edit Content →
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
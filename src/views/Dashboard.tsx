import { useEffect, useState } from "react";
import { api } from "../lib/api";
import { useStore } from "../lib/store";
import { BadgeShelf } from "../components/Badges";

type TabId = "overview" | "courses" | "certificates" | "payments" | "mentorship";

export default function Dashboard() {
  const { user, go, toast, logout, linkTelegram, unlinkTelegram } = useStore();
  const [activeTab, setActiveTab] = useState<TabId>("overview");
  const [enrollments, setEnrollments] = useState<any[]>([]);
  const [activity, setActivity] = useState<any[]>([]);
  const [installments, setInstallments] = useState<any[]>([]);
  const [badges, setBadges] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);

  const isTelegram = !!(window as any).Telegram?.WebApp?.initData;

  useEffect(() => {
    if (!user) return;
    
    Promise.all([
      api.getEnrollments(),
      api.getActivity(),
      api.getMyInstallments(),
      api.getMyBadges().catch(() => ({ data: [] }))
    ]).then(([enrollRes, actRes, instRes, badgesRes]) => {
      setEnrollments(enrollRes.data);
      setActivity(actRes.data);
      setInstallments(instRes.data);
      setBadges(Object.fromEntries(badgesRes.data.map((b: any) => [b.badge_id, b.earned_at])));
    }).catch(err => {
      toast("Failed to load dashboard data");
    }).finally(() => setLoading(false));
  }, [user]);

  if (!user) {
    return (
      <div className="mx-auto max-w-2xl px-5 py-16 text-center sm:px-8">
        <h1 className="font-display text-3xl font-extrabold text-bone mb-4">Sign in to view your dashboard</h1>
        <p className="text-smoke mb-8">Track your courses, mentorship applications, and community meetups.</p>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="mx-auto max-w-7xl px-5 py-16 text-center sm:px-8">
        <p className="text-amber">Loading your dashboard...</p>
      </div>
    );
  }

  const handleConnectClick = () => {
    if (isTelegram) {
      const initData = (window as any).Telegram.WebApp.initData;
      linkTelegram(initData);
    } else {
      window.open(`https://t.me/jsagebutlerbot?start=link_${user.id}`, '_blank');
      toast("Please start a chat with the bot to complete linking.");
    }
  };

  const handleInstallmentProof = (instId: string) => {
    const botUsername = "TigersLair_bot";
    window.open(`https://t.me/${botUsername}?start=INST_${instId}`, '_blank');
    toast(`Bot opened. Please send your payment slip with caption: INST-${instId}`);
  };

  // Find the most recently enrolled course that isn't complete
  const continueLearning = enrollments.find(e => !e.quiz_passed);

  const tabs: { id: TabId; label: string; icon: string }[] = [
    { id: "overview", label: "Overview", icon: "📊" },
    { id: "courses", label: "My Courses", icon: "📚" },
    { id: "certificates", label: "Certificates", icon: "🏆" },
    { id: "payments", label: "Payments", icon: "💳" },
    { id: "mentorship", label: "Mentorship", icon: "🤝" },
  ];

  return (
    <div className="mx-auto max-w-7xl px-5 py-8 sm:px-8">
      {/* Header */}
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="font-display text-3xl font-extrabold text-bone">Welcome back, {user.name.split(" ")[0]}</h1>
          <p className="mt-1 text-sm text-smoke">
            Member since {new Date(user.joined_at).toLocaleDateString()} · {user.role}
          </p>
        </div>
        <button
          onClick={logout}
          className="rounded-md border border-bone/15 px-4 py-2 font-mono text-[10px] uppercase tracking-[0.16em] text-smoke transition-colors hover:border-alert hover:text-alert"
        >
          Sign out
        </button>
      </div>

      {/* Telegram Link Banner */}
      {!user.telegram_id && (
        <div className="mb-6 rounded-xl border border-tgsky/30 bg-tgsky/5 p-5">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <h2 className="font-display text-lg font-bold text-bone mb-1">
                {isTelegram ? "Connect this Telegram Account" : "Connect Your Telegram Account"}
              </h2>
              <p className="text-sm text-smoke">
                Link your Telegram to receive daily lesson drops, session reminders, and access the community bot.
              </p>
            </div>
            <button
              onClick={handleConnectClick}
              className="shrink-0 rounded-md bg-tgsky px-5 py-2.5 font-display text-sm font-extrabold uppercase tracking-widest text-ink hover:bg-tgsky/90 transition-colors"
            >
              {isTelegram ? "Link Instantly" : "Open Telegram"}
            </button>
          </div>
        </div>
      )}

      {/* Continue Learning Widget */}
      {continueLearning && (
        <div 
          className="mb-6 cursor-pointer rounded-xl border border-amber/20 bg-gradient-to-r from-amber/10 to-transparent p-5 transition-colors hover:border-amber/40"
          onClick={() => go({ view: "course", courseId: continueLearning.course_id })}
        >
          <div className="flex items-center gap-4">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-amber/20">
              <span className="text-2xl">▶️</span>
            </div>
            <div className="flex-1">
              <p className="font-mono text-[10px] uppercase tracking-widest text-amber mb-1">Continue Learning</p>
              <p className="font-display text-lg font-bold text-bone">{continueLearning.course_id.toUpperCase()}</p>
              <p className="text-xs text-smoke mt-0.5">
                Enrolled {new Date(continueLearning.enrolled_at).toLocaleDateString()} · {continueLearning.quiz_passed ? '✅ Completed' : 'In Progress'}
              </p>
            </div>
            <span className="hidden sm:block text-smoke">→</span>
          </div>
        </div>
      )}

      {/* Tabs */}
      <div className="mb-6 flex gap-1 overflow-x-auto border-b border-bone/10">
        {tabs.map(t => (
          <button
            key={t.id}
            onClick={() => setActiveTab(t.id)}
            className={`flex items-center gap-2 whitespace-nowrap px-4 py-3 font-display text-sm font-bold transition-colors ${
              activeTab === t.id ? 'text-amber border-b-2 border-amber' : 'text-smoke hover:text-bone'
            }`}
          >
            <span>{t.icon}</span>
            <span>{t.label}</span>
          </button>
        ))}
      </div>

      {/* Tab Content */}
      {activeTab === "overview" && (
        <div className="space-y-6">
          {/* Stats */}
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <div className="rounded-lg border border-bone/10 bg-coal p-5">
              <p className="text-xs font-bold uppercase tracking-widest text-smoke">Courses</p>
              <p className="mt-2 font-display text-3xl font-extrabold text-amber">{enrollments.length}</p>
            </div>
            <div className="rounded-lg border border-bone/10 bg-coal p-5">
              <p className="text-xs font-bold uppercase tracking-widest text-smoke">Completed</p>
              <p className="mt-2 font-display text-3xl font-extrabold text-mint">
                {enrollments.filter(e => e.quiz_passed).length}
              </p>
            </div>
            <div className="rounded-lg border border-bone/10 bg-coal p-5">
              <p className="text-xs font-bold uppercase tracking-widest text-smoke">Telegram</p>
              <p className="mt-2 font-display text-3xl font-extrabold text-tgsky">
                {user.telegram_id ? "Linked" : "Not linked"}
              </p>
            </div>
            <div className="rounded-lg border border-bone/10 bg-coal p-5">
              <p className="text-xs font-bold uppercase tracking-widest text-smoke">Badges</p>
              <p className="mt-2 font-display text-3xl font-extrabold text-bone">{Object.keys(badges).length}</p>
            </div>
          </div>

          {/* Badge Case */}
          <div className="rounded-2xl border border-bone/10 bg-coal p-6">
            <h2 className="font-display text-xl font-bold text-amber mb-4">Badge Case</h2>
            <BadgeShelf earned={badges} />
          </div>

          {/* Recent Activity */}
          <div className="rounded-lg border border-bone/10 bg-coal p-6">
            <h2 className="font-display text-lg font-bold text-amber mb-4">Recent Activity</h2>
            {activity.length === 0 ? (
              <p className="text-sm text-smoke">No recent activity yet. Start learning to see your progress here!</p>
            ) : (
              <div className="space-y-2 max-h-64 overflow-y-auto">
                {activity.slice(0, 10).map((act) => (
                  <div key={act.id} className="rounded border border-bone/5 bg-ink p-3">
                    <p className="text-sm text-bone">{act.text}</p>
                    <p className="text-xs text-smoke mt-1">
                      {new Date(act.at).toLocaleDateString()} · {act.kind}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {activeTab === "courses" && (
        <div className="rounded-lg border border-bone/10 bg-coal p-6">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="font-display text-xl font-bold text-amber">My Courses</h2>
            <button
              onClick={() => go({ view: "courses" })}
              className="text-xs font-bold uppercase tracking-widest text-smoke hover:text-amber"
            >
              Browse more →
            </button>
          </div>
          {enrollments.length === 0 ? (
            <div className="py-8 text-center">
              <p className="text-sm text-smoke mb-4">You haven't enrolled in any courses yet.</p>
              <button
                onClick={() => go({ view: "courses" })}
                className="rounded-md bg-amber px-6 py-2 font-display text-xs font-extrabold uppercase tracking-widest text-ink"
              >
                Explore Courses
              </button>
            </div>
          ) : (
            <div className="space-y-3">
              {enrollments.map((enrollment) => (
                <div
                  key={enrollment.course_id}
                  className="lesson-row flex items-center justify-between rounded border border-bone/5 bg-ink p-4 cursor-pointer hover:border-amber/30"
                  onClick={() => go({ view: "course", courseId: enrollment.course_id })}
                >
                  <div className="flex-1">
                    <p className="font-bold text-bone">{enrollment.course_id.toUpperCase()}</p>
                    <p className="text-xs text-smoke mt-1">
                      Enrolled {new Date(enrollment.enrolled_at).toLocaleDateString()}
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    {enrollment.quiz_passed ? (
                      <span className="rounded bg-mint/20 px-2 py-1 text-[10px] font-bold uppercase tracking-wider text-mint">
                        Completed
                      </span>
                    ) : (
                      <span className="rounded bg-amber/20 px-2 py-1 text-[10px] font-bold uppercase tracking-wider text-amber">
                        In Progress
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {activeTab === "certificates" && (
        <div className="rounded-lg border border-bone/10 bg-coal p-6">
          <h2 className="font-display text-xl font-bold text-amber mb-4">My Certificates</h2>
          {enrollments.filter(e => e.quiz_passed).length === 0 ? (
            <p className="text-sm text-smoke">No certificates yet. Complete a course to earn yours!</p>
          ) : (
            <div className="space-y-3">
              {enrollments.filter(e => e.quiz_passed).map((enrollment) => (
                <div
                  key={enrollment.course_id}
                  className="flex items-center justify-between rounded border border-mint/20 bg-mint/5 p-4 cursor-pointer hover:border-mint/40"
                  onClick={() => go({ view: "course", courseId: enrollment.course_id })}
                >
                  <div>
                    <p className="font-bold text-bone">{enrollment.course_id.toUpperCase()}</p>
                    <p className="text-xs text-mint mt-1">✅ Certificate Earned</p>
                  </div>
                  <span className="text-smoke">View →</span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {activeTab === "payments" && (
        <div className="space-y-6">
          {installments.length > 0 ? (
            <div className="rounded-xl border border-amber/30 bg-amber/5 p-6">
              <h2 className="font-display text-xl font-bold text-amber mb-4">⚠️ Pending Installments</h2>
              <div className="space-y-3">
                {installments.map((inst) => (
                  <div key={inst.id} className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 rounded-lg border border-amber/10 bg-coal p-4">
                    <div>
                      <p className="font-bold text-bone">{inst.course_title || 'Course Installment'}</p>
                      <p className="text-sm text-smoke">
                        Due: {new Date(inst.due_date).toLocaleDateString()} • Status: <span className="text-amber font-bold capitalize">{inst.status.replace('_', ' ')}</span>
                      </p>
                      <p className="font-display text-lg font-bold text-amber mt-1">₦{inst.amount.toLocaleString()}</p>
                    </div>
                    {inst.status === 'pending' && (
                      <button
                        onClick={() => handleInstallmentProof(inst.id)}
                        className="shrink-0 rounded-md bg-amber px-4 py-2 text-xs font-bold uppercase tracking-widest text-ink hover:bg-amber/90"
                      >
                        Upload Proof
                      </button>
                    )}
                    {inst.status === 'proof_submitted' && (
                      <span className="shrink-0 rounded-md bg-mint/20 px-4 py-2 text-xs font-bold uppercase tracking-widest text-mint">
                        Awaiting Approval
                      </span>
                    )}
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="rounded-lg border border-bone/10 bg-coal p-6 text-center">
              <p className="text-smoke">No pending payments. You're all caught up!</p>
            </div>
          )}
        </div>
      )}

      {activeTab === "mentorship" && (
        <div className="rounded-lg border border-bone/10 bg-coal p-6">
          <h2 className="font-display text-xl font-bold text-amber mb-4">Mentorship & Community</h2>
          <div className="space-y-3">
            {/* ✅ NEW: Account Settings Button */}
            <button
              onClick={() => go({ view: "settings" })}
              className="w-full rounded border border-bone/5 bg-ink p-4 text-left text-sm text-bone hover:border-amber/30 transition-colors"
            >
              <p className="font-bold mb-1">⚙️ Account Settings →</p>
              <p className="text-xs text-smoke">Manage profile, password, and integrations</p>
            </button>

            <button
              onClick={() => go({ view: "mentorshop" })}
              className="w-full rounded border border-bone/5 bg-ink p-4 text-left text-sm text-bone hover:border-amber/30 transition-colors"
            >
              <p className="font-bold mb-1">Apply for Mentorship →</p>
              <p className="text-xs text-smoke">Get paired with an experienced mentor</p>
            </button>
            <button
              onClick={() => go({ view: "counseling" })}
              className="w-full rounded border border-bone/5 bg-ink p-4 text-left text-sm text-bone hover:border-amber/30 transition-colors"
            >
              <p className="font-bold mb-1">Book Counseling Session →</p>
              <p className="text-xs text-smoke">Digital therapy and personal guidance</p>
            </button>
            <button
              onClick={() => go({ view: "meetups" })}
              className="w-full rounded border border-bone/5 bg-ink p-4 text-left text-sm text-bone hover:border-amber/30 transition-colors"
            >
              <p className="font-bold mb-1">Community Meetups →</p>
              <p className="text-xs text-smoke">Join live sessions and networking events</p>
            </button>
            {user.telegram_id && (
              <button
                onClick={unlinkTelegram}
                className="w-full rounded border border-alert/20 bg-ink p-4 text-left text-sm text-alert hover:border-alert transition-colors"
              >
                Unlink Telegram Account
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
import { useEffect, useState } from "react";
import { api } from "../lib/api";
import { useStore } from "../lib/store";

export default function Dashboard() {
  const { user, go, toast, logout, isEnrolled } = useStore();
  const [enrollments, setEnrollments] = useState<any[]>([]);
  const [activity, setActivity] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    
    Promise.all([
      api.getEnrollments(),
      api.getActivity()
    ]).then(([enrollRes, actRes]) => {
      setEnrollments(enrollRes.data);
      setActivity(actRes.data);
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

  const progress = (courseId: string) => {
    const enrollment = enrollments.find(e => e.course_id === courseId);
    if (!enrollment) return 0;
    // Simplified progress calculation
    return enrollment.quiz_passed ? 100 : 50;
  };

  return (
    <div className="mx-auto max-w-7xl px-5 py-12 sm:px-8">
      {/* Header */}
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="font-display text-3xl font-extrabold text-bone">Welcome back, {user.name.split(" ")[0]}</h1>
          <p className="mt-1 text-sm text-smoke">
            Member since {new Date(user.joined_at).toLocaleDateString()} • {user.role}
          </p>
        </div>
        <button
          onClick={logout}
          className="rounded-md border border-bone/15 px-4 py-2 font-mono text-[10px] uppercase tracking-[0.16em] text-smoke transition-colors hover:border-alert hover:text-alert"
        >
          Sign out
        </button>
      </div>

      {/* Stats Grid */}
      <div className="mb-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
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
          <p className="text-xs font-bold uppercase tracking-widest text-smoke">Activity</p>
          <p className="mt-2 font-display text-3xl font-extrabold text-bone">{activity.length}</p>
        </div>
      </div>

      <div className="grid gap-8 lg:grid-cols-3">
        {/* Enrolled Courses */}
        <div className="lg:col-span-2 rounded-lg border border-bone/10 bg-coal p-6">
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
                    <div className="text-right">
                      <p className="text-xs text-smoke">Progress</p>
                      <p className="font-display text-lg font-bold text-amber">{progress(enrollment.course_id)}%</p>
                    </div>
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

        {/* Right Sidebar */}
        <div className="space-y-6">
          {/* Quick Actions */}
          <div className="rounded-lg border border-bone/10 bg-coal p-6">
            <h2 className="font-display text-lg font-bold text-amber mb-4">Quick Actions</h2>
            <div className="space-y-2">
              <button
                onClick={() => go({ view: "mentorshop" })}
                className="w-full rounded border border-bone/5 bg-ink p-3 text-left text-sm text-bone hover:border-amber/30"
              >
                Apply for Mentorship →
              </button>
              <button
                onClick={() => go({ view: "mentorship-dashboard" })}
                className="w-full rounded border border-bone/5 bg-ink p-3 text-left text-sm text-bone hover:border-amber/30"
              >
                View Mentorship Dashboard →
              </button>
              <button
                onClick={() => go({ view: "counseling" })}
                className="w-full rounded border border-bone/5 bg-ink p-3 text-left text-sm text-bone hover:border-amber/30"
              >
                Book Counseling Session →
              </button>
              <button
                onClick={() => go({ view: "meetups" })}
                className="w-full rounded border border-bone/5 bg-ink p-3 text-left text-sm text-bone hover:border-amber/30"
              >
                Community Meetups →
              </button>
            </div>
          </div>

          {/* Recent Activity */}
          <div className="rounded-lg border border-bone/10 bg-coal p-6">
            <h2 className="font-display text-lg font-bold text-amber mb-4">Recent Activity</h2>
            {activity.length === 0 ? (
              <p className="text-sm text-smoke">No recent activity.</p>
            ) : (
              <div className="space-y-2 max-h-64 overflow-y-auto">
                {activity.slice(0, 10).map((act) => (
                  <div key={act.id} className="rounded border border-bone/5 bg-ink p-3">
                    <p className="text-sm text-bone">{act.text}</p>
                    <p className="text-xs text-smoke mt-1">
                      {new Date(act.at).toLocaleDateString()} • {act.kind}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
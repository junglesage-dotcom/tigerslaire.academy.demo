import { useEffect, useState } from "react";
import { api } from "../lib/api";
import { useStore } from "../lib/store";

export default function MentorshipDashboard() {
  const { go, toast } = useStore();
  const [apps, setApps] = useState<any[]>([]);
  const [sessions, setSessions] = useState<any[]>([]);
  const [rsvps, setRsvps] = useState<any[]>([]);

  useEffect(() => {
    api.getMyApplications().then(res => setApps(res.data));
    api.getMySessions().then(res => setSessions(res.data));
    api.getMyRsvps().then(res => setRsvps(res.data));
  }, []);

  const handleAgree = async (appId: string) => {
    try {
      await api.agreeToProposal(appId);
      toast("You agreed to the proposal. Next steps will be shared soon.");
      setApps(apps.map(a => a.id === appId ? { ...a, status: 'agreed' } : a));
    } catch (e: any) {
      toast(e.message || "Failed to agree");
    }
  };

  return (
    <div className="mx-auto max-w-7xl px-5 py-12 sm:px-8">
      <h1 className="font-display text-3xl font-extrabold text-bone mb-8">Mentorship Dashboard</h1>

      <div className="grid gap-8 lg:grid-cols-2">
        {/* Applications */}
        <div className="rounded-lg border border-bone/10 bg-coal p-6">
          <h2 className="font-display text-xl font-bold text-amber mb-4">My Applications</h2>
          {apps.length === 0 ? (
            <p className="text-sm text-smoke">No applications yet.</p>
          ) : (
            <div className="space-y-4">
              {apps.map((app) => (
                <div key={app.id} className="rounded border border-bone/5 bg-ink p-4">
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="font-bold text-bone">{app.category_name || app.custom_category}</p>
                      <p className="text-xs text-smoke mt-1">Applied: {new Date(app.applied_at).toLocaleDateString()}</p>
                    </div>
                    <span className={`px-2 py-1 text-[10px] font-bold uppercase tracking-wider rounded ${
                      app.status === 'pending' ? 'bg-smoke/20 text-smoke' :
                      app.status === 'proposal_sent' ? 'bg-amber/20 text-amber' :
                      app.status === 'agreed' ? 'bg-mint/20 text-mint' : 'bg-bone/10 text-bone'
                    }`}>
                      {app.status.replace('_', ' ')}
                    </span>
                  </div>
                  {app.status === 'proposal_sent' && (
                    <div className="mt-4 rounded-lg border border-amber/30 bg-amber/5 p-4 space-y-3">
                      <p className="text-xs font-bold uppercase tracking-widest text-amber mb-2">📬 Proposal Received</p>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
                        <div>
                          <span className="text-smoke block text-xs uppercase">Assigned Mentor</span>
                          <span className="font-bold text-bone">{app.mentor_name || "TBD"}</span>
                        </div>
                        <div>
                          <span className="text-smoke block text-xs uppercase">Proposed Rate</span>
                          <span className="font-bold text-amber">₦{app.proposed_price?.toLocaleString()}</span>
                        </div>
                        <div className="sm:col-span-2">
                          <span className="text-smoke block text-xs uppercase">Proposed First Session</span>
                          <span className="font-bold text-bone">
                            {app.start_date ? new Date(app.start_date).toLocaleString() : "To be discussed"}
                          </span>
                        </div>
                      </div>

                      {app.review_notes && (
                        <div className="rounded border border-bone/10 bg-ink p-3 mt-2">
                          <p className="text-sm text-bone/90 italic">"{app.review_notes}"</p>
                        </div>
                      )}

                      <div className="flex gap-3 mt-4 pt-3 border-t border-amber/20">
                        <button
                          onClick={() => handleAgree(app.id)}
                          className="flex-1 rounded bg-mint py-2.5 text-xs font-bold uppercase tracking-wider text-ink hover:bg-mint/90 transition-colors"
                        >
                          Accept & Proceed
                        </button>
                        <button
                          onClick={() => toast("Please contact support to discuss alternatives")}
                          className="flex-1 rounded border border-bone/20 bg-coal py-2.5 text-xs font-bold uppercase tracking-wider text-bone hover:bg-bone/5 transition-colors"
                        >
                          Discuss Alternatives
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Sessions & RSVPs */}
        <div className="space-y-8">
          <div className="rounded-lg border border-bone/10 bg-coal p-6">
            <h2 className="font-display text-xl font-bold text-amber mb-4">Upcoming Sessions</h2>
            {sessions.length === 0 ? (
              <p className="text-sm text-smoke">No sessions booked.</p>
            ) : (
              <div className="space-y-3">
                {sessions.slice(0, 3).map((s) => (
                  <div key={s.id} className="rounded border border-bone/5 bg-ink p-3">
                    <p className="font-bold text-bone text-sm">{s.topic}</p>
                    <p className="text-xs text-smoke">{new Date(s.scheduled_at).toLocaleString()} • {s.format}</p>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="rounded-lg border border-bone/10 bg-coal p-6">
            <h2 className="font-display text-xl font-bold text-amber mb-4">My Meetups</h2>
            {rsvps.length === 0 ? (
              <p className="text-sm text-smoke">No meetup RSVPs.</p>
            ) : (
              <div className="space-y-3">
                {rsvps.slice(0, 3).map((m) => (
                  <div key={m.id} className="rounded border border-bone/5 bg-ink p-3">
                    <p className="font-bold text-bone text-sm">{m.title}</p>
                    <p className="text-xs text-smoke">{new Date(m.scheduled_at).toLocaleDateString()} • {m.rsvp_status}</p>
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
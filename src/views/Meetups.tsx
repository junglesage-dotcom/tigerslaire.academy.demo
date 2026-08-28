import { useEffect, useState } from "react";
import { api } from "../lib/api";
import { useStore } from "../lib/store";

export default function Meetups() {
  const { toast } = useStore();
  const [meetups, setMeetups] = useState<any[]>([]);

  useEffect(() => {
    api.getMeetups().then(res => setMeetups(res.data));
  }, []);

  const handleRsvp = async (id: string, status: string) => {
    try {
      await api.rsvpMeetup(id, status);
      toast(`RSVP updated to: ${status}`);
      setMeetups(meetups.map(m => m.id === id ? { ...m, user_rsvp: status } : m));
    } catch (e: any) {
      toast(e.message || "Failed to update RSVP");
    }
  };

  return (
    <div className="mx-auto max-w-7xl px-5 py-12 sm:px-8">
      <h1 className="font-display text-3xl font-extrabold text-bone mb-8">Community Meetups</h1>
      
      {meetups.length === 0 ? (
        <div className="rounded-lg border border-bone/10 bg-coal p-8 text-center">
          <p className="text-smoke">No upcoming meetups scheduled. Check back soon!</p>
        </div>
      ) : (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {meetups.map((m) => (
            <div key={m.id} className="card-lift flex flex-col rounded-lg border border-bone/10 bg-coal p-6">
              <div className="mb-4 flex items-center gap-2">
                <span className="rounded bg-amber/10 px-2 py-1 text-[10px] font-bold uppercase tracking-wider text-amber">
                  {m.format}
                </span>
                <span className="text-xs text-smoke">
                  {new Date(m.scheduled_at).toLocaleDateString()}
                </span>
              </div>
              <h3 className="font-display text-xl font-bold text-bone">{m.title}</h3>
              <p className="mt-2 flex-1 text-sm text-smoke">{m.description}</p>
              
              <div className="mt-6 flex gap-2">
                {(!m.user_rsvp || m.user_rsvp === 'not_going') && (
                  <button
                    onClick={() => handleRsvp(m.id, 'going')}
                    className="flex-1 rounded-md bg-amber py-2 text-xs font-bold uppercase tracking-wider text-ink hover:bg-amber/90"
                  >
                    Going
                  </button>
                )}
                {m.user_rsvp === 'going' && (
                  <button
                    onClick={() => handleRsvp(m.id, 'not_going')}
                    className="flex-1 rounded-md border border-alert/30 bg-alert/10 py-2 text-xs font-bold uppercase tracking-wider text-alert"
                  >
                    Cancel RSVP
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
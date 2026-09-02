import { useEffect, useState } from "react";
import { api } from "../lib/api";
import { useStore } from "../lib/store";

export default function Mentorshop() {
  const { go, user, setAuthOpen } = useStore();
  const [categories, setCategories] = useState<any[]>([]);
  const [mentors, setMentors] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      api.getCategories(),
      api.getMentors()
    ]).then(([catRes, menRes]) => {
      setCategories(catRes.data);
      setMentors(menRes.data);
    }).catch(() => {
      // Fallback data if API fails
      setCategories([
        { id: 'tech', name: 'Tech Mentorship', description: 'Coding, data, cybersecurity, and technical career guidance.' },
        { id: 'life-skills', name: 'Life Skills', description: 'Productivity, time management, and personal effectiveness.' },
        { id: 'digital-therapy', name: 'Digital Therapy', description: 'Digital wellness, screen time management, and healthy tech habits.' },
        { id: 'life-coaching', name: 'Life Coaching', description: 'Goal setting, career transitions, and personal growth.' },
        { id: 'custom', name: 'Custom Mentorship', description: 'Describe your specific needs and goals.' }
      ]);
    }).finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="mx-auto max-w-7xl px-5 py-16 text-center sm:px-8">
        <p className="text-amber">Loading the Mentorshop...</p>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-7xl px-5 py-12 sm:px-8">
      <div className="mb-12 text-center">
        <h1 className="font-display text-4xl font-extrabold tracking-tight text-bone sm:text-5xl">
          The Mentorshop
        </h1>
        <p className="mt-4 max-w-2xl mx-auto text-lg text-smoke">
          1-on-1 guidance in Tech, Life Skills, Digital Therapy, and Life Coaching. 
          Tailored to your pace, your goals, and your schedule.
        </p>
      </div>

      <div className="mb-16">
        <h2 className="font-display text-2xl font-bold text-amber mb-6">Explore Categories</h2>
        {categories.length === 0 ? (
          <p className="text-smoke">No categories available at the moment.</p>
        ) : (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {categories.map((cat) => (
              <div key={cat.id} className="card-lift rounded-lg border border-bone/10 bg-coal p-6">
                <h3 className="font-display text-xl font-bold text-bone">{cat.name}</h3>
                <p className="mt-2 text-sm text-smoke">{cat.description}</p>
                <button
                  onClick={() => user ? go({ view: "mentorship-apply", categoryId: cat.id } as any) : setAuthOpen(true)}
                  className="mt-4 text-xs font-bold uppercase tracking-widest text-amber hover:underline"
                >
                  Apply Now →
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      <div>
        <h2 className="font-display text-2xl font-bold text-amber mb-6">Meet Your Guides</h2>
        {mentors.length === 0 ? (
          <p className="text-smoke">No mentors have been added yet. Check back soon!</p>
        ) : (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {mentors.map((m) => (
              <div key={m.id} className="rounded-lg border border-bone/10 bg-[#1a120a] p-6">
                <div className="flex items-center gap-4">
                  {m.image_url ? (
                    <img src={m.image_url} alt={m.name} className="h-12 w-12 rounded-full object-cover border-2 border-amber/20" />
                  ) : (
                    <div className="flex h-12 w-12 items-center justify-center rounded-full bg-amber text-ink font-display font-bold text-xl">
                      {m.name.charAt(0)}
                    </div>
                  )}
                  <div>
                    <h3 className="font-display text-lg font-bold text-bone">{m.name}</h3>
                    <p className="text-xs text-smoke uppercase tracking-wider">
                      {m.specialties.join(" · ")}
                    </p>
                  </div>
                </div>
                <p className="mt-4 text-sm text-smoke leading-relaxed">{m.bio}</p>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="mt-16 flex flex-col sm:flex-row gap-4 justify-center">
        <button
          onClick={() => user ? go({ view: "counseling" }) : setAuthOpen(true)}
          className="stripe-btn rounded-md bg-amber px-8 py-4 font-display text-sm font-extrabold uppercase tracking-widest text-ink"
        >
          Book a Counseling Session
        </button>
        <button
          onClick={() => go({ view: "meetups" })}
          className="rounded-md border border-bone/20 px-8 py-4 font-display text-sm font-extrabold uppercase tracking-widest text-bone hover:bg-bone/5"
        >
          View Community Meetups
        </button>
      </div>
    </div>
  );
}
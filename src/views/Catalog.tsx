import { useEffect, useState } from "react";
import { api } from "../lib/api";
import { useStore } from "../lib/store";
import { IconClaw } from "../components/Icons";

export default function Catalog() {
  const { go, user, setAuthOpen, isEnrolled } = useStore();
  const [courses, setCourses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'Beginner' | 'Intermediate' | 'Advanced'>('all');
  const [search, setSearch] = useState('');

  useEffect(() => {
    api
      .getCourses()
      .then((res) => setCourses(res.data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const filteredCourses = courses.filter((c) => {
    const matchesFilter = filter === 'all' || c.level === filter;
    const matchesSearch = search === '' || 
      c.title.toLowerCase().includes(search.toLowerCase()) ||
      c.code.toLowerCase().includes(search.toLowerCase()) ||
      c.tagline.toLowerCase().includes(search.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  const handleCourseClick = (courseId: string) => {
    go({ view: "course", courseId });
  };

  if (loading) {
    return (
      <div className="mx-auto max-w-7xl px-5 py-16 text-center sm:px-8">
        <div className="inline-flex items-center gap-3 rounded-lg border border-bone/10 bg-coal px-6 py-4">
          <div className="h-4 w-4 animate-spin rounded-full border-2 border-amber border-t-transparent" />
          <p className="font-mono text-sm uppercase tracking-widest text-amber">Loading courses...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-7xl px-5 py-12 sm:px-8">
      {/* Header */}
      <div className="mb-10">
        <div className="mb-2 flex items-center gap-2">
          <span className="h-1 w-8 bg-amber" />
          <span className="font-mono text-xs uppercase tracking-[0.3em] text-amber">Course Catalog</span>
        </div>
        <h1 className="font-display text-4xl font-extrabold tracking-tight text-bone sm:text-5xl">
          All Tracks in One Den
        </h1>
        <p className="mt-4 max-w-2xl text-lg text-smoke">
          Practical courses built around real-world problems. Every lesson drops into your private Telegram channel, and the website tracks what you finish.
        </p>
      </div>

      {/* Filters */}
      <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-wrap gap-2">
          {['all', 'Beginner', 'Intermediate', 'Advanced'].map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`rounded-md px-4 py-2 font-display text-xs font-bold uppercase tracking-widest transition-colors ${filter === f ? 'bg-amber text-ink' : 'border border-bone/10 text-smoke hover:border-amber hover:text-amber'}`}
            >
              {f === 'all' ? 'All Levels' : f}
            </button>
          ))}
        </div>
        <div className="relative">
          <input
            type="text"
            placeholder="Search courses..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full rounded-md border border-bone/10 bg-ink py-2 pl-10 pr-4 text-sm text-bone placeholder:text-smoke/50 focus:border-amber focus:outline-none sm:w-64"
          />
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-smoke">🔍</span>
        </div>
      </div>

      {/* Course Grid */}
      {filteredCourses.length === 0 ? (
        <div className="rounded-lg border border-bone/10 bg-coal p-12 text-center">
          <p className="text-lg text-bone mb-2">No courses found</p>
          <p className="text-sm text-smoke">Try adjusting your filters or search term.</p>
        </div>
      ) : (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {filteredCourses.map((course) => {
            const enrolled = user ? isEnrolled(course.id) : false;
            return (
              <div
                key={course.id}
                onClick={() => handleCourseClick(course.id)}
                className="card-lift group relative cursor-pointer overflow-hidden rounded-xl border border-bone/10 bg-coal"
              >
                {/* Color Accent Bar */}
                <div className="h-1.5 w-full" style={{ backgroundColor: course.hue }} />

                <div className="p-6">
                  {/* Header */}
                  <div className="mb-4 flex items-start justify-between">
                    <div className="flex h-12 w-12 items-center justify-center rounded-lg text-ink transition-transform group-hover:scale-110" style={{ backgroundColor: course.hue }}>
                      <IconClaw className="h-6 w-6" />
                    </div>
                    <div className="text-right">
                      <span className="rounded px-2 py-1 text-[10px] font-bold uppercase tracking-wider" style={{ backgroundColor: course.hue + '20', color: course.hue }}>
                        {course.code}
                      </span>
                    </div>
                  </div>

                  {/* Title & Tagline */}
                  <h3 className="mb-2 font-display text-xl font-bold text-bone group-hover:text-amber transition-colors">
                    {course.title}
                  </h3>
                  <p className="mb-4 text-sm text-smoke line-clamp-2">{course.tagline}</p>

                  {/* Stats */}
                  <div className="mb-4 flex flex-wrap gap-2 text-xs">
                    <span className="rounded bg-bone/5 px-2 py-1 text-bone">{course.level}</span>
                    <span className="rounded bg-bone/5 px-2 py-1 text-bone">{course.weeks} weeks</span>
                    {enrolled && (
                      <span className="rounded bg-mint/20 px-2 py-1 text-[10px] font-bold uppercase tracking-wider text-mint">
                        ✓ Enrolled
                      </span>
                    )}
                  </div>

                  {/* Footer */}
                  <div className="flex items-center justify-between border-t border-bone/10 pt-4">
                    <div>
                      <p className="font-mono text-[10px] uppercase tracking-widest text-smoke">Price</p>
                      <p className="font-display text-lg font-bold" style={{ color: course.hue }}>
                        ₦{course.price?.toLocaleString()}
                      </p>
                    </div>
                    <span className="flex items-center gap-1 text-xs font-bold uppercase tracking-widest text-amber opacity-0 transition-opacity group-hover:opacity-100">
                      View <span>→</span>
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Bottom CTA */}
      <div className="mt-16 rounded-2xl border border-bone/10 bg-gradient-to-br from-coal to-ink p-8 text-center">
        <p className="font-mono text-xs uppercase tracking-[0.3em] text-amber mb-3">Need guidance?</p>
        <h2 className="font-display text-2xl font-bold text-bone mb-3">
          Explore the Mentorshop
        </h2>
        <p className="text-smoke mb-6 max-w-xl mx-auto">
          1-on-1 mentorship in Tech, Life Skills, Digital Therapy, and Life Coaching. Tailored to your pace and goals.
        </p>
        <button
          onClick={() => go({ view: "mentorshop" })}
          className="stripe-btn rounded-md bg-amber px-8 py-3 font-display text-sm font-extrabold uppercase tracking-widest text-ink"
        >
          Visit Mentorshop →
        </button>
      </div>
    </div>
  );
}
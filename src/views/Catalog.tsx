import { useEffect, useState, useMemo } from "react";
import { api } from "../lib/api";
import { useStore } from "../lib/store";
import { IconClaw } from "../components/Icons";

const CATEGORIES = [
  "All",
  "General",
  "Programming",
  "Design",
  "Business",
  "Data Science",
  "Marketing",
  "Kingdom Righteousness",
  "Personal Development",
];

export default function Catalog() {
  const { go, user, toast, isEnrolled, enroll } = useStore();
  const [courses, setCourses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All");

  useEffect(() => {
    loadCourses();
  }, []);

  const loadCourses = async () => {
    try {
      setLoading(true);
      const res = await api.getCourses();
      setCourses(res.data || []);
    } catch (e: any) {
      toast(e.message || "Failed to load courses");
    } finally {
      setLoading(false);
    }
  };

  const filteredCourses = useMemo(() => {
    return courses.filter((c) => {
      // Handle legacy courses that might not have a category yet
      const courseCat = c.category || "General";
      const matchesCategory = selectedCategory === "All" || courseCat === selectedCategory;
      
      const searchLower = search.toLowerCase();
      const matchesSearch = 
        c.title.toLowerCase().includes(searchLower) || 
        c.code.toLowerCase().includes(searchLower) ||
        (c.tagline && c.tagline.toLowerCase().includes(searchLower));
        
      return matchesCategory && matchesSearch;
    });
  }, [courses, search, selectedCategory]);

  const handleViewCourse = (courseId: string) => {
    go({ view: "course", courseId });
  };

  if (loading) {
    return (
      <div className="mx-auto max-w-7xl px-5 py-12 sm:px-8">
        <div className="mb-8 h-10 w-48 animate-pulse rounded bg-bone/10" />
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="h-72 animate-pulse rounded-xl border border-bone/10 bg-coal" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-7xl px-5 py-12 sm:px-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="font-display text-3xl font-extrabold text-bone">Course Catalog</h1>
        <p className="mt-2 text-sm text-smoke">
          Explore our curated learning paths. Master new skills and join the Lair.
        </p>
      </div>

      {/* Filters */}
      <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative flex-1 max-w-md">
          <input
            type="text"
            placeholder="Search by title or code..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full rounded-lg border border-bone/15 bg-coal px-4 py-2.5 pl-10 text-sm text-bone placeholder:text-smoke/50 focus:border-amber focus:outline-none transition-colors"
          />
          <IconClaw className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-smoke/50" />
        </div>
        
        <select
          value={selectedCategory}
          onChange={(e) => setSelectedCategory(e.target.value)}
          className="rounded-lg border border-bone/15 bg-coal px-4 py-2.5 text-sm text-bone focus:border-amber focus:outline-none transition-colors sm:w-56"
        >
          {CATEGORIES.map((cat) => (
            <option key={cat} value={cat}>
              {cat === "All" ? "All Categories" : cat}
            </option>
          ))}
        </select>
      </div>

      {/* Course Grid */}
      {filteredCourses.length === 0 ? (
        <div className="rounded-xl border border-dashed border-bone/15 bg-coal/50 p-12 text-center">
          <p className="font-display text-xl font-bold text-smoke">No courses found</p>
          <p className="mt-2 text-sm text-smoke/70">Try adjusting your search or category filter.</p>
        </div>
      ) : (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {filteredCourses.map((course) => {
            const enrolled = isEnrolled(course.id);
            const courseCat = course.category || "General";
            
            return (
              <div
                key={course.id}
                className="group flex flex-col rounded-xl border border-bone/10 bg-coal transition-all hover:border-amber/30 hover:shadow-[0_8px_30px_-12px_rgba(255,164,27,0.15)]"
              >
                {/* Card Header / Badge Area */}
                <div className="flex items-start justify-between p-5 pb-0">
                  <span 
                    className="rounded-md px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider"
                    style={{ backgroundColor: `${course.hue}20`, color: course.hue }}
                  >
                    {courseCat}
                  </span>
                  <span className="rounded-md bg-bone/5 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-bone">
                    {course.level}
                  </span>
                </div>

                {/* Card Body */}
                <div className="flex flex-1 flex-col p-5 pt-3">
                  <p className="font-mono text-xs uppercase tracking-widest text-smoke mb-1">
                    {course.code}
                  </p>
                  <h3 className="font-display text-xl font-bold text-bone mb-2 line-clamp-2 group-hover:text-amber transition-colors">
                    {course.title}
                  </h3>
                  <p className="text-sm text-smoke line-clamp-2 mb-4 flex-1">
                    {course.tagline || course.summary}
                  </p>

                  {/* Meta Info */}
                  <div className="flex flex-wrap items-center gap-4 text-xs text-smoke mb-5">
                    <span className="flex items-center gap-1.5">
                      <span className="text-amber">📅</span> {course.weeks} weeks
                    </span>
                    <span className="flex items-center gap-1.5">
                      <span className="text-amber">📚</span> {course.path}
                    </span>
                  </div>

                  {/* Card Footer */}
                  <div className="mt-auto flex items-center justify-between border-t border-bone/10 pt-4">
                    <div>
                      <p className="text-[10px] uppercase tracking-widest text-smoke">Price</p>
                      <p className="font-display text-lg font-bold text-bone">
                        ₦{Number(course.price || 0).toLocaleString()}
                      </p>
                    </div>
                    
                    {enrolled ? (
                      <button
                        onClick={() => handleViewCourse(course.id)}
                        className="rounded-md bg-mint/20 px-4 py-2 text-xs font-bold uppercase tracking-widest text-mint hover:bg-mint/30 transition-colors"
                      >
                        Continue
                      </button>
                    ) : (
                      <button
                        onClick={() => handleViewCourse(course.id)}
                        className="stripe-btn rounded-md bg-amber px-4 py-2 text-xs font-bold uppercase tracking-widest text-ink transition-transform hover:-translate-y-0.5"
                      >
                        View Course
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
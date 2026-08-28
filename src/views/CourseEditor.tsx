import { useEffect, useState } from "react";
import { api } from "../lib/api";
import { useStore } from "../lib/store";
import { getYouTubeEmbedUrl } from "../lib/youtube";

export default function CourseEditor({ courseId }: { courseId: string }) {
  const { go, toast, confirm } = useStore();
  const [course, setCourse] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'details' | 'modules' | 'lessons' | 'quiz' | 'resources'>('details');

  // Form states
  const [newModule, setNewModule] = useState({ title: "", orderIndex: 1 });
  const [newLesson, setNewLesson] = useState({
    title: "", minutes: 20, moduleId: "", tags: "Video", bullets: "", msg: 0, youtubeUrl: "", orderIndex: 1
  });
  const [newQuiz, setNewQuiz] = useState({ question: "", options: "", answer: 0, orderIndex: 1 });

  // Resources
  const [resources, setResources] = useState<Record<string, any[]>>({});
  const [selectedLessonForResources, setSelectedLessonForResources] = useState<string | null>(null);
  const [newResource, setNewResource] = useState({
    type: 'video_youtube',
    title: '',
    description: '',
    sourceUrl: '',
    thumbnailUrl: '',
    durationSeconds: 0,
    fileSizeBytes: 0,
    accessLevel: 'enrolled',
    orderIndex: 0
  });

  // Resource types for the dropdown
  const resourceTypes = [
    { value: 'video_youtube', label: '▶️ YouTube Video' },
    { value: 'video_r2', label: '🎬 Video (R2/Hosted)' },
    { value: 'video_external', label: '📹 External Video' },
    { value: 'document_pdf', label: '📄 PDF Document' },
    { value: 'document_text', label: '📝 Reading Material' },
    { value: 'audio', label: '🎵 Audio' },
    { value: 'link_drive', label: '📁 Google Drive Link' },
    { value: 'link_external', label: '🌐 External Link' },
    { value: 'assignment', label: '📋 Assignment' },
    { value: 'image', label: '🖼️ Image' },
  ];

  // Maps a resource type to a single emoji icon (used in the resources list)
  const getTypeIcon = (type: string): string => {
    const found = resourceTypes.find(t => t.value === type);
    if (found) return found.label.trim().charAt(0);
    const icons: Record<string, string> = {
      video_youtube: '▶️', video_r2: '🎬', video_external: '📹',
      document_pdf: '📄', document_text: '📝', audio: '🎵',
      link_drive: '📁', link_external: '🌐', assignment: '📋', image: '🖼️',
    };
    return icons[type] || '📦';
  };

  useEffect(() => {
    loadCourse();
  }, [courseId]);

  const loadCourse = async () => {
    try {
      const res = await api.getCourse(courseId);
      setCourse(res.data);
    } catch (e: any) {
      toast("Failed to load course");
    } finally {
      setLoading(false);
    }
  };

  const handleAddModule = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.addModule(courseId, newModule);
      toast("Module added");
      setNewModule({ title: "", orderIndex: newModule.orderIndex + 1 });
      loadCourse();
    } catch (e: any) {
      toast(e.message);
    }
  };

  const handleAddLesson = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newLesson.moduleId) return toast("Select a module");
    try {
      await api.addLesson(courseId, {
        ...newLesson,
        tags: newLesson.tags.split(",").map(t => t.trim()),
        bullets: newLesson.bullets.split("\n").filter(b => b.trim())
      });
      toast("Lesson added");
      setNewLesson({ ...newLesson, title: "", bullets: "", youtubeUrl: "" });
      loadCourse();
    } catch (e: any) {
      toast(e.message);
    }
  };

  const handleDeleteLesson = async (lessonId: string) => {
    confirm({
      title: "Delete lesson?",
      message: "This will permanently remove the lesson and its resources. This cannot be undone.",
      confirmLabel: "Delete",
      onConfirm: async () => {
        try {
          await api.deleteLesson(lessonId);
          toast("Lesson deleted");
          loadCourse();
        } catch (e: any) {
          toast(e.message);
        }
      },
    });
  };

  const handleAddQuiz = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.addQuizQuestion(courseId, {
        ...newQuiz,
        options: newQuiz.options.split("\n").filter(o => o.trim())
      });
      toast("Quiz question added");
      setNewQuiz({ question: "", options: "", answer: 0, orderIndex: newQuiz.orderIndex + 1 });
      loadCourse();
    } catch (e: any) {
      toast(e.message);
    }
  };

  // Load resources when a lesson is selected
  const loadResources = async (lessonId: string) => {
    try {
      const res = await api.getResources(courseId, lessonId);
      setResources({ ...resources, [lessonId]: res.data });
    } catch (e: any) {
      toast('Failed to load resources');
    }
  };

  const handleAddResource = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedLessonForResources) return;
    try {
      await api.createResource({
        lessonId: selectedLessonForResources,
        courseId,
        ...newResource
      });
      toast('Resource added');
      setNewResource({
        type: 'video_youtube',
        title: '', description: '', sourceUrl: '', thumbnailUrl: '',
        durationSeconds: 0, fileSizeBytes: 0, accessLevel: 'enrolled', orderIndex: 0
      });
      loadResources(selectedLessonForResources);
    } catch (e: any) {
      toast(e.message);
    }
  };

  const handleDeleteResource = async (resourceId: string) => {
    confirm({
      title: "Delete resource?",
      message: "This resource will be permanently removed from the lesson.",
      confirmLabel: "Delete",
      onConfirm: async () => {
    try {
      await api.deleteResource(resourceId);
      toast('Resource deleted');
      if (selectedLessonForResources) loadResources(selectedLessonForResources);
    } catch (e: any) {
      toast(e.message);
    }
    },
    });
    };

    if (loading) return <div className="p-8 text-amber">Loading course...</div>;
  if (!course) return <div className="p-8 text-alert">Course not found</div>;

  const tabs = [
    { id: 'details', label: 'Details' },
    { id: 'modules', label: 'Modules' },
    { id: 'lessons', label: 'Lessons' },
    { id: 'resources', label: 'Resources' },  // NEW
    { id: 'quiz', label: 'Quiz' },
  ] as const;

  return (
    <div className="mx-auto max-w-5xl px-5 py-12 sm:px-8">
      <button onClick={() => go({ view: "admin" })} className="mb-4 text-sm text-smoke hover:text-amber">
        ← Back to Admin
      </button>
      
      <h1 className="font-display text-3xl font-extrabold text-bone mb-2">{course.code}: {course.title}</h1>
      <p className="text-smoke mb-8">{course.tagline}</p>

      {/* Tabs */}
      <div className="mb-6 flex gap-2 border-b border-bone/10">
        {tabs.map(t => (
          <button
            key={t.id}
            onClick={() => setActiveTab(t.id)}
            className={`px-4 py-2 font-display text-sm font-bold transition-colors ${
              activeTab === t.id ? 'text-amber border-b-2 border-amber' : 'text-smoke hover:text-bone'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Details Tab */}
      {activeTab === 'details' && (
        <div className="rounded-lg border border-bone/10 bg-coal p-6 space-y-3">
          <p><span className="text-smoke">Code:</span> <span className="text-bone font-bold">{course.code}</span></p>
          <p><span className="text-smoke">Level:</span> <span className="text-bone">{course.level}</span></p>
          <p><span className="text-smoke">Weeks:</span> <span className="text-bone">{course.weeks}</span></p>
          <p><span className="text-smoke">Price:</span> <span className="text-amber font-bold">₦{course.price?.toLocaleString()}</span></p>
          <p><span className="text-smoke">Telegram Channel:</span> <span className="text-tgsky">{course.channel}</span></p>
          <div>
            <p className="text-smoke mb-1">Outcomes:</p>
            <ul className="list-disc list-inside text-bone text-sm space-y-1">
              {course.outcomes.map((o: string, i: number) => <li key={i}>{o}</li>)}
            </ul>
          </div>
          <div>
            <p className="text-smoke mb-1">Skills:</p>
            <div className="flex flex-wrap gap-2">
              {course.skills.map((s: string, i: number) => (
                <span key={i} className="rounded bg-amber/10 px-2 py-1 text-xs text-amber">{s}</span>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Modules Tab */}
      {activeTab === 'modules' && (
        <div className="space-y-6">
          <div className="rounded-lg border border-bone/10 bg-coal p-6">
            <h3 className="font-display text-lg font-bold text-amber mb-4">Add Module</h3>
            <form onSubmit={handleAddModule} className="flex gap-2">
              <input
                required
                placeholder="Module title"
                className="flex-1 rounded border border-bone/10 bg-ink p-2 text-sm text-bone"
                value={newModule.title}
                onChange={e => setNewModule({ ...newModule, title: e.target.value })}
              />
              <input
                type="number"
                placeholder="Order"
                className="w-20 rounded border border-bone/10 bg-ink p-2 text-sm text-bone"
                value={newModule.orderIndex}
                onChange={e => setNewModule({ ...newModule, orderIndex: parseInt(e.target.value) })}
              />
              <button type="submit" className="rounded bg-amber px-4 py-2 text-xs font-bold uppercase text-ink">
                Add
              </button>
            </form>
          </div>

          <div className="space-y-3">
            {course.modules.map((m: any) => (
              <div key={m.id} className="rounded border border-bone/5 bg-coal p-4">
                <p className="font-bold text-bone">{m.title}</p>
                <p className="text-xs text-smoke mt-1">Order: {m.order_index} • {m.lessons?.length || 0} lessons</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Lessons Tab */}
      {activeTab === 'lessons' && (
        <div className="space-y-6">
          <div className="rounded-lg border border-bone/10 bg-coal p-6">
            <h3 className="font-display text-lg font-bold text-amber mb-4">Add Lesson</h3>
            <form onSubmit={handleAddLesson} className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <input
                  required
                  placeholder="Lesson title"
                  className="col-span-2 rounded border border-bone/10 bg-ink p-2 text-sm text-bone"
                  value={newLesson.title}
                  onChange={e => setNewLesson({ ...newLesson, title: e.target.value })}
                />
                <select
                  required
                  className="rounded border border-bone/10 bg-ink p-2 text-sm text-bone"
                  value={newLesson.moduleId}
                  onChange={e => setNewLesson({ ...newLesson, moduleId: e.target.value })}
                >
                  <option value="">Select module</option>
                  {course.modules.map((m: any) => (
                    <option key={m.id} value={m.id}>{m.title}</option>
                  ))}
                </select>
                <input
                  type="number"
                  placeholder="Minutes"
                  className="rounded border border-bone/10 bg-ink p-2 text-sm text-bone"
                  value={newLesson.minutes}
                  onChange={e => setNewLesson({ ...newLesson, minutes: parseInt(e.target.value) })}
                />
                <input
                  placeholder="Tags (comma-separated)"
                  className="rounded border border-bone/10 bg-ink p-2 text-sm text-bone"
                  value={newLesson.tags}
                  onChange={e => setNewLesson({ ...newLesson, tags: e.target.value })}
                />
                <input
                  placeholder="YouTube URL"
                  className="rounded border border-bone/10 bg-ink p-2 text-sm text-bone"
                  value={newLesson.youtubeUrl}
                  onChange={e => setNewLesson({ ...newLesson, youtubeUrl: e.target.value })}
                />
              </div>
              <textarea
                placeholder="Bullets (one per line)"
                rows={3}
                className="w-full rounded border border-bone/10 bg-ink p-2 text-sm text-bone"
                value={newLesson.bullets}
                onChange={e => setNewLesson({ ...newLesson, bullets: e.target.value })}
              />
              <button type="submit" className="rounded bg-amber px-4 py-2 text-xs font-bold uppercase text-ink">
                Add Lesson
              </button>
            </form>
          </div>

          <div className="space-y-3">
            {course.modules.map((m: any) => (
              <div key={m.id} className="rounded border border-bone/10 bg-coal p-4">
                <h4 className="font-bold text-amber mb-3">{m.title}</h4>
                {m.lessons?.map((l: any) => (
                  <div key={l.id} className="mb-3 rounded border border-bone/5 bg-ink p-3">
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <p className="font-bold text-bone">{l.title}</p>
                        <p className="text-xs text-smoke mt-1">{l.minutes} min • {l.tags?.join(', ')}</p>
                        {l.youtube_url && (
                          <p className="text-xs text-tgsky mt-1">🎬 Has video</p>
                        )}
                      </div>
                      <button
                        onClick={() => handleDeleteLesson(l.id)}
                        className="text-xs text-alert hover:underline"
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Resources Tab */}
      {activeTab === 'resources' && (
        <div className="space-y-6">
          <div className="rounded-lg border border-bone/10 bg-coal p-6">
            <h3 className="font-display text-lg font-bold text-amber mb-4">Select a Lesson</h3>
            <select
              className="w-full rounded border border-bone/10 bg-ink p-2 text-sm text-bone"
              value={selectedLessonForResources || ''}
              onChange={(e) => {
                const lessonId = e.target.value;
                setSelectedLessonForResources(lessonId);
                if (lessonId) loadResources(lessonId);
              }}
            >
              <option value="">Choose a lesson...</option>
              {course.modules.map((m: any) => (
                <optgroup key={m.id} label={m.title}>
                  {m.lessons?.map((l: any) => (
                    <option key={l.id} value={l.id}>{l.title}</option>
                  ))}
                </optgroup>
              ))}
            </select>
          </div>

          {selectedLessonForResources && (
            <>
              {/* Add Resource Form */}
              <div className="rounded-lg border border-bone/10 bg-coal p-6">
                <h3 className="font-display text-lg font-bold text-amber mb-4">Add Resource</h3>
                <form onSubmit={handleAddResource} className="space-y-3">
                  <select
                    className="w-full rounded border border-bone/10 bg-ink p-2 text-sm text-bone"
                    value={newResource.type}
                    onChange={(e) => setNewResource({ ...newResource, type: e.target.value })}
                  >
                    {resourceTypes.map(t => (
                      <option key={t.value} value={t.value}>{t.label}</option>
                    ))}
                  </select>
                  <input
                    required
                    placeholder="Title"
                    className="w-full rounded border border-bone/10 bg-ink p-2 text-sm text-bone"
                    value={newResource.title}
                    onChange={(e) => setNewResource({ ...newResource, title: e.target.value })}
                  />
                  <textarea
                    placeholder="Description (optional)"
                    rows={2}
                    className="w-full rounded border border-bone/10 bg-ink p-2 text-sm text-bone"
                    value={newResource.description}
                    onChange={(e) => setNewResource({ ...newResource, description: e.target.value })}
                  />
                  <input
                    required
                    placeholder="Source URL (YouTube, R2, Drive, etc.)"
                    className="w-full rounded border border-bone/10 bg-ink p-2 text-sm text-bone"
                    value={newResource.sourceUrl}
                    onChange={(e) => setNewResource({ ...newResource, sourceUrl: e.target.value })}
                  />
                  {(newResource.type === 'video_r2' || newResource.type === 'video_external') && (
                    <>
                      <input
                        placeholder="Thumbnail URL (optional)"
                        className="w-full rounded border border-bone/10 bg-ink p-2 text-sm text-bone"
                        value={newResource.thumbnailUrl}
                        onChange={(e) => setNewResource({ ...newResource, thumbnailUrl: e.target.value })}
                      />
                      <input
                        type="number"
                        placeholder="Duration (seconds)"
                        className="w-full rounded border border-bone/10 bg-ink p-2 text-sm text-bone"
                        value={newResource.durationSeconds}
                        onChange={(e) => setNewResource({ ...newResource, durationSeconds: parseInt(e.target.value) || 0 })}
                      />
                    </>
                  )}
                  <select
                    className="w-full rounded border border-bone/10 bg-ink p-2 text-sm text-bone"
                    value={newResource.accessLevel}
                    onChange={(e) => setNewResource({ ...newResource, accessLevel: e.target.value })}
                  >
                    <option value="public">🌍 Public (free preview)</option>
                    <option value="enrolled">🔒 Enrolled students only</option>
                    <option value="premium">⭐ Premium tier only</option>
                  </select>
                  <button type="submit" className="w-full rounded bg-amber py-2 text-xs font-bold uppercase text-ink">
                    Add Resource
                  </button>
                </form>
              </div>

              {/* Existing Resources */}
              <div className="rounded-lg border border-bone/10 bg-coal p-6">
                <h3 className="font-display text-lg font-bold text-amber mb-4">
                  Resources ({resources[selectedLessonForResources]?.length || 0})
                </h3>
                <div className="space-y-2">
                  {(resources[selectedLessonForResources] || []).map((r: any) => (
                    <div key={r.id} className="flex items-center justify-between rounded border border-bone/5 bg-ink p-3">
                      <div className="flex items-center gap-3 flex-1 min-w-0">
                        <span className="text-xl">{getTypeIcon(r.type)}</span>
                        <div className="flex-1 min-w-0">
                          <p className="font-bold text-bone truncate">{r.title}</p>
                          <p className="text-xs text-smoke truncate">{r.source_url}</p>
                        </div>
                      </div>
                      <button
                        onClick={() => handleDeleteResource(r.id)}
                        className="ml-2 text-xs text-alert hover:underline"
                      >
                        Delete
                      </button>
                    </div>
                  ))}
                  {(resources[selectedLessonForResources] || []).length === 0 && (
                    <p className="text-sm text-smoke text-center py-4">No resources yet.</p>
                  )}
                </div>
              </div>
            </>
          )}
        </div>
      )}

      {/* Quiz Tab */}
      {activeTab === 'quiz' && (
        <div className="space-y-6">
          <div className="rounded-lg border border-bone/10 bg-coal p-6">
            <h3 className="font-display text-lg font-bold text-amber mb-4">Add Quiz Question</h3>
            <form onSubmit={handleAddQuiz} className="space-y-3">
              <input
                required
                placeholder="Question"
                className="w-full rounded border border-bone/10 bg-ink p-2 text-sm text-bone"
                value={newQuiz.question}
                onChange={e => setNewQuiz({ ...newQuiz, question: e.target.value })}
              />
              <textarea
                required
                placeholder="Options (one per line)"
                rows={4}
                className="w-full rounded border border-bone/10 bg-ink p-2 text-sm text-bone"
                value={newQuiz.options}
                onChange={e => setNewQuiz({ ...newQuiz, options: e.target.value })}
              />
              <input
                type="number"
                placeholder="Correct answer index (0-based)"
                className="w-full rounded border border-bone/10 bg-ink p-2 text-sm text-bone"
                value={newQuiz.answer}
                onChange={e => setNewQuiz({ ...newQuiz, answer: parseInt(e.target.value) })}
              />
              <button type="submit" className="rounded bg-amber px-4 py-2 text-xs font-bold uppercase text-ink">
                Add Question
              </button>
            </form>
          </div>

          <div className="space-y-3">
            {course.quiz?.map((q: any, i: number) => (
              <div key={i} className="rounded border border-bone/5 bg-ink p-3">
                <p className="font-bold text-bone">{q.question}</p>
                <ul className="mt-2 text-sm text-smoke space-y-1">
                  {q.options?.map((o: string, j: number) => (
                    <li key={j} className={j === q.answer ? 'text-mint font-bold' : ''}>
                      {j === q.answer ? '✓ ' : '  '}{o}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
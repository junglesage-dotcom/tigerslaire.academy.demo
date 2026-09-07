import { useEffect, useState } from "react";
import { api } from "../lib/api";
import { useStore } from "../lib/store";

export default function CourseEditor() {
  const { route, go, user, toast } = useStore();
  // FIXED: Safely extract courseId from the custom store router instead of React Router
  const courseId = route.view === "course-editor" ? route.courseId : null;
  
  const [course, setCourse] = useState<any>(null);
  const [modules, setModules] = useState<any[]>([]);
  const [lessons, setLessons] = useState<any[]>([]);
  const [resources, setResources] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedModule, setExpandedModule] = useState<string | null>(null);
  const [expandedLesson, setExpandedLesson] = useState<string | null>(null);

  useEffect(() => {
    if (!user || user.role !== "admin") {
      toast("Admin access required");
      go({ view: "home" });
      return;
    }
    if (!courseId) {
      go({ view: "admin" });
      return;
    }
    loadCourse();
  }, [courseId, user, go, toast]);

  const loadCourse = async () => {
    if (!courseId) return;
    try {
      setLoading(true);
      const res = await api.getCourse(courseId);
      setCourse(res.data);
      setModules(res.data.modules || []);
      
      const allLessons = (res.data.modules || []).flatMap((m: any) => m.lessons || []);
      setLessons(allLessons);
      
      // Load resources for all lessons
      const allResources: any[] = [];
      for (const lesson of allLessons) {
        try {
          const resRes = await api.getResources(courseId, lesson.id);
          allResources.push(...resRes.data.map((r: any) => ({ ...r, lessonId: lesson.id })));
        } catch (e) { /* ignore */ }
      }
      setResources(allResources);
    } catch (e: any) {
      toast(e.message || "Failed to load course");
    } finally {
      setLoading(false);
    }
  };

  const handleAddModule = async () => {
    const title = prompt("Enter module title:");
    if (title && courseId) {
      try {
        await api.addModule(courseId, { title, orderIndex: modules.length });
        toast("Module added");
        loadCourse();
      } catch (e: any) {
        toast(e.message || "Failed to add module");
      }
    }
  };

  const handleAddLesson = async (moduleId: string) => {
    const title = prompt("Enter lesson title:");
    if (title && courseId) {
      try {
        await api.addLesson(courseId, {
          moduleId,
          title,
          minutes: 0,
          tags: [],
          bullets: [],
          orderIndex: lessons.filter(l => l.module_id === moduleId).length
        });
        toast("Lesson added");
        loadCourse();
      } catch (e: any) {
        toast(e.message || "Failed to add lesson");
      }
    }
  };

  const handleAddResource = async (lessonId: string, resourceData: any) => {
    if (!courseId) return;
    try {
      await api.createResource({
        lessonId,
        courseId,
        type: resourceData.type,
        title: resourceData.name || "Resource",
        sourceUrl: resourceData.url,
        sourceType: resourceData.sourceType || "external",
        key: resourceData.key,
        accessLevel: "enrolled"
      });
      toast("Resource added");
      loadCourse();
    } catch (e: any) {
      toast(e.message || "Failed to add resource");
    }
  };

  const handleDeleteResource = async (resourceId: string) => {
    if (confirm("Delete this resource?")) {
      try {
        await api.deleteResource(resourceId);
        toast("Resource deleted");
        loadCourse();
      } catch (e: any) {
        toast(e.message || "Failed to delete");
      }
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="flex items-center gap-3">
          <div className="h-5 w-5 animate-spin rounded-full border-2 border-amber border-t-transparent"></div>
          <p className="font-mono text-sm text-amber">Loading course editor...</p>
        </div>
      </div>
    );
  }

  if (!course) {
    return (
      <div className="mx-auto max-w-5xl px-5 py-16 text-center sm:px-8">
        <div className="rounded-lg border border-alert/30 bg-alert/5 p-8">
          <p className="font-display text-2xl font-bold text-alert mb-2">Course Not Found</p>
          <p className="text-smoke mb-4">The course you're looking for doesn't exist or has been removed.</p>
          <button
            onClick={() => go({ view: "admin" })}
            className="rounded-md bg-amber px-6 py-2 font-display text-sm font-extrabold uppercase tracking-widest text-ink"
          >
            Back to Admin
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-7xl px-5 py-12 sm:px-8">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="font-display text-3xl font-extrabold text-bone">
            {course.code}: {course.title}
          </h1>
          <p className="text-sm text-smoke mt-1">Course Editor</p>
        </div>
        <button
          onClick={() => go({ view: "admin" })}
          className="rounded-md border border-bone/20 px-4 py-2 text-xs font-bold uppercase tracking-widest text-bone hover:bg-bone/5"
        >
          Back to Admin
        </button>
      </div>

      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="font-display text-xl font-bold text-amber">Modules</h2>
          <button
            onClick={handleAddModule}
            className="rounded-md bg-amber px-4 py-2 text-xs font-bold uppercase tracking-widest text-ink hover:bg-amber/90"
          >
            + Add Module
          </button>
        </div>

        {modules.map((module, mIdx) => (
          <div key={module.id} className="rounded-lg border border-bone/10 bg-coal">
            <div
              className="flex items-center justify-between p-4 cursor-pointer hover:bg-ink/50"
              onClick={() => setExpandedModule(expandedModule === module.id ? null : module.id)}
            >
              <div className="flex items-center gap-3">
                <span className="flex h-8 w-8 items-center justify-center rounded-full bg-amber/20 text-amber text-sm font-bold">
                  {mIdx + 1}
                </span>
                <h3 className="font-display text-lg font-bold text-bone">{module.title}</h3>
              </div>
              <span className="text-sm text-smoke">
                {expandedModule === module.id ? "▼" : "▶"}
              </span>
            </div>

            {expandedModule === module.id && (
              <div className="border-t border-bone/10 p-4 space-y-4">
                <div className="space-y-2">
                  {lessons
                    .filter(l => l.module_id === module.id)
                    .map((lesson, lIdx) => (
                      <div key={lesson.id} className="rounded border border-bone/5 bg-ink p-3">
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-mono text-smoke">{lIdx + 1}.</span>
                            <span className="font-bold text-bone">{lesson.title}</span>
                            <span className="text-xs text-smoke">({lesson.minutes} min)</span>
                          </div>
                          <button
                            onClick={() => setExpandedLesson(expandedLesson === lesson.id ? null : lesson.id)}
                            className="text-xs text-amber hover:underline"
                          >
                            {expandedLesson === lesson.id ? "Hide resources" : "Manage Resources"}
                          </button>
                        </div>

                        {expandedLesson === lesson.id && (
                          <div className="mt-4 space-y-4 border-t border-bone/10 pt-4">
                            <h4 className="text-sm font-bold text-amber">Add Resources</h4>
                            
                            <div className="grid gap-4 sm:grid-cols-2">
                              <ResourceUploader
                                courseId={courseId!}
                                lessonId={lesson.id}
                                type="video"
                                onUploadComplete={(data) => handleAddResource(lesson.id, data)}
                              />
                              <ResourceUploader
                                courseId={courseId!}
                                lessonId={lesson.id}
                                type="document"
                                onUploadComplete={(data) => handleAddResource(lesson.id, data)}
                              />
                            </div>

                            <div>
                              <p className="text-xs text-smoke mb-2">Or Paste External Link (YouTube, Drive, etc.)</p>
                              <ResourceLinker
                                courseId={courseId!}
                                lessonId={lesson.id}
                                type="video"
                                onResourceReady={(data) => handleAddResource(lesson.id, data)}
                              />
                            </div>

                            {resources.filter(r => r.lessonId === lesson.id).length > 0 && (
                              <div className="mt-4">
                                <p className="text-xs font-bold text-amber mb-2">Existing Resources:</p>
                                <div className="space-y-2">
                                  {resources
                                    .filter(r => r.lessonId === lesson.id)
                                    .map(res => (
                                      <div key={res.id} className="flex items-center justify-between rounded border border-bone/5 bg-coal p-3">
                                        <div>
                                          <p className="text-sm font-bold text-bone">{res.title}</p>
                                          <p className="text-xs text-smoke">
                                            {res.type} • {res.source_type || "external"}
                                          </p>
                                        </div>
                                        <button
                                          onClick={() => handleDeleteResource(res.id)}
                                          className="text-xs text-alert hover:underline"
                                        >
                                          Delete
                                        </button>
                                      </div>
                                    ))}
                                </div>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    ))}
                </div>
                <button
                  onClick={() => handleAddLesson(module.id)}
                  className="w-full rounded-md border border-dashed border-bone/20 py-2 text-xs font-bold uppercase tracking-widest text-smoke hover:border-amber hover:text-amber"
                >
                  + Add Lesson
                </button>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

// ==========================================
// SUB-COMPONENTS FOR UPLOADING & LINKING
// ==========================================

function ResourceUploader({ courseId, lessonId, type, onUploadComplete }: any) {
  const { toast } = useStore();
  const [uploading, setUploading] = useState(false);
  const [fileName, setFileName] = useState("");

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setFileName(file.name);
      setUploading(true);
      try {
        const res = await api.uploadResource(file, null, courseId, lessonId, type);
        toast(`${type} uploaded successfully!`);
        onUploadComplete(res.data);
        setFileName("");
      } catch (e: any) {
        toast(e.message || "Failed to upload file");
      } finally {
        setUploading(false);
        if (e.target) e.target.value = "";
      }
    }
  };

  const accept = type === "video" ? "video/mp4,video/webm,video/ogg" : ".pdf,.doc,.docx,.txt,.zip";

  return (
    <div>
      <p className="text-xs text-smoke mb-2">Upload {type === "video" ? "Video" : "Document"}</p>
      <label className="flex-1 cursor-pointer rounded-md border border-dashed border-bone/20 bg-ink p-3 text-center text-sm text-smoke hover:border-amber hover:text-amber transition-colors block">
        {uploading ? (
          <span className="flex items-center justify-center gap-2">
            <div className="h-4 w-4 animate-spin rounded-full border-2 border-amber border-t-transparent"></div>
            Uploading {fileName}...
          </span>
        ) : fileName ? (
          <span className="text-bone">✓ {fileName}</span>
        ) : (
          <span>Click to upload {type}</span>
        )}
        <input
          type="file"
          accept={accept}
          className="hidden"
          onChange={handleFileChange}
          disabled={uploading}
        />
      </label>
    </div>
  );
}

function ResourceLinker({ courseId, lessonId, type, onResourceReady }: any) {
  const { toast } = useStore();
  const [url, setUrl] = useState("");
  const [loading, setLoading] = useState(false);

  const handleAdd = async () => {
    if (!url) {
      toast("Please enter a valid URL");
      return;
    }
    setLoading(true);
    try {
      const res = await api.uploadResource(null, url, courseId, lessonId, type);
      toast("Resource added successfully!");
      onResourceReady(res.data);
      setUrl("");
    } catch (e: any) {
      toast(e.message || "Failed to add resource");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-2">
      <input
        type="url"
        placeholder="https://youtube.com/watch?v=... or https://drive.google.com/..."
        className="w-full rounded border border-bone/10 bg-coal p-2 text-sm text-bone focus:border-amber outline-none"
        value={url}
        onChange={(e) => setUrl(e.target.value)}
      />
      <button
        onClick={handleAdd}
        disabled={loading}
        className="w-full rounded bg-mint py-2 text-xs font-bold uppercase tracking-widest text-ink hover:bg-mint/90 disabled:opacity-50"
      >
        {loading ? "Processing..." : "Add External Link"}
      </button>
    </div>
  );
}
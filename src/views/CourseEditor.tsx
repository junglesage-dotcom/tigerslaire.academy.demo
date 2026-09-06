import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { api } from "../lib/api";
import { useStore } from "../lib/store";
import FileUpload from "../components/FileUpload";
import ResourceInput from "../components/ResourceInput";
import ResourceViewer from "../components/ResourceViewer";

export default function CourseEditor() {
  const { courseId } = useParams<{ courseId: string }>();
  const navigate = useNavigate();
  const { user, toast } = useStore();
  const [course, setCourse] = useState<any>(null);
  const [modules, setModules] = useState<any[]>([]);
  const [lessons, setLessons] = useState<any[]>([]);
  const [resources, setResources] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeModule, setActiveModule] = useState<string | null>(null);
  const [activeLesson, setActiveLesson] = useState<string | null>(null);

  useEffect(() => {
    if (!user || user.role !== 'admin') {
      toast("Admin access required");
      navigate("/");
      return;
    }
    loadCourse();
  }, [courseId, user, navigate, toast]);

  const loadCourse = async () => {
    if (!courseId) return;
    try {
      setLoading(true);
      const courseRes = await api.getCourse(courseId);
      setCourse(courseRes.data);
      setModules(courseRes.data.modules || []);
      setLessons(courseRes.data.modules?.flatMap((m: any) => m.lessons || []) || []);
      
      // Load resources for all lessons
      const allResources: any[] = [];
      for (const module of courseRes.data.modules || []) {
        for (const lesson of module.lessons || []) {
          const resRes = await api.getResources(courseId, lesson.id);
          allResources.push(...resRes.data.map((r: any) => ({ ...r, lessonId: lesson.id })));
        }
      }
      setResources(allResources);
    } catch (err: any) {
      toast(err.message || "Failed to load course");
    } finally {
      setLoading(false);
    }
  };

  const handleAddModule = async () => {
    const title = prompt("Enter module title:");
    if (!title) return;
    
    try {
      await api.addModule(courseId!, { title, orderIndex: modules.length });
      toast("Module added");
      loadCourse();
    } catch (err: any) {
      toast(err.message || "Failed to add module");
    }
  };

  const handleAddLesson = async (moduleId: string) => {
    const title = prompt("Enter lesson title:");
    if (!title) return;
    
    try {
      await api.addLesson(courseId!, {
        moduleId,
        title,
        minutes: 0,
        tags: [],
        bullets: [],
        orderIndex: lessons.filter(l => l.module_id === moduleId).length
      });
      toast("Lesson added");
      loadCourse();
    } catch (err: any) {
      toast(err.message || "Failed to add lesson");
    }
  };

  const handleAddResource = async (lessonId: string, resourceData: any) => {
    try {
      await api.createResource({
        lessonId,
        courseId,
        type: resourceData.type,
        title: resourceData.name || "Resource",
        sourceUrl: resourceData.url,
        sourceType: resourceData.sourceType || 'external',
        key: resourceData.key,
        accessLevel: 'enrolled'
      });
      toast("Resource added");
      loadCourse();
    } catch (err: any) {
      toast(err.message || "Failed to add resource");
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="flex items-center gap-3">
          <div className="h-5 w-5 animate-spin rounded-full border-2 border-amber border-t-transparent" />
          <p className="font-mono text-sm text-amber">Loading course editor...</p>
        </div>
      </div>
    );
  }

  if (!course) return null;

  return (
    <div className="mx-auto max-w-7xl px-5 py-12 sm:px-8">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="font-display text-3xl font-extrabold text-bone">{course.code}: {course.title}</h1>
          <p className="text-sm text-smoke mt-1">Course Editor</p>
        </div>
        <button
          onClick={() => navigate("/admin")}
          className="rounded-md border border-bone/20 px-4 py-2 text-xs font-bold uppercase tracking-widest text-bone hover:bg-bone/5"
        >
          Back to Admin
        </button>
      </div>

      {/* Modules Section */}
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

        {modules.map((module, index) => (
          <div key={module.id} className="rounded-lg border border-bone/10 bg-coal">
            <div
              className="flex items-center justify-between p-4 cursor-pointer hover:bg-ink/50"
              onClick={() => setActiveModule(activeModule === module.id ? null : module.id)}
            >
              <div className="flex items-center gap-3">
                <span className="flex h-8 w-8 items-center justify-center rounded-full bg-amber/20 text-amber text-sm font-bold">
                  {index + 1}
                </span>
                <h3 className="font-display text-lg font-bold text-bone">{module.title}</h3>
              </div>
              <span className="text-sm text-smoke">
                {activeModule === module.id ? '▼' : '▶'}
              </span>
            </div>

            {activeModule === module.id && (
              <div className="border-t border-bone/10 p-4 space-y-4">
                {/* Lessons in this module */}
                <div className="space-y-2">
                  {lessons
                    .filter(l => l.module_id === module.id)
                    .map((lesson, lIndex) => (
                      <div key={lesson.id} className="rounded border border-bone/5 bg-ink p-3">
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-mono text-smoke">{lIndex + 1}.</span>
                            <span className="font-bold text-bone">{lesson.title}</span>
                            <span className="text-xs text-smoke">({lesson.minutes} min)</span>
                          </div>
                          <button
                            onClick={() => setActiveLesson(activeLesson === lesson.id ? null : lesson.id)}
                            className="text-xs text-amber hover:underline"
                          >
                            {activeLesson === lesson.id ? 'Hide Resources' : 'Manage Resources'}
                          </button>
                        </div>

                        {/* Resource Management */}
                        {activeLesson === lesson.id && (
                          <div className="mt-4 space-y-4 border-t border-bone/10 pt-4">
                            <h4 className="text-sm font-bold text-amber">Add Resources</h4>
                            
                            {/* File Upload */}
                            <div className="grid gap-4 sm:grid-cols-2">
                              <div>
                                <p className="text-xs text-smoke mb-2">Upload Video</p>
                                <FileUpload
                                  courseId={courseId!}
                                  lessonId={lesson.id}
                                  type="video"
                                  onUploadComplete={(data) => handleAddResource(lesson.id, data)}
                                />
                              </div>
                              <div>
                                <p className="text-xs text-smoke mb-2">Upload Document</p>
                                <FileUpload
                                  courseId={courseId!}
                                  lessonId={lesson.id}
                                  type="document"
                                  onUploadComplete={(data) => handleAddResource(lesson.id, data)}
                                />
                              </div>
                            </div>

                            {/* External URL Input */}
                            <div>
                              <p className="text-xs text-smoke mb-2">Or Paste External Link (YouTube, Drive, etc.)</p>
                              <ResourceInput
                                courseId={courseId!}
                                lessonId={lesson.id}
                                type="video"
                                onResourceReady={(data) => handleAddResource(lesson.id, data)}
                              />
                            </div>

                            {/* Existing Resources */}
                            {resources.filter(r => r.lessonId === lesson.id).length > 0 && (
                              <div className="mt-4">
                                <p className="text-xs font-bold text-amber mb-2">Existing Resources:</p>
                                <div className="space-y-2">
                                  {resources
                                    .filter(r => r.lessonId === lesson.id)
                                    .map(resource => (
                                      <div key={resource.id} className="flex items-center justify-between rounded border border-bone/5 bg-coal p-3">
                                        <div>
                                          <p className="text-sm font-bold text-bone">{resource.title}</p>
                                          <p className="text-xs text-smoke">{resource.type} • {resource.source_type || 'external'}</p>
                                        </div>
                                        <button
                                          onClick={async () => {
                                            if (confirm("Delete this resource?")) {
                                              try {
                                                await api.deleteResource(resource.id);
                                                toast("Resource deleted");
                                                loadCourse();
                                              } catch (err: any) {
                                                toast(err.message || "Failed to delete");
                                              }
                                            }
                                          }}
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
import { useEffect, useState } from "react";
import { api } from "../lib/api";
import { useStore } from "../lib/store";

export default function CourseEditor() {
  const { route, go, user, toast } = useStore();
  // FIXED: Safely extract courseId from the custom store router instead of React Router
  const courseId = route.view === "course-editor" ? route.courseId : null;
  
  const [course, setCourse] = useState<any>(null);
  const [modules, setModules] = useState<any[]>([]);
  const [units, setUnits] = useState<any[]>([]); // Renamed from lessons
  const [resources, setResources] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedModule, setExpandedModule] = useState<string | null>(null);
  const [expandedUnit, setExpandedUnit] = useState<string | null>(null);
  
  const [isSavingDetails, setIsSavingDetails] = useState(false);

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
      
      const allUnits = (res.data.modules || []).flatMap((m: any) => m.lessons || []);
      setUnits(allUnits);
      
      const allResources: any[] = [];
      for (const unit of allUnits) {
        try {
          const resRes = await api.getResources(courseId, unit.id);
          allResources.push(...resRes.data.map((r: any) => ({ ...r, unitId: unit.id })));
        } catch (e) { /* ignore */ }
      }
      setResources(allResources);
    } catch (e: any) { 
      toast(e.message || "Failed to load course"); 
    } finally { 
      setLoading(false); 
    }
  };

  const handleSaveCourseDetails = async () => {
    if (!course) return;
    setIsSavingDetails(true);
    try {
      const payload = {
        ...course,
        price: Number(course.price) || 0,
        price_usd: Number(course.price_usd) || 0,
        weeks: Number(course.weeks) || 0,
        outcomes: typeof course.outcomes === 'string' ? course.outcomes.split('\n').filter((o: string) => o.trim()) : course.outcomes,
        skills: typeof course.skills === 'string' ? course.skills.split(',').map((s: string) => s.trim()) : course.skills
      };
      await api.updateCourse(courseId!, payload);
      toast("Course details updated successfully!");
    } catch (e: any) { 
      toast(e.message || "Failed to save details"); 
    } finally { 
      setIsSavingDetails(false); 
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

  const handleAddUnit = async (moduleId: string) => {
    const title = prompt("Enter unit title:");
    if (title && courseId) {
      try {
        await api.addLesson(courseId, { 
          moduleId, 
          title, 
          minutes: 0, 
          tags: [], 
          bullets: [], 
          orderIndex: units.filter(u => u.module_id === moduleId).length 
        });
        toast("Unit added"); 
        loadCourse();
      } catch (e: any) { 
        toast(e.message || "Failed to add unit"); 
      }
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
      <div className="mx-auto max-w-5xl px-5 py-16 text-center">
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

      {/* COURSE SETTINGS & PRICING EDITOR */}
      <div className="rounded-xl border border-bone/10 bg-coal p-6 mb-8">
        <h2 className="font-display text-xl font-bold text-amber mb-4">Course Settings & Pricing</h2>
        <div className="grid gap-4 md:grid-cols-2 mb-4">
          <input placeholder="Course Code" className="rounded border border-bone/10 bg-ink p-2 text-sm text-bone" value={course.code || ''} onChange={e => setCourse({...course, code: e.target.value})} />
          <input placeholder="Title" className="rounded border border-bone/10 bg-ink p-2 text-sm text-bone" value={course.title || ''} onChange={e => setCourse({...course, title: e.target.value})} />
          <input placeholder="Tagline" className="rounded border border-bone/10 bg-ink p-2 text-sm text-bone md:col-span-2" value={course.tagline || ''} onChange={e => setCourse({...course, tagline: e.target.value})} />
          <select className="rounded border border-bone/10 bg-ink p-2 text-sm text-bone" value={course.level || 'Beginner'} onChange={e => setCourse({...course, level: e.target.value})}>
            <option>Beginner</option>
            <option>Intermediate</option>
            <option>Advanced</option>
          </select>
          <input type="number" placeholder="Weeks" className="rounded border border-bone/10 bg-ink p-2 text-sm text-bone" value={course.weeks || 0} onChange={e => setCourse({...course, weeks: parseInt(e.target.value) || 0})} />
          
          <div className="grid grid-cols-2 gap-3 p-3 rounded-lg border border-amber/30 bg-amber/5 md:col-span-2">
            <div>
              <label className="text-[10px] font-bold uppercase text-amber block mb-1">Price (₦ NGN)</label>
              <input type="number" className="w-full rounded border border-bone/10 bg-ink p-2 text-sm text-bone" value={course.price || 0} onChange={e => setCourse({...course, price: parseInt(e.target.value) || 0})} />
            </div>
            <div>
              <label className="text-[10px] font-bold uppercase text-amber block mb-1">Price ($ USD)</label>
              <input type="number" className="w-full rounded border border-bone/10 bg-ink p-2 text-sm text-bone" value={course.price_usd || 0} onChange={e => setCourse({...course, price_usd: parseInt(e.target.value) || 0})} />
            </div>
          </div>
        </div>
        
        <textarea placeholder="Summary" rows={3} className="w-full rounded border border-bone/10 bg-ink p-2 text-sm text-bone mb-4" value={course.summary || ''} onChange={e => setCourse({...course, summary: e.target.value})} />
        <textarea placeholder="Outcomes (one per line)" rows={3} className="w-full rounded border border-bone/10 bg-ink p-2 text-sm text-bone mb-4" value={Array.isArray(course.outcomes) ? course.outcomes.join('\n') : (course.outcomes || '')} onChange={e => setCourse({...course, outcomes: e.target.value})} />
        <input placeholder="Skills (comma separated)" className="w-full rounded border border-bone/10 bg-ink p-2 text-sm text-bone mb-4" value={Array.isArray(course.skills) ? course.skills.join(', ') : (course.skills || '')} onChange={e => setCourse({...course, skills: e.target.value})} />
        <input placeholder="Telegram Channel" className="w-full rounded border border-bone/10 bg-ink p-2 text-sm text-bone mb-4" value={course.channel || ''} onChange={e => setCourse({...course, channel: e.target.value})} />
        
        <button 
          onClick={handleSaveCourseDetails} 
          disabled={isSavingDetails} 
          className="w-full rounded bg-amber py-2 text-xs font-bold uppercase tracking-widest text-ink hover:bg-amber/90 disabled:opacity-50"
        >
          {isSavingDetails ? "Saving..." : "Save Course Details"}
        </button>
      </div>

      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="font-display text-xl font-bold text-amber">Modules & Units</h2>
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
              <span className="text-sm text-smoke">{expandedModule === module.id ? "▼" : "▶"}</span>
            </div>

            {expandedModule === module.id && (
              <div className="border-t border-bone/10 p-4 space-y-4">
                <div className="space-y-2">
                  {units.filter(u => u.module_id === module.id).map((unit, uIdx) => (
                    <div key={unit.id} className="rounded border border-bone/5 bg-ink p-3">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-mono text-smoke">Unit {uIdx + 1}.</span>
                          <span className="font-bold text-bone">{unit.title}</span>
                        </div>
                        <button 
                          onClick={() => setExpandedUnit(expandedUnit === unit.id ? null : unit.id)} 
                          className="text-xs text-amber hover:underline"
                        >
                          {expandedUnit === unit.id ? "Hide Resources" : "Manage Resources"}
                        </button>
                      </div>

                      {expandedUnit === unit.id && (
                        <div className="mt-4 space-y-4 border-t border-bone/10 pt-4">
                          <div className="space-y-2 mb-4">
                            <p className="text-xs font-bold text-amber mb-2">Existing Unit Resources:</p>
                            {resources.filter(r => r.unitId === unit.id).length === 0 && (
                              <p className="text-xs text-smoke italic">No resources added to this unit yet.</p>
                            )}
                            {resources.filter(r => r.unitId === unit.id).map(res => (
                              <div key={res.id} className="flex items-center justify-between rounded border border-bone/5 bg-coal p-3">
                                <div>
                                  <p className="text-sm font-bold text-bone">{res.title}</p>
                                  <p className="text-xs text-smoke">{res.type} • {res.source_type || "external"}</p>
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
                          <UnitResourceAdder courseId={courseId!} unitId={unit.id} onAdded={loadCourse} />
                        </div>
                      )}
                    </div>
                  ))}
                </div>
                <button 
                  onClick={() => handleAddUnit(module.id)} 
                  className="w-full rounded-md border border-dashed border-bone/20 py-2 text-xs font-bold uppercase tracking-widest text-smoke hover:border-amber hover:text-amber"
                >
                  + Add Unit
                </button>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

function UnitResourceAdder({ courseId, unitId, onAdded }: any) {
  const { toast } = useStore();
  const [type, setType] = useState('video_youtube');
  const [title, setTitle] = useState('');
  const [url, setUrl] = useState('');
  const [description, setDescription] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);

  const handleAdd = async () => {
    if (!title.trim()) return toast("Resource title is required");
    setLoading(true);
    try {
      let sourceUrl = url;
      let sourceType = 'external';
      let finalType = type;

      if (type === 'video_r2' || type === 'document_pdf') {
        if (!file) { toast("Please select a file to upload"); setLoading(false); return; }
        const uploadType = type === 'video_r2' ? 'video' : 'document';
        const res = await api.uploadResource(file, null, courseId, unitId, uploadType);
        sourceUrl = res.data.url;
        sourceType = 'r2';
        finalType = uploadType === 'video' ? 'video_r2' : 'document_pdf';
      }

      await api.createResource({ 
        lessonId: unitId, 
        courseId, 
        type: finalType, 
        title, 
        description, 
        sourceUrl, 
        sourceType, 
        accessLevel: 'enrolled' 
      });
      toast("Resource added to unit!");
      onAdded();
      setTitle(''); setUrl(''); setDescription(''); setFile(null);
    } catch (e: any) { 
      toast(e.message || "Failed to add resource"); 
    } finally { 
      setLoading(false); 
    }
  };

  return (
    <div className="rounded-lg border border-bone/10 bg-ink p-4 space-y-3">
      <p className="text-xs font-bold text-amber uppercase tracking-widest">Add New Resource</p>
      <select 
        className="w-full rounded border border-bone/10 bg-coal p-2 text-sm text-bone" 
        value={type} 
        onChange={e => setType(e.target.value)}
      >
        <option value="video_youtube">YouTube Video (Link)</option>
        <option value="video_r2">Upload Video File (MP4)</option>
        <option value="document_pdf">Upload PDF / Document</option>
        <option value="link_external">External Link / Blog Post</option>
        <option value="assignment">Text Assignment / Instructions</option>
      </select>
      
      <input 
        placeholder="Resource Title (e.g., Introduction to Python)" 
        className="w-full rounded border border-bone/10 bg-coal p-2 text-sm text-bone" 
        value={title} 
        onChange={e => setTitle(e.target.value)} 
      />
      
      {(type === 'video_youtube' || type === 'link_external') && (
        <input 
          placeholder="Paste URL here..." 
          className="w-full rounded border border-bone/10 bg-coal p-2 text-sm text-bone" 
          value={url} 
          onChange={e => setUrl(e.target.value)} 
        />
      )}
      
      {(type === 'video_r2' || type === 'document_pdf') && (
        <input 
          type="file" 
          className="w-full text-sm text-smoke file:mr-4 file:py-2 file:px-4 file:rounded file:border-0 file:text-xs file:font-bold file:bg-amber file:text-ink" 
          onChange={e => setFile(e.target.files?.[0] || null)} 
        />
      )}

      <textarea 
        placeholder="Description / Instructions (Optional)" 
        rows={2} 
        className="w-full rounded border border-bone/10 bg-coal p-2 text-sm text-bone" 
        value={description} 
        onChange={e => setDescription(e.target.value)} 
      />
      
      <button 
        onClick={handleAdd} 
        disabled={loading} 
        className="w-full rounded bg-mint py-2 text-xs font-bold uppercase tracking-widest text-ink hover:bg-mint/90 disabled:opacity-50"
      >
        {loading ? "Processing..." : "Add Resource to Unit"}
      </button>
    </div>
  );
}
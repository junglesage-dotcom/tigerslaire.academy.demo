import { useEffect, useState, useMemo } from "react";
import html2canvas from "html2canvas";
import jsPDF from "jspdf";
import { api } from "../lib/api";
import { useStore } from "../lib/store";
import ResourcePlayer from "../components/ResourcePlayer";
import CheckoutModal from "../components/CheckoutModal";
import { IconClaw, IconPlane } from "../components/Icons";
import { BADGE_MAP } from "../components/Badges";
import { bindBackButton, haptic, botDeepLink } from "../lib/telegram";

export default function CourseDetail({ courseId }: { courseId: string }) {
  const { user, isEnrolled, completeLesson: markComplete, submitQuiz, go, toast, setAuthOpen } = useStore();
  const [course, setCourse] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [completedLessons, setCompletedLessons] = useState<string[]>([]);
  const [quizAnswers, setQuizAnswers] = useState<Record<number, number>>({});
  const [quizSubmitted, setQuizSubmitted] = useState(false);
  const [quizScore, setQuizScore] = useState<{ score: number; total: number; passed: boolean } | null>(null);
  const [showReview, setShowReview] = useState(false);
  const [activeTab, setActiveTab] = useState<'overview' | 'curriculum' | 'quiz' | 'certificate'>('overview');
  const [expandedModule, setExpandedModule] = useState<number | null>(0);
  const [showCheckout, setShowCheckout] = useState(false);
  const [currency, setCurrency] = useState<'NGN' | 'USD'>('NGN');
  const [lessonResources, setLessonResources] = useState<Record<string, any[]>>({});
  const [downloadingCert, setDownloadingCert] = useState(false);

  useEffect(() => {
    loadCourse();
  }, [courseId]);

  useEffect(() => bindBackButton(() => go({ view: "courses" })), [go]);

  const loadCourse = async () => {
    setLoading(true);
    try {
      const res = await api.getCourse(courseId);
      setCourse(res.data);
      setCompletedLessons([]);
      setQuizAnswers({});
      setQuizSubmitted(false);
      setQuizScore(null);
      setShowReview(false);
      setActiveTab('overview');
      setExpandedModule(0);
    } catch (e: any) {
      toast("Failed to load course: " + (e.message || "Unknown error"));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!course) return;
    course.modules.forEach(async (m: any) => {
      for (const lesson of m.lessons || []) {
        try {
          const res = await api.getResources(courseId, lesson.id);
          setLessonResources(prev => ({ ...prev, [lesson.id]: res.data }));
        } catch (e) { /* ignore */ }
      }
    });
  }, [course]);

  const handleCompleteLesson = async (lessonId: string, lessonTitle: string) => {
    if (!user) {
      setAuthOpen(true);
      return;
    }
    try {
      const res = await markComplete(courseId, lessonId);
      setCompletedLessons([...completedLessons, lessonId]);
      haptic('success');
      toast("✓ " + lessonTitle);

      // Badge toast integration
      if (res && res.awarded && res.awarded.length > 0) {
        res.awarded.forEach((id: string) => {
          const b = BADGE_MAP[id];
          if (b) {
            toast(`🏅 Badge unlocked: ${b.name}`);
          }
        });
      }
    } catch (e: any) {
      haptic('error');
      toast(e.message || "Failed to mark lesson");
    }
  };

  const handleQuizAnswer = (questionIndex: number, optionIndex: number) => {
    if (quizSubmitted) return;
    setQuizAnswers({ ...quizAnswers, [questionIndex]: optionIndex });
  };

  const handleSubmitQuiz = async () => {
    if (!user) {
      setAuthOpen(true);
      return;
    }
    if (!course?.quiz || course.quiz.length === 0) {
      toast("No quiz available");
      return;
    }
    if (Object.keys(quizAnswers).length < course.quiz.length) {
      toast("Please answer all questions before submitting");
      return;
    }

    let score = 0;
    course.quiz.forEach((q: any, i: number) => {
      if (quizAnswers[i] === q.answer) score++;
    });

    const total = course.quiz.length;

    try {
      const res = await submitQuiz(courseId, score, total);
      const passed = res.passed;
      setQuizScore({ score, total, passed });
      setQuizSubmitted(true);
      haptic(passed ? 'success' : 'error');
      if (passed) {
        toast("🎉 Quiz passed! You're one step from your certificate.");
      } else {
        toast("Quiz not passed. You need 70% to pass. Review and try again.");
      }

      // Badge toast integration
      if (res.awarded && res.awarded.length > 0) {
        res.awarded.forEach((id: string) => {
          const b = BADGE_MAP[id];
          if (b) {
            toast(`🏅 Badge unlocked: ${b.name}`);
          }
        });
      }
    } catch (e: any) {
      haptic('error');
      toast(e.message || "Failed to submit quiz");
    }
  };

  const downloadCertificate = async () => {
    const element = document.getElementById('certificate-canvas');
    if (!element) return;
    setDownloadingCert(true);
    toast("Generating your certificate PDF...");
    try {
      const canvas = await html2canvas(element, { scale: 2, backgroundColor: '#1a120a', useCORS: true });
      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' });
      const pageWidth = pdf.internal.pageSize.getWidth();
      const pageHeight = pdf.internal.pageSize.getHeight();
      const imgWidth = pageWidth;
      const imgHeight = (canvas.height * imgWidth) / canvas.width;
      const yOffset = (pageHeight - imgHeight) / 2;
      pdf.addImage(imgData, 'PNG', 0, yOffset, imgWidth, imgHeight);
      pdf.save(`TigersLair_${course.code}_Certificate_${certificateId}.pdf`);
      haptic('success');
      toast("Certificate downloaded!");
    } catch (e: any) {
      haptic('error');
      toast(e.message || "Failed to generate PDF");
    } finally {
      setDownloadingCert(false);
    }
  };

  // ✅ UPDATED: Includes the verification deep-link
  const shareCertificate = async () => {
    const verifyUrl = `${window.location.origin}/?verify=${certificateId}`;
    const text = `🐯 I just completed "${course.title}" (${course.code}) at Tiger's Lair Academy! Certificate ID: ${certificateId}\nVerify: ${verifyUrl}`;
    try {
      await navigator.clipboard.writeText(text);
      toast("Share text copied to clipboard!");
    } catch {
      toast(text);
    }
  };

  // ✅ UPDATED: Includes the verification deep-link
  const shareOnTelegram = () => {
    const verifyUrl = `${window.location.origin}/?verify=${certificateId}`;
    const text = `I just completed "${course.title}" (${course.code}) at Tiger's Lair Academy! 🐯 Certificate ID: ${certificateId}`;
    window.open(`https://t.me/share/url?url=${encodeURIComponent(verifyUrl)}&text=${encodeURIComponent(text)}`, '_blank');
  };

  const stats = useMemo(() => {
    if (!course) return { totalLessons: 0, totalMinutes: 0, modules: 0 };
    const totalLessons = course.modules.reduce((sum: number, m: any) => sum + (m.lessons?.length || 0), 0);
    const totalMinutes = course.modules.reduce(
      (sum: number, m: any) => sum + (m.lessons?.reduce((s: number, l: any) => s + (l.minutes || 0), 0) || 0),
      0
    );
    return { totalLessons, totalMinutes, modules: course.modules.length };
  }, [course]);

  const progress = useMemo(() => {
    if (stats.totalLessons === 0) return 0;
    return Math.round((completedLessons.length / stats.totalLessons) * 100);
  }, [completedLessons, stats.totalLessons]);

  const courseComplete = progress === 100 && quizScore?.passed;

  const certificateId = useMemo(() => {
    if (!courseComplete || !user) return null;
    const serial = (user.id + courseId).split("").reduce((a, ch) => a + ch.charCodeAt(0), 0);
    return "TL-" + course.code + "-" + String(serial * 7).slice(-6);
  }, [courseComplete, user, courseId, course]);

  if (loading) {
    return (
      <div className="mx-auto max-w-6xl px-5 py-16 text-center sm:px-8">
        <div className="inline-flex items-center gap-3 rounded-lg border border-bone/10 bg-coal px-6 py-4">
          <div className="h-4 w-4 animate-spin rounded-full border-2 border-amber border-t-transparent" />
          <p className="font-mono text-sm uppercase tracking-widest text-amber">Loading course data...</p>
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
          <button onClick={() => go({ view: "courses" })} className="rounded-md bg-amber px-6 py-2 font-display text-sm font-extrabold uppercase tracking-widest text-ink">
            Back to Courses
          </button>
        </div>
      </div>
    );
  }

  const enrolled = isEnrolled(courseId);
  const activePrice = currency === 'NGN' ? (course.price || 0) : (course.price_usd || 0);
  const currencySymbol = currency === 'NGN' ? '₦' : '$';

  const tabs = [
    { id: 'overview', label: 'Overview', icon: '📋' },
    { id: 'curriculum', label: 'Curriculum', icon: '📚' },
    { id: 'quiz', label: 'Gate Quiz', icon: '🎯' },
    { id: 'certificate', label: 'Certificate', icon: '🏆' },
  ] as const;

  return (
    <div className="mx-auto max-w-6xl px-5 py-8 sm:px-8">
      {/* Breadcrumb */}
      <button onClick={() => go({ view: "courses" })} className="mb-6 flex items-center gap-2 text-sm text-smoke hover:text-amber transition-colors">
        <span>←</span>
        <span>Back to Course Catalog</span>
      </button>

      {/* Currency Toggle */}
      <div className="flex justify-end mb-4">
        <div className="inline-flex gap-1 p-1 rounded-lg bg-ink border border-bone/10">
          <button
            onClick={() => setCurrency('NGN')}
            className={`px-4 py-1.5 text-xs font-bold uppercase tracking-widest rounded-md transition-colors ${
              currency === 'NGN' ? 'bg-amber text-ink' : 'text-smoke hover:text-bone'
            }`}
          >
            NGN (₦)
          </button>
          <button
            onClick={() => setCurrency('USD')}
            className={`px-4 py-1.5 text-xs font-bold uppercase tracking-widest rounded-md transition-colors ${
              currency === 'USD' ? 'bg-amber text-ink' : 'text-smoke hover:text-bone'
            }`}
          >
            USD ($)
          </button>
        </div>
      </div>

      {/* Hero Section */}
      <div className="relative overflow-hidden rounded-2xl border border-bone/10 bg-gradient-to-br from-coal via-ink to-coal p-8 sm:p-12 mb-8">
        <div className="absolute inset-0 grid-lines opacity-30" />
        <div className="relative">
          <div className="flex flex-wrap items-center gap-3 mb-4">
            <span className="rounded-md px-3 py-1 text-xs font-bold uppercase tracking-wider" style={{ backgroundColor: course.hue + '20', color: course.hue }}>
              {course.code}
            </span>
            <span className="rounded-md bg-bone/5 px-3 py-1 text-xs font-bold uppercase tracking-wider text-bone">
              {course.level}
            </span>
            <span className="rounded-md bg-bone/5 px-3 py-1 text-xs font-bold uppercase tracking-wider text-bone">
              {course.path}
            </span>
          </div>

          <h1 className="font-display text-4xl font-extrabold tracking-tight text-bone sm:text-5xl lg:text-6xl mb-4">
            {course.title}
          </h1>
          <p className="text-lg sm:text-xl text-smoke max-w-3xl leading-relaxed mb-8">
            {course.tagline}
          </p>

          {/* Stats Row */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
            <div className="rounded-lg border border-bone/10 bg-ink/50 p-4">
              <p className="text-xs font-mono uppercase tracking-widest text-smoke mb-1">Duration</p>
              <p className="font-display text-2xl font-bold text-bone">{course.weeks}<span className="text-sm text-smoke ml-1">weeks</span></p>
            </div>
            <div className="rounded-lg border border-bone/10 bg-ink/50 p-4">
              <p className="text-xs font-mono uppercase tracking-widest text-smoke mb-1">Lessons</p>
              <p className="font-display text-2xl font-bold text-bone">{stats.totalLessons}</p>
            </div>
            <div className="rounded-lg border border-bone/10 bg-ink/50 p-4">
              <p className="text-xs font-mono uppercase tracking-widest text-smoke mb-1">Total Time</p>
              <p className="font-display text-2xl font-bold text-bone">{Math.round(stats.totalMinutes / 60)}<span className="text-sm text-smoke ml-1">hrs</span></p>
            </div>
            <div className="rounded-lg border border-bone/10 bg-ink/50 p-4">
              <p className="text-xs font-mono uppercase tracking-widest text-smoke mb-1">Modules</p>
              <p className="font-display text-2xl font-bold text-bone">{stats.modules}</p>
            </div>
          </div>

          {/* Enrollment CTA */}
          {!enrolled && (
            <div className="flex flex-wrap items-center gap-4">
              <div>
                <p className="font-display text-4xl font-extrabold" style={{ color: course.hue }}>
                  {currencySymbol}{activePrice.toLocaleString()}
                </p>
                <p className="text-xs text-smoke mt-1">One-time payment • Lifetime access</p>
              </div>
              <button
                onClick={() => setShowCheckout(true)}
                className="stripe-btn rounded-md px-8 py-4 font-display text-sm font-extrabold uppercase tracking-widest text-ink transition-transform hover:-translate-y-0.5"
                style={{ backgroundColor: course.hue }}
              >
                Enroll Now →
              </button>
            </div>
          )}

          {/* Enrolled Progress */}
          {enrolled && (
            <div className="rounded-lg border border-bone/10 bg-ink/50 p-4">
              <div className="flex items-center justify-between mb-2">
                <p className="text-xs font-mono uppercase tracking-widest text-smoke">Your Progress</p>
                <p className="font-display text-lg font-bold" style={{ color: course.hue }}>{progress}%</p>
              </div>
              <div className="h-2 w-full overflow-hidden rounded-full bg-bone/10">
                <div
                  className="h-full rounded-full transition-all duration-500"
                  style={{ width: progress + '%', backgroundColor: course.hue }}
                />
              </div>
              <div className="mt-2 flex justify-between text-xs text-smoke">
                <span>{completedLessons.length} of {stats.totalLessons} lessons</span>
                {courseComplete && <span className="text-mint font-bold">✓ Course Complete</span>}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div className="mb-8 flex gap-1 overflow-x-auto border-b border-bone/10">
        {tabs.map(t => (
          <button
            key={t.id}
            onClick={() => setActiveTab(t.id)}
            className={`flex items-center gap-2 whitespace-nowrap px-5 py-3 font-display text-sm font-bold transition-colors ${
              activeTab === t.id ? 'text-amber border-b-2 border-amber' : 'text-smoke hover:text-bone'
            }`}
          >
            <span>{t.icon}</span>
            <span>{t.label}</span>
          </button>
        ))}
      </div>

      {/* Overview Tab */}
      {activeTab === 'overview' && (
        <div className="grid gap-8 lg:grid-cols-3">
          <div className="lg:col-span-2 space-y-8">
            {/* About */}
            <section>
              <h2 className="font-display text-2xl font-bold text-amber mb-4">About This Course</h2>
              <p className="text-bone leading-relaxed text-lg">{course.summary}</p>
            </section>

            {/* Outcomes */}
            <section>
              <h2 className="font-display text-2xl font-bold text-amber mb-4">What You'll Achieve</h2>
              <div className="space-y-3">
                {course.outcomes.map((outcome: string, i: number) => (
                  <div key={i} className="flex gap-3 rounded-lg border border-bone/5 bg-coal p-4">
                    <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-mint/20 text-mint text-xs font-bold">
                      ✓
                    </span>
                    <p className="text-bone">{outcome}</p>
                  </div>
                ))}
              </div>
            </section>

            {/* Skills */}
            <section>
              <h2 className="font-display text-2xl font-bold text-amber mb-4">Skills You'll Master</h2>
              <div className="flex flex-wrap gap-2">
                {course.skills.map((skill: string, i: number) => (
                  <span key={i} className="rounded-md border border-bone/10 bg-coal px-4 py-2 text-sm font-bold text-bone">
                    {skill}
                  </span>
                ))}
              </div>
            </section>

            {/* Telegram Channel */}
            <section>
              <h2 className="font-display text-2xl font-bold text-amber mb-4">Private Telegram Channel</h2>
              <div className="rounded-lg border border-tgsky/20 bg-tgsky/5 p-6">
                <div className="flex items-start gap-4">
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-tgsky/20">
                    <IconPlane className="h-6 w-6 text-tgsky" />
                  </div>
                  <div className="flex-1">
                    <p className="font-display text-lg font-bold text-bone mb-1">Daily Lesson Delivery</p>
                    <p className="text-sm text-smoke mb-3">
                      All course materials — videos, PDFs, assignments, and announcements — are delivered directly to your private Telegram channel.
                    </p>
                    <p className="font-mono text-sm text-tgsky">{course.channel}</p>
                    {enrolled ? (
                      course.channel ? (
                        <button
                          onClick={() => botDeepLink(`chan_${courseId}`)}
                          className="mt-4 rounded-md bg-tgsky px-5 py-2.5 text-xs font-bold uppercase tracking-widest text-ink hover:bg-tgsky/90 transition-colors"
                        >
                          🔑 Get Channel Invite via Bot
                        </button>
                      ) : (
                        <p className="mt-3 text-xs text-smoke">This course doesn't have a channel configured yet.</p>
                      )
                    ) : (
                      <p className="mt-3 text-xs text-smoke">Enroll to receive your private channel invite through the bot.</p>
                    )}
                  </div>
                </div>
              </div>
            </section>
          </div>

          {/* Sidebar */}
          <aside className="space-y-6">
            {/* Course Info Card */}
            <div className="sticky top-24 rounded-2xl border border-bone/10 bg-coal p-6">
              <div className="mb-6 flex items-center gap-3">
                <div className="flex h-14 w-14 items-center justify-center rounded-xl text-ink" style={{ backgroundColor: course.hue }}>
                  <IconClaw className="h-8 w-8" />
                </div>
                <div>
                  <p className="font-mono text-xs uppercase tracking-widest text-smoke">Course</p>
                  <p className="font-display text-xl font-bold text-bone">{course.code}</p>
                </div>
              </div>

              <dl className="space-y-3 text-sm">
                <div className="flex justify-between border-b border-bone/5 pb-2">
                  <dt className="text-smoke">Level</dt>
                  <dd className="font-bold text-bone">{course.level}</dd>
                </div>
                <div className="flex justify-between border-b border-bone/5 pb-2">
                  <dt className="text-smoke">Duration</dt>
                  <dd className="font-bold text-bone">{course.weeks} weeks</dd>
                </div>
                <div className="flex justify-between border-b border-bone/5 pb-2">
                  <dt className="text-smoke">Lessons</dt>
                  <dd className="font-bold text-bone">{stats.totalLessons}</dd>
                </div>
                <div className="flex justify-between border-b border-bone/5 pb-2">
                  <dt className="text-smoke">Total Time</dt>
                  <dd className="font-bold text-bone">{Math.round(stats.totalMinutes / 60)} hours</dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-smoke">Price</dt>
                  <dd className="font-display text-xl font-bold" style={{ color: course.hue }}>
                    {currencySymbol}{activePrice.toLocaleString()}
                  </dd>
                </div>
              </dl>

              {!enrolled ? (
                <button
                  onClick={() => setShowCheckout(true)}
                  className="mt-6 w-full stripe-btn rounded-md py-3 font-display text-sm font-extrabold uppercase tracking-widest text-ink"
                  style={{ backgroundColor: course.hue }}
                >
                  Enroll Now
                </button>
              ) : (
                <div className="mt-6 rounded-lg border border-mint/30 bg-mint/5 p-4 text-center">
                  <p className="text-xs font-mono uppercase tracking-widest text-mint mb-1">✓ Enrolled</p>
                  <p className="text-sm text-bone">Keep learning at your pace</p>
                </div>
              )}
            </div>
          </aside>
        </div>
      )}

      {/* Curriculum Tab */}
      {activeTab === 'curriculum' && (
        <div className="space-y-4">
          {!enrolled && (
            <div className="rounded-lg border border-amber/30 bg-amber/5 p-4 mb-6">
              <p className="text-sm text-bone">
                <span className="font-bold text-amber">Preview Mode:</span> Enroll to track your progress and mark lessons complete.
              </p>
            </div>
          )}

          {course.modules.map((module: any, moduleIndex: number) => {
            const moduleLessons = module.lessons || [];
            const moduleCompleted = moduleLessons.filter((l: any) => completedLessons.includes(l.id)).length;
            const moduleProgress = moduleLessons.length > 0 ? Math.round((moduleCompleted / moduleLessons.length) * 100) : 0;
            const isExpanded = expandedModule === moduleIndex;

            return (
              <div key={module.id} className="rounded-xl border border-bone/10 bg-coal overflow-hidden">
                {/* Module Header */}
                <button
                  onClick={() => setExpandedModule(isExpanded ? null : moduleIndex)}
                  className="w-full flex items-center justify-between gap-4 p-5 hover:bg-ink/50 transition-colors text-left"
                >
                  <div className="flex items-center gap-4 flex-1">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg font-display text-sm font-bold" style={{ backgroundColor: course.hue + '30', color: course.hue }}>
                      {String(moduleIndex + 1).padStart(2, '0')}
                    </div>
                    <div className="flex-1">
                      <p className="font-display text-lg font-bold text-bone">{module.title}</p>
                      <p className="text-xs text-smoke mt-1">
                        {moduleLessons.length} lessons • {moduleLessons.reduce((s: number, l: any) => s + (l.minutes || 0), 0)} min
                        {enrolled && <span className="ml-2 text-mint">• {moduleCompleted}/{moduleLessons.length} complete</span>}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    {enrolled && (
                      <div className="hidden sm:block w-24">
                        <div className="h-1.5 w-full overflow-hidden rounded-full bg-bone/10">
                          <div className="h-full rounded-full transition-all" style={{ width: moduleProgress + '%', backgroundColor: course.hue }} />
                        </div>
                      </div>
                    )}
                    <span className={`text-bone transition-transform ${isExpanded ? 'rotate-180' : ''}`}>▼</span>
                  </div>
                </button>

                {/* Module Lessons */}
                {isExpanded && (
                  <div className="border-t border-bone/10 bg-ink/30 p-4 space-y-2">
                    {moduleLessons.map((lesson: any, lessonIndex: number) => {
                      const isCompleted = completedLessons.includes(lesson.id);
                      return (
                        <div key={lesson.id} className="rounded-lg border border-bone/5 bg-coal p-4 hover:border-bone/20 transition-colors">
                          <div className="flex items-start justify-between gap-4">
                            <div className="flex gap-3 flex-1">
                              <div className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xs font-bold ${
                                isCompleted ? 'bg-mint/20 text-mint' : 'bg-bone/5 text-smoke'
                              }`}>
                                {isCompleted ? '✓' : lessonIndex + 1}
                              </div>
                              <div className="flex-1">
                                <p className={`font-bold ${isCompleted ? 'text-mint' : 'text-bone'}`}>{lesson.title}</p>
                                <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-smoke">
                                  <span>{lesson.minutes} min</span>
                                  {lesson.tags?.map((tag: string, i: number) => (
                                    <span key={i} className="rounded bg-bone/5 px-2 py-0.5">{tag}</span>
                                  ))}
                                </div>
                                {lesson.bullets && lesson.bullets.length > 0 && (
                                  <ul className="mt-3 space-y-1">
                                    {lesson.bullets.map((bullet: string, i: number) => (
                                      <li key={i} className="text-sm text-bone/80 flex gap-2">
                                        <span className="text-smoke">•</span>
                                        <span>{bullet}</span>
                                      </li>
                                    ))}
                                  </ul>
                                )}

                                {/* Resources */}
                                {(lessonResources[lesson.id] || []).map((resource: any) => (
                                  <ResourcePlayer key={resource.id} resource={resource} />
                                ))}
                              </div>
                            </div>
                            {enrolled && !isCompleted && (
                              <button
                                onClick={() => handleCompleteLesson(lesson.id, lesson.title)}
                                className="shrink-0 rounded-md px-4 py-2 text-xs font-bold uppercase tracking-wider text-ink transition-colors hover:opacity-90"
                                style={{ backgroundColor: course.hue }}
                              >
                                Complete
                              </button>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Quiz Tab */}
      {activeTab === 'quiz' && (
        <div className="max-w-3xl mx-auto">
          {!enrolled ? (
            <div className="rounded-2xl border border-bone/10 bg-coal p-12 text-center">
              <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-amber/10">
                <span className="text-4xl">🎯</span>
              </div>
              <h2 className="font-display text-2xl font-bold text-bone mb-3">Gate Quiz Locked</h2>
              <p className="text-smoke mb-6">You must enroll in this course to access the gate quiz.</p>
              <button
                onClick={() => setShowCheckout(true)}
                className="stripe-btn rounded-md px-8 py-3 font-display text-sm font-extrabold uppercase tracking-widest text-ink"
                style={{ backgroundColor: course.hue }}
              >
                Enroll to Unlock
              </button>
            </div>
          ) : !course.quiz || course.quiz.length === 0 ? (
            <div className="rounded-2xl border border-bone/10 bg-coal p-12 text-center">
              <p className="text-smoke">No quiz questions available for this course yet.</p>
            </div>
          ) : (
            <div className="space-y-6">
              {/* Quiz Header */}
              <div className="rounded-2xl border border-bone/10 bg-coal p-6">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h2 className="font-display text-2xl font-bold text-amber">Gate Quiz</h2>
                    <p className="text-sm text-smoke mt-1">
                      {course.quiz.length} questions • 70% required to pass
                    </p>
                  </div>
                  {quizSubmitted && quizScore && (
                    <div className={`rounded-lg px-4 py-2 ${quizScore.passed ? 'bg-mint/10 border border-mint/30' : 'bg-alert/10 border border-alert/30'}`}>
                      <p className={`font-display text-lg font-bold ${quizScore.passed ? 'text-mint' : 'text-alert'}`}>
                        {quizScore.score}/{quizScore.total}
                      </p>
                    </div>
                  )}
                </div>

                {/* Progress */}
                <div className="flex items-center gap-3">
                  <div className="flex-1 h-2 overflow-hidden rounded-full bg-bone/10">
                    <div
                      className="h-full rounded-full transition-all"
                      style={{
                        width: (Object.keys(quizAnswers).length / course.quiz.length) * 100 + '%',
                        backgroundColor: course.hue
                      }}
                    />
                  </div>
                  <span className="text-xs font-mono text-smoke">
                    {Object.keys(quizAnswers).length}/{course.quiz.length}
                  </span>
                </div>
              </div>

              {/* Questions */}
              <div className="space-y-4">
                {course.quiz.map((q: any, i: number) => {
                  const userAnswer = quizAnswers[i];
                  const isCorrect = userAnswer === q.answer;
                  const showFeedback = quizSubmitted && showReview;

                  return (
                    <div key={i} className={`rounded-xl border p-6 ${
                      showFeedback
                        ? isCorrect ? 'border-mint/30 bg-mint/5' : 'border-alert/30 bg-alert/5'
                        : 'border-bone/10 bg-coal'
                    }`}>
                      <div className="flex items-start gap-3 mb-4">
                        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg font-display text-sm font-bold" style={{ backgroundColor: course.hue + '30', color: course.hue }}>
                          Q{i + 1}
                        </span>
                        <p className="font-bold text-bone text-lg flex-1">{q.question}</p>
                      </div>

                      <div className="space-y-2 ml-11">
                        {q.options.map((option: string, j: number) => {
                          const isSelected = userAnswer === j;
                          const isCorrectOption = q.answer === j;

                          let borderClass = 'border-bone/10 hover:border-bone/30';
                          let bgClass = '';
                          if (isSelected && !quizSubmitted) {
                            borderClass = 'border-amber';
                            bgClass = 'bg-amber/10';
                          }
                          if (showFeedback) {
                            if (isCorrectOption) {
                              borderClass = 'border-mint';
                              bgClass = 'bg-mint/10';
                            } else if (isSelected && !isCorrectOption) {
                              borderClass = 'border-alert';
                              bgClass = 'bg-alert/10';
                            }
                          }

                          return (
                            <label
                              key={j}
                              className={`flex items-center gap-3 rounded-lg border p-3 cursor-pointer transition-colors ${borderClass} ${bgClass}`}
                            >
                              <input
                                type="radio"
                                name={`question-${i}`}
                                checked={isSelected}
                                onChange={() => handleQuizAnswer(i, j)}
                                disabled={quizSubmitted}
                                className="h-4 w-4 accent-amber"
                              />
                              <span className="flex-1 text-bone">{option}</span>
                              {showFeedback && isCorrectOption && <span className="text-mint font-bold">✓</span>}
                              {showFeedback && isSelected && !isCorrectOption && <span className="text-alert font-bold">✗</span>}
                            </label>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Submit / Results */}
              {!quizSubmitted ? (
                <button
                  onClick={handleSubmitQuiz}
                  disabled={Object.keys(quizAnswers).length < course.quiz.length}
                  className="w-full stripe-btn rounded-xl py-4 font-display text-sm font-extrabold uppercase tracking-widest text-ink disabled:opacity-50 disabled:cursor-not-allowed"
                  style={{ backgroundColor: course.hue }}
                >
                  Submit Quiz ({Object.keys(quizAnswers).length}/{course.quiz.length} answered)
                </button>
              ) : (
                <div className={`rounded-2xl border-2 p-8 text-center ${
                  quizScore?.passed ? 'border-mint bg-mint/5' : 'border-alert bg-alert/5'
                }`}>
                  <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full" style={{ backgroundColor: (quizScore?.passed ? '#57d9a3' : '#ff5d5d') + '20' }}>
                    <span className="text-4xl">{quizScore?.passed ? '🎉' : '📚'}</span>
                  </div>
                  <h3 className={`font-display text-3xl font-bold mb-2 ${quizScore?.passed ? 'text-mint' : 'text-alert'}`}>
                    {quizScore?.passed ? 'Quiz Passed!' : 'Not Quite There'}
                  </h3>
                  <p className="text-bone text-lg mb-2">
                    You scored <span className="font-bold">{quizScore?.score}</span> out of <span className="font-bold">{quizScore?.total}</span>
                  </p>
                  <p className="text-smoke text-sm mb-6">
                    ({Math.round((quizScore!.score / quizScore!.total) * 100)}% • 70% required)
                  </p>

                  <div className="flex flex-wrap gap-3 justify-center">
                    {!quizScore?.passed && (
                      <button
                        onClick={() => {
                          setQuizSubmitted(false);
                          setQuizAnswers({});
                          setQuizScore(null);
                          setShowReview(false);
                        }}
                        className="rounded-md px-6 py-3 font-display text-sm font-extrabold uppercase tracking-widest text-ink"
                        style={{ backgroundColor: course.hue }}
                      >
                        Try Again
                      </button>
                    )}
                    <button
                      onClick={() => setShowReview(!showReview)}
                      className="rounded-md border border-bone/20 px-6 py-3 font-display text-sm font-bold uppercase tracking-widest text-bone hover:bg-bone/5"
                    >
                      {showReview ? 'Hide' : 'Review'} Answers
                    </button>
                    {quizScore?.passed && (
                      <button
                        onClick={() => setActiveTab('certificate')}
                        className="rounded-md bg-mint px-6 py-3 font-display text-sm font-extrabold uppercase tracking-widest text-ink"
                      >
                        View Certificate →
                      </button>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Certificate Tab */}
      {activeTab === 'certificate' && (
        <div className="max-w-3xl mx-auto">
          {!enrolled ? (
            <div className="rounded-2xl border border-bone/10 bg-coal p-12 text-center">
              <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-amber/10">
                <span className="text-4xl">🏆</span>
              </div>
              <h2 className="font-display text-2xl font-bold text-bone mb-3">Certificate Locked</h2>
              <p className="text-smoke">Enroll in this course to earn your certificate.</p>
            </div>
          ) : !courseComplete ? (
            <div className="rounded-2xl border border-bone/10 bg-coal p-12 text-center">
              <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-amber/10">
                <span className="text-4xl">🔒</span>
              </div>
              <h2 className="font-display text-2xl font-bold text-bone mb-3">Certificate Not Yet Earned</h2>
              <p className="text-smoke mb-6">Complete all lessons and pass the gate quiz to unlock your certificate.</p>
              <div className="space-y-2 text-left max-w-sm mx-auto">
                <div className="flex items-center gap-3">
                  <span className={progress === 100 ? 'text-mint' : 'text-smoke'}>{progress === 100 ? '✓' : '○'}</span>
                  <span className="text-bone">Complete all {stats.totalLessons} lessons</span>
                  <span className="ml-auto text-xs text-smoke">{completedLessons.length}/{stats.totalLessons}</span>
                </div>
                <div className="flex items-center gap-3">
                  <span className={quizScore?.passed ? 'text-mint' : 'text-smoke'}>{quizScore?.passed ? '✓' : '○'}</span>
                  <span className="text-bone">Pass the gate quiz (70%+)</span>
                  <span className="ml-auto text-xs text-smoke">
                    {quizScore ? quizScore.score + '/' + quizScore.total : 'Not attempted'}
                  </span>
                </div>
              </div>
            </div>
          ) : (
            <div className="space-y-6">
              {/* Certificate Preview */}
              <div
                id="certificate-canvas"
                className="relative overflow-hidden rounded-2xl border-4 p-12 text-center"
                style={{ borderColor: course.hue, background: 'linear-gradient(135deg, #1a120a 0%, #211709 100%)' }}
              >
                <div className="absolute inset-0 grid-lines opacity-20" />
                <div className="relative">
                  <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full" style={{ backgroundColor: course.hue }}>
                    <IconClaw className="h-12 w-12 text-ink" />
                  </div>
                  <p className="font-mono text-xs uppercase tracking-[0.3em] text-smoke mb-2">Certificate of Completion</p>
                  <h2 className="font-display text-4xl font-extrabold text-bone mb-4">Tiger's Lair Academy</h2>
                  <div className="my-8">
                    <p className="text-sm text-smoke mb-2">This certifies that</p>
                    <p className="font-display text-3xl font-bold mb-2" style={{ color: course.hue }}>{user?.name}</p>
                    <p className="text-sm text-smoke mb-6">has successfully completed</p>
                    <p className="font-display text-2xl font-bold text-bone mb-2">{course.title}</p>
                    <p className="font-mono text-sm text-smoke">{course.code} • {course.weeks} weeks • {stats.totalLessons} lessons</p>
                  </div>
                  <div className="mt-8 pt-6 border-t border-bone/10">
                    <p className="font-mono text-xs text-smoke mb-1">Certificate ID</p>
                    <p className="font-mono text-sm font-bold text-amber">{certificateId}</p>
                  </div>
                </div>
              </div>

              {/* Download / Share */}
              <div className="flex flex-wrap gap-3 justify-center">
                <button
                  onClick={downloadCertificate}
                  disabled={downloadingCert}
                  className="stripe-btn rounded-md px-6 py-3 font-display text-sm font-extrabold uppercase tracking-widest text-ink disabled:opacity-60 disabled:cursor-not-allowed flex items-center gap-2"
                  style={{ backgroundColor: course.hue }}
                >
                  {downloadingCert && <div className="h-4 w-4 animate-spin rounded-full border-2 border-ink border-t-transparent" />}
                  {downloadingCert ? "Generating..." : "Download PDF"}
                </button>
                <button
                  onClick={shareCertificate}
                  className="rounded-md border border-bone/20 px-6 py-3 font-display text-sm font-bold uppercase tracking-widest text-bone hover:bg-bone/5"
                >
                  Share Achievement
                </button>
                <button
                  onClick={shareOnTelegram}
                  className="rounded-md bg-tgsky px-6 py-3 font-display text-sm font-extrabold uppercase tracking-widest text-ink hover:bg-tgsky/90 transition-colors"
                >
                  Post to Telegram
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Checkout Modal */}
      {showCheckout && (
        <CheckoutModal 
          courseId={courseId} 
          amount={activePrice} 
          ngnAmount={course.price}
          currency={currency}
          courseTitle={course.title} 
          onClose={() => setShowCheckout(false)} 
        />
      )}
    </div>
  );
}
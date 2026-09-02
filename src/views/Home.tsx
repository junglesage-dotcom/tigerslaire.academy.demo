import { useStore } from "../lib/store";
import { IconClaw, IconPlane } from "../components/Icons";

export default function Home() {
  const { go, setAuthOpen } = useStore();

  const scrollTo = (id: string) => {
    document.getElementById(id)?.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <div className="relative overflow-hidden">
      {/* Hero Section */}
      <section className="relative pt-24 pb-32 px-5 sm:px-8">
        <div className="mx-auto max-w-7xl text-center">
          <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-bone/10 bg-coal/50 px-4 py-1.5 backdrop-blur-sm">
            <span className="blink-dot h-1.5 w-1.5 rounded-full bg-mint" />
            <span className="font-mono text-[10px] uppercase tracking-[0.2em] text-smoke">
              Tiger's Lair Academy · est. Benin City
            </span>
          </div>
          
          <h1 className="font-display text-5xl font-extrabold tracking-tight text-bone sm:text-7xl lg:text-8xl">
            Learn. Build. <span className="text-amber">Thrive.</span>
          </h1>
          
          <p className="mx-auto mt-6 max-w-2xl text-lg text-smoke sm:text-xl">
            An educational ecosystem combining practical courses, 1-on-1 mentorship, and digital therapy. 
            We do not just teach skills. We build resilient minds.
          </p>

          <div className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row">
            <button
              onClick={() => go({ view: "courses" })}
              className="stripe-btn rounded-md bg-amber px-8 py-4 font-display text-sm font-extrabold uppercase tracking-widest text-ink transition-transform hover:-translate-y-0.5"
            >
              Explore the Den
            </button>
            <button
              onClick={() => setAuthOpen(true)}
              className="rounded-md border border-bone/20 px-8 py-4 font-display text-sm font-extrabold uppercase tracking-widest text-bone transition-colors hover:bg-bone/5"
            >
              Join the Lair
            </button>
          </div>
        </div>
      </section>

      {/* View the Student's Lair (User Flow) */}
      <section id="flow" className="border-y border-bone/10 bg-[#120c05] py-24 px-5 sm:px-8">
        <div className="mx-auto max-w-7xl">
          <div className="mb-16 text-center">
            <p className="font-mono text-xs uppercase tracking-[0.3em] text-amber mb-3">The Journey</p>
            <h2 className="font-display text-4xl font-extrabold text-bone sm:text-5xl">View the Student's Lair</h2>
            <p className="mt-4 max-w-2xl mx-auto text-smoke">
              A seamless flow from enrollment to mastery. Here is how you engage with the platform.
            </p>
          </div>

          <div className="grid gap-8 md:grid-cols-3">
            {[
              {
                step: "01",
                title: "Enroll & Connect",
                desc: "Choose your track and link your Telegram account. Your personal dashboard becomes your command center for all learning activities."
              },
              {
                step: "02",
                title: "Receive Daily Drops",
                desc: "Lessons, PDFs, and assignments are delivered directly to your private Telegram channel. The website tracks your progress as you complete them."
              },
              {
                step: "03",
                title: "Track, Mentor & Graduate",
                desc: "Monitor your progress on the web dashboard. Book counseling sessions, attend community meetups, and earn your certificate upon completion."
              }
            ].map((item) => (
              <div key={item.step} className="card-lift rounded-xl border border-bone/10 bg-coal p-8">
                <span className="font-mono text-4xl font-bold text-amber/20">{item.step}</span>
                <h3 className="mt-4 font-display text-xl font-bold text-bone">{item.title}</h3>
                <p className="mt-3 text-sm leading-relaxed text-smoke">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Catalogue Preview */}
      <section className="py-24 px-5 sm:px-8">
        <div className="mx-auto max-w-7xl text-center">
          <p className="font-mono text-xs uppercase tracking-[0.3em] text-amber mb-3">The Curriculum</p>
          <h2 className="font-display text-4xl font-extrabold text-bone sm:text-5xl">All Tracks in One Den</h2>
          <p className="mt-4 max-w-2xl mx-auto text-smoke">
            From data analysis to ethical hacking, every course is built for the modern African landscape.
          </p>
          <button
            onClick={() => go({ view: "courses" })}
            className="mt-10 rounded-md border border-bone/20 px-8 py-3 font-display text-sm font-extrabold uppercase tracking-widest text-bone hover:bg-bone/5"
          >
            View Full Catalogue →
          </button>
        </div>
      </section>

      {/* Why Pick the Lair */}
      <section className="border-y border-bone/10 bg-[#120c05] py-24 px-5 sm:px-8">
        <div className="mx-auto max-w-7xl">
          <div className="mb-16 text-center">
            <p className="font-mono text-xs uppercase tracking-[0.3em] text-amber mb-3">The Advantage</p>
            <h2 className="font-display text-4xl font-extrabold text-bone sm:text-5xl">Why Pick the Lair?</h2>
          </div>

          <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
            {[
              {
                icon: "🎓",
                title: "More Than Courses",
                desc: "We do not just dump videos on you. We provide structured learning paths with real assignments and gate quizzes to ensure mastery."
              },
              {
                icon: "🤝",
                title: "1-on-1 Mentorship",
                desc: "Stuck on a concept or navigating a career transition? Get paired with a mentor in Tech, Life Skills, or Digital Therapy for personalized guidance."
              },
              {
                icon: "🧠",
                title: "Digital Therapy",
                desc: "Burnout is real. Our digital therapy tracks help you manage screen time, build healthy tech habits, and maintain mental clarity."
              },
              {
                icon: "📱",
                title: "Telegram Delivery",
                desc: "Learn on the app you already use. Daily lessons drop straight into your Telegram, making it easy to study during your commute or breaks."
              },
              {
                icon: "🌍",
                title: "Community Building",
                desc: "Join virtual and physical meetups. Network with like-minded individuals, share findings, and grow together in a supportive ecosystem."
              },
              {
                icon: "🏆",
                title: "Recognized Certificates",
                desc: "Complete your track, pass the gate quiz, and receive a verifiable certificate to showcase your new skills to employers or clients."
              }
            ].map((item) => (
              <div key={item.title} className="rounded-xl border border-bone/10 bg-coal p-6">
                <div className="mb-4 text-3xl">{item.icon}</div>
                <h3 className="font-display text-lg font-bold text-bone">{item.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-smoke">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Founder & Philosophy */}
      <section className="py-24 px-5 sm:px-8">
        <div className="mx-auto max-w-4xl text-center">
          <div className="mb-8 flex justify-center">
            <div className="flex h-20 w-20 items-center justify-center rounded-full bg-amber text-ink">
              <IconClaw className="h-10 w-10" />
            </div>
          </div>
          <h2 className="font-display text-3xl font-extrabold text-bone sm:text-4xl">
            Built by a critical thinker who teaches, taught by great minds that build.
          </h2>
          <p className="mx-auto mt-6 max-w-2xl text-lg leading-relaxed text-smoke">
            Tiger's Lair is an educational platform rooted in mentorship, digital therapy, and community building. 
            Founded by Ehis O. Ferguson, the academy is designed to bridge the gap between theoretical knowledge and practical application, 
            ensuring every student is equipped to thrive in the digital economy.
          </p>
        </div>
      </section>

      {/* 4 Cohorts */}
      <section className="border-y border-bone/10 bg-[#120c05] py-24 px-5 sm:px-8">
        <div className="mx-auto max-w-7xl text-center">
          <p className="font-mono text-xs uppercase tracking-[0.3em] text-amber mb-3">The Cycle</p>
          <h2 className="font-display text-4xl font-extrabold text-bone sm:text-5xl">4 Cohorts. 4 Quarters. 4 Elements.</h2>
          <p className="mt-4 max-w-2xl mx-auto text-smoke">
            The year is divided into four distinct intakes, each aligned with an element to guide your learning journey.
          </p>

          <div className="mt-16 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {[
              { q: "Q1", el: "Claw", c: "bg-amber/10 text-amber", desc: "Groundwork & Foundations. Building the core skills." },
              { q: "Q2", el: "Claw", c: "bg-tgsky/10 text-tgsky", desc: "Flow & Adaptation. Exploring data and business logic." },
              { q: "Q3", el: "Claw", c: "bg-ember/10 text-ember", desc: "Intensity & Execution. Deep dives into hacking and security." },
              { q: "Q4", el: "Claw", c: "bg-mint/10 text-mint", desc: "Expansion & Mastery. Capstones, mentorship, and graduation." }
            ].map((item) => (
              <div key={item.q} className="rounded-xl border border-bone/10 bg-coal p-6 text-left">
                <div className={`mb-4 inline-block rounded px-2 py-1 font-mono text-xs font-bold uppercase ${item.c}`}>
                  {item.q} · {item.el}
                </div>
                <p className="text-sm text-smoke">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Platform Highlights */}
      <section className="py-24 px-5 sm:px-8">
        <div className="mx-auto max-w-7xl">
          <div className="mb-16 text-center">
            <p className="font-mono text-xs uppercase tracking-[0.3em] text-amber mb-3">The Ecosystem</p>
            <h2 className="font-display text-4xl font-extrabold text-bone sm:text-5xl">Platform Highlights</h2>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            {[
              "Real-time progress tracking across all enrolled courses.",
              "Direct Telegram integration for daily lesson delivery.",
              "Flexible 1-on-1 mentorship in Tech, Life Skills, and Therapy.",
              "Bookable counseling sessions via Zoom, Meet, or In-Person.",
              "Community meetups and networking events.",
              "Secure payment options via Card or Bank Transfer.",
              "Verifiable digital certificates upon course completion.",
              "Admin dashboard for seamless course and mentor management."
            ].map((feature, i) => (
              <div key={i} className="flex items-start gap-3 rounded-lg border border-bone/5 bg-coal p-4">
                <span className="mt-1 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-mint/20 text-[10px] font-bold text-mint">✓</span>
                <p className="text-sm text-bone">{feature}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
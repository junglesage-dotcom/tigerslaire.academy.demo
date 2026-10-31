import { useStore } from "../lib/store";
import { IconClaw, IconPlane } from "../components/Icons";
import { GraduationCap, UserCheck, Brain, Smartphone, Globe, Award, Check } from "lucide-react";
import { motion } from "framer-motion";

// Import your images here
import heroBg from '../assets/images/hero-bg.png';
import clawImage from '../assets/images/claw-image.jpg';
import founderEhis from '../assets/images/founder-ehis.png';
import clawBg from '../assets/images/claw.png';

// ============================================
// ANIMATION VARIANTS
// ============================================
const fadeInUp = {
  hidden: { opacity: 0, y: 40 },
  visible: { 
    opacity: 1, 
    y: 0,
    transition: { duration: 0.6, ease: "easeOut" }
  }
};

const staggerContainer = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.15
    }
  }
};

const hoverScale = {
  rest: { scale: 1 },
  hover: { scale: 1.1, rotate: 5, transition: { type: "spring", stiffness: 300, damping: 15 } }
};

export default function Home() {
  const { go, setAuthOpen } = useStore();

  const scrollTo = (id: string) => {
    document.getElementById(id)?.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <div className="relative overflow-hidden">
      {/* Hero Section */}
      <section 
        className="relative pt-24 pb-32 px-5 sm:px-8 bg-cover bg-center bg-no-repeat min-h-[80vh] flex items-center"
        style={{ backgroundImage: `url(${heroBg})` }}
      >
        {/* Dark overlay to ensure text is readable over the image */}
        <div className="absolute inset-0 bg-gradient-to-b from-coal/90 via-coal/70 to-coal/90 backdrop-blur-[2px]" />
        
        <motion.div 
          className="relative mx-auto max-w-7xl text-center w-full"
          initial="hidden"
          animate="visible"
          variants={staggerContainer}
        >
          <motion.div variants={fadeInUp} className="mb-6 inline-flex items-center gap-2 rounded-full border border-bone/10 bg-coal/50 px-4 py-1.5 backdrop-blur-sm">
            <span className="blink-dot h-1.5 w-1.5 rounded-full bg-mint" />
            <span className="font-mono text-[10px] uppercase tracking-[0.2em] text-smoke">
              Tiger's Lair Academy · est. Benin City
            </span>
          </motion.div>
          
          <motion.h1 variants={fadeInUp} className="font-display text-5xl font-extrabold tracking-tight text-bone sm:text-7xl lg:text-8xl drop-shadow-lg">
            Learn. Build. <span className="text-amber">Thrive.</span>
          </motion.h1>
          
          <motion.p variants={fadeInUp} className="mx-auto mt-6 max-w-2xl text-lg text-smoke sm:text-xl drop-shadow-md">
            An AI powered educational ecosystem combining practical courses, 1-on-1 mentorship, and digital therapy. 
            We do not just teach skills. We build resilient minds.
          </motion.p>

          <motion.div variants={fadeInUp} className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row">
            <button
              onClick={() => go({ view: "courses" })}
              className="stripe-btn rounded-md bg-amber px-8 py-4 font-display text-sm font-extrabold uppercase tracking-widest text-ink transition-transform hover:-translate-y-0.5 shadow-lg"
            >
              Explore the Den
            </button>
            <button
              onClick={() => setAuthOpen(true)}
              className="rounded-md border border-bone/20 px-8 py-4 font-display text-sm font-extrabold uppercase tracking-widest text-bone transition-colors hover:bg-bone/5 backdrop-blur-sm"
            >
              Join the Lair
            </button>
          </motion.div>
        </motion.div>
      </section>

      {/* View the Student's Lair (User Flow) */}
      <section id="flow" className="border-y border-bone/10 bg-[#120c05] py-24 px-5 sm:px-8">
        <div className="mx-auto max-w-7xl">
          <motion.div 
            className="mb-16 text-center"
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-100px" }}
            variants={fadeInUp}
          >
            <p className="font-mono text-xs uppercase tracking-[0.3em] text-amber mb-3">The Journey</p>
            <h2 className="font-display text-4xl font-extrabold text-bone sm:text-5xl">View the Student's Lair</h2>
            <p className="mt-4 max-w-2xl mx-auto text-smoke">
              A seamless flow from enrollment to mastery. Here is how you engage with the platform.
            </p>
          </motion.div>

          <motion.div 
            className="grid gap-8 md:grid-cols-3"
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-100px" }}
            variants={staggerContainer}
          >
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
              <motion.div 
                key={item.step} 
                variants={fadeInUp}
                className="card-lift rounded-xl border border-bone/10 bg-coal p-8 hover:border-amber/30 transition-colors"
              >
                <span className="font-mono text-4xl font-bold text-amber/20">{item.step}</span>
                <h3 className="mt-4 font-display text-xl font-bold text-bone">{item.title}</h3>
                <p className="mt-3 text-sm leading-relaxed text-smoke">{item.desc}</p>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* Catalogue Preview */}
      <section className="py-24 px-5 sm:px-8">
        <motion.div 
          className="mx-auto max-w-7xl text-center"
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-100px" }}
          variants={fadeInUp}
        >
          <p className="font-mono text-xs uppercase tracking-[0.3em] text-amber mb-3">The Curriculum</p>
          <h2 className="font-display text-4xl font-extrabold text-bone sm:text-5xl">All Tracks in One Den</h2>
          <p className="mt-4 max-w-2xl mx-auto text-smoke">
            From data analysis to ethical hacking, every course is built for the modern African landscape.
          </p>
          <button
            onClick={() => go({ view: "courses" })}
            className="mt-10 rounded-md border border-bone/20 px-8 py-3 font-display text-sm font-extrabold uppercase tracking-widest text-bone hover:bg-bone/5 transition-colors"
          >
            View Full Catalogue →
          </button>
        </motion.div>
      </section>

      {/* Why Pick the Lair */}
      <section className="relative border-y border-bone/10 bg-[#120c05] py-24 px-5 sm:px-8 overflow-hidden">
        {/* Claw Image Background with low opacity */}
        <div 
          className="absolute inset-0 bg-cover bg-center bg-no-repeat opacity-95 pointer-events-none"
          style={{ backgroundImage: `url(${clawImage})` }}
        />
        {/* Overlay to ensure text remains readable */}
        <div className="absolute inset-0 bg-[#120c05]/80" />
        
        <div className="relative mx-auto max-w-7xl">
          <motion.div 
            className="mb-16 text-center"
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-100px" }}
            variants={fadeInUp}
          >
            <p className="font-mono text-xs uppercase tracking-[0.3em] text-amber mb-3">The Advantage</p>
            <h2 className="font-display text-4xl font-extrabold text-bone sm:text-5xl">Why Pick the Lair?</h2>
          </motion.div>

          <motion.div 
            className="grid gap-8 md:grid-cols-2 lg:grid-cols-3"
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-100px" }}
            variants={staggerContainer}
          >
            {[
              {
                icon: <GraduationCap className="h-8 w-8 text-amber" />,
                title: "More Than Courses",
                desc: "We do not just dump videos on you. We provide structured learning paths with real assignments and gate quizzes to ensure mastery."
              },
              {
                icon: <UserCheck className="h-8 w-8 text-amber" />,
                title: "1-on-1 Mentorship",
                desc: "Stuck on a concept or navigating a career transition? Get paired with a mentor in Tech, Life Skills, or Digital Therapy for personalized guidance."
              },
              {
                icon: <Brain className="h-8 w-8 text-amber" />,
                title: "Digital Therapy",
                desc: "Burnout is real. Our digital therapy tracks help you manage screen time, build healthy tech habits, and maintain mental clarity."
              },
              {
                icon: <Smartphone className="h-8 w-8 text-amber" />,
                title: "Telegram Delivery",
                desc: "Learn on the app you already use. Daily lessons drop straight into your Telegram, making it easy to study during your commute or breaks."
              },
              {
                icon: <Globe className="h-8 w-8 text-amber" />,
                title: "Community Building",
                desc: "Join virtual and physical meetups. Network with like-minded individuals, share findings, and grow together in a supportive ecosystem."
              },
              {
                icon: <Award className="h-8 w-8 text-amber" />,
                title: "Recognized Certificates",
                desc: "Complete your track, pass the gate quiz, and receive a verifiable certificate to showcase your new skills to employers or clients."
              }
            ].map((item) => (
              <motion.div 
                key={item.title} 
                variants={fadeInUp}
                className="rounded-xl border border-bone/10 bg-coal p-6 backdrop-blur-sm bg-coal/80 hover:border-amber/30 transition-colors group"
              >
                <motion.div 
                  className="mb-4"
                  variants={hoverScale}
                  initial="rest"
                  whileHover="hover"
                >
                  {item.icon}
                </motion.div>
                <h3 className="font-display text-lg font-bold text-bone">{item.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-smoke">{item.desc}</p>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* Founder & Philosophy */}
      <section className="py-24 px-5 sm:px-8">
        <motion.div 
          className="mx-auto max-w-4xl text-center"
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-100px" }}
          variants={fadeInUp}
        >
          <div className="mb-8 flex justify-center">
            <img 
              src={founderEhis} 
              alt="Ehis O. Ferguson, Founder of Tiger's Lair Academy" 
              className="h-24 w-24 sm:h-32 sm:w-32 rounded-full object-cover border-4 border-amber/30 shadow-2xl"
            />
          </div>
          <h2 className="font-display text-3xl font-extrabold text-bone sm:text-4xl">
            Built by a critical thinker who teaches, taught by great minds that build.
          </h2>
          <p className="mx-auto mt-6 max-w-2xl text-lg leading-relaxed text-smoke">
            Tiger's Lair is an educational platform rooted in mentorship, digital therapy, and community building. 
            Founded by Ehis O. Ferguson, the academy is designed to bridge the gap between theoretical knowledge and practical application, 
            ensuring every student is equipped to thrive in the digital economy.
          </p>
        </motion.div>
      </section>

      {/* 4 Cohorts */}
      <section className="border-y border-bone/10 bg-[#120c05] py-24 px-5 sm:px-8">
        <div className="mx-auto max-w-7xl text-center">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-100px" }}
            variants={fadeInUp}
          >
            <p className="font-mono text-xs uppercase tracking-[0.3em] text-amber mb-3">The Cycle</p>
            <h2 className="font-display text-4xl font-extrabold text-bone sm:text-5xl">4 Cohorts. 4 Quarters. 4 Elements.</h2>
            <p className="mt-4 max-w-2xl mx-auto text-smoke">
              The year is divided into four distinct intakes, each aligned with an element to guide your learning journey.
            </p>
          </motion.div>

          <motion.div 
            className="mt-16 grid gap-6 sm:grid-cols-2 lg:grid-cols-4"
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-100px" }}
            variants={staggerContainer}
          >
            {[
              { q: "Q1", el: "Claw", c: "bg-amber/10 text-amber", desc: "Groundwork & Foundations. Building the core skills." },
              { q: "Q2", el: "Claw", c: "bg-tgsky/10 text-tgsky", desc: "Flow & Adaptation. Exploring data and business logic." },
              { q: "Q3", el: "Claw", c: "bg-ember/10 text-ember", desc: "Intensity & Execution. Deep dives into hacking and security." },
              { q: "Q4", el: "Claw", c: "bg-mint/10 text-mint", desc: "Expansion & Mastery. Capstones, mentorship, and graduation." }
            ].map((item) => (
              <motion.div 
                key={item.q} 
                variants={fadeInUp}
                className="rounded-xl border border-bone/10 bg-coal p-6 text-left hover:border-amber/30 transition-colors"
              >
                <div className={`mb-4 inline-block rounded px-2 py-1 font-mono text-xs font-bold uppercase ${item.c}`}>
                  {item.q} · {item.el}
                </div>
                <p className="text-sm text-smoke">{item.desc}</p>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* Platform Highlights */}
      <section 
        className="relative py-24 px-5 sm:px-8 bg-cover bg-center bg-no-repeat"
        style={{ backgroundImage: `url(${clawBg})` }}
      >
        {/* Dark overlay to ensure text and cards remain readable */}
        <div className="absolute inset-0 bg-coal/90" />
        
        <div className="relative mx-auto max-w-7xl">
          <motion.div 
            className="mb-16 text-center"
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-100px" }}
            variants={fadeInUp}
          >
            <p className="font-mono text-xs uppercase tracking-[0.3em] text-amber mb-3">The Ecosystem</p>
            <h2 className="font-display text-4xl font-extrabold text-bone sm:text-5xl">Platform Highlights</h2>
          </motion.div>

          <motion.div 
            className="grid gap-4 md:grid-cols-2"
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-100px" }}
            variants={staggerContainer}
          >
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
              <motion.div 
                key={i} 
                variants={fadeInUp}
                className="flex items-start gap-3 rounded-lg border border-bone/5 bg-coal p-4 hover:border-amber/20 transition-colors"
              >
                <span className="mt-1 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-mint/20 text-mint">
                  <Check className="h-3 w-3" />
                </span>
                <p className="text-sm text-bone">{feature}</p>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>
    </div>
  );
}
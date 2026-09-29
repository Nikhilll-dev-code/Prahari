import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import Hero3DCanvas from '../components/Hero3DCanvas';
import TiltCard from '../components/TiltCard';
import StatCounter from '../components/StatCounter';
import { useAuth } from '../context/AuthContext';
import { 
  Shield, ArrowRight, Sparkles, AlertTriangle, Eye, 
  BrainCircuit, Activity, FileCheck, Layers, Users, 
  CheckCircle2, Compass, Building2, Flame, ExternalLink, ChevronDown
} from 'lucide-react';

export default function Welcome({ onGetStarted }) {
  const { user, isHSE, isReporter } = useAuth();

  // Typing effect for the Hero Tagline
  const fullTagline = "PRAHARI • AI/NLP Safety Precursor Detection Engine for Oil India Limited (KAVACH Framework)";
  const [displayedTagline, setDisplayedTagline] = useState('');

  useEffect(() => {
    let index = 0;
    const interval = setInterval(() => {
      setDisplayedTagline(fullTagline.slice(0, index));
      index++;
      if (index > fullTagline.length) {
        clearInterval(interval);
      }
    }, 28);
    return () => clearInterval(interval);
  }, []);

  const scrollToSection = (id) => {
    const el = document.getElementById(id);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <div className="min-h-screen text-slate-900 dark:text-slate-100 bg-slate-50 dark:bg-[#0B132B] selection:bg-accent-blue selection:text-white relative overflow-hidden transition-colors duration-300">
      
      {/* Dynamic Ambient Background Gradients */}
      <div 
        className="absolute top-0 left-1/4 w-[500px] h-[500px] bg-accent-blue/10 dark:bg-[#1F3864]/30 rounded-full blur-[120px] pointer-events-none -z-10"
        aria-hidden="true"
      />
      <div 
        className="absolute top-1/3 right-10 w-[450px] h-[450px] bg-cyan-500/10 dark:bg-[#2E74B5]/25 rounded-full blur-[140px] pointer-events-none -z-10"
        aria-hidden="true"
      />
      <div 
        className="absolute bottom-1/4 left-10 w-[550px] h-[550px] bg-blue-500/10 dark:bg-[#00B4D8]/15 rounded-full blur-[150px] pointer-events-none -z-10"
        aria-hidden="true"
      />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-24 sm:space-y-32 py-8 sm:py-12">
        
        {/* ========================================================
            SECTION 1: HERO (Full-Screen, 3D Interactive, Animated)
            ======================================================== */}
        <section className="min-h-[82vh] flex flex-col justify-center pt-4 sm:pt-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center">
            
            {/* Left: Text & Actions */}
            <motion.div 
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
              className="lg:col-span-7 space-y-6 text-center lg:text-left"
            >
              {/* Organization & PS Chip */}
              <div className="inline-flex items-center space-x-2 px-3.5 py-1.5 rounded-full bg-white/90 dark:bg-slate-900/80 border border-slate-300 dark:border-cyan-glow/30 backdrop-blur-md shadow-xs">
                <span className="w-2 h-2 rounded-full bg-accent-blue dark:bg-cyan-bright animate-ping" />
                <span className="text-xs font-mono font-semibold text-accent-blue dark:text-cyan-bright tracking-wide">
                  PRAHARI • Oil India Limited (OIL) • PS SIH26165
                </span>
              </div>

              {/* Big Animated Headline */}
              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black font-heading tracking-tight leading-[1.1] text-slate-900 dark:text-white">
                Detecting <span className="gradient-text-sentinel">Fatal Precursors</span> Before Escalation
              </h1>

              {/* Tagline with Typing Effect */}
              <p className="text-base sm:text-lg text-slate-700 dark:text-slate-300 font-mono min-h-[3.2rem] leading-relaxed">
                {displayedTagline}
                <span className="inline-block w-2 h-4 bg-accent-blue dark:bg-cyan-bright ml-1 animate-pulse" />
              </p>

              <p className="text-sm text-slate-600 dark:text-slate-400 max-w-xl mx-auto lg:mx-0 leading-relaxed font-sans">
                An industrial-grade AI safety system purpose-built for high-consequence energy installations. Unmasks catastrophic SIF precursors buried inside routine field logs with explainable NLP reasoning.
              </p>

              {/* Two Action Buttons */}
              <div className="pt-2 flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-4">
                <button
                  onClick={onGetStarted}
                  className="btn-premium w-full sm:w-auto px-8 py-4 rounded-xl bg-gradient-to-r from-primary-navy via-accent-blue to-cyan-500 text-white font-bold text-sm flex items-center justify-center space-x-3 shadow-lg shadow-accent-blue/30 group cursor-pointer"
                >
                  <span>
                    {isHSE ? 'Enter HSE Triage Console' : 'Open Field Safety Portal'}
                  </span>
                  <ArrowRight className="w-4 h-4 transition-transform duration-300 group-hover:translate-x-1.5" />
                </button>

                <button
                  onClick={() => scrollToSection('problem-purpose')}
                  className="btn-premium w-full sm:w-auto px-7 py-4 rounded-xl bg-white hover:bg-slate-100 dark:bg-slate-900/70 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 border border-slate-300 dark:border-blue-500/30 font-semibold text-sm flex items-center justify-center space-x-2 backdrop-blur-md shadow-xs cursor-pointer"
                >
                  <Eye className="w-4 h-4 text-accent-blue dark:text-cyan-glow" />
                  <span>Explore Architecture</span>
                </button>
              </div>

              {/* Role Context Bar */}
              {user && (
                <div className="pt-3 text-xs text-slate-500 dark:text-slate-400 flex items-center justify-center lg:justify-start space-x-2">
                  <span>Authenticated as:</span>
                  <span className="font-bold text-slate-800 dark:text-white bg-slate-200 dark:bg-slate-800/80 px-2 py-0.5 rounded border border-slate-300 dark:border-slate-700">
                    {user.name} ({user.role})
                  </span>
                  <span>• {user.installation} Field</span>
                </div>
              )}
            </motion.div>

            {/* Right: 3D Interactive Sentinel Canvas */}
            <motion.div 
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 1, delay: 0.2, ease: [0.16, 1, 0.3, 1] }}
              className="lg:col-span-5 relative flex items-center justify-center"
            >
              <Hero3DCanvas />
              
              {/* Interactive badge overlay */}
              <div className="absolute -bottom-2 sm:bottom-4 bg-white/90 dark:bg-slate-900/90 border border-slate-300 dark:border-cyan-glow/30 px-3.5 py-1.5 rounded-full text-[11px] font-mono text-accent-blue dark:text-cyan-bright backdrop-blur-lg flex items-center space-x-2 pointer-events-none shadow-md">
                <Sparkles className="w-3 h-3 text-accent-blue dark:text-cyan-bright animate-spin" style={{ animationDuration: '6s' }} />
                <span className="font-bold tracking-wider">INTERACTIVE CORE</span>
              </div>
            </motion.div>
          </div>

          {/* Scroll Down Indicator */}
          <div className="flex justify-center pt-8 sm:pt-14">
            <button 
              onClick={() => scrollToSection('problem-purpose')}
              className="text-slate-500 dark:text-slate-400 hover:text-accent-blue dark:hover:text-cyan-bright transition flex flex-col items-center space-y-1 text-xs font-mono"
            >
              <span>Scroll to discover</span>
              <ChevronDown className="w-4 h-4 animate-bounce" />
            </button>
          </div>
        </section>


        {/* ========================================================
            SECTION 2: PROBLEM AND PURPOSE (3 Key Pillars)
            ======================================================== */}
        <section id="problem-purpose" className="space-y-10 scroll-mt-20">
          <div className="text-center max-w-3xl mx-auto space-y-3">
            <div className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-full bg-red-100 dark:bg-red-950/60 border border-red-300 dark:border-red-500/40 text-red-700 dark:text-red-300 text-xs font-mono uppercase">
              <Flame className="w-3.5 h-3.5 text-red-500 dark:text-red-400" />
              <span>The Industry Blindspot</span>
            </div>
            <h2 className="text-3xl sm:text-4xl font-extrabold font-heading text-slate-900 dark:text-white">
              Why PRAHARI Exists
            </h2>
            <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed font-sans">
              In standard industrial reporting, 80% of serious injuries and fatalities (SIF) stem from precursors that were originally recorded as routine or low-severity observations because no injury occurred yet.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <TiltCard className="p-6 sm:p-8 space-y-4 border-l-4 border-l-red-500">
              <div className="w-12 h-12 rounded-xl bg-red-100 dark:bg-red-500/15 border border-red-300 dark:border-red-500/30 flex items-center justify-center text-red-600 dark:text-red-400">
                <AlertTriangle className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold font-heading text-slate-900 dark:text-white">
                1. The Heinrich Fallacy
              </h3>
              <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
                Traditional safety pyramids assume reducing minor cuts automatically reduces deaths. SIF research proves high-consequence energy exposures require a distinct, non-linear detection model.
              </p>
            </TiltCard>

            <TiltCard className="p-6 sm:p-8 space-y-4 border-l-4 border-l-amber-500">
              <div className="w-12 h-12 rounded-xl bg-amber-100 dark:bg-amber-500/15 border border-amber-300 dark:border-amber-500/30 flex items-center justify-center text-amber-600 dark:text-amber-400">
                <Eye className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold font-heading text-slate-900 dark:text-white">
                2. Disguised Low-Severity Logs
              </h3>
              <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
                A field technician logs "Contractor climbed scaffold without harness near separator tank" as 'Low Severity' because nobody fell. PRAHARI immediately flags this as a high-potential fatal precursor.
              </p>
            </TiltCard>

            <TiltCard className="p-6 sm:p-8 space-y-4 border-l-4 border-l-accent-blue dark:border-l-cyan-glow">
              <div className="w-12 h-12 rounded-xl bg-blue-100 dark:bg-cyan-glow/15 border border-blue-300 dark:border-cyan-glow/30 flex items-center justify-center text-accent-blue dark:text-cyan-bright">
                <BrainCircuit className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold font-heading text-slate-900 dark:text-white">
                3. Explainable Safety AI
              </h3>
              <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
                HSE officers cannot make life-critical calls on black-box predictions. PRAHARI highlights the exact words inside the observation that triggered the score, building total regulatory trust.
              </p>
            </TiltCard>
          </div>
        </section>


        {/* ========================================================
            SECTION 3: HOW IT WORKS (4-Step Interactive Timeline)
            ======================================================== */}
        <section className="space-y-12">
          <div className="text-center max-w-2xl mx-auto space-y-3">
            <span className="text-xs font-mono font-bold text-accent-blue dark:text-cyan-bright uppercase tracking-widest">
              End-to-End Workflow
            </span>
            <h2 className="text-3xl sm:text-4xl font-extrabold font-heading text-slate-900 dark:text-white">
              How PRAHARI Works
            </h2>
            <p className="text-sm text-slate-600 dark:text-slate-300 font-sans">
              From field observation to executive escalation in under 5 seconds.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 relative">
            {[
              {
                step: '01',
                title: 'Low-Friction Ingestion',
                desc: 'Field engineers submit observations via simple mobile-first forms with live 10-word guidance, or bulk CSV upload.',
                icon: FileCheck,
                badge: 'Form S3 & S7'
              },
              {
                step: '02',
                title: 'AI/NLP Precursor Scoring',
                desc: 'TF-IDF and calibrated ensemble models analyze high-energy terms (LOTO, line-of-fire, height, pressure).',
                icon: BrainCircuit,
                badge: 'FastAPI ML Engine'
              },
              {
                step: '03',
                title: 'Equal-Weight Triage',
                desc: 'Reporter severity and AI risk score sit side-by-side with equal weight. Disguised high risks rise to queue top.',
                icon: Activity,
                badge: 'Rule BR-2 & BR-5'
              },
              {
                step: '04',
                title: 'Audit & Escalation',
                desc: 'Officers review highlighted evidence, trigger mandatory RCA escalation protocols, backed by an immutable log.',
                icon: Shield,
                badge: 'Rule BR-3 & SEC-5'
              }
            ].map((item, idx) => {
              const Icon = item.icon;
              return (
                <div 
                  key={idx} 
                  className="p-6 rounded-2xl glass-panel border border-slate-200 dark:border-cyan-glow/20 space-y-4 hover:border-accent-blue dark:hover:border-cyan-glow/50 transition duration-300 group"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-2xl font-black font-mono text-accent-blue dark:text-cyan-bright/80 group-hover:dark:text-cyan-bright transition">
                      {item.step}
                    </span>
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-100 text-slate-700 dark:bg-blue-950/80 dark:text-blue-200 border border-slate-200 dark:border-blue-800">
                      {item.badge}
                    </span>
                  </div>

                  <div className="w-10 h-10 rounded-lg bg-blue-100 dark:bg-blue-900/40 border border-blue-200 dark:border-blue-600/40 flex items-center justify-center text-accent-blue dark:text-cyan-glow group-hover:scale-110 transition duration-300">
                    <Icon className="w-5 h-5" />
                  </div>

                  <h3 className="text-base font-bold font-heading text-slate-900 dark:text-white">
                    {item.title}
                  </h3>

                  <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed font-sans">
                    {item.desc}
                  </p>
                </div>
              );
            })}
          </div>
        </section>


        {/* ========================================================
            SECTION 4: FEATURES GRID (Interactive 3D Tilt Cards)
            ======================================================== */}
        <section className="space-y-12">
          <div className="text-center max-w-2xl mx-auto space-y-3">
            <span className="text-xs font-mono font-bold text-accent-blue uppercase tracking-widest">
              Enterprise Grade Capabilities
            </span>
            <h2 className="text-3xl sm:text-4xl font-extrabold font-heading text-slate-900 dark:text-white">
              Engineered for Critical Operations
            </h2>
            <p className="text-sm text-slate-600 dark:text-slate-300">
              Built strictly to Oil India Limited HSE guidelines and WCAG 2.1 AA accessibility standards.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[
              {
                title: 'Explainable Highlighted Evidence',
                desc: 'Never a black-box score. Every risk score is one click away from highlighted words directly inside the original text.',
                icon: Eye,
                color: 'text-amber-500 dark:text-amber-400'
              },
              {
                title: 'Strict Role-Scoped Navigation',
                desc: 'Reporters never see officer triage navigation; officers never see raw reporting forms. Enforced at the component level.',
                icon: Users,
                color: 'text-accent-blue dark:text-cyan-bright'
              },
              {
                title: 'Disguised High-Risk Guard',
                desc: 'Automatically surfaces dangerous observations that field personnel downplayed as Low because nobody got hurt.',
                icon: AlertTriangle,
                color: 'text-red-500 dark:text-red-400'
              },
              {
                title: 'WCAG 2.1 AA & Grayscale Support',
                desc: 'Risk is never conveyed by color alone. High ●, Medium ◐, Low ○, and Review ⚙ remain distinct in grayscale mode.',
                icon: CheckCircle2,
                color: 'text-emerald-600 dark:text-emerald-400'
              },
              {
                title: 'Immutable Regulatory Audit Trail',
                desc: 'Append-only chronological audit logging captures every state transition, actor ID, and timestamp for HSE compliance.',
                icon: Layers,
                color: 'text-blue-500 dark:text-blue-400'
              },
              {
                title: 'Bulk CSV Ingestion Engine',
                desc: 'Ingest and classify thousands of historical observations with client-side verification and downloadable error reports.',
                icon: ExternalLink,
                color: 'text-purple-500 dark:text-purple-400'
              }
            ].map((feat, i) => {
              const Icon = feat.icon;
              return (
                <TiltCard key={i} className="p-6 space-y-3.5">
                  <div className={`w-10 h-10 rounded-xl bg-slate-100 dark:bg-slate-900/90 border border-slate-200 dark:border-slate-700/60 flex items-center justify-center ${feat.color}`}>
                    <Icon className="w-5 h-5" />
                  </div>
                  <h3 className="text-base font-bold font-heading text-slate-900 dark:text-white">
                    {feat.title}
                  </h3>
                  <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed font-sans">
                    {feat.desc}
                  </p>
                </TiltCard>
              );
            })}
          </div>
        </section>


        {/* ========================================================
            SECTION 5: STATS OR IMPACT (Animated Counters)
            ======================================================== */}
        <section className="space-y-8">
          <div className="text-center max-w-xl mx-auto space-y-2">
            <span className="text-xs font-mono font-bold text-accent-blue dark:text-cyan-bright uppercase tracking-widest">
              Demonstrated Performance
            </span>
            <h2 className="text-3xl font-extrabold font-heading text-slate-900 dark:text-white">
              Impact &amp; Benchmarks
            </h2>
          </div>

          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
            <StatCounter
              endValue={26480}
              suffix="+"
              label="Observations Scored"
              sublabel="Across 8 OIL Installations"
            />
            <StatCounter
              endValue={94.8}
              suffix="%"
              decimals={1}
              label="Precursor Accuracy"
              sublabel="Validated against HSE records"
            />
            <StatCounter
              endValue={0}
              label="Fatalities Target"
              sublabel="KAVACH Zero-Harm Mission"
            />
            <StatCounter
              endValue={5}
              prefix="< "
              suffix="s"
              label="Real-time Latency"
              sublabel="Target PERF-1 compliance"
            />
          </div>
        </section>


        {/* ========================================================
            SECTION 6: FINAL CALL TO ACTION (Gradient Banner)
            ======================================================== */}
        <section className="rounded-3xl p-8 sm:p-12 bg-gradient-to-r from-primary-navy via-navy-deep to-accent-blue border border-cyan-glow/40 shadow-2xl relative overflow-hidden text-center space-y-6">
          <div 
            className="absolute -top-24 -left-24 w-72 h-72 bg-cyan-glow/20 rounded-full blur-3xl pointer-events-none"
            aria-hidden="true"
          />
          <div 
            className="absolute -bottom-24 -right-24 w-72 h-72 bg-blue-500/20 rounded-full blur-3xl pointer-events-none"
            aria-hidden="true"
          />

          <div className="max-w-2xl mx-auto space-y-3 relative z-10">
            <div className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-full bg-blue-950/80 border border-blue-400/40 text-blue-200 text-xs font-mono">
              <Shield className="w-3.5 h-3.5 text-cyan-bright" />
              <span>Ready for Operational Deployment</span>
            </div>
            <h2 className="text-3xl sm:text-4xl font-black font-heading text-white tracking-tight">
              Ready to Strengthen Oil India's Safety Shield?
            </h2>
            <p className="text-sm text-blue-100 font-sans leading-relaxed">
              Step directly into the PRAHARI triage queue or start reporting observations from your assigned field installation.
            </p>
          </div>

          <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-4 relative z-10">
            <button
              onClick={onGetStarted}
              className="btn-premium px-8 py-4 rounded-xl bg-white hover:bg-slate-100 text-primary-navy font-black text-sm flex items-center justify-center space-x-3 shadow-xl shadow-black/30 group cursor-pointer"
            >
              <span>Get Started Now</span>
              <ArrowRight className="w-4 h-4 transition-transform duration-300 group-hover:translate-x-1.5 text-primary-navy" />
            </button>

            <button
              onClick={() => scrollToSection('problem-purpose')}
              className="btn-premium px-6 py-4 rounded-xl bg-blue-950/80 hover:bg-blue-900 text-blue-200 border border-blue-400/30 font-semibold text-sm flex items-center justify-center space-x-2 cursor-pointer"
            >
              <Compass className="w-4 h-4 text-cyan-bright" />
              <span>Review Safety Framework</span>
            </button>
          </div>
        </section>

      </div>
    </div>
  );
}

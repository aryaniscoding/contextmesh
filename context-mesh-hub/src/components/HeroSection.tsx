import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";
import { ArrowRight, Github, ChevronDown, LogIn, Users, LayoutDashboard } from "lucide-react";
import { useState, useEffect, lazy, Suspense } from "react";
import { useNavigate } from "react-router-dom";
import { ContextFlowSVG, NetworkMeshSVG, DataPacketsSVG, RingOrbitsSVG } from "./svg/SectionSVGs";
import { useAuth } from "@/contexts/AuthContext";
import CreateTeamModal from "./CreateTeamModal";
import EnterTeamModal from "./EnterTeamModal";

const HeroDemo = lazy(() => import("./HeroDemo"));

const useTypewriter = (text: string, speed = 80, startDelay = 800) => {
  const [displayed, setDisplayed] = useState("");
  const [done, setDone] = useState(false);
  const [started, setStarted] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setStarted(true), startDelay);
    return () => clearTimeout(t);
  }, [startDelay]);

  useEffect(() => {
    if (!started) return;
    if (displayed.length < text.length) {
      const t = setTimeout(() => setDisplayed(text.slice(0, displayed.length + 1)), speed);
      return () => clearTimeout(t);
    } else {
      const t = setTimeout(() => setDone(true), 600);
      return () => clearTimeout(t);
    }
  }, [displayed, text, speed, started]);

  return { displayed, done, started };
};

const spring = { type: "spring" as const, stiffness: 100, damping: 15 };

const HeroSection = () => {
  const { displayed, done, started } = useTypewriter("REMEMBERS", 80, 1200);
  const { user } = useAuth();
  const navigate = useNavigate();
  const [createTeamOpen, setCreateTeamOpen] = useState(false);
  const [enterTeamOpen, setEnterTeamOpen] = useState(false);

  const handleCreateTeam = () => {
    if (!user) { navigate("/login"); return; }
    setCreateTeamOpen(true);
  };

  const handleEnterTeam = () => {
    if (!user) { navigate("/login"); return; }
    setEnterTeamOpen(true);
  };

  return (
    <section className="relative min-h-screen flex items-center pt-24 pb-16 overflow-hidden">
      {/* Orbs — static gradient, no animation */}
      <div className="glow-orb w-[800px] h-[800px] top-[-200px] left-1/2 -translate-x-1/2"
        style={{ background: "radial-gradient(circle, hsl(263 70% 50% / 0.35) 0%, hsl(239 84% 67% / 0.15) 40%, transparent 70%)" }} />
      <div className="glow-orb w-[400px] h-[400px] bottom-[10%] right-[5%]"
        style={{ background: "radial-gradient(circle, hsl(187 94% 43% / 0.2) 0%, transparent 70%)" }} />

      {/* Hero SVG decorations */}
      <ContextFlowSVG />
      <NetworkMeshSVG />
      <DataPacketsSVG />
      <RingOrbitsSVG />

      <div className="container mx-auto px-4 lg:px-8 relative z-10">
        <div className="flex flex-col lg:flex-row items-center gap-8 lg:gap-12">
          <div className="max-w-3xl lg:max-w-[50%] lg:flex-shrink-0">
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.2, ...spring }}
          >
            <span className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-mono text-muted-foreground border border-[hsl(0_0%_100%/0.08)] bg-[hsl(0_0%_100%/0.03)] tracking-widest uppercase">
              [ AI Infrastructure · 2025 ]
            </span>
          </motion.div>

          <div className="mt-8 space-y-1">
            <motion.h1
              initial={{ opacity: 0, x: -120 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.9, delay: 0.4, ...spring }}
              className="font-display font-extrabold text-[44px] md:text-[64px] lg:text-[76px] leading-[1.05] tracking-tight text-foreground"
            >
              YOUR TEAM'S AI
            </motion.h1>
            <motion.h1
              initial={{ opacity: 0, x: 120 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.9, delay: 0.7, ...spring }}
              className="font-display font-extrabold text-[44px] md:text-[64px] lg:text-[76px] leading-[1.05] tracking-tight"
            >
              <span className="text-gradient shimmer-text hero-stroke-text">
                {started ? displayed : ""}
                {!done && started && <span className="animate-blink text-foreground">|</span>}
              </span>
            </motion.h1>
            <motion.h1
              initial={{ opacity: 0, y: 80 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.9, delay: 0.9, ...spring }}
              className="font-display font-extrabold text-[44px] md:text-[64px] lg:text-[76px] leading-[1.05] tracking-tight text-foreground"
            >
              EVERYTHING.
            </motion.h1>
          </div>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 1.0 }}
            className="mt-6 text-muted-foreground text-base md:text-lg max-w-[540px] leading-relaxed"
          >
            ContextMesh captures your team's full AI chat history —
            every decision, every line of code, every reasoning trail.
            Load any teammate's context into your AI with one click
            and continue exactly where they left off.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5, delay: 1.2, ...spring }}
            className="mt-8 flex flex-col sm:flex-row gap-3"
          >
            <Button size="lg" className="shimmer-btn gradient-btn border-0 text-primary-foreground rounded-full px-8 h-12 text-sm font-semibold gap-2 relative overflow-hidden">
              Get Early Access <ArrowRight className="h-4 w-4" />
            </Button>
            <a href="https://github.com" target="_blank" rel="noreferrer">
              <Button size="lg" variant="outline" className="shimmer-btn glass-card rounded-full px-8 h-12 text-sm font-semibold gap-2 w-full sm:w-auto hover:border-accent/40 transition-all duration-300 relative overflow-hidden">
                <Github className="h-4 w-4" /> View on GitHub
              </Button>
            </a>
          </motion.div>

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5, delay: 1.3 }}
            className="mt-8 flex items-center gap-3"
          >
            <div className="flex -space-x-2">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="w-8 h-8 rounded-full border-2 border-background"
                  style={{ background: `linear-gradient(135deg, hsl(${239 + i * 10} 70% ${50 + i * 5}%), hsl(${260 + i * 10} 60% ${40 + i * 5}%))` }} />
              ))}
            </div>
            <span className="text-sm text-muted-foreground">Joined by 200+ engineers from AI-first teams</span>
          </motion.div>

          {/* Team action buttons */}
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 1.5 }}
            className="mt-6 flex flex-col sm:flex-row gap-3"
          >
            {user ? (
              // Logged-in: direct access to teams
              <>
                <Button
                  size="sm"
                  onClick={() => navigate("/teams")}
                  className="gradient-btn border-0 text-primary-foreground rounded-full px-6 h-10 text-sm shimmer-btn relative overflow-hidden gap-2"
                >
                  <LayoutDashboard className="h-4 w-4" /> Go to My Teams
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={handleEnterTeam}
                  className="rounded-full px-6 h-10 text-sm border-[hsl(0_0%_100%/0.12)] text-foreground hover:bg-[hsl(0_0%_100%/0.06)] hover:border-accent/40 transition-all duration-300 gap-2"
                >
                  <Users className="h-4 w-4" /> Join a Team
                </Button>
              </>
            ) : (
              // Logged-out: sign up / log in
              <>
                <Button
                  size="sm"
                  onClick={() => navigate("/signup")}
                  className="gradient-btn border-0 text-primary-foreground rounded-full px-6 h-10 text-sm shimmer-btn relative overflow-hidden gap-2"
                >
                  Get Started <ArrowRight className="h-4 w-4" />
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => navigate("/login")}
                  className="rounded-full px-6 h-10 text-sm border-[hsl(0_0%_100%/0.12)] text-foreground hover:bg-[hsl(0_0%_100%/0.06)] hover:border-accent/40 transition-all duration-300 gap-2"
                >
                  <LogIn className="h-4 w-4" /> Log In
                </Button>
              </>
            )}
          </motion.div>
          {!user && (
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.5, delay: 1.7 }}
              className="mt-3 text-xs text-muted-foreground/50"
            >
              Already have a passcode? <button onClick={() => navigate("/login")} className="text-violet-400 hover:text-violet-300 underline underline-offset-2 transition-colors">Log in to join your team →</button>
            </motion.p>
          )}
          </div>

          {/* Right column — Split Brain Visual */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.8, delay: 1.4 }}
            className="hidden lg:flex flex-1 items-center justify-center"
          >
            <Suspense fallback={<div className="w-[580px] h-[520px]" />}>
              <HeroDemo />
            </Suspense>
          </motion.div>
        </div>

        {/* Scroll indicator */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 2, duration: 0.5 }}
          className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2"
        >
          <span className="text-[10px] text-muted-foreground/50 uppercase tracking-[0.2em] font-mono">Scroll to explore</span>
          <motion.div animate={{ y: [0, 6, 0] }} transition={{ duration: 1.5, repeat: Infinity }}>
            <ChevronDown className="h-4 w-4 text-muted-foreground/30" />
          </motion.div>
        </motion.div>
      </div>

      {/* Modals */}
      <CreateTeamModal open={createTeamOpen} onOpenChange={setCreateTeamOpen} />
      <EnterTeamModal open={enterTeamOpen} onOpenChange={setEnterTeamOpen} />
    </section>
  );
};

export default HeroSection;

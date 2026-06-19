import { Button } from "@/components/ui/button";
import { motion, useScroll, useTransform } from "framer-motion";
import { ArrowRight, Github } from "lucide-react";
import { useRef, useState, useEffect } from "react";
import { InfinityLoopSVG } from "./svg/SectionSVGs";

const floatingPills = [
  { text: "✓ Full history captured", delay: 0, duration: 7 },
  { text: "✓ Handoff generated", delay: 2.5, duration: 8 },
  { text: "✓ 0 knowledge lost", delay: 5, duration: 6.5 },
];

const TypewriterTag = () => {
  const text = "No knowledge left behind.";
  const [displayed, setDisplayed] = useState("");
  const [started, setStarted] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const obs = new IntersectionObserver(
      ([e]) => { if (e.isIntersecting) { setStarted(true); obs.disconnect(); } },
      { threshold: 0.5 }
    );
    if (ref.current) obs.observe(ref.current);
    return () => obs.disconnect();
  }, []);

  useEffect(() => {
    if (!started) return;
    if (displayed.length < text.length) {
      const t = setTimeout(() => setDisplayed(text.slice(0, displayed.length + 1)), 60);
      return () => clearTimeout(t);
    }
  }, [displayed, started]);

  return (
    <div ref={ref} className="mt-6 font-mono text-sm text-muted-foreground/60">
      {displayed}<span className="animate-blink">|</span>
    </div>
  );
};

const CTASection = () => {
  const sectionRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: sectionRef,
    offset: ["start end", "end start"],
  });

  const orb1Y = useTransform(scrollYProgress, [0, 1], [100, -100]);
  const orb2Y = useTransform(scrollYProgress, [0, 1], [60, -60]);
  const orb3Y = useTransform(scrollYProgress, [0, 1], [140, -140]);

  return (
    <section ref={sectionRef} className="py-[160px] relative overflow-hidden">
      <InfinityLoopSVG />
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <motion.div
          className="absolute w-[600px] h-[400px] top-1/2 left-1/3 -translate-x-1/2 -translate-y-1/2 rounded-full opacity-20"
          style={{
            background: "radial-gradient(ellipse, hsl(263 70% 50%) 0%, transparent 70%)",
            y: orb1Y,
          }}
        />
        <motion.div
          className="absolute w-[500px] h-[350px] top-1/2 left-2/3 -translate-x-1/2 -translate-y-1/2 rounded-full opacity-15"
          style={{
            background: "radial-gradient(ellipse, hsl(239 84% 67%) 0%, transparent 70%)",
            y: orb2Y,
          }}
        />
        <motion.div
          className="absolute w-[400px] h-[300px] top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full opacity-15"
          style={{
            background: "radial-gradient(ellipse, hsl(187 94% 43%) 0%, transparent 70%)",
            y: orb3Y,
          }}
        />
      </div>

      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        {floatingPills.map((pill, i) => (
          <div
            key={i}
            className="absolute text-[10px] px-3 py-1 rounded-full glass-card text-muted-foreground/60"
            style={{
              left: `${20 + i * 30}%`,
              bottom: "20%",
              animation: `float-pill-${i + 1} ${pill.duration}s ease-in-out infinite`,
              animationDelay: `${pill.delay}s`,
            }}
          >
            {pill.text}
          </div>
        ))}
      </div>

      <div className="container mx-auto px-4 lg:px-8 relative z-10">
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center max-w-3xl mx-auto"
        >
          <motion.h2
            className="font-display text-4xl md:text-5xl lg:text-6xl font-extrabold text-foreground tracking-tight leading-tight"
          >
            {"The Future of ".split(" ").map((word, i) => (
              <motion.span
                key={i}
                initial={{ opacity: 0, rotateX: 90 }}
                whileInView={{ opacity: 1, rotateX: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1, duration: 0.5 }}
                className="inline-block mr-[0.3em]"
                style={{ perspective: "600px" }}
              >
                {word}
              </motion.span>
            ))}
            <span className="text-gradient">AI Teams</span>
          </motion.h2>
          <p className="mt-4 text-xl text-muted-foreground">
            Is one where knowledge compounds instead of disappearing.
          </p>
          <p className="mt-4 text-muted-foreground max-w-xl mx-auto leading-relaxed">
            ContextMesh captures every AI session in full. Load any teammate's
            context with one click. Continue exactly where they left off.
            No knowledge ever starts from zero again.
          </p>

          <TypewriterTag />

          <div className="mt-10 flex flex-col sm:flex-row gap-3 justify-center">
            <Button size="lg" className="shimmer-btn gradient-btn border-0 text-primary-foreground rounded-full px-8 h-12 text-sm font-semibold gap-2 relative overflow-hidden">
              Get Early Access <ArrowRight className="h-4 w-4" />
            </Button>
            <a href="https://github.com" target="_blank" rel="noreferrer">
              <Button size="lg" variant="outline" className="shimmer-btn glass-card rounded-full px-8 h-12 text-sm font-semibold gap-2 w-full sm:w-auto hover:border-accent/40 transition-all duration-300 relative overflow-hidden">
                <Github className="h-4 w-4" /> View on GitHub
              </Button>
            </a>
          </div>

          <div className="mt-8 flex flex-wrap justify-center gap-3">
            {["Open Source", "MIT License", "Self-Hostable", "Cloud Hosted", "MCP Compatible"].map((tag) => (
              <span key={tag} className="text-xs px-3 py-1.5 rounded-full border border-[hsl(0_0%_100%/0.08)] bg-[hsl(0_0%_100%/0.03)] text-muted-foreground">
                {tag}
              </span>
            ))}
          </div>
        </motion.div>
      </div>
    </section>
  );
};

export default CTASection;

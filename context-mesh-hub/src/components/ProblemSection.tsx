import { motion, useInView, useScroll, useTransform } from "framer-motion";
import { TrendingDown, Clock, MousePointerClick, X, Check } from "lucide-react";
import { BreakingChainSVG } from "./svg/SectionSVGs";
import { useRef, useEffect, useState } from "react";
import { useIsMobile } from "@/hooks/use-mobile";

const stats = [
  { number: "100%", label: "of AI chat history is lost when a session ends, if not captured", icon: TrendingDown, countTo: 100, suffix: "%", prefix: "" },
  { number: "3–4", label: "average weeks to onboard a new engineer when AI context isn't preserved", icon: Clock, countTo: 4, suffix: " weeks", prefix: "3–" },
  { number: "1", label: "click to load any teammate's full AI context into your own session with ContextMesh", icon: MousePointerClick, countTo: 1, suffix: " Click", isPositive: true, prefix: "" },
];

const before = [
  "Every AI chat session disappears when closed",
  "Decisions made in AI chat are never captured",
  "Someone leaves → months of AI reasoning gone",
  "Handoffs take days of manual catch-up",
  "No way to load a teammate's full AI context",
];

const after = [
  "Every AI session auto-captured in full — raw history",
  "Decisions, code, and reasoning preserved automatically",
  "Team member leaves → one-click handoff snapshot",
  "New member loads full context and continues instantly",
  "Load any teammate's context into your AI with one click",
];

const CountUp = ({ to, suffix = "", prefix = "", duration = 1.5 }: { to: number; suffix?: string; prefix?: string; duration?: number }) => {
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true });
  const [count, setCount] = useState(0);

  useEffect(() => {
    if (!inView || to === 0) return;
    const startTime = performance.now();
    const step = (time: number) => {
      const elapsed = time - startTime;
      const progress = Math.min(elapsed / (duration * 1000), 1);
      const eased = 1 - Math.pow(1 - progress, 4);
      setCount(Math.round(eased * to));
      if (progress < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  }, [inView, to, duration]);

  return <span ref={ref}>{inView ? `${prefix}${to === 0 ? "0" : count}${suffix}` : `${prefix}0${suffix}`}</span>;
};

const ProblemSection = () => {
  const sectionRef = useRef<HTMLDivElement>(null);
  const isMobile = useIsMobile();
  const { scrollYProgress } = useScroll({
    target: sectionRef,
    offset: ["start end", "end start"],
  });

  const titleY = useTransform(scrollYProgress, [0, 0.3], [60, 0]);
  const titleOpacity = useTransform(scrollYProgress, [0, 0.2], [0, 1]);

  // Mobile: simple opacity-only animations
  const mobileVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1 },
  };

  return (
    <section id="problem" ref={sectionRef} className="py-[160px] relative overflow-hidden">
      {/* Problem section glow */}
      <div aria-hidden className="absolute pointer-events-none" style={{ zIndex: 0, top: '50%', left: '50%', transform: 'translate(-50%, -50%)', width: '100%', height: '100%', background: 'radial-gradient(ellipse 800px 400px at 50% 50%, rgba(124,58,237,0.06) 0%, transparent 100%)' }} />
      <BreakingChainSVG />
      {!isMobile && (
        <motion.div
          className="absolute inset-0 pointer-events-none"
          style={{
            background: "radial-gradient(ellipse at center, hsl(0 84% 40% / 0.08) 0%, transparent 70%)",
            opacity: useTransform(scrollYProgress, [0, 0.3, 0.7, 1], [0, 0.15, 0.15, 0]),
          }}
        />
      )}

      <div className="container mx-auto px-4 lg:px-8 relative z-10">
        {isMobile ? (
          <div>
            <h2 className="font-display text-3xl font-bold text-foreground tracking-tight text-center">
              The Hidden Cost of <span className="text-gradient">AI Silos</span>
            </h2>
            <p className="mt-4 text-muted-foreground text-lg max-w-2xl mx-auto leading-relaxed text-center">
              When your team uses AI individually, every chat session vanishes when closed.
            </p>
          </div>
        ) : (
          <motion.div style={{ y: titleY, opacity: titleOpacity }}>
            <h2 className="font-display text-3xl md:text-5xl lg:text-6xl font-bold text-foreground tracking-tight text-center">
              The Hidden Cost of <span className="text-gradient">AI Silos</span>
            </h2>
            <p className="mt-4 text-muted-foreground text-lg max-w-2xl mx-auto leading-relaxed text-center">
              When your team uses AI individually, every chat session vanishes when closed. Full reasoning trails lost. Zero way to load a teammate's context. Onboarding takes weeks instead of hours.
            </p>
          </motion.div>
        )}

        <div className="grid md:grid-cols-3 gap-6 mt-16">
          {stats.map((s, i) => (
            <motion.div
              key={i}
              initial={isMobile ? { opacity: 0 } : { opacity: 0, y: 50 }}
              whileInView={isMobile ? { opacity: 1 } : { opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: isMobile ? 0.3 : 0.6, delay: i * 0.15 }}
              className={`glass-card-hover card-glow rounded-2xl p-8 relative overflow-hidden group ${s.isPositive ? "border-accent/20" : ""}`}
              onMouseMove={isMobile ? undefined : (e) => {
                const rect = e.currentTarget.getBoundingClientRect();
                e.currentTarget.style.setProperty("--mouse-x", `${e.clientX - rect.left}px`);
                e.currentTarget.style.setProperty("--mouse-y", `${e.clientY - rect.top}px`);
              }}
            >
              <s.icon className={`h-5 w-5 absolute top-6 right-6 transition-colors duration-300 ${s.isPositive ? "text-accent/50 group-hover:text-accent" : "text-muted-foreground/50 group-hover:text-accent"}`} />
              <p className="text-4xl md:text-5xl font-display font-extrabold text-gradient mb-3">
                <CountUp to={s.countTo} suffix={s.suffix} prefix={s.prefix || ""} />
              </p>
              <p className="text-sm text-muted-foreground leading-relaxed">{s.label}</p>
            </motion.div>
          ))}
        </div>

        <div className="grid md:grid-cols-2 gap-6 mt-12">
          <motion.div
            initial={isMobile ? { opacity: 0 } : { opacity: 0, x: -60 }}
            whileInView={isMobile ? { opacity: 1 } : { opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: isMobile ? 0.3 : 0.7 }}
            className="glass-card rounded-2xl p-8"
          >
            <h3 className="font-display font-bold text-lg text-foreground mb-6">Before ContextMesh</h3>
            <ul className="space-y-3">
              {before.map((item, i) => (
                <motion.li
                  key={i}
                  initial={isMobile ? { opacity: 0 } : { opacity: 0, x: -30 }}
                  whileInView={isMobile ? { opacity: 1 } : { opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: 0.4 + i * 0.12, duration: isMobile ? 0.3 : 0.4 }}
                  className="flex items-start gap-3 text-sm text-muted-foreground"
                >
                  <X className="h-4 w-4 text-destructive mt-0.5 flex-shrink-0" />
                  {item}
                </motion.li>
              ))}
            </ul>
          </motion.div>
          <motion.div
            initial={isMobile ? { opacity: 0 } : { opacity: 0, x: 60 }}
            whileInView={isMobile ? { opacity: 1 } : { opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: isMobile ? 0.3 : 0.7 }}
            className="glass-card rounded-2xl p-8 border-accent/20"
          >
            <h3 className="font-display font-bold text-lg text-foreground mb-6">After ContextMesh</h3>
            <ul className="space-y-3">
              {after.map((item, i) => (
                <motion.li
                  key={i}
                  initial={isMobile ? { opacity: 0 } : { opacity: 0, x: 30 }}
                  whileInView={isMobile ? { opacity: 1 } : { opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: 0.4 + i * 0.12, duration: isMobile ? 0.3 : 0.4 }}
                  className="flex items-start gap-3 text-sm text-muted-foreground"
                >
                  <Check className="h-4 w-4 text-accent mt-0.5 flex-shrink-0" />
                  {item}
                </motion.li>
              ))}
            </ul>
          </motion.div>
        </div>

        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mt-16"
        >
          <p className="text-xl font-display font-bold text-gradient">There is a better way →</p>
        </motion.div>
      </div>
    </section>
  );
};

export default ProblemSection;

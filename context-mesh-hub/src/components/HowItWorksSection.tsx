import { motion, useScroll, useTransform, AnimatePresence } from "framer-motion";
import SectionHeading from "./SectionHeading";
import { useRef, useState, useEffect, useCallback } from "react";
import { NeuralDendriteSVG } from "./svg/SectionSVGs";

const FlowDiagram = () => {
  const ref = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start end", "center center"],
  });

  const lineProgress = useTransform(scrollYProgress, [0.2, 0.8], [0, 1]);

  return (
    <motion.div ref={ref} className="mb-16 relative">
      <motion.p
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        viewport={{ once: true }}
        transition={{ duration: 0.6 }}
        className="text-center text-xs font-mono text-muted-foreground/40 uppercase tracking-[0.3em] mb-8"
      >
        Follow the context
      </motion.p>

      <svg viewBox="0 0 800 220" className="w-full max-w-3xl mx-auto" fill="none">
        {[
          { x: 80, y: 40, label: "Person A", delay: 0.2 },
          { x: 80, y: 110, label: "Person B", delay: 0.35 },
          { x: 80, y: 180, label: "Person C", delay: 0.5 },
        ].map((n, i) => (
          <g key={i} className="animate-node-breathe">
            <circle cx={n.x} cy={n.y} r="28" fill="hsl(240 12% 8% / 0.8)" stroke="hsl(239 84% 67% / 0.4)" strokeWidth="1.5" />
            <text x={n.x} y={n.y + 4} textAnchor="middle" fill="hsl(0 0% 70%)" fontSize="10" fontFamily="Inter">{n.label}</text>
            <path
              d={`M${n.x + 28},${n.y} Q200,${(n.y + 110) / 2} 320,110`}
              stroke="hsl(239 84% 67% / 0.25)" strokeWidth="1" strokeDasharray="6 4" className="animate-dash" fill="none"
            />
            <circle r="3" fill="hsl(263 70% 60%)">
              <animateMotion dur={`${2.5 + i * 0.3}s`} repeatCount="indefinite" path={`M${n.x + 28},${n.y} Q200,${(n.y + 110) / 2} 320,110`} />
              <animate attributeName="opacity" values="1;0.3;1" dur={`${2.5 + i * 0.3}s`} repeatCount="indefinite" />
            </circle>
          </g>
        ))}

        <g>
          <rect x="320" y="82" width="130" height="56" rx="12"
            fill="hsl(240 12% 8% / 0.8)" stroke="hsl(263 70% 60% / 0.5)" strokeWidth="1.5" />
          <text x="385" y="107" textAnchor="middle" fill="hsl(0 0% 90%)" fontSize="10" fontWeight="600" fontFamily="Plus Jakarta Sans">Context</text>
          <text x="385" y="123" textAnchor="middle" fill="hsl(0 0% 90%)" fontSize="10" fontWeight="600" fontFamily="Plus Jakarta Sans">Aggregator</text>
          <circle cx="385" cy="110" r="45" stroke="hsl(263 70% 60% / 0.2)" strokeWidth="1" fill="none"
            strokeDasharray="8 6" className="animate-rotate-ring" style={{ transformOrigin: "385px 110px" }} />
          <circle cx="385" cy="110" r="42" stroke="hsl(263 70% 60% / 0.1)" strokeWidth="1" fill="none" className="animate-subtle-pulse" />
        </g>

        <path d="M450,110 L540,110" stroke="hsl(263 70% 60% / 0.3)" strokeWidth="1" strokeDasharray="6 4" className="animate-dash" />
        <circle r="3" fill="hsl(239 84% 67%)">
          <animateMotion dur="2s" repeatCount="indefinite" path="M450,110 L540,110" />
          <animate attributeName="opacity" values="1;0.3;1" dur="2s" repeatCount="indefinite" />
        </circle>

        <g className="animate-node-breathe">
          <rect x="540" y="82" width="130" height="56" rx="12"
            fill="hsl(240 12% 8% / 0.8)" stroke="hsl(239 84% 67% / 0.5)" strokeWidth="1.5" />
          <text x="605" y="107" textAnchor="middle" fill="hsl(0 0% 90%)" fontSize="10" fontWeight="600" fontFamily="Plus Jakarta Sans">Master</text>
          <text x="605" y="123" textAnchor="middle" fill="hsl(0 0% 90%)" fontSize="10" fontWeight="600" fontFamily="Plus Jakarta Sans">Context</text>
        </g>

        {[40, 110, 180].map((y, i) => (
          <g key={i}>
            <path d={`M670,110 Q700,${(110 + y) / 2} 720,${y}`}
              stroke="hsl(239 84% 67% / 0.2)" strokeWidth="1" strokeDasharray="6 4" className="animate-dash" fill="none" />
            <circle r="3" fill="hsl(239 84% 67%)">
              <animateMotion dur={`${2.2 + i * 0.2}s`} repeatCount="indefinite" path={`M670,110 Q700,${(110 + y) / 2} 720,${y}`} />
              <animate attributeName="opacity" values="1;0.3;1" dur={`${2.2 + i * 0.2}s`} repeatCount="indefinite" />
            </circle>
          </g>
        ))}

        {[
          { x: 740, y: 40, label: "A's AI" },
          { x: 740, y: 110, label: "B's AI" },
          { x: 740, y: 180, label: "C's AI" },
        ].map((n, i) => (
          <g key={i} className="animate-node-breathe">
            <circle cx={n.x} cy={n.y} r="28" fill="hsl(240 12% 8% / 0.8)" stroke="hsl(263 70% 60% / 0.4)" strokeWidth="1.5" />
            <text x={n.x} y={n.y + 4} textAnchor="middle" fill="hsl(0 0% 70%)" fontSize="10" fontFamily="Inter">{n.label}</text>
          </g>
        ))}
      </svg>
    </motion.div>
  );
};

const stepColors = [
  { accent: '#a78bfa', gradient: 'linear-gradient(135deg, #7c3aed, #6366f1)' },
  { accent: '#818cf8', gradient: 'linear-gradient(135deg, #6366f1, #4f46e5)' },
  { accent: '#06b6d4', gradient: 'linear-gradient(135deg, #0891b2, #0e7490)' },
  { accent: '#fbbf24', gradient: 'linear-gradient(135deg, #d97706, #b45309)' },
];

const tabs = [
  {
    value: "capture",
    icon: "🎙",
    label: "Capture",
    subtitle: "Auto-record every session",
    title: "Every session. Every message. Automatically.",
    body: "ContextMesh runs as an MCP plugin inside your AI tool. It captures the full raw chat history of every session — not just summaries. Every question asked, every decision made, every line of code discussed. All stored privately per person. Zero manual input.",
    code: `{
  "session_id": "ctx_8f2a",
  "member": "arjun@team.dev",
  "timestamp": "2025-03-08T14:32:00Z",
  "messages": 47,
  "tokens": 1248,
  "raw_history": "CAPTURED_FULL",
  "decisions": ["Use PKCE flow for mobile"],
  "files_modified": [
    "auth/middleware.ts",
    "config/oauth.ts"
  ],
  "open_questions": ["Rate limiting strategy TBD"]
}`,
  },
  {
    value: "synthesize",
    icon: "🧠",
    label: "Synthesize",
    subtitle: "Build the shared brain",
    title: "One shared brain for the whole team.",
    body: "An LLM engine reads all individual context stores and builds a Master Context — a living team knowledge base of decisions, ownership, dependencies, and open questions. Auto-updated continuously. Anyone can mark sessions private to exclude them.",
    code: `{
  "master_context": "auth_module",
  "contributors": ["arjun", "priya"],
  "synthesized": {
    "architecture": "OAuth2 + PKCE, RSA-256",
    "status": "Implemented, pending review",
    "dependencies": ["rate-limiter", "token-store"],
    "conflicts": []
  },
  "private_sessions_excluded": 3,
  "last_synthesized": "2025-03-08T15:00:00Z"
}`,
  },
  {
    value: "load",
    icon: "⚡",
    label: "Load",
    subtitle: "Instant context transfer",
    title: "One click. Full context. Instant.",
    body: "Click 'Load Context' on any teammate inside your AI tool. Their full chat history, code context, and decisions load directly into your AI session. You can answer questions about their work, continue their code, and pick up exactly where they stopped — in minutes.",
    code: `> @contextmesh load context:priya

Loading Priya's full context...
████████████████████████ 100%

✓ 127 chat sessions loaded
✓ 34 decisions synced
✓ 23 files in context
✓ 6 open questions flagged
✓ Ready — continue where Priya left off`,
  },
  {
    value: "handoff",
    icon: "📦",
    label: "Handoff",
    subtitle: "Zero-loss knowledge transfer",
    title: "People leave. Knowledge doesn't.",
    body: "When someone leaves or transfers work, ContextMesh auto-generates a Handoff Snapshot from their full context store. Their replacement's AI is initialized with everything — their reasoning, their code, their open questions — from day one.",
    code: `{
  "handoff_snapshot": {
    "from": "rahul@team.dev",
    "to": "sneha@team.dev",
    "module": "auth_module",
    "chat_sessions": 89,
    "decisions_made": 18,
    "open_items": 3,
    "ai_initialized": true,
    "knowledge_gaps": 0,
    "generated": "2025-03-08T09:00:00Z"
  }
}`,
  },
];

// --- Visual blocks per step ---

const CaptureVisual = () => {
  const syntaxHighlight = (code: string) => {
    return code.split('\n').map((line, i) => {
      const highlighted = line
        .replace(/"([^"]+)":/g, '<span style="color:#a78bfa">"$1"</span>:')
        .replace(/: "([^"]+)"/g, ': <span style="color:#34d399">"$1"</span>')
        .replace(/: (\d+)/g, ': <span style="color:#fbbf24">$1</span>')
        .replace(/[\[\]{}]/g, (m) => `<span style="color:rgba(148,163,184,0.5)">${m}</span>`);
      return <div key={i} dangerouslySetInnerHTML={{ __html: highlighted }} />;
    });
  };

  return (
    <div className="rounded-xl overflow-hidden" style={{
      boxShadow: '0 0 0 1px rgba(124,58,237,0.2), 0 32px 80px rgba(0,0,0,0.6)',
    }}>
      <div className="flex items-center gap-2 px-4 py-3" style={{ borderBottom: '1px solid rgba(255,255,255,0.06)', background: 'rgba(255,255,255,0.02)' }}>
        <div className="w-2.5 h-2.5 rounded-full bg-[hsl(0_84%_60%/0.4)]" />
        <div className="w-2.5 h-2.5 rounded-full bg-[hsl(45_84%_60%/0.4)]" />
        <div className="w-2.5 h-2.5 rounded-full bg-[hsl(120_84%_40%/0.4)]" />
        <span className="ml-2 text-[11px] text-muted-foreground" style={{ fontFamily: "'JetBrains Mono', monospace" }}>context.json</span>
      </div>
      <pre className="p-5 text-xs text-muted-foreground overflow-x-auto leading-relaxed" style={{ fontFamily: "'JetBrains Mono', monospace", background: 'rgba(0,0,0,0.3)' }}>
        <code>{syntaxHighlight(tabs[0].code)}<span className="animate-blink">█</span></code>
      </pre>
    </div>
  );
};

const SynthesizeVisual = () => {
  const nodes = [
    { x: 60, y: 60, label: "Priya", color: "#a78bfa" },
    { x: 60, y: 140, label: "Alex", color: "#818cf8" },
    { x: 180, y: 100, label: "MASTER", color: "#fff", isCenter: true },
    { x: 300, y: 80, label: "Sam", color: "#34d399" },
  ];

  return (
    <div className="flex justify-center py-4">
      <svg viewBox="0 0 360 200" className="w-full max-w-[360px]" fill="none">
        {/* Lines */}
        {[0, 1, 3].map((i) => (
          <g key={i}>
            <line x1={nodes[i].x} y1={nodes[i].y} x2={nodes[2].x} y2={nodes[2].y}
              stroke="rgba(124,58,237,0.4)" strokeWidth="1" strokeDasharray="6 4" />
            <circle r="3" fill="#a78bfa">
              <animateMotion dur={`${2 + i * 0.3}s`} repeatCount="indefinite"
                path={`M${nodes[i].x},${nodes[i].y} L${nodes[2].x},${nodes[2].y}`} />
              <animate attributeName="opacity" values="1;0.3;1" dur={`${2 + i * 0.3}s`} repeatCount="indefinite" />
            </circle>
          </g>
        ))}
        {/* Nodes */}
        {nodes.map((n, i) => (
          <g key={i}>
            <circle cx={n.x} cy={n.y} r={n.isCenter ? 28 : 22}
              fill="hsl(240 12% 8% / 0.9)"
              stroke={n.isCenter ? "rgba(124,58,237,0.6)" : "rgba(124,58,237,0.3)"}
              strokeWidth={n.isCenter ? 2 : 1.5}
            />
            {n.isCenter && (
              <circle cx={n.x} cy={n.y} r="34" stroke="rgba(124,58,237,0.15)" strokeWidth="1" fill="none"
                strokeDasharray="6 4" className="animate-rotate-ring" style={{ transformOrigin: `${n.x}px ${n.y}px` }} />
            )}
            <text x={n.x} y={n.y + 4} textAnchor="middle" fill={n.color} fontSize={n.isCenter ? 9 : 10} fontWeight={n.isCenter ? 700 : 500} fontFamily="Inter">
              {n.label}
            </text>
          </g>
        ))}
      </svg>
    </div>
  );
};

const LoadVisual = () => (
  <div className="flex items-center gap-4">
    {/* Empty window */}
    <div className="flex-1 rounded-xl overflow-hidden" style={{ background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(255,255,255,0.06)' }}>
      <div className="px-3 py-2" style={{ borderBottom: '1px solid rgba(255,255,255,0.05)', fontFamily: "'JetBrains Mono', monospace", fontSize: 9, color: 'rgba(148,163,184,0.4)' }}>YOUR AI</div>
      <div className="p-4 flex items-center justify-center" style={{ minHeight: 100 }}>
        <span className="text-muted-foreground/30 text-xs" style={{ fontFamily: "'JetBrains Mono', monospace" }}>No context loaded</span>
      </div>
    </div>
    {/* Lightning */}
    <div className="flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center text-lg animate-subtle-pulse" style={{
      background: 'rgba(6,182,212,0.15)', boxShadow: '0 0 20px rgba(6,182,212,0.3)',
    }}>⚡</div>
    {/* Loaded window */}
    <div className="flex-1 rounded-xl overflow-hidden" style={{ background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(52,211,153,0.3)' }}>
      <div className="px-3 py-2 flex items-center justify-between" style={{ background: 'rgba(16,185,129,0.1)', borderBottom: '1px solid rgba(52,211,153,0.2)', fontFamily: "'JetBrains Mono', monospace", fontSize: 9 }}>
        <span style={{ color: 'rgba(52,211,153,0.9)' }}>✓ CONTEXT LOADED</span>
      </div>
      <div className="p-3">
        <div className="rounded-lg p-2 mb-1.5" style={{ background: 'rgba(255,255,255,0.04)', fontSize: 10, color: 'rgba(226,232,240,0.7)', fontFamily: "'JetBrains Mono', monospace" }}>
          AI · using priya's context
        </div>
        <p className="text-[10px] text-foreground/60" style={{ fontFamily: "'JetBrains Mono', monospace" }}>
          "Priya chose OAuth2+PKCE because..."
        </p>
      </div>
    </div>
  </div>
);

const HandoffVisual = () => (
  <div className="rounded-xl overflow-hidden" style={{ background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(251,191,36,0.2)' }}>
    <div className="px-4 py-3 flex items-center gap-2" style={{ borderBottom: '1px solid rgba(251,191,36,0.15)', fontFamily: "'JetBrains Mono', monospace" }}>
      <span style={{ fontSize: 11, color: '#fbbf24' }}>→ Priya → Sneha</span>
      <span style={{ fontSize: 9, color: 'rgba(251,191,36,0.5)', marginLeft: 'auto' }}>HANDOFF DOC</span>
    </div>
    <div className="p-4 space-y-3" style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 10 }}>
      {[
        { icon: "📦", title: "Auth Module", items: ["OAuth2 + PKCE", "Redis cache", "Token refresh"] },
        { icon: "✓", title: "Key Decisions (4)", items: ["PKCE for mobile", "30d refresh TTL"] },
        { icon: "?", title: "Open Questions (2)", items: ["Rate limit strategy", "Webhook retries"] },
      ].map((section, i) => (
        <div key={i}>
          <p style={{ color: 'rgba(255,255,255,0.7)', fontWeight: 600, marginBottom: 4 }}>{section.icon} {section.title}</p>
          {section.items.map((item, j) => (
            <p key={j} style={{ color: 'rgba(148,163,184,0.5)', paddingLeft: 16, lineHeight: 1.8 }}>· {item}</p>
          ))}
        </div>
      ))}
    </div>
  </div>
);

const stepVisuals = [CaptureVisual, SynthesizeVisual, LoadVisual, HandoffVisual];

const AUTO_ADVANCE_MS = 4000;

const HowItWorksSection = () => {
  const [activeStep, setActiveStep] = useState(0);
  const [progress, setProgress] = useState(0);
  const [userClicked, setUserClicked] = useState(false);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const progressRef = useRef<NodeJS.Timeout | null>(null);

  const startAutoAdvance = useCallback(() => {
    if (timerRef.current) clearTimeout(timerRef.current);
    if (progressRef.current) clearInterval(progressRef.current);

    setProgress(0);
    const startTime = Date.now();
    progressRef.current = setInterval(() => {
      const elapsed = Date.now() - startTime;
      setProgress(Math.min((elapsed / AUTO_ADVANCE_MS) * 100, 100));
    }, 50);

    timerRef.current = setTimeout(() => {
      setActiveStep((prev) => (prev + 1) % 4);
      setUserClicked(false);
    }, AUTO_ADVANCE_MS);
  }, []);

  useEffect(() => {
    startAutoAdvance();
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
      if (progressRef.current) clearInterval(progressRef.current);
    };
  }, [activeStep, startAutoAdvance]);

  const handleStepClick = (i: number) => {
    setActiveStep(i);
    setUserClicked(true);
  };

  const ActiveVisual = stepVisuals[activeStep];
  const step = tabs[activeStep];
  const color = stepColors[activeStep];

  return (
    <section id="how-it-works" className="py-[160px] relative overflow-hidden">
      {/* Left glow */}
      <div aria-hidden className="absolute pointer-events-none" style={{ zIndex: 0, top: '20%', left: -150, width: 600, height: 600, background: 'radial-gradient(ellipse at center, rgba(124,58,237,0.07) 0%, transparent 70%)' }} />
      {/* Right glow */}
      <div aria-hidden className="absolute pointer-events-none" style={{ zIndex: 0, top: '60%', right: -150, width: 500, height: 500, background: 'radial-gradient(ellipse at center, rgba(79,70,229,0.06) 0%, transparent 70%)' }} />
      <NeuralDendriteSVG />
      <div className="container mx-auto px-4 lg:px-8 relative z-[1]">
        {/* Section card wrapper */}
        <div style={{ background: 'rgba(255,255,255,0.015)', border: '1px solid rgba(255,255,255,0.05)', borderRadius: 24, padding: '80px 64px', position: 'relative', overflow: 'hidden', boxShadow: '0 0 0 1px rgba(124,58,237,0.08), 0 80px 160px rgba(0,0,0,0.5)' }}>
        {/* Eyebrow + heading */}
        <div className="text-center mb-12">
          <div className="flex items-center justify-center gap-2 mb-4">
            <span className="relative w-[5px] h-[5px] rounded-full" style={{ background: '#a78bfa', boxShadow: '0 0 6px #a78bfa' }}>
              <span className="absolute inset-0 rounded-full animate-ping" style={{ background: '#a78bfa', opacity: 0.4 }} />
            </span>
            <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 10, letterSpacing: '0.2em', color: 'rgba(167,139,250,0.6)' }}>
              THE PIPELINE
            </span>
          </div>
          <SectionHeading subtitle="Install once. Let it run. Never lose context again.">
            Ridiculously Simple to <span className="text-gradient">Understand</span>
          </SectionHeading>
        </div>

        <div className="mt-16">
          <FlowDiagram />
        </div>

        {/* Vertical stepper + content */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="mt-4 grid lg:grid-cols-[280px_1fr] gap-10 items-start"
        >
          {/* Left stepper */}
          <div className="flex flex-col">
            {tabs.map((t, i) => {
              const isActive = i === activeStep;
              const sc = stepColors[i];
              return (
                <div key={t.value}>
                  <button
                    onClick={() => handleStepClick(i)}
                    className="w-full text-left rounded-[14px] p-[18px_20px] transition-all duration-300 relative"
                    style={{
                      background: isActive ? 'linear-gradient(135deg, rgba(124,58,237,0.12), rgba(79,70,229,0.08))' : 'rgba(255,255,255,0.02)',
                      border: isActive ? '1px solid rgba(124,58,237,0.35)' : '1px solid rgba(255,255,255,0.05)',
                      boxShadow: isActive ? '0 8px 32px rgba(124,58,237,0.1), inset 0 1px 0 rgba(255,255,255,0.05)' : 'none',
                      cursor: 'pointer',
                    }}
                  >
                    <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 9, color: 'rgba(124,58,237,0.6)', letterSpacing: '0.15em' }}>
                      {String(i + 1).padStart(2, '0')} ——
                    </span>
                    <div className="flex items-center gap-3 mt-2">
                      <div className="w-8 h-8 rounded-[10px] flex items-center justify-center text-base flex-shrink-0"
                        style={{ background: isActive ? sc.gradient : 'rgba(255,255,255,0.04)' }}>
                        {t.icon}
                      </div>
                      <div>
                        <p className="font-display text-[15px] font-bold text-foreground">{t.label}</p>
                        <p className="text-[12px] text-muted-foreground/60" style={{ fontFamily: "'JetBrains Mono', monospace" }}>{t.subtitle}</p>
                      </div>
                    </div>
                    {/* Progress bar under active */}
                    {isActive && (
                      <div className="mt-3 h-[2px] rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.06)' }}>
                        <div className="h-full rounded-full transition-[width] duration-100" style={{
                          width: `${progress}%`,
                          background: `linear-gradient(90deg, ${sc.accent}, rgba(255,255,255,0.3))`,
                        }} />
                      </div>
                    )}
                  </button>
                  {/* Connector line */}
                  {i < 3 && (
                    <div className="flex justify-center">
                      <div style={{ width: 1, height: 20, background: 'linear-gradient(to bottom, rgba(124,58,237,0.3), transparent)' }} />
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Right content panel */}
          <AnimatePresence mode="wait">
            <motion.div
              key={activeStep}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.35, ease: [0.34, 1.56, 0.64, 1] }}
              className="rounded-2xl p-8 lg:p-10"
              style={{
                background: 'rgba(255,255,255,0.02)',
                border: '1px solid rgba(255,255,255,0.07)',
                boxShadow: '0 40px 80px rgba(0,0,0,0.4)',
                minHeight: 380,
              }}
            >
              {/* Accent line */}
              <div className="rounded-full mb-6" style={{ width: 60, height: 2, background: color.accent }} />

              {/* Step number */}
              <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 9, letterSpacing: '0.15em', color: color.accent }}>
                STEP {String(activeStep + 1).padStart(2, '0')}
              </span>

              {/* Title */}
              <h3 className="font-display text-2xl lg:text-[28px] font-bold text-foreground mb-4 mt-2" style={{ lineHeight: 1.1 }}>
                {step.title}
              </h3>

              {/* Body */}
              <p className="text-[15px] leading-[1.75] mb-8" style={{ color: 'rgba(255,255,255,0.55)', maxWidth: 520 }}>
                {step.body}
              </p>

              {/* Visual */}
              <ActiveVisual />
            </motion.div>
          </AnimatePresence>
        </motion.div>
        </div>
      </div>
    </section>
  );
};

export default HowItWorksSection;

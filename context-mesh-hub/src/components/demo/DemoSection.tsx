import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import InteractiveDemo from "./InteractiveDemo";
import { masterContext, handoffDoc } from "./demoData";

const tabs = [
  { id: "team", icon: "👥", iconColor: "#a78bfa", label: "Team View" },
  { id: "master", icon: "🧠", iconColor: "#a78bfa", label: "Master Context" },
  { id: "handoff", icon: "📦", iconColor: "#fbbf24", label: "Handoff Mode" },
];

// --- Full Master Context View (Tab 2) ---
const MasterContextFullView = () => {
  const [conflictResolved, setConflictResolved] = useState(false);

  const decisions = [
    { text: "OAuth2 PKCE flow for mobile clients", by: "Arjun", time: "3h ago" },
    { text: "Redis rate limiting: 1000 req/min", by: "Priya", time: "4h ago" },
    { text: "Session expiry: 7 days", by: "Arjun", time: "5h ago" },
    { text: "PostgreSQL + Redis cache", by: "Rahul", time: "1d ago" },
    { text: "URL path versioning /v1/, /v2/", by: "Priya", time: "1d ago" },
    { text: "Docker for all services", by: "Rahul", time: "2d ago" },
    { text: "FastAPI backend", by: "Rahul", time: "2d ago" },
  ];

  const questions = [
    { text: "Rate limiting: per-IP or per-tenant?", by: "Arjun" },
    { text: "Webhook retry: fixed 3 or configurable?", by: "Priya" },
    { text: "Mobile SDK scope", by: "unassigned" },
  ];

  return (
    <div className="p-6 max-h-[520px] overflow-y-auto scrollbar-hide">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <span className="text-base font-semibold text-foreground">⬡ Master Context</span>
        <span className="flex items-center gap-1 text-[9px] px-2 py-0.5 rounded-full bg-destructive/15 text-destructive">
          <span className="w-1.5 h-1.5 rounded-full bg-destructive animate-pulse" />Live
        </span>
        <span className="text-[10px] text-muted-foreground ml-auto" style={{ fontFamily: "'JetBrains Mono', monospace" }}>Updated 2m ago</span>
      </div>

      {/* Active Decisions */}
      <div className="mb-6">
        <h4 className="text-sm font-bold text-foreground mb-3" style={{ borderLeft: '3px solid #a78bfa', paddingLeft: 12 }}>
          Active Decisions ({decisions.length})
        </h4>
        <div className="space-y-1.5">
          {decisions.map((d, i) => (
            <motion.div key={i} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.04 }}
              className="flex items-center gap-3 p-2.5 rounded-lg"
              style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.04)' }}>
              <span className="text-[10px] px-2 py-0.5 rounded-full font-semibold" style={{ background: 'rgba(124,58,237,0.15)', border: '1px solid rgba(124,58,237,0.3)', color: '#a78bfa' }}>Decision</span>
              <span className="text-[11px] text-foreground/80 flex-1">{d.text}</span>
              <span className="text-[9px] text-muted-foreground whitespace-nowrap">by {d.by}</span>
              <span className="text-[9px] text-muted-foreground/50 whitespace-nowrap">{d.time}</span>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Open Questions */}
      <div className="mb-6">
        <h4 className="text-sm font-bold text-[hsl(45_80%_55%)] mb-3" style={{ borderLeft: '3px solid #fbbf24', paddingLeft: 12 }}>
          Open Questions ({questions.length})
        </h4>
        <div className="space-y-1.5">
          {questions.map((q, i) => (
            <div key={i} className="flex items-center gap-3 p-2.5 rounded-lg"
              style={{ background: 'rgba(251,191,36,0.04)', border: '1px solid rgba(251,191,36,0.1)' }}>
              <span className="text-[12px] text-[hsl(45_80%_55%)]">?</span>
              <span className="text-[11px] text-foreground/80 flex-1">{q.text}</span>
              <span className="text-[9px] text-muted-foreground whitespace-nowrap">flagged by {q.by}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Conflicts */}
      <div className="mb-6">
        <h4 className="text-sm font-bold text-destructive mb-3" style={{ borderLeft: '3px solid #f87171', paddingLeft: 12 }}>
          Conflicts Detected (1)
        </h4>
        {conflictResolved ? (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
            className="p-3 rounded-lg" style={{ background: 'rgba(52,211,153,0.06)', border: '1px solid rgba(52,211,153,0.2)' }}>
            <p className="text-[11px] text-[hsl(142_70%_45%)] font-semibold">✓ Resolved</p>
          </motion.div>
        ) : (
          <div className="p-3 rounded-lg" style={{ background: 'rgba(239,68,68,0.05)', border: '1px solid rgba(239,68,68,0.15)' }}>
            <p className="text-[11px] text-foreground/80 font-semibold mb-2">⚠ Auth rate limit strategy</p>
            <div className="space-y-1.5 mb-3">
              <div className="flex items-center gap-2 text-[10px]">
                <span className="text-muted-foreground">Arjun's context:</span>
                <span className="text-foreground/70">"per-IP rate limiting"</span>
              </div>
              <div className="flex items-center gap-2 text-[10px]">
                <span className="text-muted-foreground">Priya's context:</span>
                <span className="text-foreground/70">"per-tenant rate limiting"</span>
              </div>
            </div>
            <button onClick={() => setConflictResolved(true)}
              className="text-[10px] px-3 py-1.5 rounded-lg transition-colors font-semibold"
              style={{
                background: 'linear-gradient(135deg, rgba(239,68,68,0.2), rgba(220,38,38,0.15))',
                border: '1px solid rgba(239,68,68,0.3)',
                color: '#f87171',
              }}>
              Mark Resolved
            </button>
          </div>
        )}
      </div>

      {/* Bottom note */}
      <p className="text-[10px] text-muted-foreground/40 text-center" style={{ fontFamily: "'JetBrains Mono', monospace" }}>
        Master Context is auto-injected into all team AI prompts · Engineers can toggle off per session
      </p>
    </div>
  );
};

// --- Handoff View (Tab 3) ---
const HandoffView = () => {
  const [generating, setGenerating] = useState(false);
  const [progress, setProgress] = useState(0);
  const [text, setText] = useState("");
  const [done, setDone] = useState(false);
  const [initialized, setInitialized] = useState(false);

  const generate = () => {
    setGenerating(true);
    setProgress(0);
    setText("");
    setDone(false);
    setInitialized(false);

    let p = 0;
    const pInterval = setInterval(() => {
      p += 2;
      setProgress(p);
      if (p >= 100) {
        clearInterval(pInterval);
        let i = 0;
        const tInterval = setInterval(() => {
          if (i < handoffDoc.length) {
            setText(handoffDoc.slice(0, i + 1));
            i++;
          } else {
            clearInterval(tInterval);
            setDone(true);
          }
        }, 12);
      }
    }, 40);
  };

  const initializeAI = () => {
    setInitialized(true);
  };

  return (
    <div className="p-6 max-h-[520px] overflow-y-auto scrollbar-hide">
      {!generating ? (
        <div className="text-center py-12 max-w-md mx-auto">
          <p className="text-sm text-muted-foreground mb-2">Generate handoff for:</p>
          <div className="glass-card rounded-xl px-4 py-3 mb-4">
            <p className="text-sm font-semibold text-foreground">Rahul Dev → Sneha Rao</p>
            <p className="text-[10px] text-muted-foreground mt-0.5">89 chat sessions · 12 decisions · 47 context entries · 3 open questions</p>
          </div>
          <button onClick={generate} className="w-full py-3 rounded-xl text-sm font-semibold text-primary-foreground gradient-btn shimmer-btn relative overflow-hidden">
            Generate Snapshot
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          {progress < 100 && (
            <div>
              <p className="text-xs text-muted-foreground mb-2">Generating handoff snapshot from full context store...</p>
              <div className="h-2 rounded-full bg-secondary overflow-hidden">
                <motion.div className="h-full rounded-full" style={{ background: "linear-gradient(90deg, hsl(239 84% 67%), hsl(263 70% 60%))" }}
                  animate={{ width: `${progress}%` }} transition={{ duration: 0.1 }} />
              </div>
            </div>
          )}
          {text && (
            <pre className="text-[11px] text-accent/80 font-mono whitespace-pre-wrap leading-relaxed glass-card rounded-xl p-4">
              {text}{!done && <span className="animate-blink">█</span>}
            </pre>
          )}
          <AnimatePresence>
            {done && !initialized && (
              <motion.button initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} onClick={initializeAI}
                className="w-full py-3 rounded-xl text-sm font-semibold text-primary-foreground gradient-btn shimmer-btn relative overflow-hidden">
                Initialize Sneha's AI Context
              </motion.button>
            )}
            {initialized && (
              <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}
                className="text-center py-4 rounded-xl bg-[hsl(142_70%_45%/0.1)] border border-[hsl(142_70%_45%/0.2)]">
                <p className="text-sm font-semibold text-[hsl(142_70%_45%)]">✓ Sneha's AI context loaded</p>
                <p className="text-[10px] text-muted-foreground mt-1">47 entries · 12 decisions · 0 gaps</p>
                <p className="text-[10px] text-muted-foreground mt-1">Sneha's AI now has Rahul's full context — she can continue his work immediately.</p>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      )}
    </div>
  );
};

const DemoSection = () => {
  const [activeTab, setActiveTab] = useState("team");

  return (
    <section className="py-[120px] relative overflow-hidden">
      {/* Primary glow */}
      <div aria-hidden className="absolute pointer-events-none" style={{ zIndex: 0, top: -100, left: '50%', transform: 'translateX(-50%)', width: 900, height: 600, background: 'radial-gradient(ellipse at center, rgba(124,58,237,0.09) 0%, rgba(79,70,229,0.04) 40%, transparent 70%)' }} />
      {/* Secondary glow */}
      <div aria-hidden className="absolute pointer-events-none" style={{ zIndex: 0, bottom: 0, right: -100, width: 500, height: 400, background: 'radial-gradient(ellipse at center, rgba(99,102,241,0.05) 0%, transparent 70%)' }} />
      <div className="container mx-auto px-4 lg:px-8 relative z-[1]">
        {/* Section card wrapper */}
        <div style={{ background: 'rgba(255,255,255,0.015)', border: '1px solid rgba(255,255,255,0.05)', borderRadius: 24, padding: '80px 64px', position: 'relative', overflow: 'hidden', boxShadow: '0 0 0 1px rgba(124,58,237,0.08), 0 80px 160px rgba(0,0,0,0.5)' }}>
        {/* Header */}
        <motion.div initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.6 }}
          className="text-center mb-12">
          <div className="flex items-center justify-center gap-2 mb-4">
            <span className="relative w-[5px] h-[5px] rounded-full" style={{ background: '#a78bfa', boxShadow: '0 0 6px #a78bfa' }}>
              <span className="absolute inset-0 rounded-full animate-ping" style={{ background: '#a78bfa', opacity: 0.4 }} />
            </span>
            <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 10, letterSpacing: '0.2em', color: 'rgba(167,139,250,0.6)' }}>
              LIVE PREVIEW
            </span>
          </div>
          <h2 className="font-display text-3xl md:text-5xl font-bold tracking-tight">
            <span className="text-foreground">See It In </span>
            <span style={{ background: 'linear-gradient(135deg, #a78bfa, #818cf8)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>Action</span>
          </h2>
          <p className="mt-3" style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 13, color: 'rgba(148,163,184,0.5)', letterSpacing: '0.05em' }}>
            No signup. No install. Just click.
          </p>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 40 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.7, delay: 0.2 }}>
          {/* Tab Bar */}
          <div className="flex justify-center mb-6">
            <div className="inline-flex items-center gap-1 p-[5px] rounded-[14px]"
              style={{
                background: 'rgba(255,255,255,0.03)',
                border: '1px solid rgba(255,255,255,0.07)',
                boxShadow: '0 8px 32px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.05)',
              }}>
              {tabs.map((tab) => {
                const isActive = activeTab === tab.id;
                return (
                  <button key={tab.id} onClick={() => setActiveTab(tab.id)}
                    className="relative transition-all duration-250 flex flex-col items-center"
                    style={{
                      background: isActive ? 'linear-gradient(135deg, rgba(124,58,237,0.35), rgba(79,70,229,0.25))' : 'transparent',
                      border: isActive ? '1px solid rgba(124,58,237,0.4)' : '1px solid transparent',
                      boxShadow: isActive ? '0 4px 16px rgba(124,58,237,0.25), inset 0 1px 0 rgba(255,255,255,0.1)' : 'none',
                      color: isActive ? '#fff' : 'rgba(148,163,184,0.5)',
                      borderRadius: 10,
                      padding: '10px 22px',
                      fontSize: 13,
                      fontWeight: 600,
                      cursor: 'pointer',
                      letterSpacing: '-0.01em',
                    }}
                    onMouseEnter={(e) => {
                      if (!isActive) {
                        e.currentTarget.style.background = 'rgba(255,255,255,0.04)';
                        e.currentTarget.style.color = 'rgba(255,255,255,0.7)';
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (!isActive) {
                        e.currentTarget.style.background = 'transparent';
                        e.currentTarget.style.color = 'rgba(148,163,184,0.5)';
                      }
                    }}
                  >
                    <span className="flex items-center gap-2">
                      <span>{tab.icon}</span>
                      {tab.label}
                    </span>
                    {isActive && (
                      <motion.div layoutId="demo-tab-underline"
                        className="mt-[2px] rounded-full"
                        style={{ width: '60%', height: 2, background: 'linear-gradient(90deg, #a78bfa, #818cf8)' }}
                      />
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Demo Window */}
          <div className="rounded-2xl overflow-hidden"
            style={{
              border: '1px solid rgba(255,255,255,0.08)',
              background: '#0a0a18',
              boxShadow: '0 0 0 1px rgba(124,58,237,0.15), 0 40px 120px rgba(124,58,237,0.12), 0 80px 200px rgba(0,0,0,0.8)',
            }}>
            <AnimatePresence mode="wait">
              {activeTab === "team" && (
                <motion.div key="team" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.2 }}>
                  <InteractiveDemo />
                </motion.div>
              )}
              {activeTab === "master" && (
                <motion.div key="master" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.2 }}>
                  <MasterContextFullView />
                </motion.div>
              )}
              {activeTab === "handoff" && (
                <motion.div key="handoff" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.2 }}>
                  <HandoffView />
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          <div className="grid md:grid-cols-3 gap-4 mt-6">
            {[
              { text: "Full AI chat history, auto-captured", arrow: "←" },
              { text: "Every decision, preserved forever", arrow: "↑" },
              { text: "One click. Load any teammate's context.", arrow: "→" },
            ].map((c, i) => (
              <motion.div key={i} initial={{ opacity: 0, y: 10 }} whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }} transition={{ delay: 0.3 + i * 0.1 }}
                className="flex items-center gap-2 px-3 py-2 rounded-full glass-card text-xs text-muted-foreground w-fit">
                <span className="text-accent">{c.arrow}</span> {c.text}
              </motion.div>
            ))}
          </div>
        </motion.div>
        </div>
      </div>
    </section>
  );
};

export default DemoSection;

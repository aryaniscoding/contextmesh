import { useState, useRef, useCallback, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Switch } from "@/components/ui/switch";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { members, memberEntries, masterContext, categoryConfig, handoffDoc } from "./demoData";
import type { TeamMember, ContextEntry } from "./demoData";

// --- Subcomponents ---

const StatusDot = ({ status }: { status: TeamMember["status"] }) => {
  const colors: Record<string, string> = {
    active: "hsl(142 70% 45%)",
    away: "hsl(45 80% 55%)",
    new: "hsl(239 84% 67%)",
  };
  return (
    <span className="relative flex h-2.5 w-2.5 flex-shrink-0">
      <span className="absolute inline-flex h-full w-full rounded-full opacity-40 animate-ping" style={{ background: colors[status], boxShadow: `0 0 6px ${colors[status]}` }} />
      <span className="relative inline-flex rounded-full h-2.5 w-2.5" style={{ background: colors[status], boxShadow: `0 0 6px ${colors[status]}` }} />
    </span>
  );
};

const badgeStyles: Record<string, { bg: string; border: string; color: string }> = {
  chat: { bg: 'rgba(100,116,139,0.15)', border: '1px solid rgba(100,116,139,0.3)', color: 'rgba(148,163,184,0.9)' },
  decision: { bg: 'rgba(124,58,237,0.15)', border: '1px solid rgba(124,58,237,0.35)', color: '#a78bfa' },
  task: { bg: 'rgba(16,185,129,0.12)', border: '1px solid rgba(16,185,129,0.3)', color: '#34d399' },
  question: { bg: 'rgba(251,191,36,0.1)', border: '1px solid rgba(251,191,36,0.25)', color: '#fbbf24' },
  conflict: { bg: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.25)', color: '#f87171' },
  handoff: { bg: 'rgba(124,58,237,0.12)', border: '1px solid rgba(124,58,237,0.3)', color: '#a78bfa' },
};

const CategoryBadge = ({ category }: { category: ContextEntry["category"] }) => {
  const cfg = categoryConfig[category];
  const style = badgeStyles[category] || badgeStyles.chat;
  return (
    <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full" style={{ color: style.color, background: style.bg, border: style.border }}>
      {cfg.label}
    </span>
  );
};

const ChatBubbles = ({ messages }: { messages: ContextEntry["chatMessages"] }) => {
  if (!messages) return null;
  return (
    <motion.div
      initial={{ height: 0, opacity: 0 }}
      animate={{ height: "auto", opacity: 1 }}
      exit={{ height: 0, opacity: 0 }}
      transition={{ duration: 0.3 }}
      className="overflow-hidden"
    >
      <div className="mt-2 rounded-lg bg-[hsl(240_12%_8%/0.8)] p-2 space-y-1.5 max-h-[160px] overflow-y-auto scrollbar-hide">
        {messages.map((msg, i) => (
          <div key={i} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
            <div className={`max-w-[85%] px-2.5 py-1.5 rounded-lg text-[11px] leading-relaxed ${
              msg.role === "user"
                ? "bg-accent/20 text-foreground/90"
                : "bg-[hsl(0_0%_100%/0.05)] text-muted-foreground"
            }`}>
              {msg.text}
            </div>
          </div>
        ))}
        <p className="text-[9px] text-accent/60 text-center pt-1 cursor-pointer hover:text-accent transition-colors">View full session →</p>
      </div>
    </motion.div>
  );
};

const ContextCard = ({ entry, index }: { entry: ContextEntry; index: number }) => {
  const [expanded, setExpanded] = useState(false);
  const isChat = entry.category === "chat";

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: index * 0.08 }}
      onClick={isChat ? () => setExpanded(!expanded) : undefined}
      className={`p-[14px_16px] rounded-xl transition-all duration-200 ${isChat ? "cursor-pointer" : "cursor-default"}`}
      style={{
        background: 'rgba(255,255,255,0.025)',
        border: '1px solid rgba(255,255,255,0.06)',
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.background = 'rgba(255,255,255,0.04)';
        e.currentTarget.style.borderColor = 'rgba(124,58,237,0.25)';
        e.currentTarget.style.transform = 'translateY(-1px)';
        e.currentTarget.style.boxShadow = '0 8px 24px rgba(0,0,0,0.3)';
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.background = 'rgba(255,255,255,0.025)';
        e.currentTarget.style.borderColor = 'rgba(255,255,255,0.06)';
        e.currentTarget.style.transform = 'translateY(0)';
        e.currentTarget.style.boxShadow = 'none';
      }}
    >
      <div className="flex items-center gap-2 mb-1.5">
        <CategoryBadge category={entry.category} />
        <span className="text-[10px] text-muted-foreground ml-auto">{entry.time}</span>
      </div>
      <p className="text-xs font-semibold text-foreground leading-snug">{entry.title}</p>
      <p className="text-[11px] text-muted-foreground leading-relaxed mt-1">{entry.body}</p>
      {entry.progress !== undefined && (
        <div className="mt-2 h-1.5 rounded-full bg-secondary overflow-hidden">
          <motion.div
            className="h-full rounded-full"
            style={{ background: "linear-gradient(90deg, hsl(239 84% 67%), hsl(263 70% 60%))" }}
            initial={{ width: "0%" }}
            animate={{ width: `${entry.progress}%` }}
            transition={{ duration: 1.5, ease: "easeOut" }}
          />
        </div>
      )}
      {entry.files && (
        <div className="flex flex-wrap gap-1 mt-2">
          {entry.files.map((f) => (
            <span key={f} className="text-[9px] px-1.5 py-0.5 rounded" style={{
              fontFamily: "'JetBrains Mono', monospace",
              fontSize: 9,
              background: 'rgba(15,23,42,0.8)',
              border: '1px solid rgba(255,255,255,0.08)',
              color: 'rgba(148,163,184,0.6)',
              borderRadius: 6,
              padding: '2px 8px',
            }}>{f}</span>
          ))}
        </div>
      )}
      <AnimatePresence>
        {isChat && expanded && <ChatBubbles messages={entry.chatMessages} />}
      </AnimatePresence>
    </motion.div>
  );
};

// --- Context Load Mode (Mode 2: Peer context loading) ---
type CenterPanelMode = "own" | "loading" | "loaded" | "viewing";

const ContextLoadView = ({ member, onDismiss, onLoaded }: { member: TeamMember; onDismiss: () => void; onLoaded: () => void }) => {
  const [progress, setProgress] = useState(0);
  const [steps, setSteps] = useState<number[]>([]);

  const loadSteps = [
    { text: `Raw chat history — ${member.name === "Priya Mehta" ? "127" : "89"} sessions`, icon: "✓" },
    { text: `Code context — ${member.name === "Priya Mehta" ? "23" : "14"} files`, icon: "✓" },
    { text: `Decisions extracted — ${member.name === "Priya Mehta" ? "34" : "18"} logged`, icon: "✓" },
    { text: `Open questions — ${member.name === "Priya Mehta" ? "6" : "3"} pending`, icon: "✓" },
  ];

  useEffect(() => {
    const stepTimers: NodeJS.Timeout[] = [];
    loadSteps.forEach((_, i) => {
      stepTimers.push(setTimeout(() => setSteps((s) => [...s, i]), 300 + i * 300));
    });
    let p = 0;
    const pInterval = setInterval(() => {
      p += 3;
      setProgress(Math.min(p, 100));
      if (p >= 100) {
        clearInterval(pInterval);
        setTimeout(() => onLoaded(), 200);
      }
    }, 45);
    return () => {
      stepTimers.forEach(clearTimeout);
      clearInterval(pInterval);
    };
  }, []);

  return (
    <motion.div initial={{ opacity: 0, x: -30 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.3 }} className="flex-1 flex flex-col items-center justify-center p-6 gap-4">
      <div className="w-14 h-14 rounded-full flex items-center justify-center text-lg font-bold text-white" style={{ background: member.gradient }}>
        {member.initials}
      </div>
      <p className="text-sm font-semibold text-foreground">Loading {member.name}'s Context into your AI</p>
      <div className="space-y-2 w-full max-w-[280px]">
        {loadSteps.map((step, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, x: -10 }}
            animate={steps.includes(i) ? { opacity: 1, x: 0 } : {}}
            className="flex items-center gap-2 text-[11px]"
          >
            <span className="text-[hsl(142_70%_45%)]">{step.icon}</span>
            <span className="text-muted-foreground">{step.text}</span>
          </motion.div>
        ))}
      </div>
      <div className="w-full max-w-[280px] h-1.5 rounded-full bg-secondary overflow-hidden">
        <motion.div className="h-full rounded-full" style={{ background: "linear-gradient(90deg, hsl(239 84% 67%), hsl(263 70% 60%))" }}
          animate={{ width: `${progress}%` }} transition={{ duration: 0.05 }} />
      </div>
    </motion.div>
  );
};

// Loaded state - shows peer's context with success banner
const PeerLoadedView = ({ member, onDismiss, onLoadIntoAI }: { member: TeamMember; onDismiss: () => void; onLoadIntoAI?: () => void; }) => {
  const entries = memberEntries[member.name] || [];
  const [includeInSession, setIncludeInSession] = useState(true);
  const isViewOnly = !onLoadIntoAI ? false : false; // not view-only if no onLoadIntoAI

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex-1 flex flex-col min-w-0 overflow-hidden border-l-2 border-accent/40">
      {/* Success banner */}
      <div className="px-4 py-2 bg-[hsl(142_70%_45%/0.1)] border-b border-[hsl(142_70%_45%/0.2)] flex items-center justify-between flex-shrink-0">
        <span className="text-[11px] text-[hsl(142_70%_45%)] font-semibold">⚡ {member.name}'s context loaded · Your AI now knows everything they knew</span>
        <button onClick={onDismiss} className="text-[9px] text-muted-foreground hover:text-foreground transition-colors px-2 py-0.5 rounded bg-[hsl(0_0%_100%/0.05)]">✕</button>
      </div>
      {/* Toggle row */}
      <div className="flex items-center justify-between px-4 py-2 border-b border-[hsl(0_0%_100%/0.06)] flex-shrink-0">
        <div className="flex items-center gap-2">
          <p className="text-xs font-semibold text-foreground">{member.name.split(" ")[0]}'s Context</p>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-[9px] px-2 py-0.5 rounded-full bg-accent/10 text-accent flex items-center gap-1">👁 Viewing: {member.name.split(" ")[0]}</span>
        </div>
      </div>
      <div className="flex items-center justify-between px-4 py-1.5 border-b border-[hsl(0_0%_100%/0.04)] flex-shrink-0">
        <span className="text-[9px] text-muted-foreground">Include in current session</span>
        <Switch checked={includeInSession} onCheckedChange={(v) => { setIncludeInSession(v); if (!v) onDismiss(); }} className="scale-[0.55] origin-right" />
      </div>
      <div className="flex-1 overflow-y-auto p-3 space-y-2 scrollbar-hide">
        <AnimatePresence mode="wait">
          <motion.div key={member.name} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.2 }} className="space-y-2">
            {entries.map((entry, i) => (
              <ContextCard key={`${member.name}-${i}`} entry={entry} index={i} />
            ))}
          </motion.div>
        </AnimatePresence>
      </div>
    </motion.div>
  );
};

// View-only mode (browsing peer's context without loading)
const PeerViewOnlyView = ({ member, onDismiss, onLoadIntoAI }: { member: TeamMember; onDismiss: () => void; onLoadIntoAI: () => void }) => {
  const entries = memberEntries[member.name] || [];

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex-1 flex flex-col min-w-0 overflow-hidden border-l-2 border-[hsl(0_0%_50%/0.4)]">
      {/* View-only banner */}
      <div className="px-4 py-2 bg-[hsl(0_0%_50%/0.06)] border-b border-[hsl(0_0%_50%/0.15)] flex items-center justify-between flex-shrink-0">
        <span className="text-[11px] text-muted-foreground">👁 Browsing {member.name}'s context (read only)</span>
        <button onClick={onDismiss} className="text-[9px] text-muted-foreground hover:text-foreground transition-colors px-2 py-0.5 rounded bg-[hsl(0_0%_100%/0.05)]">✕</button>
      </div>
      {/* Load into AI button */}
      <div className="px-4 py-2 border-b border-[hsl(0_0%_100%/0.06)] flex-shrink-0">
        <button onClick={onLoadIntoAI}
          className="w-full text-[11px] px-3 py-2 rounded-lg font-semibold text-white transition-all duration-200"
          style={{
            background: 'linear-gradient(135deg, #7c3aed, #4f46e5)',
            boxShadow: '0 4px 12px rgba(124,58,237,0.3)',
          }}
        >
          ⚡ Load into AI →
        </button>
      </div>
      <div className="flex items-center justify-between px-4 py-2 border-b border-[hsl(0_0%_100%/0.06)] flex-shrink-0">
        <p className="text-xs font-semibold text-foreground">{member.name.split(" ")[0]}'s Context</p>
        <span className="text-[9px] px-2 py-0.5 rounded-full bg-[hsl(0_0%_50%/0.1)] text-muted-foreground flex items-center gap-1">👁 Viewing: {member.name.split(" ")[0]}</span>
      </div>
      <div className="flex-1 overflow-y-auto p-3 space-y-2 scrollbar-hide">
        <AnimatePresence mode="wait">
          <motion.div key={member.name} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.2 }} className="space-y-2">
            {entries.map((entry, i) => (
              <ContextCard key={`${member.name}-${i}`} entry={entry} index={i} />
            ))}
          </motion.div>
        </AnimatePresence>
      </div>
    </motion.div>
  );
};

// --- Health donut ---
const HealthDonut = () => {
  const scores = [91, 93, 94, 93];
  const [idx, setIdx] = useState(0);
  useEffect(() => {
    const t = setInterval(() => setIdx((i) => (i + 1) % scores.length), 3000);
    return () => clearInterval(t);
  }, []);
  const score = scores[idx];
  const c = 2 * Math.PI * 18;
  const offset = c * (1 - score / 100);

  return (
    <div className="flex items-center gap-2">
      <svg viewBox="0 0 44 44" className="w-10 h-10" style={{ filter: 'drop-shadow(0 0 10px rgba(124,58,237,0.4))' }}>
        <circle cx="22" cy="22" r="18" fill="none" stroke="hsl(240 6% 14%)" strokeWidth="4" />
        <motion.circle cx="22" cy="22" r="18" fill="none" stroke="url(#demoHealthGrad)" strokeWidth="4"
          strokeLinecap="round" transform="rotate(-90 22 22)"
          animate={{ strokeDashoffset: offset }}
          transition={{ duration: 1 }}
          strokeDasharray={c}
        />
        <defs>
          <linearGradient id="demoHealthGrad" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="hsl(239 84% 67%)" />
            <stop offset="100%" stopColor="hsl(263 70% 60%)" />
          </linearGradient>
        </defs>
        <text x="22" y="22" textAnchor="middle" dominantBaseline="middle" fill="white" fontSize="9" fontWeight="700">{score}</text>
      </svg>
      <span className="text-[10px] text-muted-foreground">Context Health</span>
    </div>
  );
};

// --- Handoff Generator ---
const HandoffPanel = ({ onClose }: { onClose: () => void }) => {
  const [text, setText] = useState("");
  const [done, setDone] = useState(false);

  useEffect(() => {
    let i = 0;
    const t = setInterval(() => {
      if (i < handoffDoc.length) {
        setText(handoffDoc.slice(0, i + 1));
        i++;
      } else {
        clearInterval(t);
        setTimeout(() => setDone(true), 400);
      }
    }, 18);
    return () => clearInterval(t);
  }, []);

  return (
    <motion.div
      initial={{ x: "100%" }}
      animate={{ x: 0 }}
      exit={{ x: "100%" }}
      transition={{ type: "spring", stiffness: 200, damping: 25 }}
      className="absolute inset-0 z-20 bg-[hsl(240_15%_5%/0.97)] backdrop-blur-sm flex flex-col"
    >
      <div className="flex items-center justify-between px-4 py-2 border-b border-[hsl(0_0%_100%/0.06)]">
        <span className="text-xs font-semibold text-foreground">Generating Handoff...</span>
        <button onClick={onClose} className="text-[10px] text-muted-foreground hover:text-foreground transition-colors">✕ Close</button>
      </div>
      <pre className="flex-1 p-4 text-[11px] text-accent/80 font-mono overflow-auto whitespace-pre-wrap leading-relaxed">
        {text}<span className="animate-blink">█</span>
      </pre>
      <AnimatePresence>
        {done && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="px-4 py-3 border-t border-[hsl(0_0%_100%/0.06)] flex flex-col gap-1"
          >
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-[hsl(142_70%_45%)]" />
              <span className="text-xs text-[hsl(142_70%_45%)] font-semibold">✓ Handoff Complete — Sneha's AI initialized</span>
            </div>
            <p className="text-[10px] text-muted-foreground pl-4">Sneha's AI now has Rahul's full context — she can continue his work immediately.</p>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

// --- Main Component ---
interface InteractiveDemoProps {
  compact?: boolean;
}

const InteractiveDemo = ({ compact = false }: InteractiveDemoProps) => {
  const [activeMember, setActiveMember] = useState(0);
  const [showHandoff, setShowHandoff] = useState(false);
  const [conflictResolved, setConflictResolved] = useState(false);
  const [hoveredMember, setHoveredMember] = useState<number | null>(null);
  const [autoShare, setAutoShare] = useState(true);
  const [lastPrivate, setLastPrivate] = useState(false);
  const [teamContextOn, setTeamContextOn] = useState(true);
  const cardRef = useRef<HTMLDivElement>(null);

  // Center panel mode: "own" | "loading" | "loaded" | "viewing"
  const [centerMode, setCenterMode] = useState<CenterPanelMode>("own");
  const [targetMemberIdx, setTargetMemberIdx] = useState<number | null>(null);

  const handleMouse = useCallback((e: React.MouseEvent) => {
    if (!cardRef.current || compact) return;
    const rect = cardRef.current.getBoundingClientRect();
    const cx = rect.left + rect.width / 2;
    const cy = rect.top + rect.height / 2;
    const rx = ((e.clientY - cy) / rect.height) * -4;
    const ry = ((e.clientX - cx) / rect.width) * 6;
    cardRef.current.style.transform = `perspective(1200px) rotateX(${rx}deg) rotateY(${ry}deg)`;
  }, [compact]);

  const handleLeave = useCallback(() => {
    if (cardRef.current) {
      cardRef.current.style.transform = "perspective(1200px) rotateX(0deg) rotateY(0deg)";
    }
  }, []);

  const member = members[activeMember];
  const entries = memberEntries[member.name] || [];
  const height = compact ? "h-[420px]" : "h-[500px] lg:h-[560px]";

  const handleLoadContext = (memberIdx: number) => {
    setTargetMemberIdx(memberIdx);
    setCenterMode("loading");
  };

  const handleViewContext = (memberIdx: number) => {
    setTargetMemberIdx(memberIdx);
    setCenterMode("viewing");
  };

  const handleDismissPeer = () => {
    setTargetMemberIdx(null);
    setCenterMode("own");
  };

  const handleLoadingComplete = () => {
    setCenterMode("loaded");
  };

  return (
    <div
      ref={cardRef}
      onMouseMove={handleMouse}
      onMouseLeave={handleLeave}
      className="transition-transform duration-200 ease-out"
      style={{ transformStyle: "preserve-3d" }}
    >
      <div className={`rounded-2xl overflow-hidden ${height} flex flex-col relative`}
        style={{
          border: '1px solid rgba(255,255,255,0.08)',
          background: '#0a0a18',
          boxShadow: '0 0 0 1px rgba(124,58,237,0.15), 0 40px 120px rgba(124,58,237,0.12), 0 80px 200px rgba(0,0,0,0.8)',
        }}>
        {/* Window bar */}
        <div className="flex items-center gap-2 px-4 py-2.5 flex-shrink-0" style={{ borderBottom: 'none', background: 'rgba(255,255,255,0.02)' }}>
          <div className="w-3 h-3 rounded-full bg-[hsl(0_84%_60%/0.7)]" />
          <div className="w-3 h-3 rounded-full bg-[hsl(45_84%_60%/0.7)]" />
          <div className="w-3 h-3 rounded-full bg-[hsl(120_84%_40%/0.7)]" />
          <span className="ml-3 text-[11px] text-muted-foreground font-mono">ContextMesh — Live Preview</span>
        </div>
        {/* Gradient separator */}
        <div style={{ height: 1, background: 'linear-gradient(90deg, transparent, rgba(124,58,237,0.3), transparent)' }} />

        {/* 3-panel body */}
        <div className="flex-1 flex overflow-hidden relative">
          <AnimatePresence>
            {showHandoff && <HandoffPanel onClose={() => setShowHandoff(false)} />}
          </AnimatePresence>

          {/* LEFT — Team */}
          <div className="w-[180px] lg:w-[200px] border-r border-[hsl(0_0%_100%/0.06)] p-3 flex-shrink-0 hidden md:flex flex-col">
            <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-2">Team · 4 online</p>
            <div className="space-y-1">
              {members.map((m, i) => {
                const isActive = i === activeMember && centerMode === "own";
                const isHovered = hoveredMember === i;
                return (
                  <div
                    key={m.name}
                    onMouseEnter={() => setHoveredMember(i)}
                    onMouseLeave={() => setHoveredMember(null)}
                    className="relative"
                    style={{ marginBottom: 4 }}
                  >
                    <button
                      onClick={() => { setActiveMember(i); setCenterMode("own"); setTargetMemberIdx(null); }}
                      className="w-full flex items-center gap-2 px-2.5 py-2.5 rounded-[10px] text-left transition-all duration-200"
                      style={{
                        background: isActive ? 'linear-gradient(135deg, rgba(124,58,237,0.12), rgba(79,70,229,0.08))' : 'transparent',
                        border: isActive ? '1px solid rgba(124,58,237,0.2)' : '1px solid transparent',
                      }}
                    >
                      <div className="w-7 h-7 rounded-full flex items-center justify-center text-[10px] font-bold text-white flex-shrink-0"
                        style={{
                          background: m.gradient,
                          boxShadow: isActive ? `0 0 12px ${m.gradient.includes('263') ? 'rgba(167,139,250,0.4)' : m.gradient.includes('142') ? 'rgba(52,211,153,0.4)' : 'rgba(99,102,241,0.4)'}` : 'none',
                          border: isActive ? '2px solid rgba(255,255,255,0.3)' : '2px solid transparent',
                        }}>
                        {m.initials}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-[11px] font-medium text-foreground truncate">{m.name}</p>
                        <p className="text-[9px] text-muted-foreground truncate">{m.task}</p>
                      </div>
                      <StatusDot status={m.status} />
                    </button>
                    {/* Hover action buttons */}
                    <AnimatePresence>
                      {isHovered && i !== activeMember && (
                        <motion.div
                          initial={{ opacity: 0, y: 4 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: 4 }}
                          transition={{ duration: 0.15 }}
                          className="flex items-center gap-1 mt-1 px-2"
                        >
                          <button
                            onClick={(e) => { e.stopPropagation(); handleViewContext(i); }}
                            className="text-[8px] px-2 py-1 rounded-full transition-colors whitespace-nowrap"
                            style={{
                              background: 'transparent',
                              border: '1px solid rgba(255,255,255,0.15)',
                              color: 'rgba(255,255,255,0.5)',
                              fontFamily: "'JetBrains Mono', monospace",
                            }}
                          >
                            👁 View
                          </button>
                          <button
                            onClick={(e) => { e.stopPropagation(); handleLoadContext(i); }}
                            className="text-[8px] px-2 py-1 rounded-full transition-colors whitespace-nowrap"
                            style={{
                              background: 'rgba(124,58,237,0.2)',
                              border: '1px solid rgba(124,58,237,0.4)',
                              color: 'rgba(167,139,250,0.9)',
                              fontFamily: "'JetBrains Mono', monospace",
                            }}
                          >
                            ⚡ Load →
                          </button>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Mobile member selector */}
          <div className="md:hidden flex gap-1 p-2 border-b border-[hsl(0_0%_100%/0.06)] absolute top-0 left-0 right-0 z-10 bg-[hsl(240_12%_6%/0.95)]">
            {members.map((m, i) => (
              <button key={m.name} onClick={() => { setActiveMember(i); setCenterMode("own"); setTargetMemberIdx(null); }}
                className={`flex-1 text-[9px] py-1.5 rounded-md transition-colors ${i === activeMember ? "bg-accent/15 text-accent" : "text-muted-foreground"}`}>
                {m.initials}
              </button>
            ))}
          </div>

          {/* CENTER — Context Feed / Loading / Loaded / View Only */}
          <AnimatePresence mode="wait">
            {centerMode === "loading" && targetMemberIdx !== null ? (
              <ContextLoadView
                key={`load-${targetMemberIdx}`}
                member={members[targetMemberIdx]}
                onDismiss={handleDismissPeer}
                onLoaded={handleLoadingComplete}
              />
            ) : centerMode === "loaded" && targetMemberIdx !== null ? (
              <PeerLoadedView
                key={`loaded-${targetMemberIdx}`}
                member={members[targetMemberIdx]}
                onDismiss={handleDismissPeer}
              />
            ) : centerMode === "viewing" && targetMemberIdx !== null ? (
              <PeerViewOnlyView
                key={`view-${targetMemberIdx}`}
                member={members[targetMemberIdx]}
                onDismiss={handleDismissPeer}
                onLoadIntoAI={() => { setCenterMode("loading"); }}
              />
            ) : (
              <motion.div key="own" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="flex-1 flex flex-col min-w-0 overflow-hidden">
                <div className="flex items-center justify-between px-4 py-2 border-b border-[hsl(0_0%_100%/0.06)] flex-shrink-0 md:mt-0 mt-8">
                  <div className="flex items-center gap-2">
                    <p className="text-xs font-semibold text-foreground">Your Context</p>
                    <span className="text-[9px] px-2 py-0.5 rounded-full bg-secondary text-muted-foreground">synced 2m ago</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-[9px] text-muted-foreground">⬡ Team Context:</span>
                    <span className="text-[9px] font-semibold" style={{ color: teamContextOn ? '#a78bfa' : 'rgba(255,255,255,0.3)' }}>
                      {teamContextOn ? "ON" : "OFF"}
                    </span>
                    <Switch checked={teamContextOn} onCheckedChange={setTeamContextOn} className="scale-[0.55] origin-right" />
                  </div>
                </div>
                {/* Toggle status message */}
                <div className="px-4 py-1.5 border-b border-[hsl(0_0%_100%/0.04)] flex-shrink-0">
                  <p className="text-[9px] text-muted-foreground" style={{ fontFamily: "'JetBrains Mono', monospace" }}>
                    {teamContextOn
                      ? "Master Context is being injected into all your AI prompts automatically"
                      : "Master Context injection paused — your AI is working independently"}
                  </p>
                </div>
                <div className="flex-1 overflow-y-auto p-3 space-y-2.5 scrollbar-hide">
                  <AnimatePresence mode="wait">
                    <motion.div key={member.name} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.2 }} className="space-y-2.5">
                      {entries.map((entry, i) => (
                        <ContextCard key={`${member.name}-${i}`} entry={entry} index={i} />
                      ))}
                    </motion.div>
                  </AnimatePresence>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* RIGHT — Master Context */}
          <div className="w-[200px] lg:w-[240px] border-l border-[hsl(0_0%_100%/0.06)] p-3 flex-shrink-0 hidden lg:flex flex-col overflow-y-auto scrollbar-hide">
            {/* Mode 1: Active indicator */}
            <TooltipProvider>
              <div className="flex items-center gap-2 mb-2 px-1 py-1.5 rounded-lg" style={{ background: 'rgba(124,58,237,0.06)', border: '1px solid rgba(124,58,237,0.12)' }}>
                <span className="relative flex h-2 w-2 flex-shrink-0">
                  <span className="absolute inline-flex h-full w-full rounded-full animate-ping" style={{ background: '#a78bfa', opacity: 0.4 }} />
                  <span className="relative inline-flex rounded-full h-2 w-2" style={{ background: '#a78bfa' }} />
                </span>
                <span className="text-[9px] text-accent/70" style={{ fontFamily: "'JetBrains Mono', monospace" }}>
                  ⬡ Mode 1: Active
                </span>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <span className="text-[10px] text-muted-foreground cursor-help ml-auto">?</span>
                  </TooltipTrigger>
                  <TooltipContent side="left" className="max-w-[200px] text-[10px]">
                    Master Context is automatically added to every AI prompt for your whole team. Anyone can toggle this off in their session.
                  </TooltipContent>
                </Tooltip>
              </div>
            </TooltipProvider>

            <div className="flex items-center gap-2 mb-3">
              <span className="text-xs font-semibold text-foreground">⬡ Master Context</span>
              <span className="flex items-center gap-1 text-[9px] px-1.5 py-0.5 rounded-full bg-destructive/15 text-destructive">
                <span className="w-1.5 h-1.5 rounded-full bg-destructive animate-pulse" />Live
              </span>
            </div>

            {/* Injecting status */}
            <p className="text-[8px] text-accent/40 mb-3" style={{ fontFamily: "'JetBrains Mono', monospace" }}>
              Injecting into all team prompts
            </p>

            {/* Decisions */}
            <div className="mb-3">
              <p className="text-[11px] font-bold text-muted-foreground mb-1.5" style={{ borderLeft: '3px solid #a78bfa', paddingLeft: 10, letterSpacing: '0.08em' }}>
                Active Decisions ({masterContext.decisions.length})
              </p>
              <div className="space-y-0">
                {masterContext.decisions.slice(0, 3).map((d, i) => (
                  <p key={i} className="text-[10px] text-foreground/70 py-[5px]" style={{ borderBottom: '1px solid rgba(255,255,255,0.04)', fontSize: 11, paddingLeft: 12 }}>· {d}</p>
                ))}
                <p className="text-[9px] text-muted-foreground/50 pl-3 pt-1">+{masterContext.decisions.length - 3} more...</p>
              </div>
            </div>

            {/* Questions */}
            <div className="mb-3">
              <p className="text-[11px] font-bold text-[hsl(45_80%_55%)] mb-1.5" style={{ borderLeft: '3px solid #fbbf24', paddingLeft: 10, letterSpacing: '0.08em' }}>
                Open Questions ({masterContext.questions.length})
              </p>
              <div className="space-y-0">
                {masterContext.questions.map((q, i) => (
                  <p key={i} className="text-foreground/70 py-[5px]" style={{ borderBottom: '1px solid rgba(255,255,255,0.04)', fontSize: 11, paddingLeft: 12 }}>· {q.text} <span className="text-muted-foreground">({q.owner})</span></p>
                ))}
              </div>
            </div>

            {/* Handoffs */}
            <div className="mb-3">
              <p className="text-[11px] font-bold text-muted-foreground mb-1.5" style={{ borderLeft: '3px solid #34d399', paddingLeft: 10, letterSpacing: '0.08em' }}>
                Recent Handoffs (1)
              </p>
              <p className="text-foreground/70 py-[5px]" style={{ borderBottom: '1px solid rgba(255,255,255,0.04)', fontSize: 11, paddingLeft: 12 }}>· {masterContext.handoffs[0].from} → {masterContext.handoffs[0].to} · {masterContext.handoffs[0].time} ✓</p>
            </div>

            {/* Conflict */}
            <div className="mb-3">
              <p className="text-[11px] font-bold text-destructive mb-1.5" style={{ borderLeft: '3px solid #f87171', paddingLeft: 10, letterSpacing: '0.08em' }}>
                Conflicts Detected (1)
              </p>
              {conflictResolved ? (
                <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-[10px] text-[hsl(142_70%_45%)] pl-3">✓ Resolved</motion.p>
              ) : (
                <div className="rounded-[10px] p-[10px_12px]" style={{ background: 'rgba(239,68,68,0.06)', border: '1px solid rgba(239,68,68,0.2)' }}>
                  <p className="text-[10px] text-foreground/70">{masterContext.conflict.text}</p>
                  <button onClick={() => setConflictResolved(true)}
                    className="mt-1 text-[9px] px-2.5 py-[3px] rounded-[6px] transition-colors"
                    style={{
                      background: 'linear-gradient(135deg, rgba(239,68,68,0.2), rgba(220,38,38,0.15))',
                      border: '1px solid rgba(239,68,68,0.3)',
                      color: '#f87171',
                    }}>
                    Resolve
                  </button>
                </div>
              )}
            </div>

            <HealthDonut />

            {/* Privacy Controls */}
            <div className="mt-3 pt-3 border-t border-[hsl(0_0%_100%/0.06)]">
              <p className="text-[10px] font-semibold text-muted-foreground mb-2">🔒 Privacy Controls</p>
              <div className="space-y-2">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-[9px] text-foreground/70 leading-tight">Auto-share sessions to Master Context</span>
                  <Switch checked={autoShare} onCheckedChange={setAutoShare} className="scale-[0.6] origin-right" />
                </div>
                <div className="flex items-center justify-between gap-2">
                  <span className="text-[9px] text-foreground/70 leading-tight">Last session marked private</span>
                  <Switch checked={lastPrivate} onCheckedChange={setLastPrivate} className="scale-[0.6] origin-right" />
                </div>
              </div>
              <p className="text-[8px] text-muted-foreground/40 mt-1.5">Private sessions are only visible to you</p>
            </div>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="flex items-center justify-between px-4 py-2 flex-shrink-0" style={{ background: 'rgba(255,255,255,0.02)', borderTop: '1px solid rgba(255,255,255,0.05)' }}>
          <div className="flex items-center gap-3">
            {[
              { color: "hsl(0 84% 60%)", label: "Conflict" },
              { color: "hsl(45 80% 55%)", label: "Question" },
              { color: "hsl(142 70% 45%)", label: "Synced" },
            ].map((l) => (
              <span key={l.label} className="flex items-center gap-1 text-[9px] text-muted-foreground">
                <span className="w-1.5 h-1.5 rounded-full" style={{ background: l.color }} />{l.label}
              </span>
            ))}
          </div>
          <div className="flex items-center gap-2">
            <span className="text-[9px] px-2 py-0.5 rounded-md font-medium" style={{ background: 'rgba(99,102,241,0.15)', border: '1px solid rgba(99,102,241,0.3)', color: '#818cf8' }}>☁️ Cloud</span>
            <span className="text-[9px] px-2 py-0.5 rounded-md font-medium" style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.15)', color: 'rgba(255,255,255,0.7)' }}>🖥️ Self-hosted</span>
            <button
              onClick={() => setShowHandoff(true)}
              className="text-[12px] px-4 py-[7px] rounded-lg font-semibold text-white transition-all duration-200"
              style={{
                background: 'linear-gradient(135deg, #7c3aed, #4f46e5)',
                border: 'none',
                boxShadow: '0 4px 16px rgba(124,58,237,0.35)',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.boxShadow = '0 8px 28px rgba(124,58,237,0.5)';
                e.currentTarget.style.transform = 'translateY(-1px)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.boxShadow = '0 4px 16px rgba(124,58,237,0.35)';
                e.currentTarget.style.transform = 'translateY(0)';
              }}
            >
              Generate Handoff
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default InteractiveDemo;

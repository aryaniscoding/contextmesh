import { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import {
  LogOut, Eye, Zap, Lock, X, ChevronRight, MessageSquare,
  CheckCircle2, HelpCircle, AlertTriangle, CircleDot,
  Activity, Search, Shield, User, List, ArrowLeft,
} from "lucide-react";
import { getMemberContext, getMasterContext, markSessionPrivate, getAllTeamContext } from "@/lib/api";

// ───────── Types ─────────
interface TeamData {
  teamId: string;
  teamName: string;
  passcode: string;
  adminName: string;
  members: string[];
  createdAt: string;
}
interface UserData {
  currentUser: string;
  teamId: string;
  isAdmin: boolean;
}

interface ContextEntry {
  id: string;
  category: "chat" | "decision" | "task" | "question" | "conflict";
  title: string;
  summary: string;
  timestamp: string;
  files: string[];
  isPrivate: boolean;
  member: string;
  rawMessages?: any[];
}

// Removed hardcoded SAMPLE_ENTRIES

const CATEGORY_CONFIG = {
  chat: { label: "Raw Chat", icon: MessageSquare, color: "bg-zinc-700 text-zinc-300" },
  decision: { label: "Decision", icon: CircleDot, color: "bg-indigo-500/20 text-indigo-300" },
  task: { label: "Task Complete", icon: CheckCircle2, color: "bg-emerald-500/20 text-emerald-300" },
  question: { label: "Open Question", icon: HelpCircle, color: "bg-amber-500/20 text-amber-300" },
  conflict: { label: "Conflict", icon: AlertTriangle, color: "bg-red-500/20 text-red-300" },
};

const MEMBER_COLORS = [
  "from-violet-500 to-indigo-500",
  "from-cyan-500 to-blue-500",
  "from-emerald-500 to-teal-500",
  "from-amber-500 to-orange-500",
  "from-pink-500 to-rose-500",
  "from-fuchsia-500 to-purple-500",
];

// ───────── Dashboard ─────────
const Dashboard = () => {
  const navigate = useNavigate();
  const [team, setTeam] = useState<TeamData | null>(null);
  const [user, setUser] = useState<UserData | null>(null);
  const [masterContextOn, setMasterContextOn] = useState(true);
  const [loadedPeer, setLoadedPeer] = useState<string | null>(null);
  const [viewingPeer, setViewingPeer] = useState<string | null>(null);
  const [entries, setEntries] = useState<ContextEntry[]>([]);
  const [hoveredMember, setHoveredMember] = useState<string | null>(null);
  const [masterData, setMasterData] = useState<any>(null);
  const [selectedSession, setSelectedSession] = useState<any>(null);
  const [allTeamSessions, setAllTeamSessions] = useState<any[]>([]);
  const [showAllPrompts, setShowAllPrompts] = useState(false);

  useEffect(() => {
    const teamRaw = localStorage.getItem("contextmesh_team");
    const userRaw = localStorage.getItem("contextmesh_currentUser");
    if (!teamRaw || !userRaw) {
      navigate("/");
      return;
    }
    const t = JSON.parse(teamRaw);
    const u = JSON.parse(userRaw);
    setTeam(t);
    setUser(u);

    // Persist Mode 1 toggle
    const toggleState = localStorage.getItem("contextmesh_masterToggle");
    if (toggleState !== null) setMasterContextOn(toggleState === "true");

    // Fetch initial master context
    getMasterContext(t.teamId).then(setMasterData).catch(console.error);
  }, [navigate]);

  // Auto-refresh polling every 15 seconds
  const [refreshKey, setRefreshKey] = useState(0);
  useEffect(() => {
    const interval = setInterval(() => setRefreshKey((k) => k + 1), 15000);
    return () => clearInterval(interval);
  }, []);

  // Re-fetch master context on every refresh tick
  useEffect(() => {
    if (!team) return;
    getMasterContext(team.teamId).then(setMasterData).catch(console.error);
  }, [refreshKey, team]);

  useEffect(() => {
    if (!team || !user) return;
    const target = loadedPeer || viewingPeer || user.currentUser;
    
    getMemberContext(team.teamId, target)
      .then((data) => {
        const mappedEntries: ContextEntry[] = data.sessions.map((s: any) => {
          const firstUserMsg = s.messages?.find((m: any) => m.role === 'user')?.content || "Empty Session";
          const title = firstUserMsg.substring(0, 50) + (firstUserMsg.length > 50 ? "..." : "");
          let summary = s.messages?.find((m: any) => m.role === 'assistant')?.content || "";
          if (summary.length > 150) summary = summary.substring(0, 150) + "...";
          
          return {
            id: String(s.id),
            category: s.decisions?.length ? "decision" : s.questions?.length ? "question" : "chat",
            title,
            summary,
            timestamp: new Date(s.created_at).toLocaleString(),
            files: s.files || [],
            isPrivate: s.is_private,
            member: target,
            rawMessages: s.messages || [],
          };
        });
        setEntries(mappedEntries);
      })
      .catch(console.error);
  }, [loadedPeer, viewingPeer, team, user, refreshKey]);

  const handleToggle = (checked: boolean) => {
    setMasterContextOn(checked);
    localStorage.setItem("contextmesh_masterToggle", String(checked));
  };

  const handleLogout = () => {
    localStorage.removeItem("contextmesh_currentUser");
    navigate("/");
  };

  const handleLoadPeer = (name: string) => {
    setLoadedPeer(name);
    setViewingPeer(null);
    localStorage.setItem("contextmesh_loadedPeer", name);
  };

  const handleRemovePeer = () => {
    setLoadedPeer(null);
    localStorage.removeItem("contextmesh_loadedPeer");
  };

  const handleMarkPrivate = async (id: string) => {
    const entry = entries.find((e) => e.id === id);
    if (!entry) return;
    try {
      await markSessionPrivate(Number(id), !entry.isPrivate);
      setEntries((prev) =>
        prev.map((e) => (e.id === id ? { ...e, isPrivate: !e.isPrivate } : e))
      );
    } catch (e) {
      console.error("Failed to update privacy", e);
    }
  };

  const displayedEntries = useMemo(() => {
    if (loadedPeer) return entries.map((e) => ({ ...e, member: loadedPeer }));
    if (viewingPeer) return entries.map((e) => ({ ...e, member: viewingPeer }));
    return entries.map((e) => ({ ...e, member: user?.currentUser || "" }));
  }, [entries, loadedPeer, viewingPeer, user]);

  if (!team || !user) return null;

  return (
    <div className="min-h-screen bg-[#04040f] text-foreground flex flex-col">
      {/* ─── Header ─── */}
      <header className="h-16 border-b border-[hsl(0_0%_100%/0.06)] bg-[hsl(240_10%_6%/0.8)] backdrop-blur-xl flex items-center justify-between px-6 flex-shrink-0 z-30">
        <a href="/" className="flex items-center gap-2">
          <span className="text-xl animate-logo-glow">⬡</span>
          <span className="font-display text-lg font-bold tracking-tight">ContextMesh</span>
        </a>
        <span className="text-sm text-muted-foreground font-medium hidden sm:block">{team.teamName}</span>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-full bg-gradient-to-br from-violet-500 to-indigo-500 flex items-center justify-center text-xs font-bold">
              {user.currentUser.charAt(0)}
            </div>
            <span className="text-sm text-foreground hidden sm:block">{user.currentUser}</span>
          </div>
          <Button variant="ghost" size="sm" onClick={handleLogout} className="text-muted-foreground hover:text-foreground gap-1.5">
            <LogOut className="h-4 w-4" /> Log out
          </Button>
        </div>
      </header>

      {/* ─── Main 3-Panel Layout ─── */}
      <div className="flex-1 flex overflow-hidden">

        {/* ─── Left Panel: Team Members ─── */}
        <aside className="w-72 border-r border-[hsl(0_0%_100%/0.06)] bg-[hsl(240_10%_4%/0.6)] flex flex-col flex-shrink-0">
          <div className="p-4 border-b border-[hsl(0_0%_100%/0.06)]">
            <h2 className="text-xs font-mono uppercase tracking-widest text-muted-foreground/60 mb-1">Team Members</h2>
            <p className="text-xs text-muted-foreground/40">{team.members.length} member{team.members.length > 1 ? "s" : ""}</p>
          </div>
          <ScrollArea className="flex-1">
            <div className="p-2 space-y-1">
              {team.members.map((name, i) => {
                const isCurrentUser = name === user.currentUser;
                const isLoaded = name === loadedPeer;
                return (
                  <div
                    key={name}
                    className={`relative group rounded-xl px-3 py-3 transition-all duration-200 cursor-pointer ${
                      isCurrentUser
                        ? "border-l-2 border-violet-500 bg-violet-500/5"
                        : isLoaded
                        ? "border-l-2 border-emerald-500 bg-emerald-500/5"
                        : "hover:bg-[hsl(0_0%_100%/0.03)]"
                    }`}
                    onMouseEnter={() => setHoveredMember(name)}
                    onMouseLeave={() => setHoveredMember(null)}
                  >
                    <div className="flex items-center gap-3">
                      <div className={`w-8 h-8 rounded-full bg-gradient-to-br ${MEMBER_COLORS[i % MEMBER_COLORS.length]} flex items-center justify-center text-xs font-bold flex-shrink-0`}>
                        {name.charAt(0)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-medium text-foreground truncate">{name}</span>
                          {isCurrentUser && (
                            <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-violet-500/20 text-violet-300">you</span>
                          )}
                          {isLoaded && (
                            <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300">loaded</span>
                          )}
                        </div>
                        <div className="flex items-center gap-1.5 mt-0.5">
                          <div className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                          <span className="text-[10px] text-muted-foreground/50">Active now</span>
                        </div>
                      </div>
                    </div>

                    {/* Hover actions */}
                    {!isCurrentUser && hoveredMember === name && (
                      <motion.div
                        initial={{ opacity: 0, x: 8 }}
                        animate={{ opacity: 1, x: 0 }}
                        className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1"
                      >
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <button
                              onClick={() => { setViewingPeer(name); setLoadedPeer(null); }}
                              className="w-7 h-7 rounded-lg bg-[hsl(0_0%_100%/0.06)] hover:bg-[hsl(0_0%_100%/0.12)] flex items-center justify-center transition-colors"
                            >
                              <Eye className="h-3.5 w-3.5 text-muted-foreground" />
                            </button>
                          </TooltipTrigger>
                          <TooltipContent>View Context</TooltipContent>
                        </Tooltip>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <button
                              onClick={() => handleLoadPeer(name)}
                              className="w-7 h-7 rounded-lg bg-violet-500/15 hover:bg-violet-500/25 flex items-center justify-center transition-colors"
                            >
                              <Zap className="h-3.5 w-3.5 text-violet-400" />
                            </button>
                          </TooltipTrigger>
                          <TooltipContent>Load into AI →</TooltipContent>
                        </Tooltip>
                      </motion.div>
                    )}
                  </div>
                );
              })}
            </div>
          </ScrollArea>
        </aside>

        {/* ─── Center: Context Feed ─── */}
        <main className="flex-1 flex flex-col bg-background relative overflow-hidden">
          <div className="h-16 border-b border-[hsl(0_0%_100%/0.06)] px-6 flex items-center justify-between flex-shrink-0 bg-background/50 backdrop-blur-sm z-10">
            <div className="flex items-center gap-4">
              <Switch checked={masterContextOn} onCheckedChange={handleToggle} id="mc-toggle" className="data-[state=checked]:bg-violet-600" />
              <label htmlFor="mc-toggle" className="text-sm font-medium text-foreground cursor-pointer select-none">
                Team Context: <span className={masterContextOn ? "text-violet-400" : "text-muted-foreground"}>{masterContextOn ? "ON" : "OFF"}</span>
              </label>
            </div>
            {(loadedPeer || viewingPeer) && (
              <div className="flex items-center gap-2">
                <span className="text-xs text-muted-foreground">Viewing context for</span>
                <span className="text-xs font-semibold px-2 py-1 rounded-md bg-emerald-500/10 text-emerald-400">
                  {loadedPeer || viewingPeer}
                </span>
                <Button size="sm" variant="ghost" className="h-7 px-2 text-muted-foreground hover:text-foreground ml-2" onClick={() => { setLoadedPeer(null); setViewingPeer(null); }}>
                  Clear
                </Button>
              </div>
            )}
          </div>

          <AnimatePresence>
            {loadedPeer && (
              <motion.div
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="absolute top-16 inset-x-0 z-20 border-b border-emerald-500/20 bg-emerald-500/5 backdrop-blur-md"
              >
                <div className="px-5 py-2.5 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Zap className="h-4 w-4 text-emerald-400" />
                    <span className="text-sm text-emerald-300 font-medium">{loadedPeer}'s context loaded</span>
                  </div>
                  <Button size="sm" variant="ghost" onClick={handleRemovePeer} className="text-emerald-400 hover:text-emerald-300 hover:bg-emerald-500/10 h-7 text-xs gap-1">
                    <X className="h-3 w-3" /> Remove
                  </Button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Entries */}
          <ScrollArea className="flex-1">
            <div className="p-5 space-y-3">
              {displayedEntries.map((entry) => {
                const cfg = CATEGORY_CONFIG[entry.category];
                const Icon = cfg.icon;
                return (
                  <motion.div
                    key={entry.id}
                    layout
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: entry.isPrivate ? 0.5 : 1, y: 0 }}
                    className={`rounded-xl border border-[hsl(0_0%_100%/0.06)] bg-[hsl(240_10%_6%/0.6)] p-4 hover:border-[hsl(0_0%_100%/0.1)] transition-all duration-200 cursor-pointer ${
                      entry.isPrivate ? "opacity-50" : ""
                    }`}
                    onClick={() => setSelectedSession({ id: entry.id, messages: entry.rawMessages || [] })}
                  >
                    <div className="flex items-start justify-between mb-2">
                      <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-medium ${cfg.color}`}>
                        <Icon className="h-3 w-3" /> {cfg.label}
                      </span>
                      <div className="flex items-center gap-1.5">
                        {entry.isPrivate && <Lock className="h-3.5 w-3.5 text-amber-400" />}
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <button
                              onClick={(e) => { e.stopPropagation(); handleMarkPrivate(entry.id); }}
                              className="w-6 h-6 rounded-md hover:bg-[hsl(0_0%_100%/0.06)] flex items-center justify-center transition-colors"
                            >
                              <Lock className={`h-3.5 w-3.5 ${entry.isPrivate ? "text-amber-400" : "text-muted-foreground/40"}`} />
                            </button>
                          </TooltipTrigger>
                          <TooltipContent>{entry.isPrivate ? "Make Public" : "Mark Private"}</TooltipContent>
                        </Tooltip>
                      </div>
                    </div>
                    <h4 className="text-sm font-medium text-foreground mb-1">{entry.title}</h4>
                    <p className="text-xs text-muted-foreground leading-relaxed mb-3">{entry.summary}</p>
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] text-muted-foreground/50">{entry.timestamp}</span>
                      <div className="flex items-center gap-1.5 flex-wrap">
                        {entry.files.map((f) => (
                          <span key={f} className="text-[10px] px-2 py-0.5 rounded-full bg-[hsl(0_0%_100%/0.04)] text-muted-foreground/60 font-mono">
                            {f}
                          </span>
                        ))}
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </ScrollArea>
        </main>

        {/* ─── Right Panel: Master Context ─── */}
        <aside className="w-80 bg-[hsl(240_10%_4%/0.6)] flex flex-col flex-shrink-0">
          <div className="p-4 border-b border-[hsl(0_0%_100%/0.06)] flex-shrink-0">
            <div className="flex items-center gap-2 mb-1">
              <span className="text-base">⬡</span>
              <h2 className="text-sm font-semibold text-foreground">Master Context</h2>
              <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300">Live</span>
            </div>
            {masterContextOn && (
              <div className="flex items-center gap-2 mt-2">
                <div className="w-2 h-2 rounded-full bg-violet-400 animate-pulse" />
                <span className="text-[10px] text-violet-300/70">Injecting into all prompts</span>
              </div>
            )}
          </div>

          <ScrollArea className="flex-1">
            <div className="p-4 space-y-5">
              {/* Active Decisions */}
              <section>
                <h3 className="text-xs font-mono uppercase tracking-widest text-muted-foreground/60 mb-3 flex items-center gap-2">
                  <CircleDot className="h-3 w-3 text-indigo-400" /> Active Decisions
                </h3>
                <div className="space-y-2">
                  {masterData?.decisions?.length > 0 ? masterData.decisions.map((d: any, i: number) => (
                    <div key={i} className="rounded-lg bg-[hsl(0_0%_100%/0.03)] border border-[hsl(0_0%_100%/0.05)] p-3">
                      <p className="text-xs text-foreground leading-relaxed">{i + 1}. {d.text || d.decision || (typeof d === 'string' ? d : JSON.stringify(d))}</p>
                      {d.made_by && <span className="text-[10px] text-muted-foreground/50 mt-1 block">by {d.made_by}</span>}
                    </div>
                  )) : (
                    <p className="text-xs text-muted-foreground/50 italic">No decisions recorded yet.</p>
                  )}
                </div>
              </section>

              {/* Open Questions */}
              <section>
                <h3 className="text-xs font-mono uppercase tracking-widest text-amber-400/60 mb-3 flex items-center gap-2">
                  <HelpCircle className="h-3 w-3 text-amber-400" /> Open Questions
                </h3>
                <div className="space-y-2">
                  {masterData?.open_questions?.length > 0 ? masterData.open_questions.map((q: any, i: number) => (
                    <div key={i} className="rounded-lg bg-amber-500/5 border border-amber-500/10 p-3">
                      <p className="text-xs text-amber-200/90 leading-relaxed">{q.question || (typeof q === 'string' ? q : JSON.stringify(q))}</p>
                      {q.flagged_by && <span className="text-[10px] text-amber-400/40 mt-1 block">flagged by {q.flagged_by}</span>}
                    </div>
                  )) : (
                    <p className="text-xs text-muted-foreground/50 italic">No open questions.</p>
                  )}
                </div>
              </section>

              {/* Conflicts Detected */}
              <section>
                <h3 className="text-xs font-mono uppercase tracking-widest text-red-400/60 mb-3 flex items-center gap-2">
                  <AlertTriangle className="h-3 w-3 text-red-400" /> Conflicts Detected
                </h3>
                <div className="space-y-2">
                  {masterData?.conflicts?.length > 0 ? masterData.conflicts.map((c: any, i: number) => (
                    <div key={i} className="rounded-lg bg-red-500/5 border border-red-500/10 p-3">
                      <p className="text-xs text-red-200/90 font-medium mb-1">{c.topic || c.conflict || (typeof c === 'string' ? c : JSON.stringify(c))}</p>
                      {c.member_a && <p className="text-[10px] text-red-300/60">{c.member_a}: {c.says_a} • {c.member_b}: {c.says_b}</p>}
                      <Button size="sm" variant="ghost" className="text-red-400 hover:text-red-300 hover:bg-red-500/10 h-6 text-[10px] mt-2 px-2 gap-1">
                        <ChevronRight className="h-3 w-3" /> Resolve
                      </Button>
                    </div>
                  )) : (
                    <p className="text-xs text-muted-foreground/50 italic">No active conflicts.</p>
                  )}
                </div>
              </section>

              {/* Context Health */}
              <section>
                <h3 className="text-xs font-mono uppercase tracking-widest text-muted-foreground/60 mb-3 flex items-center gap-2">
                  <Activity className="h-3 w-3 text-emerald-400" /> Context Health
                </h3>
                {(() => {
                  const decCount = masterData?.decisions?.length || 0;
                  const qCount = masterData?.open_questions?.length || 0;
                  const cCount = masterData?.conflicts?.length || 0;
                  const total = decCount + qCount + cCount;
                  const healthPct = total > 0 ? Math.round(((decCount) / Math.max(total, 1)) * 100) : (entries.length > 0 ? 50 : 0);
                  return (
                    <div className="flex items-center gap-4 p-3 rounded-lg bg-[hsl(0_0%_100%/0.03)] border border-[hsl(0_0%_100%/0.05)]">
                      <div className="relative w-14 h-14 flex-shrink-0">
                        <svg className="w-14 h-14 -rotate-90" viewBox="0 0 56 56">
                          <circle cx="28" cy="28" r="22" fill="none" stroke="hsl(0 0% 100% / 0.06)" strokeWidth="4" />
                          <circle
                            cx="28" cy="28" r="22" fill="none"
                            stroke="url(#healthGrad)" strokeWidth="4"
                            strokeDasharray={`${(healthPct / 100) * 138.23} ${138.23}`}
                            strokeLinecap="round"
                          />
                          <defs>
                            <linearGradient id="healthGrad" x1="0" y1="0" x2="1" y2="1">
                              <stop offset="0%" stopColor="hsl(263 70% 60%)" />
                              <stop offset="100%" stopColor="hsl(160 84% 50%)" />
                            </linearGradient>
                          </defs>
                        </svg>
                        <span className="absolute inset-0 flex items-center justify-center text-xs font-bold text-foreground">{healthPct}%</span>
                      </div>
                      <div>
                        <p className="text-xs text-foreground font-medium">{healthPct >= 70 ? 'Very Healthy' : healthPct >= 40 ? 'Moderate' : 'Needs Data'}</p>
                        <p className="text-[10px] text-muted-foreground/50 mt-0.5">{decCount} decisions, {qCount} questions, {cCount} conflicts</p>
                      </div>
                    </div>
                  );
                })()}
              </section>

              {/* View All Team Prompts Button */}
              <section>
                <Button
                  variant="outline"
                  className="w-full border-violet-500/20 text-violet-300 hover:bg-violet-500/10 hover:text-violet-200 gap-2 text-xs h-9"
                  onClick={() => {
                    if (team) {
                      getAllTeamContext(team.teamId)
                        .then((data) => {
                          setAllTeamSessions(data.sessions || []);
                          setShowAllPrompts(true);
                        })
                        .catch(console.error);
                    }
                  }}
                >
                  <List className="h-3.5 w-3.5" /> View All Team Prompts
                </Button>
              </section>

              {/* Privacy */}
              <section>
                <h3 className="text-xs font-mono uppercase tracking-widest text-muted-foreground/60 mb-3 flex items-center gap-2">
                  <Shield className="h-3 w-3 text-violet-400" /> Privacy
                </h3>
                <div className="flex items-center justify-between p-3 rounded-lg bg-[hsl(0_0%_100%/0.03)] border border-[hsl(0_0%_100%/0.05)]">
                  <span className="text-xs text-muted-foreground">Last session</span>
                  <span className="text-xs text-muted-foreground/60 flex items-center gap-1">
                    Public <Lock className="h-3 w-3" />
                  </span>
                </div>
              </section>
            </div>
          </ScrollArea>
        </aside>
      </div>

      {/* ─── Prompt Viewer Modal ─── */}
      <Dialog open={!!selectedSession} onOpenChange={(open) => !open && setSelectedSession(null)}>
        <DialogContent className="max-w-2xl bg-[hsl(240_10%_8%)] border-[hsl(0_0%_100%/0.1)] p-0 gap-0 overflow-hidden flex flex-col h-[85vh] sm:rounded-2xl">
          <DialogHeader className="p-4 border-b border-[hsl(0_0%_100%/0.06)] flex-shrink-0">
            <DialogTitle className="text-sm font-semibold text-foreground">
              Session #{selectedSession?.id} — Full Chat
            </DialogTitle>
          </DialogHeader>
          <ScrollArea className="flex-1 w-full">
            <div className="p-4 space-y-3">
              {(selectedSession?.messages || []).map((msg: any, i: number) => (
                <div key={i} className={`rounded-lg p-3 ${msg.role === 'user' ? 'bg-violet-500/10 border border-violet-500/20 ml-8' : 'bg-[hsl(0_0%_100%/0.03)] border border-[hsl(0_0%_100%/0.05)] mr-8'}`}>
                  <span className={`text-[10px] font-mono uppercase tracking-widest ${msg.role === 'user' ? 'text-violet-400' : 'text-emerald-400'}`}>{msg.role}</span>
                  <p className="text-xs text-foreground mt-1 leading-relaxed whitespace-pre-wrap">{msg.content}</p>
                </div>
              ))}
            </div>
          </ScrollArea>
        </DialogContent>
      </Dialog>

      {/* ─── All Team Prompts Modal ─── */}
      <Dialog open={showAllPrompts} onOpenChange={setShowAllPrompts}>
        <DialogContent className="max-w-3xl bg-[hsl(240_10%_8%)] border-[hsl(0_0%_100%/0.1)] p-0 gap-0 overflow-hidden flex flex-col h-[85vh] sm:rounded-2xl">
          <DialogHeader className="p-4 border-b border-[hsl(0_0%_100%/0.06)] flex-shrink-0">
            <DialogTitle className="text-sm font-semibold text-foreground flex items-center gap-2">
              <List className="h-4 w-4 text-violet-400" /> All Team Prompts ({allTeamSessions.length})
            </DialogTitle>
          </DialogHeader>
          <ScrollArea className="flex-1 w-full">
            <div className="p-4 space-y-3">
              {allTeamSessions.map((s: any) => {
                const firstMsg = s.messages?.[0]?.content || 'Empty session';
                const preview = firstMsg.substring(0, 120) + (firstMsg.length > 120 ? '...' : '');
                return (
                  <div
                    key={s.id}
                    onClick={() => { setSelectedSession(s); setShowAllPrompts(false); }}
                    className="rounded-lg bg-[hsl(0_0%_100%/0.03)] border border-[hsl(0_0%_100%/0.05)] p-4 hover:border-violet-500/30 hover:bg-violet-500/5 cursor-pointer transition-all"
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-[10px] font-mono text-violet-400">Session #{s.id} — {s.member_name}</span>
                      <span className="text-[10px] text-muted-foreground/50">{new Date(s.created_at).toLocaleString()}</span>
                    </div>
                    <p className="text-xs text-foreground leading-relaxed">{preview}</p>
                    {s.files?.length > 0 && (
                      <div className="flex gap-1 mt-2 flex-wrap">
                        {s.files.map((f: string, fi: number) => (
                          <span key={fi} className="text-[9px] px-1.5 py-0.5 rounded bg-zinc-800 text-zinc-400">{f}</span>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
              {allTeamSessions.length === 0 && (
                <p className="text-xs text-muted-foreground/50 italic text-center py-8">No team prompts saved yet. Use Claude Code or Cursor to save your first session!</p>
              )}
            </div>
          </ScrollArea>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Dashboard;

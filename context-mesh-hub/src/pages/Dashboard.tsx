import React, { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Input } from "@/components/ui/input";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import {
  LogOut, Eye, Zap, Lock, X, ChevronRight, MessageSquare,
  CheckCircle2, HelpCircle, AlertTriangle, CircleDot,
  Activity, Search, Shield, User, List, ArrowLeft,
  DollarSign, Crown, Users, Key, Copy, Check, EyeOff,
  PackageOpen, Loader2, FileText, AlertCircle, ArrowRight,
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import {
  getMemberContext, getMasterContext, markSessionPrivate,
  getAllTeamContext, getTeamInfo, searchContext, getTeamPasscode,
  getHandoffSnapshot,
} from "@/lib/api";

// ───────── Types ─────────
interface MemberInfo {
  user_id: string;
  name: string;
  email: string;
  role: string;
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
  memberUserId?: string;
  rawMessages?: any[];
}

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
  const { user, signOut, session } = useAuth();

  const [teamId, setTeamId] = useState("");
  const [teamName, setTeamName] = useState("");
  const [teamRole, setTeamRole] = useState("");
  const [members, setMembers] = useState<MemberInfo[]>([]);

  const [masterContextOn, setMasterContextOn] = useState(true);
  const [loadedPeer, setLoadedPeer] = useState<MemberInfo | null>(null);
  const [viewingPeer, setViewingPeer] = useState<MemberInfo | null>(null);
  const [entries, setEntries] = useState<ContextEntry[]>([]);
  const [hoveredMember, setHoveredMember] = useState<string | null>(null);
  const [masterData, setMasterData] = useState<any>(null);
  const [selectedSession, setSelectedSession] = useState<any>(null);
  const [allTeamSessions, setAllTeamSessions] = useState<any[]>([]);
  const [showAllPrompts, setShowAllPrompts] = useState(false);

  // Search
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<any[] | null>(null);
  const [searching, setSearching] = useState(false);

  // Passcode viewer (admin only)
  const [showPasscode, setShowPasscode] = useState(false);
  const [passcode, setPasscode] = useState("");
  const [passcodeCopied, setPasscodeCopied] = useState(false);

  // Handoff snapshot
  const [handoffMember, setHandoffMember] = useState<MemberInfo | null>(null);
  const [handoffData, setHandoffData] = useState<any>(null);
  const [handoffLoading, setHandoffLoading] = useState(false);
  const [handoffError, setHandoffError] = useState("");

  // Init from localStorage
  useEffect(() => {
    const teamRaw = localStorage.getItem("contextmesh_team");
    if (!teamRaw) {
      navigate("/teams");
      return;
    }
    const t = JSON.parse(teamRaw);
    setTeamId(t.teamId);
    setTeamName(t.teamName);
    setTeamRole(t.role || "member");
    // Load passcode from team data or separate storage
    const savedPasscode = t.passcode || localStorage.getItem(`contextmesh_passcode_${t.teamId}`) || "";
    if (savedPasscode) setPasscode(savedPasscode);

    const toggleState = localStorage.getItem("contextmesh_masterToggle");
    if (toggleState !== null) setMasterContextOn(toggleState === "true");
  }, [navigate]);

  // Fetch team info + master context
  const [refreshKey, setRefreshKey] = useState(0);
  useEffect(() => {
    const interval = setInterval(() => setRefreshKey((k) => k + 1), 60000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (!teamId) return;
    const fetchIt = async () => {
      const token = session?.access_token;
      if (!token) return;

      getMasterContext(token, teamId).then(setMasterData).catch(console.error);

      getTeamInfo(token, teamId)
        .then((info) => {
          setMembers(info.members || []);
          setTeamName(info.team_name);
          // Derive role from API (more reliable than localStorage)
          const me = info.members?.find((m: MemberInfo) => m.user_id === user?.id);
          if (me) {
            setTeamRole(me.role);
            // Fetch passcode from API for admins
            if (me.role === "admin") {
              getTeamPasscode(token, teamId)
                .then((data) => { if (data.passcode) setPasscode(data.passcode); })
                .catch(() => {}); // silently fail if not available
            }
          }
        })
        .catch(console.error);
    };
    fetchIt();
  }, [refreshKey, teamId, session?.access_token]);

  // Fetch context entries
  useEffect(() => {
    if (!teamId || !user) return;
    const fetchCtx = async () => {
      const token = session?.access_token;
      if (!token) return;

      const peer = loadedPeer || viewingPeer;
      const targetName = peer?.name;
      // CLI users have IDs like "cli-123" — use member name instead of user ID
      const isCLIUser = peer?.user_id?.startsWith("cli-");
      const targetUserId = peer && !isCLIUser ? peer.user_id : undefined;
      const targetMemberName = isCLIUser ? peer.name : undefined;

      getMemberContext(token, teamId, targetUserId, targetMemberName)
        .then((data) => {
          const mappedEntries: ContextEntry[] = data.sessions.map((s: any) => {
            const firstUserMsg = s.messages?.find((m: any) => m.role === "user")?.content || "Empty Session";
            const title = firstUserMsg.substring(0, 50) + (firstUserMsg.length > 50 ? "..." : "");
            let summary = s.messages?.find((m: any) => m.role === "assistant")?.content || "";
            if (summary.length > 150) summary = summary.substring(0, 150) + "...";

            return {
              id: String(s.id),
              category: s.decisions?.length ? "decision" : s.questions?.length ? "question" : "chat",
              title,
              summary,
              timestamp: new Date(s.created_at).toLocaleString(),
              files: s.files || [],
              isPrivate: s.is_private,
              member: s.member_name || targetName || user.user_metadata?.display_name || "",
              rawMessages: s.messages || [],
            };
          });
          setEntries(mappedEntries);
        })
        .catch(console.error);
    };
    fetchCtx();
  }, [loadedPeer, viewingPeer, teamId, user, refreshKey, session?.access_token]);

  const handleToggle = (checked: boolean) => {
    setMasterContextOn(checked);
    localStorage.setItem("contextmesh_masterToggle", String(checked));
  };

  const handleLogout = async () => {
    await signOut();
    navigate("/login");
  };

  const [loadCopied, setLoadCopied] = useState(false);

  const handleLoadPeer = async (member: MemberInfo) => {
    setLoadedPeer(member);
    setViewingPeer(null);

    // Fetch their sessions and build an AI-ready prompt to copy to clipboard
    const token = session?.access_token;
    if (!token) return;

    try {
      const isCLI = member.user_id?.startsWith("cli-");
      const data = await getMemberContext(
        token, teamId,
        isCLI ? undefined : member.user_id,
        isCLI ? member.name : undefined,
      );
      const sessions = (data.sessions || []).slice(0, 5);

      const sessionSummaries = sessions.map((s: any, i: number) => {
        const userMsgs = (s.messages || [])
          .filter((m: any) => m.role === "user")
          .map((m: any) => m.content.slice(0, 300))
          .join("\n");
        const files = s.files?.length ? `Files: ${s.files.join(", ")}` : "";
        return `[Session ${i + 1} — ${new Date(s.created_at).toLocaleDateString()}]\n${files}${files ? "\n" : ""}${userMsgs}`;
      }).join("\n\n---\n\n");

      const prompt = `You are now being given context from my teammate ${member.name} on our engineering team. Here are their most recent AI sessions:\n\n${sessionSummaries}\n\n---\nUse this context to understand what ${member.name} has been working on. I may ask you to continue their work, answer questions they left open, or review decisions they made.`;

      await navigator.clipboard.writeText(prompt);
      setLoadCopied(true);
      setTimeout(() => setLoadCopied(false), 3000);
    } catch {
      // clipboard copy failed silently — banner still shows
    }
  };

  const handleRemovePeer = () => {
    setLoadedPeer(null);
  };

  const handleMarkPrivate = async (id: string) => {
    const token = session?.access_token;
    if (!token) return;
    const entry = entries.find((e) => e.id === id);
    if (!entry) return;
    try {
      await markSessionPrivate(token, Number(id), !entry.isPrivate);
      setEntries((prev) =>
        prev.map((e) => (e.id === id ? { ...e, isPrivate: !e.isPrivate } : e))
      );
    } catch (e) {
      console.error("Failed to update privacy", e);
    }
  };

  const handleSearch = async () => {
    if (!searchQuery.trim()) {
      setSearchResults(null);
      return;
    }
    const token = session?.access_token;
    if (!token) return;
    setSearching(true);
    try {
      const data = await searchContext(token, teamId, searchQuery.trim());
      setSearchResults(data.results || []);
    } catch (e) {
      console.error("Search failed", e);
    } finally {
      setSearching(false);
    }
  };

  const handleGenerateHandoff = async (member: MemberInfo) => {
    const token = session?.access_token;
    if (!token) return;
    setHandoffMember(member);
    setHandoffData(null);
    setHandoffError("");
    setHandoffLoading(true);
    try {
      const isCLI = member.user_id?.startsWith("cli-");
      const data = await getHandoffSnapshot(
        token, teamId,
        isCLI ? undefined : member.user_id,
        isCLI ? member.name : undefined,
      );
      setHandoffData(data);
    } catch (e: any) {
      setHandoffError(e.message || "Failed to generate handoff");
    } finally {
      setHandoffLoading(false);
    }
  };

  const displayedEntries = useMemo(() => {
    if (loadedPeer) return entries.map((e) => ({ ...e, member: loadedPeer.name }));
    if (viewingPeer) return entries.map((e) => ({ ...e, member: viewingPeer.name }));
    return entries;
  }, [entries, loadedPeer, viewingPeer]);

  const currentUserId = user?.id;
  const displayName = user?.user_metadata?.display_name || user?.email || "";

  if (!teamId || !user) return null;

  return (
    <div className="min-h-screen bg-[#04040f] text-foreground flex flex-col">
      {/* ─── Header ─── */}
      <header className="h-16 border-b border-[hsl(0_0%_100%/0.06)] bg-[hsl(240_10%_6%/0.8)] backdrop-blur-xl flex items-center justify-between px-6 flex-shrink-0 z-30">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="sm" onClick={() => navigate("/teams")} className="text-muted-foreground hover:text-foreground gap-1.5 h-8 px-2">
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <a href="/" className="flex items-center gap-2">
            <span className="text-xl animate-logo-glow">⬡</span>
            <span className="font-display text-lg font-bold tracking-tight">ContextMesh</span>
          </a>
        </div>
        <span className="text-sm text-muted-foreground font-medium hidden sm:block">{teamName}</span>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-full bg-gradient-to-br from-violet-500 to-indigo-500 flex items-center justify-center text-xs font-bold">
              {displayName.charAt(0)}
            </div>
            <span className="text-sm text-foreground hidden sm:block">{displayName}</span>
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
            <p className="text-xs text-muted-foreground/40">{members.length} member{members.length > 1 ? "s" : ""}</p>
          </div>
          <ScrollArea className="flex-1">
            <div className="p-2 space-y-1">
              {members.map((member, i) => {
                const isCurrentUser = member.user_id === currentUserId;
                const isLoaded = member.user_id === loadedPeer?.user_id;
                return (
                  <div
                    key={member.user_id}
                    className={`relative group rounded-xl px-3 py-3 transition-all duration-200 cursor-pointer ${
                      isCurrentUser
                        ? "border-l-2 border-violet-500 bg-violet-500/5"
                        : isLoaded
                        ? "border-l-2 border-emerald-500 bg-emerald-500/5"
                        : "hover:bg-[hsl(0_0%_100%/0.03)]"
                    }`}
                    onMouseEnter={() => setHoveredMember(member.user_id)}
                    onMouseLeave={() => setHoveredMember(null)}
                  >
                    <div className="flex items-center gap-3">
                      <div className={`w-8 h-8 rounded-full bg-gradient-to-br ${MEMBER_COLORS[i % MEMBER_COLORS.length]} flex items-center justify-center text-xs font-bold flex-shrink-0`}>
                        {member.name.charAt(0)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-medium text-foreground truncate">{member.name}</span>
                          {isCurrentUser && (
                            <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-violet-500/20 text-violet-300">you</span>
                          )}
                          {isLoaded && (
                            <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300">loaded</span>
                          )}
                          {member.role === "admin" && (
                            <Crown className="h-3 w-3 text-amber-400" />
                          )}
                        </div>
                        <div className="flex items-center gap-1.5 mt-0.5">
                          <div className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                          <span className="text-[10px] text-muted-foreground/50">{member.email}</span>
                        </div>
                      </div>
                    </div>

                    {!isCurrentUser && hoveredMember === member.user_id && (
                      <motion.div
                        initial={{ opacity: 0, x: 8 }}
                        animate={{ opacity: 1, x: 0 }}
                        className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1"
                      >
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <button
                              onClick={() => { setViewingPeer(member); setLoadedPeer(null); }}
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
                              onClick={() => handleLoadPeer(member)}
                              className="w-7 h-7 rounded-lg bg-violet-500/15 hover:bg-violet-500/25 flex items-center justify-center transition-colors"
                            >
                              <Zap className="h-3.5 w-3.5 text-violet-400" />
                            </button>
                          </TooltipTrigger>
                          <TooltipContent>Copy context prompt for AI</TooltipContent>
                        </Tooltip>
                        {teamRole === "admin" && (
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <button
                                onClick={() => handleGenerateHandoff(member)}
                                className="w-7 h-7 rounded-lg bg-amber-500/15 hover:bg-amber-500/25 flex items-center justify-center transition-colors"
                              >
                                <PackageOpen className="h-3.5 w-3.5 text-amber-400" />
                              </button>
                            </TooltipTrigger>
                            <TooltipContent>Generate Handoff</TooltipContent>
                          </Tooltip>
                        )}
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
                  {loadedPeer?.name || viewingPeer?.name}
                </span>
                {loadedPeer && (
                  <button
                    onClick={() => handleLoadPeer(loadedPeer)}
                    className={`flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-md transition-all duration-200 ${
                      loadCopied
                        ? "bg-emerald-500/15 text-emerald-400"
                        : "bg-violet-500/10 text-violet-400 hover:bg-violet-500/20"
                    }`}
                  >
                    {loadCopied
                      ? <><Check className="h-3 w-3" /> Prompt copied!</>
                      : <><Copy className="h-3 w-3" /> Copy AI prompt</>
                    }
                  </button>
                )}
                <Button size="sm" variant="ghost" className="h-7 px-2 text-muted-foreground hover:text-foreground ml-1" onClick={() => { setLoadedPeer(null); setViewingPeer(null); }}>
                  Clear
                </Button>
              </div>
            )}
          </div>

          {/* Search Bar */}
          <div className="px-5 py-3 border-b border-[hsl(0_0%_100%/0.04)] bg-background/30">
            <div className="flex items-center gap-2">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground/40" />
                <Input
                  placeholder="Semantic search across team context..."
                  value={searchQuery}
                  onChange={(e) => {
                    setSearchQuery(e.target.value);
                    if (!e.target.value.trim()) setSearchResults(null);
                  }}
                  onKeyDown={(e) => e.key === "Enter" && handleSearch()}
                  className="bg-[hsl(0_0%_100%/0.03)] border-[hsl(0_0%_100%/0.06)] h-9 rounded-lg text-sm pl-9 text-foreground placeholder:text-muted-foreground/40"
                />
              </div>
              <Button
                size="sm"
                onClick={handleSearch}
                disabled={searching || !searchQuery.trim()}
                className="h-9 px-4 bg-violet-500/15 text-violet-300 hover:bg-violet-500/25 border-0 text-xs"
              >
                {searching ? "..." : "Search"}
              </Button>
              {searchResults && (
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => { setSearchQuery(""); setSearchResults(null); }}
                  className="h-9 px-2 text-muted-foreground text-xs"
                >
                  Clear
                </Button>
              )}
            </div>
          </div>

          <AnimatePresence>
            {loadedPeer && (
              <motion.div
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="border-b border-emerald-500/20 bg-emerald-500/5 backdrop-blur-md z-20"
              >
                <div className="px-5 py-2.5 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Zap className="h-4 w-4 text-emerald-400" />
                    <span className="text-sm text-emerald-300 font-medium">{loadedPeer.name}'s context loaded</span>
                  </div>
                  <Button size="sm" variant="ghost" onClick={handleRemovePeer} className="text-emerald-400 hover:text-emerald-300 hover:bg-emerald-500/10 h-7 text-xs gap-1">
                    <X className="h-3 w-3" /> Remove
                  </Button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Entries or Search Results */}
          <ScrollArea className="flex-1">
            <div className="p-5 space-y-3">
              {/* Search Results */}
              {searchResults ? (
                <>
                  <p className="text-xs text-muted-foreground/60 mb-2">
                    {searchResults.length} semantic match{searchResults.length !== 1 ? "es" : ""} for "{searchQuery}"
                  </p>
                  {searchResults.map((r: any) => (
                    <motion.div
                      key={r.session_id}
                      layout
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="rounded-xl border border-violet-500/15 bg-[hsl(240_10%_6%/0.6)] p-4 hover:border-violet-500/30 transition-all duration-200"
                    >
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-[10px] font-mono text-violet-400">
                          {r.member_name} — {(r.similarity * 100).toFixed(1)}% match
                        </span>
                        <span className="text-[10px] text-muted-foreground/50">
                          {new Date(r.created_at).toLocaleString()}
                        </span>
                      </div>
                      <p className="text-xs text-foreground leading-relaxed">{r.preview}</p>
                      {r.files?.length > 0 && (
                        <div className="flex gap-1 mt-2 flex-wrap">
                          {r.files.map((f: string, fi: number) => (
                            <span key={fi} className="text-[9px] px-1.5 py-0.5 rounded bg-zinc-800 text-zinc-400">{f}</span>
                          ))}
                        </div>
                      )}
                    </motion.div>
                  ))}
                  {searchResults.length === 0 && (
                    <p className="text-xs text-muted-foreground/50 italic text-center py-8">No matching sessions found.</p>
                  )}
                </>
              ) : (
                /* Regular Entries */
                displayedEntries.map((entry) => {
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
                        <div className="flex items-center gap-2">
                          <span className="text-[10px] text-muted-foreground/50">{entry.timestamp}</span>
                          <span className="text-[10px] text-violet-400/60">by {entry.member}</span>
                        </div>
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
                })
              )}
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
                      <p className="text-xs text-foreground leading-relaxed">{i + 1}. {d.text || d.decision || (typeof d === "string" ? d : JSON.stringify(d))}</p>
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
                      <p className="text-xs text-amber-200/90 leading-relaxed">{q.question || (typeof q === "string" ? q : JSON.stringify(q))}</p>
                      {q.flagged_by && <span className="text-[10px] text-amber-400/40 mt-1 block">flagged by {q.flagged_by}</span>}
                    </div>
                  )) : (
                    <p className="text-xs text-muted-foreground/50 italic">No open questions.</p>
                  )}
                </div>
              </section>

              {/* Conflicts */}
              <section>
                <h3 className="text-xs font-mono uppercase tracking-widest text-red-400/60 mb-3 flex items-center gap-2">
                  <AlertTriangle className="h-3 w-3 text-red-400" /> Conflicts Detected
                </h3>
                <div className="space-y-2">
                  {masterData?.conflicts?.length > 0 ? masterData.conflicts.map((c: any, i: number) => (
                    <div key={i} className="rounded-lg bg-red-500/5 border border-red-500/10 p-3">
                      <p className="text-xs text-red-200/90 font-medium mb-1">{c.topic || c.conflict || (typeof c === "string" ? c : JSON.stringify(c))}</p>
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
                  const healthPct = total > 0 ? Math.round((decCount / Math.max(total, 1)) * 100) : (entries.length > 0 ? 50 : 0);
                  return (
                    <div className="flex items-center gap-4 p-3 rounded-lg bg-[hsl(0_0%_100%/0.03)] border border-[hsl(0_0%_100%/0.05)]">
                      <div className="relative w-14 h-14 flex-shrink-0">
                        <svg className="w-14 h-14 -rotate-90" viewBox="0 0 56 56">
                          <circle cx="28" cy="28" r="22" fill="none" stroke="hsl(0 0% 100% / 0.06)" strokeWidth="4" />
                          <circle cx="28" cy="28" r="22" fill="none" stroke="url(#healthGrad)" strokeWidth="4" strokeDasharray={`${(healthPct / 100) * 138.23} ${138.23}`} strokeLinecap="round" />
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
                        <p className="text-xs text-foreground font-medium">{healthPct >= 70 ? "Very Healthy" : healthPct >= 40 ? "Moderate" : "Needs Data"}</p>
                        <p className="text-[10px] text-muted-foreground/50 mt-0.5">{decCount} decisions, {qCount} questions, {cCount} conflicts</p>
                      </div>
                    </div>
                  );
                })()}
              </section>

              {/* View All Prompts */}
              <section>
                <Button
                  variant="outline"
                  className="w-full border-violet-500/20 text-violet-300 hover:bg-violet-500/10 hover:text-violet-200 gap-2 text-xs h-9"
                  onClick={async () => {
                    const token = session?.access_token;
                    if (token && teamId) {
                      getAllTeamContext(token, teamId)
                        .then((data) => { setAllTeamSessions(data.sessions || []); setShowAllPrompts(true); })
                        .catch(console.error);
                    }
                  }}
                >
                  <List className="h-3.5 w-3.5" /> View All Team Prompts
                </Button>
              </section>

              {/* Admin Section */}
              {teamRole === "admin" && (
                <>
                  {/* Team Passcode */}
                  {passcode && (
                    <section>
                      <h3 className="text-xs font-mono uppercase tracking-widest text-muted-foreground/60 mb-3 flex items-center gap-2">
                        <Key className="h-3 w-3 text-amber-400" /> Team Passcode
                      </h3>
                      <div className="rounded-lg bg-[hsl(240_20%_8%)] border border-amber-500/15 p-3">
                        <div className="flex items-center justify-between">
                          <span className="font-mono text-sm font-bold tracking-wider text-amber-300">
                            {showPasscode ? passcode : "••••••••"}
                          </span>
                          <div className="flex items-center gap-1">
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <button
                                  onClick={() => setShowPasscode(!showPasscode)}
                                  className="w-7 h-7 rounded-md hover:bg-[hsl(0_0%_100%/0.06)] flex items-center justify-center transition-colors"
                                >
                                  {showPasscode ? <EyeOff className="h-3.5 w-3.5 text-muted-foreground" /> : <Eye className="h-3.5 w-3.5 text-muted-foreground" />}
                                </button>
                              </TooltipTrigger>
                              <TooltipContent>{showPasscode ? "Hide" : "Show"}</TooltipContent>
                            </Tooltip>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <button
                                  onClick={() => {
                                    navigator.clipboard.writeText(passcode);
                                    setPasscodeCopied(true);
                                    setTimeout(() => setPasscodeCopied(false), 2000);
                                  }}
                                  className="w-7 h-7 rounded-md hover:bg-[hsl(0_0%_100%/0.06)] flex items-center justify-center transition-colors"
                                >
                                  {passcodeCopied ? <Check className="h-3.5 w-3.5 text-emerald-400" /> : <Copy className="h-3.5 w-3.5 text-muted-foreground" />}
                                </button>
                              </TooltipTrigger>
                              <TooltipContent>{passcodeCopied ? "Copied!" : "Copy"}</TooltipContent>
                            </Tooltip>
                          </div>
                        </div>
                        <p className="text-[10px] text-muted-foreground/40 mt-2">Share this with teammates so they can join</p>
                      </div>
                    </section>
                  )}

                  {/* Usage & Costs */}
                  <section>
                    <Button
                      variant="outline"
                      className="w-full border-emerald-500/20 text-emerald-300 hover:bg-emerald-500/10 hover:text-emerald-200 gap-2 text-xs h-9"
                      onClick={() => navigate("/usage")}
                    >
                      <DollarSign className="h-3.5 w-3.5" /> Usage & Costs
                    </Button>
                  </section>
                </>
              )}

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
        <DialogContent className="max-w-2xl bg-[hsl(240_10%_8%)] border-[hsl(0_0%_100%/0.1)] p-0 gap-0 flex flex-col h-[85vh] sm:rounded-2xl">
          <DialogHeader className="p-4 border-b border-[hsl(0_0%_100%/0.06)] flex-shrink-0">
            <DialogTitle className="text-sm font-semibold text-foreground">
              Session #{selectedSession?.id} — Full Chat
            </DialogTitle>
          </DialogHeader>
          <div className="flex-1 overflow-y-auto overscroll-contain p-4 space-y-3 min-h-0">
            {(selectedSession?.messages || []).map((msg: any, i: number) => (
              <div key={i} className={`rounded-lg p-3 ${msg.role === "user" ? "bg-violet-500/10 border border-violet-500/20 ml-8" : "bg-[hsl(0_0%_100%/0.03)] border border-[hsl(0_0%_100%/0.05)] mr-8"}`}>
                <span className={`text-[10px] font-mono uppercase tracking-widest ${msg.role === "user" ? "text-violet-400" : "text-emerald-400"}`}>{msg.role}</span>
                <p className="text-xs text-foreground mt-1 leading-relaxed whitespace-pre-wrap">{msg.content}</p>
              </div>
            ))}
          </div>
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
                const firstMsg = s.messages?.[0]?.content || "Empty session";
                const preview = firstMsg.substring(0, 120) + (firstMsg.length > 120 ? "..." : "");
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
                <p className="text-xs text-muted-foreground/50 italic text-center py-8">No team prompts saved yet.</p>
              )}
            </div>
          </ScrollArea>
        </DialogContent>
      </Dialog>

      {/* ─── Handoff Snapshot Modal ─── */}
      <Dialog open={!!handoffMember} onOpenChange={(open) => { if (!open) { setHandoffMember(null); setHandoffData(null); setHandoffError(""); } }}>
        <DialogContent className="max-w-2xl bg-[hsl(240_10%_8%)] border-[hsl(0_0%_100%/0.1)] p-0 gap-0 flex flex-col h-[85vh] sm:rounded-2xl">
          <DialogHeader className="p-5 border-b border-[hsl(0_0%_100%/0.06)] flex-shrink-0">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-amber-500/15 flex items-center justify-center">
                <PackageOpen className="h-4 w-4 text-amber-400" />
              </div>
              <div>
                <DialogTitle className="text-sm font-semibold text-foreground">
                  Handoff Snapshot — {handoffMember?.name}
                </DialogTitle>
                <p className="text-[11px] text-muted-foreground/50 mt-0.5">AI-generated handoff document</p>
              </div>
            </div>
          </DialogHeader>

          <div className="flex-1 overflow-y-auto overscroll-contain min-h-0 p-5">
            {handoffLoading && (
              <div className="flex flex-col items-center justify-center h-full gap-4">
                <Loader2 className="h-8 w-8 text-amber-400 animate-spin" />
                <p className="text-sm text-muted-foreground">Analyzing {handoffMember?.name}'s work history...</p>
              </div>
            )}

            {handoffError && (
              <div className="flex items-center gap-3 p-4 rounded-xl bg-red-500/10 border border-red-500/20">
                <AlertCircle className="h-4 w-4 text-red-400 flex-shrink-0" />
                <p className="text-sm text-red-300">{handoffError}</p>
              </div>
            )}

            {handoffData && (
              <div className="space-y-5">
                {/* Summary */}
                <div className="p-4 rounded-xl bg-amber-500/5 border border-amber-500/15">
                  <p className="text-xs font-mono uppercase tracking-widest text-amber-400/70 mb-2">Overview</p>
                  <p className="text-sm text-foreground leading-relaxed">{handoffData.summary}</p>
                  <p className="text-[11px] text-muted-foreground/40 mt-2">Based on {handoffData.session_count} session{handoffData.session_count !== 1 ? "s" : ""}</p>
                </div>

                {/* Key Decisions */}
                {handoffData.key_decisions?.length > 0 && (
                  <Section title="Key Decisions" icon={<CheckCircle2 className="h-3.5 w-3.5 text-indigo-400" />}>
                    {handoffData.key_decisions.map((d: any, i: number) => (
                      <div key={i} className="p-3 rounded-lg bg-[hsl(0_0%_100%/0.03)] border border-[hsl(0_0%_100%/0.05)]">
                        <div className="flex items-start justify-between gap-2">
                          <p className="text-xs text-foreground font-medium">{d.decision}</p>
                          <span className={`text-[10px] px-1.5 py-0.5 rounded font-mono flex-shrink-0 ${d.impact === "high" ? "bg-red-500/15 text-red-400" : d.impact === "medium" ? "bg-amber-500/15 text-amber-400" : "bg-zinc-500/15 text-zinc-400"}`}>{d.impact}</span>
                        </div>
                        {d.context && <p className="text-[11px] text-muted-foreground/60 mt-1">{d.context}</p>}
                      </div>
                    ))}
                  </Section>
                )}

                {/* Open Work */}
                {handoffData.open_work?.length > 0 && (
                  <Section title="Open Work" icon={<CircleDot className="h-3.5 w-3.5 text-cyan-400" />}>
                    {handoffData.open_work.map((w: any, i: number) => (
                      <div key={i} className="p-3 rounded-lg bg-[hsl(0_0%_100%/0.03)] border border-[hsl(0_0%_100%/0.05)]">
                        <div className="flex items-start gap-2">
                          <span className={`text-[10px] px-1.5 py-0.5 rounded font-mono flex-shrink-0 mt-0.5 ${w.status === "blocked" ? "bg-red-500/15 text-red-400" : w.status === "in_progress" ? "bg-cyan-500/15 text-cyan-400" : "bg-amber-500/15 text-amber-400"}`}>{w.status?.replace("_", " ")}</span>
                          <div>
                            <p className="text-xs text-foreground">{w.task}</p>
                            {w.notes && <p className="text-[11px] text-muted-foreground/50 mt-0.5">{w.notes}</p>}
                          </div>
                        </div>
                      </div>
                    ))}
                  </Section>
                )}

                {/* Open Questions */}
                {handoffData.open_questions?.length > 0 && (
                  <Section title="Open Questions" icon={<HelpCircle className="h-3.5 w-3.5 text-amber-400" />}>
                    {handoffData.open_questions.map((q: any, i: number) => (
                      <div key={i} className="flex items-start gap-2 p-3 rounded-lg bg-[hsl(0_0%_100%/0.03)] border border-[hsl(0_0%_100%/0.05)]">
                        <span className={`text-[10px] px-1.5 py-0.5 rounded font-mono flex-shrink-0 mt-0.5 ${q.urgency === "high" ? "bg-red-500/15 text-red-400" : "bg-amber-500/15 text-amber-400"}`}>{q.urgency}</span>
                        <p className="text-xs text-foreground">{q.question}</p>
                      </div>
                    ))}
                  </Section>
                )}

                {/* Files + Dependencies side by side */}
                <div className="grid grid-cols-2 gap-4">
                  {handoffData.files_owned?.length > 0 && (
                    <Section title="Files Owned" icon={<FileText className="h-3.5 w-3.5 text-violet-400" />}>
                      {handoffData.files_owned.map((f: string, i: number) => (
                        <p key={i} className="text-[11px] font-mono text-muted-foreground/70 truncate">{f}</p>
                      ))}
                    </Section>
                  )}
                  {handoffData.dependencies?.length > 0 && (
                    <Section title="Dependencies" icon={<Users className="h-3.5 w-3.5 text-emerald-400" />}>
                      {handoffData.dependencies.map((d: string, i: number) => (
                        <p key={i} className="text-[11px] text-muted-foreground/70">{d}</p>
                      ))}
                    </Section>
                  )}
                </div>

                {/* Recommended First Steps */}
                {handoffData.recommended_first_steps?.length > 0 && (
                  <Section title="Recommended First Steps" icon={<ArrowRight className="h-3.5 w-3.5 text-emerald-400" />}>
                    {handoffData.recommended_first_steps.map((s: string, i: number) => (
                      <div key={i} className="flex items-start gap-2.5">
                        <span className="w-5 h-5 rounded-full bg-emerald-500/15 text-emerald-400 text-[10px] font-bold flex items-center justify-center flex-shrink-0 mt-0.5">{i + 1}</span>
                        <p className="text-xs text-foreground leading-relaxed">{s}</p>
                      </div>
                    ))}
                  </Section>
                )}
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

function Section({ title, icon, children }: { title: string; icon: React.ReactNode; children: React.ReactNode }) {
  return (
    <div>
      <h4 className="flex items-center gap-1.5 text-[11px] font-mono uppercase tracking-widest text-muted-foreground/50 mb-2">
        {icon}{title}
      </h4>
      <div className="space-y-2">{children}</div>
    </div>
  );
}

export default Dashboard;

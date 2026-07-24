import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import {
  Users, Plus, LogIn, ArrowRight, Crown, User,
  AlertCircle, CheckCircle2, Copy, Check, LogOut,
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { createTeam, joinTeam, getMyTeams } from "@/lib/api";

interface TeamCard {
  team_id: string;
  team_name: string;
  role: string;
  member_count: number;
}

const TEAM_COLORS = [
  "from-violet-500 to-indigo-500",
  "from-cyan-500 to-blue-500",
  "from-emerald-500 to-teal-500",
  "from-amber-500 to-orange-500",
  "from-pink-500 to-rose-500",
  "from-fuchsia-500 to-purple-500",
];

const TeamSelector = () => {
  const { user, signOut, session } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [teams, setTeams] = useState<TeamCard[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [showJoin, setShowJoin] = useState(false);

  const fetchTeams = useCallback(async () => {
    const token = session?.access_token;
    if (!token) return;
    try {
      const data = await getMyTeams(token);
      setTeams(data.teams || []);
    } catch (e) {
      console.error("Failed to fetch teams", e);
    } finally {
      setLoading(false);
    }
  }, [session?.access_token]);

  useEffect(() => {
    fetchTeams();
  }, [fetchTeams]);

  const handleSelectTeam = (team: TeamCard) => {
    // Save selected team to localStorage for dashboard
    localStorage.setItem("contextmesh_team", JSON.stringify({
      teamId: team.team_id,
      teamName: team.team_name,
      role: team.role,
      members: [],
    }));
    navigate("/dashboard");
  };

  const handleLogout = async () => {
    await signOut();
    navigate("/login");
  };

  return (
    <div className="min-h-screen bg-[#04040f] relative overflow-hidden">
      {/* Background */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-1/4 left-1/3 w-[500px] h-[500px] bg-violet-500/8 rounded-full blur-[150px]" />
        <div className="absolute bottom-1/4 right-1/3 w-[500px] h-[500px] bg-indigo-500/6 rounded-full blur-[150px]" />
      </div>

      <div className="relative z-10 max-w-4xl mx-auto px-4 py-16">
        {/* Header */}
        <div className="flex items-center justify-between mb-12">
          <div className="flex items-center gap-3">
            <span className="text-3xl animate-logo-glow">⬡</span>
            <div>
              <h1 className="font-display text-2xl font-bold tracking-tight text-foreground">
                Your Teams
              </h1>
              <p className="text-sm text-muted-foreground">
                {user?.email}
              </p>
            </div>
          </div>
          <Button
            variant="ghost"
            onClick={handleLogout}
            className="text-muted-foreground hover:text-foreground gap-1.5"
          >
            <LogOut className="h-4 w-4" /> Sign Out
          </Button>
        </div>

        {/* Team Grid */}
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-48 rounded-2xl bg-[hsl(0_0%_100%/0.03)] border border-[hsl(0_0%_100%/0.06)] animate-pulse" />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {teams.map((team, i) => (
              <motion.div
                key={team.team_id}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
                onClick={() => handleSelectTeam(team)}
                className="group relative rounded-2xl border border-[hsl(0_0%_100%/0.06)] bg-[hsl(240_10%_6%/0.6)] p-6 cursor-pointer hover:border-violet-500/30 hover:bg-violet-500/5 transition-all duration-300"
              >
                {/* Team Avatar */}
                <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${TEAM_COLORS[i % TEAM_COLORS.length]} flex items-center justify-center text-lg font-bold mb-4`}>
                  {team.team_name.charAt(0)}
                </div>

                <h3 className="text-lg font-semibold text-foreground mb-1">
                  {team.team_name}
                </h3>

                <div className="flex items-center gap-3 mb-4">
                  <span className="text-xs text-muted-foreground flex items-center gap-1">
                    <Users className="h-3 w-3" /> {team.member_count} member{team.member_count > 1 ? "s" : ""}
                  </span>
                  {team.role === "admin" && (
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-500/15 text-amber-300 flex items-center gap-1">
                      <Crown className="h-2.5 w-2.5" /> Admin
                    </span>
                  )}
                  {team.role === "member" && (
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-violet-500/15 text-violet-300 flex items-center gap-1">
                      <User className="h-2.5 w-2.5" /> Member
                    </span>
                  )}
                </div>

                <div className="flex items-center gap-1 text-xs text-muted-foreground/50 group-hover:text-violet-300 transition-colors">
                  Open Dashboard <ArrowRight className="h-3 w-3" />
                </div>
              </motion.div>
            ))}

            {/* Create Team Card */}
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: teams.length * 0.05 }}
              onClick={() => setShowCreate(true)}
              className="rounded-2xl border border-dashed border-[hsl(0_0%_100%/0.1)] bg-[hsl(0_0%_100%/0.02)] p-6 cursor-pointer hover:border-violet-500/40 hover:bg-violet-500/5 transition-all duration-300 flex flex-col items-center justify-center min-h-[200px] gap-3"
            >
              <div className="w-12 h-12 rounded-xl bg-violet-500/10 border border-violet-500/20 flex items-center justify-center">
                <Plus className="h-6 w-6 text-violet-400" />
              </div>
              <span className="text-sm font-medium text-muted-foreground">Create a Team</span>
            </motion.div>

            {/* Join Team Card */}
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: (teams.length + 1) * 0.05 }}
              onClick={() => setShowJoin(true)}
              className="rounded-2xl border border-dashed border-[hsl(0_0%_100%/0.1)] bg-[hsl(0_0%_100%/0.02)] p-6 cursor-pointer hover:border-cyan-500/40 hover:bg-cyan-500/5 transition-all duration-300 flex flex-col items-center justify-center min-h-[200px] gap-3"
            >
              <div className="w-12 h-12 rounded-xl bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center">
                <LogIn className="h-6 w-6 text-cyan-400" />
              </div>
              <span className="text-sm font-medium text-muted-foreground">Join a Team</span>
            </motion.div>
          </div>
        )}

        {teams.length === 0 && !loading && (
          <div className="text-center mt-8">
            <p className="text-muted-foreground/60 text-sm">
              You're not part of any team yet. Create one or join with a passcode!
            </p>
          </div>
        )}
      </div>

      {/* Create Team Modal */}
      <CreateTeamDialog
        open={showCreate}
        onOpenChange={setShowCreate}
        onCreated={fetchTeams}
      />

      {/* Join Team Modal */}
      <JoinTeamDialog
        open={showJoin}
        onOpenChange={setShowJoin}
        onJoined={fetchTeams}
      />
    </div>
  );
};

// ─── Create Team Dialog ───
function CreateTeamDialog({
  open, onOpenChange, onCreated,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  onCreated: () => void;
}) {
  const { session } = useAuth();
  const { toast } = useToast();
  const [teamName, setTeamName] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [result, setResult] = useState<{ team_id: string; passcode: string } | null>(null);
  const [copied, setCopied] = useState(false);

  const reset = () => {
    setTeamName("");
    setError("");
    setResult(null);
    setCopied(false);
    setLoading(false);
  };

  const handleCreate = async () => {
    if (teamName.trim().length < 3) {
      setError("Team name must be at least 3 characters");
      return;
    }
    setError("");
    setLoading(true);
    try {
      const token = session?.access_token;
      if (!token) throw new Error("Not authenticated");
      const data = await createTeam(token, teamName.trim());
      setResult({ team_id: data.team_id, passcode: data.passcode });
      onCreated();
    } catch (e: any) {
      setError(e.message || "Failed to create team");
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = async () => {
    if (result) {
      await navigator.clipboard.writeText(result.passcode);
      setCopied(true);
      toast({ title: "Passcode copied!" });
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) reset(); onOpenChange(v); }}>
      <DialogContent className="sm:max-w-[460px] bg-[hsl(240_10%_6%/0.97)] backdrop-blur-2xl border border-[hsl(0_0%_100%/0.08)] shadow-2xl rounded-2xl p-8">
        <DialogTitle className="sr-only">Create a Team</DialogTitle>
        {!result ? (
          <div>
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-xl bg-violet-500/10 border border-violet-500/20 flex items-center justify-center">
                <Users className="h-5 w-5 text-violet-400" />
              </div>
              <h3 className="text-lg font-semibold text-foreground">Create a Team</h3>
            </div>
            <label className="text-sm font-medium text-muted-foreground mb-2 block">Team Name</label>
            <Input
              placeholder="e.g. Acme Engineering"
              value={teamName}
              onChange={(e) => { setTeamName(e.target.value); setError(""); }}
              onKeyDown={(e) => e.key === "Enter" && handleCreate()}
              className="bg-[hsl(0_0%_100%/0.04)] border-[hsl(0_0%_100%/0.1)] focus:border-violet-500/50 h-12 rounded-xl text-foreground placeholder:text-muted-foreground/50 mb-4"
              autoFocus
            />
            {error && (
              <div className="flex items-center gap-2 p-3 rounded-lg bg-red-500/10 border border-red-500/20 mb-4">
                <AlertCircle className="h-4 w-4 text-red-400" />
                <p className="text-xs text-red-400">{error}</p>
              </div>
            )}
            <Button onClick={handleCreate} disabled={loading} className="w-full gradient-btn border-0 text-primary-foreground rounded-xl h-12 text-sm font-semibold gap-2">
              {loading ? (
                <motion.div animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: "linear" }} className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full" />
              ) : (
                <>Create Team <ArrowRight className="h-4 w-4" /></>
              )}
            </Button>
          </div>
        ) : (
          <div className="text-center">
            <CheckCircle2 className="h-16 w-16 text-emerald-400 mx-auto mb-4" />
            <h3 className="text-xl font-bold text-foreground mb-2">Team Created!</h3>
            <p className="text-sm text-muted-foreground mb-6">Share the passcode with your team.</p>
            <div className="mb-3">
              <label className="text-xs text-muted-foreground/60 mb-1 block text-left">Team ID</label>
              <div className="bg-[hsl(0_0%_100%/0.04)] border border-[hsl(0_0%_100%/0.08)] rounded-lg px-4 py-2.5 font-mono text-sm text-foreground text-left">
                {result.team_id}
              </div>
            </div>
            <div className="mb-6">
              <label className="text-xs text-muted-foreground/60 mb-1 block text-left">Passcode</label>
              <div className="bg-[hsl(240_20%_8%)] border border-violet-500/20 rounded-lg px-4 py-3 flex items-center justify-between">
                <span className="font-mono text-lg font-bold text-violet-300 tracking-wider">{result.passcode}</span>
                <Button size="sm" variant="ghost" onClick={handleCopy} className="text-muted-foreground hover:text-foreground gap-1.5 h-8">
                  {copied ? <Check className="h-4 w-4 text-emerald-400" /> : <Copy className="h-4 w-4" />}
                  {copied ? "Copied" : "Copy"}
                </Button>
              </div>
            </div>
            <Button onClick={() => { reset(); onOpenChange(false); }} className="w-full gradient-btn border-0 text-primary-foreground rounded-xl h-12 text-sm font-semibold">
              Done
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

// ─── Join Team Dialog ───
function JoinTeamDialog({
  open, onOpenChange, onJoined,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  onJoined: () => void;
}) {
  const { session } = useAuth();
  const { toast } = useToast();
  const [passcode, setPasscode] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const reset = () => { setPasscode(""); setError(""); setLoading(false); };

  const handleJoin = async () => {
    if (!passcode.trim()) {
      setError("Please enter the team passcode");
      return;
    }
    setError("");
    setLoading(true);
    try {
      const token = session?.access_token;
      if (!token) throw new Error("Not authenticated");
      const data = await joinTeam(token, passcode.trim().toUpperCase());
      toast({ title: `Joined ${data.team_name}!`, description: `You're now a ${data.role}.` });
      onJoined();
      reset();
      onOpenChange(false);
    } catch (e: any) {
      setError(e.message || "Invalid passcode");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) reset(); onOpenChange(v); }}>
      <DialogContent className="sm:max-w-[460px] bg-[hsl(240_10%_6%/0.97)] backdrop-blur-2xl border border-[hsl(0_0%_100%/0.08)] shadow-2xl rounded-2xl p-8">
        <DialogTitle className="sr-only">Join a Team</DialogTitle>
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-xl bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center">
            <LogIn className="h-5 w-5 text-cyan-400" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-foreground">Join a Team</h3>
            <p className="text-xs text-muted-foreground">Enter the passcode your admin shared</p>
          </div>
        </div>
        <label className="text-sm font-medium text-muted-foreground mb-2 block">Team Passcode</label>
        <Input
          placeholder="e.g. MANGO-42-ROCKET"
          value={passcode}
          onChange={(e) => { setPasscode(e.target.value.toUpperCase()); setError(""); }}
          onKeyDown={(e) => e.key === "Enter" && handleJoin()}
          className="bg-[hsl(0_0%_100%/0.04)] border-[hsl(0_0%_100%/0.1)] focus:border-violet-500/50 h-12 rounded-xl text-foreground placeholder:text-muted-foreground/50 font-mono tracking-wider mb-4"
          autoFocus
        />
        {error && (
          <div className="flex items-center gap-2 p-3 rounded-lg bg-red-500/10 border border-red-500/20 mb-4">
            <AlertCircle className="h-4 w-4 text-red-400" />
            <p className="text-xs text-red-400">{error}</p>
          </div>
        )}
        <Button onClick={handleJoin} disabled={loading} className="w-full gradient-btn border-0 text-primary-foreground rounded-xl h-12 text-sm font-semibold gap-2">
          {loading ? (
            <motion.div animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: "linear" }} className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full" />
          ) : (
            <>Join Team <ArrowRight className="h-4 w-4" /></>
          )}
        </Button>
      </DialogContent>
    </Dialog>
  );
}

export default TeamSelector;

import { useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { motion, AnimatePresence } from "framer-motion";
import { CheckCircle2, Copy, ArrowRight, Users, User, Check } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { createTeam } from "@/lib/api";

interface CreateTeamModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const CreateTeamModal = ({ open, onOpenChange }: CreateTeamModalProps) => {
  const { session } = useAuth();
  const [step, setStep] = useState(1);
  const [teamName, setTeamName] = useState("");
  const [adminName, setAdminName] = useState("");
  const [teamId, setTeamId] = useState("");
  const [passcode, setPasscode] = useState("");
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState("");
  const { toast } = useToast();
  const navigate = useNavigate();

  const resetModal = useCallback(() => {
    setStep(1);
    setTeamName("");
    setAdminName("");
    setTeamId("");
    setPasscode("");
    setCopied(false);
    setError("");
  }, []);

  const handleOpenChange = (isOpen: boolean) => {
    if (!isOpen) resetModal();
    onOpenChange(isOpen);
  };

  const [loading, setLoading] = useState(false);

  const handleNext = () => {
    if (teamName.trim().length < 3) {
      setError("Team name must be at least 3 characters");
      return;
    }
    setError("");
    setStep(2);
  };

  const handleCreateTeam = async () => {
    if (adminName.trim().length < 2) {
      setError("Please enter your name");
      return;
    }
    setError("");
    setLoading(true);

    try {
      const token = session?.access_token;
      if (!token) throw new Error("Not authenticated");
      const data = await createTeam(token, teamName.trim());
      
      setTeamId(data.team_id);
      setPasscode(data.passcode);

      // Save to localStorage for frontend state
      const teamData = {
        teamId: data.team_id,
        teamName: teamName.trim(),
        passcode: data.passcode,
        role: "admin",
        adminName: adminName.trim(),
        members: [adminName.trim()],
        createdAt: new Date().toISOString(),
      };
      localStorage.setItem("contextmesh_team", JSON.stringify(teamData));
      // Persist passcode separately so it survives team re-selection
      localStorage.setItem(`contextmesh_passcode_${data.team_id}`, data.passcode);
      localStorage.setItem(
        "contextmesh_currentUser",
        JSON.stringify({
          currentUser: adminName.trim(),
          teamId: data.team_id,
          isAdmin: true,
        })
      );

      setStep(3);
    } catch (err: any) {
      setError(err.message || "Failed to create team on the server");
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = async () => {
    await navigator.clipboard.writeText(passcode);
    setCopied(true);
    toast({ title: "Passcode copied!", description: "Share this with your team members." });
    setTimeout(() => setCopied(false), 2000);
  };

  const handleGoToDashboard = () => {
    onOpenChange(false);
    resetModal();
    navigate("/dashboard");
  };

  const slideVariants = {
    enter: { x: 60, opacity: 0 },
    center: { x: 0, opacity: 1 },
    exit: { x: -60, opacity: 0 },
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-[460px] bg-[hsl(240_10%_6%/0.97)] backdrop-blur-2xl border border-[hsl(0_0%_100%/0.08)] shadow-2xl shadow-violet-500/5 p-0 overflow-hidden rounded-2xl">
        <DialogTitle className="sr-only">Create a Team</DialogTitle>

        {/* Progress bar */}
        <div className="h-1 bg-[hsl(0_0%_100%/0.04)] relative">
          <motion.div
            className="h-full bg-gradient-to-r from-violet-500 to-indigo-500 rounded-full"
            initial={{ width: "33%" }}
            animate={{ width: step === 1 ? "33%" : step === 2 ? "66%" : "100%" }}
            transition={{ duration: 0.4, ease: "easeOut" }}
          />
        </div>

        <div className="p-8 min-h-[340px] flex flex-col">
          <AnimatePresence mode="wait">
            {/* Step 1: Team Name */}
            {step === 1 && (
              <motion.div
                key="step1"
                variants={slideVariants}
                initial="enter"
                animate="center"
                exit="exit"
                transition={{ duration: 0.3 }}
                className="flex flex-col flex-1"
              >
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-10 h-10 rounded-xl bg-violet-500/10 border border-violet-500/20 flex items-center justify-center">
                    <Users className="h-5 w-5 text-violet-400" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-foreground">Create a Team</h3>
                    <p className="text-xs text-muted-foreground">Step 1 of 2</p>
                  </div>
                </div>

                <label className="text-sm font-medium text-muted-foreground mt-6 mb-2">
                  Team Name
                </label>
                <Input
                  placeholder="What do you call your team?"
                  value={teamName}
                  onChange={(e) => { setTeamName(e.target.value); setError(""); }}
                  onKeyDown={(e) => e.key === "Enter" && handleNext()}
                  className="bg-[hsl(0_0%_100%/0.04)] border-[hsl(0_0%_100%/0.1)] focus:border-violet-500/50 h-12 rounded-xl text-foreground placeholder:text-muted-foreground/50"
                  autoFocus
                />
                {error && (
                  <p className="text-xs text-red-400 mt-2">{error}</p>
                )}

                <div className="mt-auto pt-6">
                  <Button
                    onClick={handleNext}
                    className="w-full gradient-btn border-0 text-primary-foreground rounded-xl h-12 text-sm font-semibold gap-2"
                  >
                    Next <ArrowRight className="h-4 w-4" />
                  </Button>
                </div>
              </motion.div>
            )}

            {/* Step 2: Admin Name */}
            {step === 2 && (
              <motion.div
                key="step2"
                variants={slideVariants}
                initial="enter"
                animate="center"
                exit="exit"
                transition={{ duration: 0.3 }}
                className="flex flex-col flex-1"
              >
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-10 h-10 rounded-xl bg-violet-500/10 border border-violet-500/20 flex items-center justify-center">
                    <User className="h-5 w-5 text-violet-400" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-foreground">Your Name</h3>
                    <p className="text-xs text-muted-foreground">Step 2 of 2</p>
                  </div>
                </div>

                <label className="text-sm font-medium text-muted-foreground mt-6 mb-2">
                  Your Name
                </label>
                <Input
                  placeholder="e.g. Arjun Sharma"
                  value={adminName}
                  onChange={(e) => { setAdminName(e.target.value); setError(""); }}
                  onKeyDown={(e) => e.key === "Enter" && handleCreateTeam()}
                  className="bg-[hsl(0_0%_100%/0.04)] border-[hsl(0_0%_100%/0.1)] focus:border-violet-500/50 h-12 rounded-xl text-foreground placeholder:text-muted-foreground/50"
                  autoFocus
                />
                <p className="text-xs text-muted-foreground/60 mt-2">
                  You will be the team admin
                </p>
                {error && (
                  <p className="text-xs text-red-400 mt-1">{error}</p>
                )}

                <div className="mt-auto pt-6">
                  <Button
                    onClick={handleCreateTeam}
                    disabled={loading}
                    className="w-full gradient-btn border-0 text-primary-foreground rounded-xl h-12 text-sm font-semibold gap-2"
                  >
                    {loading ? (
                      <motion.div
                        animate={{ rotate: 360 }}
                        transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                        className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full"
                      />
                    ) : (
                      <>Create Team <ArrowRight className="h-4 w-4" /></>
                    )}
                  </Button>
                </div>
              </motion.div>
            )}

            {/* Step 3: Success */}
            {step === 3 && (
              <motion.div
                key="step3"
                variants={slideVariants}
                initial="enter"
                animate="center"
                exit="exit"
                transition={{ duration: 0.3 }}
                className="flex flex-col flex-1 items-center text-center"
              >
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ type: "spring", stiffness: 200, damping: 12, delay: 0.1 }}
                >
                  <CheckCircle2 className="h-16 w-16 text-emerald-400 mb-4" />
                </motion.div>

                <h3 className="text-xl font-bold text-foreground mb-1">Team Created!</h3>
                <p className="text-sm text-muted-foreground mb-6">
                  Share the passcode with your team so they can join.
                </p>

                {/* Team ID */}
                <div className="w-full mb-3">
                  <label className="text-xs text-muted-foreground/60 mb-1 block text-left">Team ID</label>
                  <div className="bg-[hsl(0_0%_100%/0.04)] border border-[hsl(0_0%_100%/0.08)] rounded-lg px-4 py-2.5 font-mono text-sm text-foreground text-left">
                    {teamId}
                  </div>
                </div>

                {/* Passcode */}
                <div className="w-full mb-6">
                  <label className="text-xs text-muted-foreground/60 mb-1 block text-left">Passcode</label>
                  <div className="bg-[hsl(240_20%_8%)] border border-violet-500/20 rounded-lg px-4 py-3 flex items-center justify-between">
                    <span className="font-mono text-lg font-bold text-violet-300 tracking-wider">
                      {passcode}
                    </span>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={handleCopy}
                      className="text-muted-foreground hover:text-foreground gap-1.5 h-8"
                    >
                      {copied ? <Check className="h-4 w-4 text-emerald-400" /> : <Copy className="h-4 w-4" />}
                      {copied ? "Copied" : "Copy"}
                    </Button>
                  </div>
                </div>

                <Button
                  onClick={handleGoToDashboard}
                  className="w-full gradient-btn border-0 text-primary-foreground rounded-xl h-12 text-sm font-semibold gap-2"
                >
                  Go to Dashboard <ArrowRight className="h-4 w-4" />
                </Button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default CreateTeamModal;

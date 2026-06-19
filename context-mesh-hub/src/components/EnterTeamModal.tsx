import { useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { motion } from "framer-motion";
import { LogIn, ArrowRight, AlertCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { joinTeam } from "@/lib/api";

interface EnterTeamModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const EnterTeamModal = ({ open, onOpenChange }: EnterTeamModalProps) => {
  const [passcode, setPasscode] = useState("");
  const [memberName, setMemberName] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();
  const navigate = useNavigate();

  const resetModal = useCallback(() => {
    setPasscode("");
    setMemberName("");
    setError("");
    setLoading(false);
  }, []);

  const handleOpenChange = (isOpen: boolean) => {
    if (!isOpen) resetModal();
    onOpenChange(isOpen);
  };

  const handleJoin = async () => {
    if (!passcode.trim()) {
      setError("Please enter the team passcode");
      return;
    }
    if (memberName.trim().length < 2) {
      setError("Please enter your name (min 2 characters)");
      return;
    }
    setError("");
    setLoading(true);

    try {
      const data = await joinTeam(passcode.trim().toUpperCase(), memberName.trim());

      // Save user state globally 
      localStorage.setItem("contextmesh_team", JSON.stringify({
        teamId: data.team_id,
        teamName: data.team_name,
        passcode: passcode.trim().toUpperCase(),
        adminName: "", // We don't strictly need to know the admin on member side
        members: data.all_members,
        createdAt: new Date().toISOString()
      }));

      localStorage.setItem(
        "contextmesh_currentUser",
        JSON.stringify({
          currentUser: memberName.trim(),
          teamId: data.team_id,
          isAdmin: false,
        })
      );

      toast({
        title: `Welcome, ${memberName.trim()}!`,
        description: `You've joined ${data.team_name}.`,
      });

      onOpenChange(false);
      resetModal();
      navigate("/dashboard");
    } catch (err: any) {
      setError(err.message || "Incorrect passcode or connection failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-[460px] bg-[hsl(240_10%_6%/0.97)] backdrop-blur-2xl border border-[hsl(0_0%_100%/0.08)] shadow-2xl shadow-violet-500/5 p-0 overflow-hidden rounded-2xl">
        <DialogTitle className="sr-only">Enter Team</DialogTitle>

        {/* Accent bar */}
        <div className="h-1 bg-gradient-to-r from-violet-500/60 via-indigo-500/60 to-cyan-500/60" />

        <div className="p-8">
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
          >
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-xl bg-violet-500/10 border border-violet-500/20 flex items-center justify-center">
                <LogIn className="h-5 w-5 text-violet-400" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-foreground">Enter Your Team</h3>
                <p className="text-xs text-muted-foreground">
                  Join with the passcode your admin shared
                </p>
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium text-muted-foreground mb-2 block">
                  Team Passcode
                </label>
                <Input
                  placeholder="e.g. MANGO-42-ROCKET"
                  value={passcode}
                  onChange={(e) => {
                    setPasscode(e.target.value.toUpperCase());
                    setError("");
                  }}
                  onKeyDown={(e) => e.key === "Enter" && handleJoin()}
                  className={`bg-[hsl(0_0%_100%/0.04)] border-[hsl(0_0%_100%/0.1)] focus:border-violet-500/50 h-12 rounded-xl text-foreground placeholder:text-muted-foreground/50 font-mono tracking-wider ${
                    error && !memberName ? "border-red-500/50" : ""
                  }`}
                  autoFocus
                />
              </div>

              <div>
                <label className="text-sm font-medium text-muted-foreground mb-2 block">
                  Your Name
                </label>
                <Input
                  placeholder="e.g. Priya Mehta"
                  value={memberName}
                  onChange={(e) => { setMemberName(e.target.value); setError(""); }}
                  onKeyDown={(e) => e.key === "Enter" && handleJoin()}
                  className="bg-[hsl(0_0%_100%/0.04)] border-[hsl(0_0%_100%/0.1)] focus:border-violet-500/50 h-12 rounded-xl text-foreground placeholder:text-muted-foreground/50"
                />
              </div>
            </div>

            {/* Error message */}
            {error && (
              <motion.div
                initial={{ opacity: 0, y: -5 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex items-center gap-2 mt-4 p-3 rounded-lg bg-red-500/10 border border-red-500/20"
              >
                <AlertCircle className="h-4 w-4 text-red-400 flex-shrink-0" />
                <p className="text-xs text-red-400">{error}</p>
              </motion.div>
            )}

            <Button
              onClick={handleJoin}
              disabled={loading}
              className="w-full gradient-btn border-0 text-primary-foreground rounded-xl h-12 text-sm font-semibold gap-2 mt-6"
            >
              {loading ? (
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                  className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full"
                />
              ) : (
                <>
                  Join Team <ArrowRight className="h-4 w-4" />
                </>
              )}
            </Button>
          </motion.div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default EnterTeamModal;

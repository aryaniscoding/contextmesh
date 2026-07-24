import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { AlertCircle, ArrowRight, Eye, EyeOff, CheckCircle2 } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";

const Signup = () => {
  const [displayName, setDisplayName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const { signUp } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (displayName.trim().length < 2) {
      setError("Name must be at least 2 characters");
      return;
    }
    if (!email.trim()) {
      setError("Please enter your email");
      return;
    }
    if (password.length < 6) {
      setError("Password must be at least 6 characters");
      return;
    }
    setError("");
    setLoading(true);

    const { error: authError } = await signUp(email.trim(), password, displayName.trim());
    if (authError) {
      setError(authError.message || "Signup failed");
      setLoading(false);
    } else {
      setSuccess(true);
      // Auto-navigate after brief delay
      setTimeout(() => navigate("/teams"), 1500);
    }
  };

  // Password strength
  const strength = password.length === 0 ? 0 : password.length < 6 ? 1 : password.length < 10 ? 2 : 3;
  const strengthColors = ["", "bg-red-500", "bg-amber-500", "bg-emerald-500"];
  const strengthLabels = ["", "Weak", "Good", "Strong"];

  return (
    <div className="min-h-screen bg-[#04040f] flex items-center justify-center relative overflow-hidden">
      {/* Background effects */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-1/3 right-1/3 w-96 h-96 bg-violet-500/10 rounded-full blur-[120px]" />
        <div className="absolute bottom-1/3 left-1/3 w-96 h-96 bg-cyan-500/8 rounded-full blur-[120px]" />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="relative z-10 w-full max-w-md px-4"
      >
        {/* Logo */}
        <div className="text-center mb-8">
          <Link to="/" className="inline-flex items-center gap-2 mb-3">
            <span className="text-3xl animate-logo-glow">⬡</span>
            <span className="font-display text-2xl font-bold tracking-tight text-foreground">
              ContextMesh
            </span>
          </Link>
          <p className="text-sm text-muted-foreground">
            Create your account
          </p>
        </div>

        {/* Card */}
        <div className="bg-[hsl(240_10%_6%/0.97)] backdrop-blur-2xl border border-[hsl(0_0%_100%/0.08)] rounded-2xl shadow-2xl shadow-violet-500/5 p-8">
          {success ? (
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="text-center py-6"
            >
              <CheckCircle2 className="h-16 w-16 text-emerald-400 mx-auto mb-4" />
              <h3 className="text-xl font-bold text-foreground mb-2">Account Created!</h3>
              <p className="text-sm text-muted-foreground">Redirecting to your teams...</p>
            </motion.div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <label className="text-sm font-medium text-muted-foreground mb-2 block">
                  Display Name
                </label>
                <Input
                  placeholder="e.g. Arjun Sharma"
                  value={displayName}
                  onChange={(e) => { setDisplayName(e.target.value); setError(""); }}
                  className="bg-[hsl(0_0%_100%/0.04)] border-[hsl(0_0%_100%/0.1)] focus:border-violet-500/50 h-12 rounded-xl text-foreground placeholder:text-muted-foreground/50"
                  autoFocus
                />
              </div>

              <div>
                <label className="text-sm font-medium text-muted-foreground mb-2 block">
                  Email
                </label>
                <Input
                  type="email"
                  placeholder="you@example.com"
                  value={email}
                  onChange={(e) => { setEmail(e.target.value); setError(""); }}
                  className="bg-[hsl(0_0%_100%/0.04)] border-[hsl(0_0%_100%/0.1)] focus:border-violet-500/50 h-12 rounded-xl text-foreground placeholder:text-muted-foreground/50"
                />
              </div>

              <div>
                <label className="text-sm font-medium text-muted-foreground mb-2 block">
                  Password
                </label>
                <div className="relative">
                  <Input
                    type={showPassword ? "text" : "password"}
                    placeholder="Min 6 characters"
                    value={password}
                    onChange={(e) => { setPassword(e.target.value); setError(""); }}
                    className="bg-[hsl(0_0%_100%/0.04)] border-[hsl(0_0%_100%/0.1)] focus:border-violet-500/50 h-12 rounded-xl text-foreground placeholder:text-muted-foreground/50 pr-12"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground/50 hover:text-muted-foreground transition-colors"
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
                {password.length > 0 && (
                  <div className="flex items-center gap-2 mt-2">
                    <div className="flex-1 h-1 rounded-full bg-[hsl(0_0%_100%/0.06)] overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all duration-300 ${strengthColors[strength]}`}
                        style={{ width: `${(strength / 3) * 100}%` }}
                      />
                    </div>
                    <span className="text-[10px] text-muted-foreground/60">{strengthLabels[strength]}</span>
                  </div>
                )}
              </div>

              {error && (
                <motion.div
                  initial={{ opacity: 0, y: -5 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="flex items-center gap-2 p-3 rounded-lg bg-red-500/10 border border-red-500/20"
                >
                  <AlertCircle className="h-4 w-4 text-red-400 flex-shrink-0" />
                  <p className="text-xs text-red-400">{error}</p>
                </motion.div>
              )}

              <Button
                type="submit"
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
                  <>Create Account <ArrowRight className="h-4 w-4" /></>
                )}
              </Button>
            </form>
          )}

          {!success && (
            <div className="mt-6 text-center">
              <p className="text-sm text-muted-foreground">
                Already have an account?{" "}
                <Link
                  to="/login"
                  className="text-violet-400 hover:text-violet-300 font-medium transition-colors"
                >
                  Sign in
                </Link>
              </p>
            </div>
          )}
        </div>
      </motion.div>
    </div>
  );
};

export default Signup;

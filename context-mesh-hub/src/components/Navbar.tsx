import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Menu, Github, Star, LogIn, Users, LayoutDashboard, UserCircle, LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { motion } from "framer-motion";
import { useAuth } from "@/contexts/AuthContext";
import CreateTeamModal from "./CreateTeamModal";
import EnterTeamModal from "./EnterTeamModal";

const navLinks = [
  { label: "Features", href: "#features" },
  { label: "How It Works", href: "#how-it-works" },
  { label: "Compare", href: "#compare" },
  { label: "Team", href: "#team" },
  { label: "FAQ", href: "#faq" },
];

const Navbar = () => {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);
  const [createTeamOpen, setCreateTeamOpen] = useState(false);
  const [enterTeamOpen, setEnterTeamOpen] = useState(false);

  const handleCreateTeam = () => {
    if (!user) { navigate("/login"); return; }
    setCreateTeamOpen(true);
  };

  const handleEnterTeam = () => {
    if (!user) { navigate("/login"); return; }
    setEnterTeamOpen(true);
  };

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const displayName = user?.user_metadata?.display_name || user?.email?.split("@")[0] || "";

  return (
    <motion.nav
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${scrolled
        ? "bg-background/80 backdrop-blur-xl border-b border-[hsl(0_0%_100%/0.06)]"
        : "bg-transparent"
        }`}
    >
      <div className="container mx-auto flex items-center justify-between px-4 py-4 lg:px-8">
        <a href="#" className="flex items-center gap-2">
          <span className="text-xl animate-logo-glow">⬡</span>
          <span className="font-display text-lg font-bold text-foreground tracking-tight">
            ContextMesh
          </span>
        </a>

        <div className="hidden lg:flex items-center gap-8">
          {navLinks.map((l) => (
            <a
              key={l.href}
              href={l.href}
              className="nav-link-animated text-sm text-muted-foreground hover:text-foreground transition-colors duration-200"
            >
              {l.label}
            </a>
          ))}
        </div>

        {/* Desktop right section */}
        <div className="hidden lg:flex items-center gap-3">
          <a href="https://github.com" target="_blank" rel="noreferrer">
            <Button variant="ghost" size="sm" className="text-muted-foreground hover:text-foreground gap-2">
              <Star className="h-4 w-4" />
              Star on GitHub
            </Button>
          </a>

          {user ? (
            // Logged-in state
            <>
              <Button
                size="sm"
                variant="outline"
                onClick={() => navigate("/teams")}
                className="rounded-full px-5 border-[hsl(0_0%_100%/0.15)] text-foreground hover:bg-[hsl(0_0%_100%/0.06)] hover:border-accent/40 transition-all duration-300 gap-2"
              >
                <LayoutDashboard className="h-4 w-4" />
                My Teams
              </Button>
              <div className="flex items-center gap-2 pl-1">
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-violet-500 to-indigo-500 flex items-center justify-center text-xs font-bold text-white">
                  {displayName.charAt(0).toUpperCase()}
                </div>
                <span className="text-sm text-foreground hidden xl:block">{displayName}</span>
              </div>
              <Button
                size="sm"
                variant="ghost"
                onClick={async () => { await signOut(); navigate("/"); }}
                className="text-muted-foreground hover:text-foreground gap-1.5"
              >
                <LogOut className="h-4 w-4" />
              </Button>
            </>
          ) : (
            // Logged-out state
            <>
              <Button
                size="sm"
                variant="outline"
                onClick={() => navigate("/login")}
                className="rounded-full px-5 border-[hsl(0_0%_100%/0.15)] text-foreground hover:bg-[hsl(0_0%_100%/0.06)] hover:border-accent/40 transition-all duration-300"
              >
                <LogIn className="h-4 w-4 mr-1.5" />
                Log In
              </Button>
              <Button
                size="sm"
                onClick={() => navigate("/signup")}
                className="gradient-btn border-0 text-primary-foreground rounded-full px-5 shimmer-btn relative overflow-hidden"
              >
                Sign Up
              </Button>
            </>
          )}
        </div>

        {/* Mobile menu */}
        <Sheet open={open} onOpenChange={setOpen}>
          <SheetTrigger asChild className="lg:hidden">
            <button className="text-foreground p-2">
              <Menu className="h-5 w-5" />
            </button>
          </SheetTrigger>
          <SheetContent side="right" className="bg-background/95 backdrop-blur-xl border-border w-80">
            <div className="flex flex-col gap-6 mt-12">
              {navLinks.map((l, i) => (
                <motion.a
                  key={l.href}
                  href={l.href}
                  onClick={() => setOpen(false)}
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.06, duration: 0.3 }}
                  className="text-lg text-foreground hover:text-accent transition-colors"
                >
                  {l.label}
                </motion.a>
              ))}
              <div className="flex flex-col gap-3 mt-4">
                {user ? (
                  <>
                    <div className="flex items-center gap-2 px-1 mb-1">
                      <div className="w-8 h-8 rounded-full bg-gradient-to-br from-violet-500 to-indigo-500 flex items-center justify-center text-xs font-bold text-white">
                        {displayName.charAt(0).toUpperCase()}
                      </div>
                      <span className="text-sm text-foreground">{displayName}</span>
                    </div>
                    <Button
                      onClick={() => { setOpen(false); navigate("/teams"); }}
                      className="gradient-btn border-0 text-primary-foreground rounded-full w-full gap-2"
                    >
                      <LayoutDashboard className="h-4 w-4" /> My Teams
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => { setOpen(false); handleEnterTeam(); }}
                      className="w-full gap-2 rounded-full"
                    >
                      <Users className="h-4 w-4" /> Join a Team
                    </Button>
                    <Button
                      variant="ghost"
                      onClick={async () => { setOpen(false); await signOut(); navigate("/"); }}
                      className="w-full gap-2 text-muted-foreground"
                    >
                      <LogOut className="h-4 w-4" /> Sign Out
                    </Button>
                  </>
                ) : (
                  <>
                    <Button
                      variant="outline"
                      onClick={() => { setOpen(false); navigate("/login"); }}
                      className="w-full gap-2 rounded-full"
                    >
                      <LogIn className="h-4 w-4" /> Log In
                    </Button>
                    <Button
                      onClick={() => { setOpen(false); navigate("/signup"); }}
                      className="gradient-btn border-0 text-primary-foreground rounded-full w-full gap-2"
                    >
                      Sign Up
                    </Button>
                  </>
                )}
              </div>
            </div>
          </SheetContent>
        </Sheet>
      </div>

      {/* Modals */}
      <CreateTeamModal open={createTeamOpen} onOpenChange={setCreateTeamOpen} />
      <EnterTeamModal open={enterTeamOpen} onOpenChange={setEnterTeamOpen} />
    </motion.nav>
  );
};

export default Navbar;

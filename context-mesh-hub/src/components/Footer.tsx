import { Github, Linkedin, Twitter } from "lucide-react";

const Footer = () => (
  <footer className="relative border-t border-[hsl(0_0%_100%/0.06)] overflow-hidden">
    {/* Footer glow */}
    <div aria-hidden className="absolute pointer-events-none" style={{ zIndex: 0, top: 0, left: '50%', transform: 'translateX(-50%)', width: 600, height: 300, background: 'radial-gradient(ellipse at center, rgba(79,70,229,0.04) 0%, transparent 70%)' }} />
    {/* Gradient top line */}
    <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-accent/40 to-transparent" />

    <div className="container mx-auto px-4 lg:px-8 py-16 relative z-[1]">
      <div className="grid md:grid-cols-2 gap-12">
        {/* Left */}
        <div>
          <div className="flex items-center gap-2 mb-3">
            <span className="text-lg">⬡</span>
            <span className="font-display text-lg font-bold text-foreground tracking-tight">ContextFabric</span>
          </div>
          <p className="text-sm text-muted-foreground max-w-xs">
            The shared memory layer for AI-assisted teams. No knowledge left behind.
          </p>
          <div className="flex gap-4 mt-5">
            {[
              { icon: Github, href: "https://github.com" },
              { icon: Linkedin, href: "https://linkedin.com" },
              { icon: Twitter, href: "https://twitter.com" },
            ].map((s, i) => (
              <a key={i} href={s.href} target="_blank" rel="noreferrer" className="text-muted-foreground/50 hover:text-accent transition-colors">
                <s.icon className="h-5 w-5" />
              </a>
            ))}
          </div>
        </div>

        {/* Right */}
        <div className="grid grid-cols-2 gap-8">
          <div>
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-4">Product</p>
            {["Features", "How It Works", "Compare", "GitHub"].map((l) => (
              <a key={l} href={l === "GitHub" ? "https://github.com" : `#${l.toLowerCase().replace(/ /g, "-")}`}
                className="block text-sm text-muted-foreground hover:text-foreground transition-colors py-1.5"
              >
                {l}
              </a>
            ))}
          </div>
          <div>
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-4">Team</p>
            {["About", "FAQ", "Contact"].map((l) => (
              <a key={l} href={l === "FAQ" ? "#faq" : l === "About" ? "#team" : "#"}
                className="block text-sm text-muted-foreground hover:text-foreground transition-colors py-1.5"
              >
                {l}
              </a>
            ))}
          </div>
        </div>
      </div>

      <div className="border-t border-[hsl(0_0%_100%/0.06)] mt-12 pt-8 text-center">
        <p className="text-xs text-muted-foreground">
          © 2025 ContextMesh. Built with ❤️ for AI-native teams.
        </p>
      </div>
    </div>
  </footer>
);

export default Footer;

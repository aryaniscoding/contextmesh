import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { ArrowRight, Github } from "lucide-react";

const DeploymentCallout = () => (
  <section className="py-12 relative overflow-hidden">
    {/* Left glow */}
    <div aria-hidden className="absolute pointer-events-none" style={{ zIndex: 0, top: '50%', left: -100, transform: 'translateY(-50%)', width: 500, height: 400, background: 'radial-gradient(ellipse at center, rgba(99,102,241,0.08) 0%, transparent 70%)' }} />
    {/* Right glow */}
    <div aria-hidden className="absolute pointer-events-none" style={{ zIndex: 0, top: '50%', right: -100, transform: 'translateY(-50%)', width: 500, height: 400, background: 'radial-gradient(ellipse at center, rgba(124,58,237,0.06) 0%, transparent 70%)' }} />
    <div className="container mx-auto px-4 lg:px-8 relative z-[1]">
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.6 }}
        className="glass-card rounded-2xl overflow-hidden"
      >
        <div className="grid md:grid-cols-2 relative">
          {/* Vertical divider */}
          <div className="hidden md:block absolute left-1/2 top-6 bottom-6 w-px bg-gradient-to-b from-transparent via-accent/30 to-transparent" />

          {/* Cloud */}
          <div className="p-8 lg:p-10">
            <div className="flex items-center gap-2 mb-4">
              <span className="text-lg">☁️</span>
              <h3 className="font-display text-lg font-bold text-foreground">Cloud Hosted</h3>
            </div>
            <ul className="space-y-2 mb-6">
              {[
                "Up in minutes",
                "Managed infrastructure",
                "Per-seat pricing",
                "SOC2 compliant (planned)",
              ].map((item, i) => (
                <li key={i} className="text-sm text-muted-foreground flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-accent/50" />
                  {item}
                </li>
              ))}
            </ul>
            <Button className="gradient-btn border-0 text-primary-foreground rounded-full px-6 h-10 text-sm font-semibold gap-2">
              Get Early Access <ArrowRight className="h-4 w-4" />
            </Button>
          </div>

          {/* Self-hosted */}
          <div className="p-8 lg:p-10 border-t md:border-t-0 border-[hsl(0_0%_100%/0.06)]">
            <div className="flex items-center gap-2 mb-4">
              <span className="text-lg">🖥️</span>
              <h3 className="font-display text-lg font-bold text-foreground">Self-Hosted</h3>
            </div>
            <ul className="space-y-2 mb-4">
              {[
                "Full data ownership",
                "Deploy via Docker in 1 command:",
              ].map((item, i) => (
                <li key={i} className="text-sm text-muted-foreground flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-muted-foreground/30" />
                  {item}
                </li>
              ))}
            </ul>
            <div className="rounded-lg bg-[hsl(240_12%_8%/0.8)] border border-[hsl(0_0%_100%/0.06)] px-4 py-2.5 mb-4">
              <code className="text-xs text-accent font-mono">docker run contextmesh/server</code>
            </div>
            <ul className="space-y-2 mb-6">
              {[
                "MIT licensed, free forever",
                "Enterprise support available",
              ].map((item, i) => (
                <li key={i} className="text-sm text-muted-foreground flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-muted-foreground/30" />
                  {item}
                </li>
              ))}
            </ul>
            <a href="https://github.com" target="_blank" rel="noreferrer">
              <Button variant="outline" className="glass-card rounded-full px-6 h-10 text-sm font-semibold gap-2 hover:border-accent/40 transition-all duration-300">
                <Github className="h-4 w-4" /> View on GitHub
              </Button>
            </a>
          </div>
        </div>
      </motion.div>
    </div>
  </section>
);

export default DeploymentCallout;

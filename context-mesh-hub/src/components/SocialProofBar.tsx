import { motion } from "framer-motion";

const companies = ["Google", "Anthropic", "Vercel", "Notion", "Figma", "OpenAI", "Stripe", "Linear"];

const SocialProofBar = () => (
  <section className="border-y border-[hsl(0_0%_100%/0.06)] py-8 overflow-hidden relative">
    {/* Section glow */}
    <div aria-hidden className="absolute inset-0 pointer-events-none" style={{ zIndex: 0, background: 'radial-gradient(ellipse 600px 300px at 50% 50%, rgba(99,102,241,0.04) 0%, transparent 100%)' }} />
    <div className="absolute left-0 top-0 bottom-0 w-24 bg-gradient-to-r from-background to-transparent z-10 pointer-events-none" />
    <div className="absolute right-0 top-0 bottom-0 w-24 bg-gradient-to-l from-background to-transparent z-10 pointer-events-none" />

    <motion.div
      initial={{ opacity: 0 }}
      whileInView={{ opacity: 1 }}
      viewport={{ once: true }}
      transition={{ duration: 0.5 }}
      className="text-center mb-6"
    >
      <p className="text-xs text-muted-foreground uppercase tracking-widest font-medium">Trusted by engineers at</p>
    </motion.div>

    <div className="flex animate-marquee whitespace-nowrap">
      {[...companies, ...companies].map((company, i) => (
        <div
          key={i}
          className="inline-flex items-center justify-center px-10 py-2 mx-2 text-muted-foreground/40 hover:text-muted-foreground hover:scale-105 transition-all duration-300 cursor-default"
        >
          <span className="text-lg font-display font-bold tracking-tight">{company}</span>
        </div>
      ))}
    </div>
  </section>
);

export default SocialProofBar;

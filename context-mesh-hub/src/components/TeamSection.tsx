import { Linkedin, Github } from "lucide-react";
import { motion } from "framer-motion";
import SectionHeading from "./SectionHeading";
import { useRef, useCallback } from "react";

const members = [
  { name: "Member 1", role: "AI Systems Engineer", initials: "AS" },
  { name: "Member 2", role: "Full-Stack Developer", initials: "PK" },
  { name: "Member 3", role: "ML Engineer", initials: "RM" },
  { name: "Member 4", role: "Product & Research", initials: "SR" },
];

const TeamCard = ({ m, i }: { m: typeof members[0]; i: number }) => {
  const cardRef = useRef<HTMLDivElement>(null);

  const handleMouse = useCallback((e: React.MouseEvent) => {
    if (!cardRef.current) return;
    const rect = cardRef.current.getBoundingClientRect();
    const cx = rect.left + rect.width / 2;
    const cy = rect.top + rect.height / 2;
    const rx = ((e.clientY - cy) / rect.height) * -8;
    const ry = ((e.clientX - cx) / rect.width) * 8;
    cardRef.current.style.transform = `perspective(600px) rotateX(${rx}deg) rotateY(${ry}deg) translateY(-4px)`;
  }, []);

  const handleLeave = useCallback(() => {
    if (cardRef.current) {
      cardRef.current.style.transform = "perspective(600px) rotateX(0deg) rotateY(0deg) translateY(0px)";
    }
  }, []);

  return (
    <motion.div
      variants={{
        hidden: { opacity: 0, rotateX: 90 },
        show: { opacity: 1, rotateX: 0, transition: { duration: 0.7, type: "spring", stiffness: 80, delay: i * 0.15 } },
      }}
      style={{ perspective: 600 }}
    >
      <div
        ref={cardRef}
        onMouseMove={handleMouse}
        onMouseLeave={handleLeave}
        className="glass-card-hover rounded-2xl p-6 flex flex-col items-center text-center group transition-all duration-200 ease-out"
        style={{ transformStyle: "preserve-3d" }}
      >
        <div className="w-16 h-16 rounded-full flex items-center justify-center mb-4 relative"
          style={{ background: "linear-gradient(135deg, hsl(239 84% 67% / 0.3), hsl(263 70% 50% / 0.3))" }}
        >
          <span className="font-display text-sm font-bold text-foreground">{m.initials}</span>
        </div>
        <h3 className="text-sm font-semibold text-foreground">{m.name}</h3>
        <p className="text-muted-foreground text-xs mt-1">{m.role}</p>
        <div className="flex gap-3 mt-4">
          <a href="https://linkedin.com" target="_blank" rel="noreferrer" className="text-muted-foreground/50 hover:text-accent transition-colors">
            <Linkedin className="h-4 w-4" />
          </a>
          <a href="https://github.com" target="_blank" rel="noreferrer" className="text-muted-foreground/50 hover:text-accent transition-colors">
            <Github className="h-4 w-4" />
          </a>
        </div>
      </div>
    </motion.div>
  );
};

const TeamSection = () => (
  <section id="team" className="py-[160px] relative overflow-hidden">
    {/* Team glow */}
    <div aria-hidden className="absolute pointer-events-none" style={{ zIndex: 0, top: 0, left: '50%', transform: 'translateX(-50%)', width: 800, height: 400, background: 'radial-gradient(ellipse at center, rgba(79,70,229,0.06) 0%, transparent 70%)' }} />
    <div className="container mx-auto px-4 lg:px-8 relative z-[1]">
      <SectionHeading subtitle="A team of engineers obsessed with making AI work better for everyone — not just individuals.">
        Team <span className="text-gradient">ContextMesh</span>
      </SectionHeading>

      <motion.div
        initial="hidden"
        whileInView="show"
        viewport={{ once: true }}
        variants={{ hidden: {}, show: { transition: { staggerChildren: 0.15 } } }}
        className="grid grid-cols-2 lg:grid-cols-4 gap-6 max-w-4xl mx-auto mt-16"
      >
        {members.map((m, i) => (
          <TeamCard key={i} m={m} i={i} />
        ))}
      </motion.div>
    </div>
  </section>
);

export default TeamSection;

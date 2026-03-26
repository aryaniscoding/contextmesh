import { motion } from "framer-motion";
import SectionHeading from "./SectionHeading";

const techItems = [
  "Mem0", "ChromaDB", "LangChain", "Claude API", "FastAPI",
  "Next.js", "PostgreSQL", "Docker", "Redis", "Pinecone",
];

const TechStackSection = () => (
  <section className="py-[120px] relative overflow-hidden">
    <div className="container mx-auto px-4 lg:px-8 relative z-[1]">
      <SectionHeading subtitle="Plugs in via MCP — zero changes to your existing workflow.">
        Built on Best-in-Class <span className="text-gradient">Infrastructure</span>
      </SectionHeading>

      {/* Tech logos with stagger reveal */}
      <motion.div
        initial="hidden"
        whileInView="show"
        viewport={{ once: true }}
        variants={{ hidden: {}, show: { transition: { staggerChildren: 0.08 } } }}
        className="flex flex-wrap justify-center gap-4 mt-12"
      >
        {techItems.map((tech, i) => (
          <motion.div
            key={tech}
            variants={{
              hidden: { opacity: 0, scale: 0.3, filter: "blur(20px)" },
              show: { opacity: 1, scale: 1, filter: "blur(0px)", transition: { duration: 0.5, type: "spring" } },
            }}
            className="inline-flex items-center justify-center px-6 py-3 glass-card rounded-xl text-muted-foreground/60 hover:text-foreground hover:border-accent/30 transition-all duration-300 cursor-default"
            style={{ animation: `float-tech ${3 + (i % 3) * 0.5}s ease-in-out infinite`, animationDelay: `${i * 0.3}s` }}
          >
            <span className="text-sm font-medium">{tech}</span>
          </motion.div>
        ))}
      </motion.div>

      {/* Marquee row */}
      <motion.div
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        viewport={{ once: true }}
        transition={{ duration: 0.5, delay: 0.5 }}
        className="mt-8 overflow-hidden relative"
      >
        <div className="absolute left-0 top-0 bottom-0 w-20 bg-gradient-to-r from-background to-transparent z-10 pointer-events-none" />
        <div className="absolute right-0 top-0 bottom-0 w-20 bg-gradient-to-l from-background to-transparent z-10 pointer-events-none" />
        <div className="flex animate-marquee whitespace-nowrap">
          {[...techItems, ...techItems].map((tech, i) => (
            <div key={i} className="inline-flex items-center justify-center px-8 py-3 mx-3 text-muted-foreground/40 hover:text-foreground transition-all duration-300 cursor-default">
              <span className="text-sm font-medium">{tech}</span>
            </div>
          ))}
        </div>
      </motion.div>
    </div>
  </section>
);

export default TechStackSection;

import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { motion } from "framer-motion";
import SectionHeading from "./SectionHeading";
import { QuestionConstellationSVG } from "./svg/SectionSVGs";

const faqs = [
  {
    q: "How does ContextFabric capture AI session data?",
    a: "It installs as an MCP server — compatible with Claude, Cursor, GitHub Copilot, and any MCP-enabled tool. After each session, it silently generates a structured JSON summary. No manual input. No workflow changes.",
  },
  {
    q: "Is my individual context private?",
    a: "Completely. Raw session data never leaves your instance. Only structured summaries — decisions, tasks, file references — are contributed to the team Master Context, with role-based access controls.",
  },
  {
    q: "What happens when a team member leaves?",
    a: "One click generates a full Handoff Snapshot — every decision, every open question, every dependency they touched — formatted and ready to initialize their replacement's AI context.",
  },
  {
    q: "Which AI tools does it integrate with?",
    a: "Any tool supporting the Model Context Protocol (MCP): Claude, Cursor, GitHub Copilot, Cline, Windsurf, and custom agents. If it speaks MCP, ContextFabric works with it.",
  },
  {
    q: "Does it require changing how we work?",
    a: "No. ContextFabric runs silently in the background. Your team keeps their existing tools and habits. The only change: nothing gets lost anymore.",
  },
  {
    q: "How is this different from just writing documentation?",
    a: "Documentation requires discipline, time, and maintenance. ContextFabric is automatic — it captures context as a natural byproduct of AI usage, not as extra work.",
  },
  {
    q: "Is it open source?",
    a: "Yes. Fully open-source, MIT licensed, and self-hostable. No vendor lock-in. Enterprise cloud hosting is on the roadmap.",
  },
];

const FAQSection = () => (
  <section id="faq" className="py-[160px] relative overflow-hidden">
    {/* FAQ glow */}
    <div aria-hidden className="absolute pointer-events-none" style={{ zIndex: 0, bottom: 0, left: '50%', transform: 'translateX(-50%)', width: 700, height: 500, background: 'radial-gradient(ellipse at center, rgba(124,58,237,0.05) 0%, transparent 70%)' }} />
    <div className="container mx-auto px-4 lg:px-8 relative z-[1]">
      <QuestionConstellationSVG />
      <SectionHeading>
        Questions? <span className="text-gradient">Answered.</span>
      </SectionHeading>

      <motion.div
        initial={{ opacity: 0, y: 30 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.5 }}
        className="max-w-[800px] mx-auto mt-16"
      >
        <Accordion type="single" collapsible className="space-y-3">
          {faqs.map((faq, i) => (
            <AccordionItem
              key={i}
              value={`faq-${i}`}
              className="glass-card rounded-xl px-6 border border-[hsl(0_0%_100%/0.06)] data-[state=open]:border-accent/20 transition-colors"
            >
              <AccordionTrigger className="text-sm font-medium text-foreground hover:no-underline py-5">
                {faq.q}
              </AccordionTrigger>
              <AccordionContent className="text-sm text-muted-foreground leading-relaxed pb-5">
                {faq.a}
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </motion.div>
    </div>
  </section>
);

export default FAQSection;

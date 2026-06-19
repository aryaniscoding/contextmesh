import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Check, X, Minus } from "lucide-react";
import { motion, useInView } from "framer-motion";
import SectionHeading from "./SectionHeading";
import { useRef } from "react";
import { PodiumSVG } from "./svg/SectionSVGs";

type CellValue = "yes" | "no" | "partial" | "yes-cloud";

const features: { name: string; values: CellValue[] }[] = [
  { name: "Captures raw AI chat history", values: ["yes", "no", "no", "no", "no"] },
  { name: "One-click load teammate's full context", values: ["yes", "no", "no", "no", "no"] },
  { name: "Per-person AI context store", values: ["yes", "yes", "no", "no", "no"] },
  { name: "Auto-synthesized Master Context", values: ["yes", "no", "no", "no", "no"] },
  { name: "Cross-person context loading", values: ["yes", "no", "partial", "no", "no"] },
  { name: "Handoff snapshot generation", values: ["yes", "no", "no", "partial", "yes"] },
  { name: "Semantic search across team history", values: ["yes", "yes", "no", "no", "no"] },
  { name: "Conflict detection", values: ["yes", "no", "no", "no", "no"] },
  { name: "Works with any AI tool", values: ["yes", "yes", "no", "no", "partial"] },
  { name: "Self-hostable / open source", values: ["yes-cloud", "yes", "no", "yes", "yes"] },
];

const columns = ["ContextMesh", "Mem0", "Copilot Spaces", "Manual Docs", "handoff-md"];

const AnimatedCheck = ({ delay }: { delay: number }) => (
  <motion.svg
    viewBox="0 0 24 24"
    className="h-4 w-4 mx-auto"
    initial="hidden"
    whileInView="visible"
    viewport={{ once: true }}
  >
    <motion.path
      d="M5 12l5 5L19 7"
      fill="none"
      stroke="hsl(263 70% 71%)"
      strokeWidth="2.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      variants={{
        hidden: { pathLength: 0, opacity: 0 },
        visible: { pathLength: 1, opacity: 1, transition: { duration: 0.3, delay } },
      }}
    />
  </motion.svg>
);

const CellIcon = ({ value, delay }: { value: CellValue; delay: number }) => {
  if (value === "yes") return <AnimatedCheck delay={delay} />;
  if (value === "yes-cloud") return (
    <span className="flex items-center justify-center gap-1">
      <AnimatedCheck delay={delay} />
      <span className="text-[9px] text-muted-foreground">☁️+🖥️</span>
    </span>
  );
  if (value === "no") return <X className="h-4 w-4 text-muted-foreground/30 mx-auto" />;
  return <Minus className="h-4 w-4 text-yellow-500/70 mx-auto" />;
};

const ComparisonSection = () => {
  const tableRef = useRef(null);
  const inView = useInView(tableRef, { once: true, margin: "-100px" });

  return (
    <section id="compare" className="py-[160px] relative overflow-hidden">
      {/* Comparison glow */}
      <div aria-hidden className="absolute pointer-events-none" style={{ zIndex: 0, top: '50%', left: '30%', width: 700, height: 500, background: 'radial-gradient(ellipse at center, rgba(79,70,229,0.06) 0%, transparent 70%)' }} />
      <div className="container mx-auto px-4 lg:px-8">
        <PodiumSVG />
        <SectionHeading subtitle="Built specifically for team AI context — not adapted from something else.">
          The Only Tool Built <span className="text-gradient">For This</span>
        </SectionHeading>

        <div ref={tableRef} className="overflow-x-auto mt-16 relative">
          <motion.div
            className="h-px bg-gradient-to-r from-transparent via-accent to-transparent mb-8"
            initial={{ scaleX: 0 }}
            whileInView={{ scaleX: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 1.2, ease: "easeInOut" }}
            style={{ transformOrigin: "left" }}
          />

          <motion.div
            initial={{ opacity: 0 }}
            animate={inView ? { opacity: 1 } : {}}
            transition={{ duration: 0.5, delay: 0.5 }}
            className="glass-card rounded-2xl"
          >
            <div className="min-w-[700px]">
              <Table>
                <TableHeader>
                  <TableRow className="border-[hsl(0_0%_100%/0.06)] hover:bg-transparent">
                    <TableHead className="text-foreground font-semibold w-[220px] sticky left-0 bg-card z-10 rounded-tl-2xl">Feature</TableHead>
                    {columns.map((col, i) => (
                      <motion.th
                        key={col}
                        initial={{ opacity: 0, y: -40 }}
                        animate={inView ? { opacity: 1, y: 0 } : {}}
                        transition={{ duration: 0.4, delay: 0.6 + i * 0.15 }}
                        className={`text-center text-sm p-4 ${
                          i === 0 ? "bg-primary/10 text-accent font-bold" : "text-muted-foreground"
                        }`}
                      >
                        {col}
                      </motion.th>
                    ))}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {features.map((f, rowIdx) => (
                    <motion.tr
                      key={f.name}
                      initial={{ opacity: 0, x: -30 }}
                      animate={inView ? { opacity: 1, x: 0 } : {}}
                      transition={{ duration: 0.4, delay: 1.2 + rowIdx * 0.06 }}
                      className="border-[hsl(0_0%_100%/0.04)] hover:bg-[hsl(0_0%_100%/0.02)]"
                    >
                      <TableCell className="text-sm text-foreground/80 sticky left-0 bg-card z-10">{f.name}</TableCell>
                      {f.values.map((v, i) => (
                        <TableCell key={i} className={`text-center ${i === 0 ? "bg-primary/5" : ""}`}>
                          <CellIcon value={v} delay={1.4 + rowIdx * 0.06 + i * 0.05} />
                        </TableCell>
                      ))}
                    </motion.tr>
                  ))}
                </TableBody>
              </Table>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
};

export default ComparisonSection;

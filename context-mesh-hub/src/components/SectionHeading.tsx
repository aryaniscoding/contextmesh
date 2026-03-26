import { ReactNode } from "react";
import { motion } from "framer-motion";

const SectionHeading = ({ children, subtitle, centered = true }: { children: ReactNode; subtitle?: string; centered?: boolean }) => (
  <motion.div
    initial={{ opacity: 0, y: 30 }}
    whileInView={{ opacity: 1, y: 0 }}
    viewport={{ once: true }}
    transition={{ duration: 0.5 }}
    className={centered ? "text-center" : ""}
  >
    <h2 className="font-display text-3xl md:text-4xl lg:text-5xl font-bold text-foreground tracking-tight">
      {children}
    </h2>
    {subtitle && (
      <p className="mt-4 text-muted-foreground text-lg max-w-2xl mx-auto leading-relaxed">
        {subtitle}
      </p>
    )}
  </motion.div>
);

export default SectionHeading;

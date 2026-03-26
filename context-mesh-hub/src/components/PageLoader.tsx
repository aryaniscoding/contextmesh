import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";

const PageLoader = () => {
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    const t = setTimeout(() => setVisible(false), 800);
    return () => clearTimeout(t);
  }, []);

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.3 }}
          className="fixed inset-0 z-[9999] bg-background flex items-center justify-center"
        >
          <span className="font-display text-xl font-bold text-foreground tracking-tight flex items-center gap-2">
            <span className="text-2xl">⬡</span> ContextMesh
          </span>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default PageLoader;

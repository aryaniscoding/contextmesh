import { useEffect, useState } from "react";
import { motion } from "framer-motion";

const ScrollProgress = () => {
  const [progress, setProgress] = useState(0);
  const [flashed, setFlashed] = useState(false);

  useEffect(() => {
    const onScroll = () => {
      const scrollTop = window.scrollY;
      const docHeight = document.documentElement.scrollHeight - window.innerHeight;
      const p = docHeight > 0 ? scrollTop / docHeight : 0;
      setProgress(p);
      if (p >= 0.99 && !flashed) setFlashed(true);
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, [flashed]);

  return (
    <div className="fixed top-0 left-0 right-0 z-[100] h-[2px]">
      <motion.div
        className="h-full origin-left"
        style={{
          scaleX: progress,
          background: flashed
            ? "hsl(187 94% 43%)"
            : "linear-gradient(90deg, hsl(239 84% 67%), hsl(263 70% 60%), hsl(187 94% 43%))",
        }}
        transition={{ duration: 0 }}
      />
      {flashed && (
        <motion.div
          className="absolute inset-0 bg-white"
          initial={{ opacity: 0.6 }}
          animate={{ opacity: 0 }}
          transition={{ duration: 0.3 }}
        />
      )}
    </div>
  );
};

export default ScrollProgress;

import { motion, useScroll, useTransform } from "framer-motion";
import { useIsMobile } from "@/hooks/use-mobile";

const shapes = [
  { depth: 0.2, top: "15%", left: "8%", el: (
    <svg width="40" height="40" viewBox="0 0 40 40" fill="none">
      <polygon points="20,2 36,11 36,29 20,38 4,29 4,11" stroke="hsl(263 70% 60%)" strokeWidth="1" opacity="0.1" />
    </svg>
  )},
  { depth: 0.4, top: "35%", right: "6%", el: (
    <svg width="36" height="36" viewBox="0 0 36 36" fill="none">
      <polygon points="18,3 33,33 3,33" stroke="hsl(239 84% 67%)" strokeWidth="1" opacity="0.08" />
    </svg>
  )},
  { depth: 0.15, top: "55%", left: "5%", el: (
    <svg width="44" height="44" viewBox="0 0 44 44" fill="none">
      <circle cx="22" cy="22" r="18" stroke="hsl(263 70% 60%)" strokeWidth="1" strokeDasharray="4 4" opacity="0.08" />
    </svg>
  )},
  { depth: 0.3, top: "70%", right: "10%", el: (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
      <line x1="12" y1="4" x2="12" y2="20" stroke="hsl(239 84% 67%)" strokeWidth="1" opacity="0.1" />
      <line x1="4" y1="12" x2="20" y2="12" stroke="hsl(239 84% 67%)" strokeWidth="1" opacity="0.1" />
    </svg>
  )},
  { depth: 0.5, top: "25%", right: "15%", el: (
    <svg width="32" height="32" viewBox="0 0 32 32" fill="none">
      <rect x="10" y="2" width="12" height="12" rx="1" transform="rotate(45 16 8)" stroke="hsl(263 70% 60%)" strokeWidth="0.8" opacity="0.08" />
      <rect x="4" y="14" width="8" height="8" rx="1" transform="rotate(45 8 18)" stroke="hsl(263 70% 60%)" strokeWidth="0.8" opacity="0.06" />
    </svg>
  )},
  { depth: 0.25, top: "82%", left: "12%", el: (
    <svg width="60" height="20" viewBox="0 0 60 20" fill="none">
      <path d="M0,10 Q15,0 30,10 Q45,20 60,10" stroke="hsl(239 84% 67%)" strokeWidth="1" opacity="0.07" />
    </svg>
  )},
];

const FloatingShape = ({ shape, index }: { shape: typeof shapes[0]; index: number }) => {
  const { scrollYProgress } = useScroll();
  const y = useTransform(scrollYProgress, [0, 1], [0, -800 * shape.depth]);

  return (
    <motion.div
      className="absolute"
      style={{
        top: shape.top,
        left: shape.left,
        right: shape.right,
        y,
        willChange: "transform",
      }}
    >
      {shape.el}
    </motion.div>
  );
};

const FloatingParallaxSVGs = () => {
  const isMobile = useIsMobile();
  if (isMobile) return null;

  return (
    <div className="fixed inset-0 pointer-events-none z-[1]" aria-hidden>
      {shapes.map((shape, i) => (
        <FloatingShape key={i} shape={shape} index={i} />
      ))}
    </div>
  );
};

export default FloatingParallaxSVGs;

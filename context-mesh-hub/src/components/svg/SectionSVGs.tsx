import { motion, useInView } from "framer-motion";
import { useRef } from "react";

// --- Problem: Breaking Chain ---
export const BreakingChainSVG = () => {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: "-100px" });

  return (
    <motion.svg ref={ref} viewBox="0 0 120 300" className="w-[100px] md:w-[140px] h-auto absolute right-4 md:right-8 top-1/2 -translate-y-1/2 opacity-60" fill="none">
      {[0, 1, 2, 3, 4].map((i) => {
        const y = i * 58 + 10;
        const isBroken = i === 2;
        return (
          <g key={i}>
            <motion.rect
              x="30" y={y} width="60" height="40" rx="12"
              stroke={isBroken ? "hsl(0 84% 60%)" : "hsl(0 84% 60% / 0.4)"}
              strokeWidth="3" fill="none"
              initial={{ opacity: 0 }}
              animate={inView ? { opacity: 1 } : {}}
              transition={{ opacity: { duration: 0.3, delay: i * 0.1 } }}
            />
            {isBroken && inView && (
              <>
                {[
                  { dx: -12, dy: -8, size: 3 },
                  { dx: 15, dy: -5, size: 2 },
                  { dx: -8, dy: 10, size: 2.5 },
                  { dx: 18, dy: 8, size: 2 },
                ].map((d, j) => (
                  <motion.rect
                    key={j}
                    x={60 + d.dx} y={y + 20 + d.dy}
                    width={d.size} height={d.size}
                    fill="hsl(0 84% 60% / 0.6)"
                    initial={{ opacity: 0, scale: 0 }}
                    animate={{ opacity: [0, 1, 0], scale: [0, 1, 0.5], x: d.dx * 2, y: d.dy * 2 }}
                    transition={{ duration: 1.2, delay: 0.8 + j * 0.1 }}
                  />
                ))}
              </>
            )}
          </g>
        );
      })}
    </motion.svg>
  );
};

// --- How It Works: Neural Dendrite ---
export const NeuralDendriteSVG = () => (
  <svg className="absolute left-0 top-0 h-full w-[60px] opacity-[0.12] hidden lg:block" viewBox="0 0 60 600" fill="none">
    <path d="M30,0 Q20,100 30,200 Q40,300 30,400 Q20,500 30,600" stroke="hsl(263 70% 60%)" strokeWidth="1.5" className="animate-dash" strokeDasharray="8 6" />
    {[80, 180, 300, 420, 520].map((y, i) => (
      <g key={i}>
        <path d={`M30,${y} Q${10 + (i % 2) * 40},${y + 20} ${5 + (i % 2) * 50},${y + 30}`}
          stroke="hsl(263 70% 60%)" strokeWidth="1" strokeDasharray="4 4" className="animate-dash" />
        <circle cx={5 + (i % 2) * 50} cy={y + 30} r="3" fill="hsl(263 70% 60% / 0.4)" className="animate-subtle-pulse" />
      </g>
    ))}
  </svg>
);

// --- Features: Panel background SVGs ---
export const FeaturePanelSVGs: Record<string, JSX.Element> = {
  brain: (
    <svg viewBox="0 0 200 200" className="w-[250px] h-[250px] absolute right-4 bottom-4 opacity-[0.06]" fill="none">
      <ellipse cx="100" cy="90" rx="60" ry="55" stroke="hsl(239 84% 67%)" strokeWidth="2" />
      <path d="M70,60 Q90,40 110,60" stroke="hsl(239 84% 67%)" strokeWidth="1.5" />
      <path d="M65,90 L135,90 M80,70 L80,110 M120,70 L120,110" stroke="hsl(239 84% 67%)" strokeWidth="1" strokeDasharray="3 3" />
      <circle cx="90" cy="80" r="4" fill="hsl(239 84% 67% / 0.3)" />
      <circle cx="110" cy="100" r="4" fill="hsl(239 84% 67% / 0.3)" />
    </svg>
  ),
  funnel: (
    <svg viewBox="0 0 200 200" className="w-[250px] h-[250px] absolute right-4 bottom-4 opacity-[0.06]" fill="none">
      <path d="M60,40 L100,100 M100,40 L100,100 M140,40 L100,100 M100,100 L100,170" stroke="hsl(263 70% 60%)" strokeWidth="2" />
      <circle cx="60" cy="35" r="6" stroke="hsl(263 70% 60%)" strokeWidth="1.5" />
      <circle cx="100" cy="35" r="6" stroke="hsl(263 70% 60%)" strokeWidth="1.5" />
      <circle cx="140" cy="35" r="6" stroke="hsl(263 70% 60%)" strokeWidth="1.5" />
      <circle cx="100" cy="175" r="8" stroke="hsl(263 70% 60%)" strokeWidth="2" />
    </svg>
  ),
  sync: (
    <svg viewBox="0 0 200 200" className="w-[250px] h-[250px] absolute right-4 bottom-4 opacity-[0.06]" fill="none">
      <path d="M60,100 A40,40 0 0,1 140,100" stroke="hsl(239 84% 67%)" strokeWidth="2" fill="none" markerEnd="url(#arr)" />
      <path d="M140,100 A40,40 0 0,1 60,100" stroke="hsl(239 84% 67%)" strokeWidth="2" fill="none" markerEnd="url(#arr)" />
      <circle cx="50" cy="100" r="12" stroke="hsl(239 84% 67%)" strokeWidth="1.5" />
      <circle cx="150" cy="100" r="12" stroke="hsl(239 84% 67%)" strokeWidth="1.5" />
      <defs><marker id="arr" viewBox="0 0 6 6" refX="3" refY="3" markerWidth="6" markerHeight="6" orient="auto">
        <path d="M0,0 L6,3 L0,6" fill="hsl(239 84% 67%)" />
      </marker></defs>
    </svg>
  ),
  handoff: (
    <svg viewBox="0 0 200 200" className="w-[250px] h-[250px] absolute right-4 bottom-4 opacity-[0.06]" fill="none">
      <path d="M80,140 Q60,130 60,110 Q60,90 80,80 Q100,70 110,80" stroke="hsl(263 70% 60%)" strokeWidth="2" />
      <path d="M110,80 Q120,70 130,80 Q150,100 120,110" stroke="hsl(263 70% 60%)" strokeWidth="2" />
      <circle cx="100" cy="60" r="14" stroke="hsl(263 70% 60%)" strokeWidth="2" fill="hsl(263 70% 60% / 0.1)" />
    </svg>
  ),
  search: (
    <svg viewBox="0 0 200 200" className="w-[250px] h-[250px] absolute right-4 bottom-4 opacity-[0.06]" fill="none">
      <circle cx="90" cy="85" r="40" stroke="hsl(239 84% 67%)" strokeWidth="2" />
      <line x1="120" y1="115" x2="160" y2="155" stroke="hsl(239 84% 67%)" strokeWidth="3" strokeLinecap="round" />
      <circle cx="80" cy="75" r="4" fill="hsl(239 84% 67% / 0.3)" />
      <circle cx="100" cy="80" r="4" fill="hsl(239 84% 67% / 0.3)" />
      <line x1="80" y1="75" x2="100" y2="80" stroke="hsl(239 84% 67% / 0.3)" strokeWidth="1" />
      <circle cx="85" cy="95" r="3" fill="hsl(239 84% 67% / 0.3)" />
      <line x1="100" y1="80" x2="85" y2="95" stroke="hsl(239 84% 67% / 0.3)" strokeWidth="1" />
    </svg>
  ),
  conflict: (
    <svg viewBox="0 0 200 200" className="w-[250px] h-[250px] absolute right-4 bottom-4 opacity-[0.06]" fill="none">
      <rect x="40" y="60" width="60" height="80" rx="8" stroke="hsl(263 70% 60%)" strokeWidth="2" />
      <rect x="100" y="60" width="60" height="80" rx="8" stroke="hsl(0 84% 60%)" strokeWidth="2" />
      <line x1="100" y1="90" x2="100" y2="120" stroke="hsl(45 80% 55%)" strokeWidth="3" />
      <polygon points="100,80 95,90 105,90" fill="hsl(45 80% 55%)" />
    </svg>
  ),
};

// --- Comparison: Podium ---
export const PodiumSVG = () => (
  <motion.svg
    viewBox="0 0 120 80" className="w-[120px] absolute top-8 right-8 hidden lg:block" fill="none"
    initial={{ opacity: 0, scale: 0.5 }}
    whileInView={{ opacity: 1, scale: 1 }}
    viewport={{ once: true }}
    transition={{ delay: 1.5, type: "spring", stiffness: 100 }}
  >
    <rect x="5" y="40" width="30" height="35" rx="3" fill="hsl(239 84% 67% / 0.15)" stroke="hsl(239 84% 67% / 0.3)" strokeWidth="1" />
    <rect x="40" y="15" width="40" height="60" rx="3" fill="hsl(263 70% 60% / 0.2)" stroke="hsl(263 70% 60% / 0.5)" strokeWidth="1.5" />
    <rect x="85" y="50" width="30" height="25" rx="3" fill="hsl(239 84% 67% / 0.1)" stroke="hsl(239 84% 67% / 0.2)" strokeWidth="1" />
    <text x="60" y="38" textAnchor="middle" fill="hsl(263 70% 71%)" fontSize="5" fontWeight="700" fontFamily="Inter">CF</text>
    <text x="60" y="46" textAnchor="middle" fill="hsl(263 70% 71%)" fontSize="4" fontFamily="Inter">★</text>
  </motion.svg>
);

// --- Team: Connection Web ---
export const TeamConnectionWeb = ({ cardPositions }: { cardPositions?: { x: number; y: number }[] }) => {
  if (!cardPositions || cardPositions.length < 4) return null;
  const cx = cardPositions.reduce((s, p) => s + p.x, 0) / cardPositions.length;
  const cy = cardPositions.reduce((s, p) => s + p.y, 0) / cardPositions.length;

  return (
    <svg className="absolute inset-0 pointer-events-none opacity-[0.08]" fill="none">
      {cardPositions.map((p, i) => (
        <line key={i} x1={p.x} y1={p.y} x2={cx} y2={cy} stroke="hsl(263 70% 60%)" strokeWidth="1" />
      ))}
    </svg>
  );
};

// --- FAQ: Question Constellation ---
export const QuestionConstellationSVG = () => (
  <svg className="absolute right-4 top-1/2 -translate-y-1/2 w-[200px] h-[300px] opacity-[0.05] hidden lg:block animate-spin" style={{ animationDuration: "120s" }} viewBox="0 0 200 300" fill="none">
    {[
      [100, 40], [120, 50], [130, 70], [120, 90], [100, 100],
      [100, 120], [100, 140], [100, 170],
      [100, 200],
    ].map(([x, y], i, arr) => (
      <g key={i}>
        <circle cx={x} cy={y} r="2" fill="hsl(263 70% 60%)" />
        {i < arr.length - 1 && !(i === 7) && (
          <line x1={x} y1={y} x2={arr[i + 1][0]} y2={arr[i + 1][1]} stroke="hsl(263 70% 60%)" strokeWidth="0.5" />
        )}
      </g>
    ))}
  </svg>
);

// --- CTA: Infinity Loop ---
export const InfinityLoopSVG = () => (
  <svg className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[400px] h-[200px] opacity-[0.12]" viewBox="0 0 400 200" fill="none">
    <defs>
      <linearGradient id="infGrad" x1="0" y1="0" x2="1" y2="0">
        <stop offset="0%" stopColor="hsl(239 84% 67%)" />
        <stop offset="50%" stopColor="hsl(263 70% 60%)" />
        <stop offset="100%" stopColor="hsl(187 94% 43%)" />
      </linearGradient>
    </defs>
    <path
      d="M200,100 C200,55 250,20 290,50 C330,80 330,120 290,150 C250,180 200,145 200,100 C200,55 150,20 110,50 C70,80 70,120 110,150 C150,180 200,145 200,100"
      stroke="url(#infGrad)" strokeWidth="2" fill="none"
    />
    <circle r="4" fill="hsl(263 70% 71%)">
      <animateMotion dur="6s" repeatCount="indefinite"
        path="M200,100 C200,55 250,20 290,50 C330,80 330,120 290,150 C250,180 200,145 200,100 C200,55 150,20 110,50 C70,80 70,120 110,150 C150,180 200,145 200,100" />
    </circle>
  </svg>
);

// --- Hero SVGs ---
export const ContextFlowSVG = () => {
  const labels = ["Capture", "Store", "Sync", "Share"];
  return (
    <motion.svg
      viewBox="0 0 60 240" className="w-[50px] md:w-[60px] absolute left-4 md:left-8 top-1/2 -translate-y-1/2 hidden lg:block"
      initial={{ opacity: 0 }}
      animate={{ opacity: 0.6 }}
      transition={{ delay: 1.5, duration: 0.8 }}
    >
      <motion.path
        d="M30,10 L30,230"
        stroke="hsl(263 70% 60%)" strokeWidth="2" fill="none"
        initial={{ pathLength: 0 }}
        animate={{ pathLength: 1 }}
        transition={{ duration: 1.5, delay: 1.5 }}
      />
      {labels.map((l, i) => {
        const y = 30 + i * 58;
        return (
          <g key={i}>
            <motion.circle
              cx="30" cy={y} r="5"
              fill="hsl(263 70% 60% / 0.3)" stroke="hsl(263 70% 60%)" strokeWidth="1.5"
              initial={{ scale: 0 }}
              animate={{ scale: [1, 1.4, 1] }}
              transition={{ delay: 2 + i * 0.3, duration: 1.5, repeat: Infinity, repeatDelay: 2 }}
            />
            <text x="30" y={y + 16} textAnchor="middle" fill="hsl(263 70% 60%)" fontSize="6" fontFamily="Inter">{l}</text>
          </g>
        );
      })}
    </motion.svg>
  );
};

export const NetworkMeshSVG = () => {
  const points = [
    [40, 20], [120, 10], [180, 50], [200, 120],
    [160, 180], [80, 200], [20, 150], [60, 90],
  ];
  return (
    <svg className="absolute -top-10 -right-10 w-[250px] md:w-[300px] h-[250px] md:h-[300px] opacity-[0.08] hidden lg:block" viewBox="0 0 220 220" fill="none">
      {points.map((p, i) =>
        points.slice(i + 1).map((q, j) => (
          <line key={`${i}-${j}`} x1={p[0]} y1={p[1]} x2={q[0]} y2={q[1]} stroke="hsl(239 84% 67%)" strokeWidth="0.5" />
        ))
      )}
      {points.map(([x, y], i) => (
        <circle key={i} cx={x} cy={y} r="3" fill="hsl(239 84% 67% / 0.4)" />
      ))}
      {[[0, 1, 7], [2, 3, 4], [5, 6, 7]].map((tri, i) => (
        <polygon key={i} points={tri.map(idx => `${points[idx][0]},${points[idx][1]}`).join(" ")}
          fill="hsl(239 84% 67% / 0.03)" />
      ))}
    </svg>
  );
};

export const DataPacketsSVG = () => (
  <div className="absolute inset-0 pointer-events-none hidden lg:block">
    {[
      { x: "10%", y: "30%", size: 10, delay: 0, dur: 4 },
      { x: "85%", y: "20%", size: 14, delay: 1, dur: 5 },
      { x: "75%", y: "70%", size: 8, delay: 2, dur: 3.5 },
      { x: "15%", y: "75%", size: 12, delay: 0.5, dur: 4.5 },
      { x: "50%", y: "15%", size: 10, delay: 1.5, dur: 3.8 },
    ].map((d, i) => (
      <motion.div
        key={i}
        className="absolute"
        style={{ left: d.x, top: d.y, willChange: "transform" }}
        animate={{ y: [0, -12, 0, 8, 0], x: [0, 6, 0, -6, 0] }}
        transition={{ duration: d.dur, delay: d.delay, repeat: Infinity }}
      >
        <svg width={d.size} height={d.size} viewBox="0 0 16 16" className="opacity-30">
          <rect x="8" y="0" width="11" height="11" rx="2" transform="rotate(45 8 8)"
            fill={i % 2 === 0 ? "hsl(263 70% 60%)" : "hsl(187 94% 43%)"} />
        </svg>
      </motion.div>
    ))}
  </div>
);

export const RingOrbitsSVG = () => (
  <svg className="absolute inset-0 w-full h-full pointer-events-none opacity-[0.15] hidden lg:block" viewBox="0 0 600 500" fill="none">
    <ellipse cx="350" cy="250" rx="200" ry="80" stroke="hsl(239 84% 67% / 0.3)" strokeWidth="1" transform="rotate(-15 350 250)" />
    <ellipse cx="350" cy="250" rx="160" ry="60" stroke="hsl(263 70% 60% / 0.2)" strokeWidth="1" transform="rotate(10 350 250)" />
    <circle r="4" fill="hsl(263 70% 71%)">
      <animateMotion dur="6s" repeatCount="indefinite">
        <mpath href="#orbit1" />
      </animateMotion>
    </circle>
    <circle r="3" fill="hsl(239 84% 67%)">
      <animateMotion dur="10s" repeatCount="indefinite">
        <mpath href="#orbit2" />
      </animateMotion>
    </circle>
    <defs>
      <ellipse id="orbit1" cx="350" cy="250" rx="200" ry="80" transform="rotate(-15 350 250)" />
      <ellipse id="orbit2" cx="350" cy="250" rx="160" ry="60" transform="rotate(10 350 250)" />
    </defs>
  </svg>
);

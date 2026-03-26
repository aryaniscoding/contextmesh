import { Brain, Link2, RefreshCw, Package, Search, AlertCircle, Monitor } from "lucide-react";
import { motion } from "framer-motion";
import { useRef, useState, useEffect } from "react";

/* ── Mini live feed for hero card ── */
const logLines = [
  { dot: "rgba(167,139,250,0.6)", text: "API refactor logged — full history" },
  { dot: "rgba(52,211,153,0.6)", text: "Auth session captured — 47 messages" },
  { dot: "rgba(251,191,36,0.5)", text: "New session captured — raw chat stored" },
];

const LiveLogVisual = () => (
  <div
    style={{
      marginTop: 24,
      background: "#030303",
      border: "1px solid #111",
      borderRadius: 8,
      padding: "14px 16px",
      fontFamily: "'JetBrains Mono', monospace",
      fontSize: 10,
      lineHeight: 2,
    }}
  >
    {logLines.map((l, i) => (
      <div key={i} style={{ color: "rgba(255,255,255,0.35)" }}>
        <span
          style={{
            display: "inline-block",
            width: 5,
            height: 5,
            borderRadius: "50%",
            background: l.dot,
            marginRight: 10,
            verticalAlign: "middle",
          }}
        />
        {l.text}
      </div>
    ))}
  </div>
);

/* ── Context synthesis node diagram ── */
const NodeDiagram = () => {
  const avatars = [
    { initials: "AK", x: 0 },
    { initials: "JD", x: 44 },
    { initials: "MR", x: 88 },
  ];
  return (
    <div style={{ marginTop: 20, display: "flex", alignItems: "center", gap: 16 }}>
      <div style={{ display: "flex", gap: 8 }}>
        {avatars.map((a, i) => (
          <div
            key={i}
            style={{
              width: 28,
              height: 28,
              borderRadius: "50%",
              border: "1px solid #1a1a1a",
              background: "#0a0a0a",
              fontFamily: "'JetBrains Mono', monospace",
              fontSize: 9,
              color: "rgba(255,255,255,0.25)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            {a.initials}
          </div>
        ))}
      </div>
      <div style={{ width: 24, height: 1, background: "#1a1a1a" }} />
      <div
        style={{
          width: 28,
          height: 28,
          borderRadius: "50%",
          border: "1px solid rgba(167,139,250,0.25)",
          background: "#0a0a0a",
          fontFamily: "'JetBrains Mono', monospace",
          fontSize: 7,
          color: "rgba(167,139,250,0.6)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          letterSpacing: "0.05em",
        }}
      >
        CTX
      </div>
    </div>
  );
};

/* ── Context loading before/after ── */
const ContextLoadStrip = () => (
  <div style={{ marginTop: 20, display: "flex", alignItems: "center", gap: 8 }}>
    <div
      style={{
        background: "#050505",
        border: "1px solid #111",
        borderRadius: 5,
        padding: "6px 10px",
        fontFamily: "'JetBrains Mono', monospace",
        fontSize: 8,
        color: "rgba(255,255,255,0.2)",
        letterSpacing: "0.08em",
      }}
    >
      NO CONTEXT
    </div>
    <span style={{ color: "rgba(167,139,250,0.4)", fontSize: 14 }}>→</span>
    <div
      style={{
        background: "#050505",
        border: "1px solid rgba(167,139,250,0.2)",
        borderRadius: 5,
        padding: "6px 10px",
        fontFamily: "'JetBrains Mono', monospace",
        fontSize: 8,
        color: "rgba(167,139,250,0.65)",
        letterSpacing: "0.08em",
      }}
    >
      CTX LOADED
    </div>
  </div>
);

/* ── Semantic search mock ── */
const SearchMock = () => (
  <div
    style={{
      marginTop: 20,
      background: "#030303",
      border: "1px solid #1a1a1a",
      borderRadius: 6,
      padding: "10px 14px",
      fontFamily: "'JetBrains Mono', monospace",
      fontSize: 10,
      color: "rgba(255,255,255,0.35)",
      display: "flex",
      alignItems: "center",
      gap: 8,
    }}
  >
    <span style={{ color: "rgba(167,139,250,0.4)" }}>◎</span>
    "Who decided to use PKCE for mobile auth?"
    <span className="animate-blink" style={{ color: "#a78bfa" }}>|</span>
  </div>
);

/* ── Feature data ── */
const features = [
  {
    icon: Brain,
    num: "01",
    title: "Full Chat History Capture",
    desc: "Every AI session captured in full — raw messages, reasoning, code discussions. Not summaries. The complete record, per person, always private by default.",
    span: "col-span-12 md:col-span-7",
    mock: <LiveLogVisual />,
    stat: "47 SESSIONS · 1.2K TOKENS",
  },
  {
    icon: Link2,
    num: "02",
    title: "Master Context Synthesis",
    desc: "LLM merges all individual contexts into one shared knowledge base — always current, always complete.",
    span: "col-span-12 md:col-span-5",
    mock: <NodeDiagram />,
  },
  {
    icon: RefreshCw,
    num: "03",
    title: "One-Click Context Loading",
    desc: "Load any teammate's full AI context into your session instantly. Their history becomes your starting point.",
    span: "col-span-12 md:col-span-4",
    mock: <ContextLoadStrip />,
  },
  {
    icon: Package,
    num: "04",
    title: "Smart Handoff Snapshots",
    desc: "When someone leaves, their full context auto-packages into a handoff brief. Zero knowledge gap.",
    span: "col-span-12 md:col-span-4",
  },
  {
    icon: Search,
    num: "05",
    title: "Semantic Search",
    desc: "Query your entire team's AI history in natural language. Find any decision, rationale, or context.",
    span: "col-span-12 md:col-span-4",
    mock: <SearchMock />,
  },
  {
    icon: AlertCircle,
    num: "06",
    title: "Conflict Detection",
    desc: "Flags when two contexts contradict — preventing silent knowledge divergence across the team.",
    span: "col-span-12 md:col-span-6",
  },
  {
    icon: Monitor,
    num: "07",
    title: "Works With Your Stack",
    desc: "Integrates via MCP with Claude, Cursor, GitHub Copilot, and any MCP-compatible AI tool.",
    span: "col-span-12 md:col-span-6",
    mock: (
      <div style={{ marginTop: 20, display: "flex", gap: 16, flexWrap: "wrap" }}>
        {["Claude", "Cursor", "Copilot", "Cline", "Windsurf"].map((t, i) => (
          <span
            key={i}
            style={{
              fontFamily: "'JetBrains Mono', monospace",
              fontSize: 9,
              color: "rgba(255,255,255,0.2)",
              letterSpacing: "0.08em",
            }}
          >
            {t}
          </span>
        ))}
      </div>
    ),
  },
];

/* ── Bento Card ── */
const BentoCard = ({
  feature,
}: {
  feature: (typeof features)[0];
}) => {
  const Icon = feature.icon;

  return (
    <motion.div
      variants={{
        hidden: { opacity: 0, y: 30 },
        show: { opacity: 1, y: 0, transition: { duration: 0.45 } },
      }}
      className={`group relative overflow-hidden ${feature.span}`}
      style={{
        background: "#000",
        border: "1px solid #111",
        borderRadius: 14,
        padding: 32,
        transition: "border-color 0.2s, background 0.2s",
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.background = "#050505";
        e.currentTarget.style.borderColor = "rgba(167,139,250,0.18)";
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.background = "#000";
        e.currentTarget.style.borderColor = "#111";
      }}
    >
      {/* Top accent line */}
      <div
        className="absolute top-0 left-0 right-0 opacity-0 group-hover:opacity-100"
        style={{
          height: 2,
          background: "linear-gradient(90deg, transparent, #a78bfa, transparent)",
          transition: "opacity 0.3s",
        }}
      />

      {/* Number + Icon header */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 24 }}>
        <span
          style={{
            fontFamily: "'JetBrains Mono', monospace",
            fontSize: 8,
            color: "rgba(255,255,255,0.15)",
            letterSpacing: "0.18em",
          }}
        >
          {feature.num}
        </span>
        <div
          style={{
            width: 36,
            height: 36,
            borderRadius: 9,
            border: "1px solid rgba(167,139,250,0.18)",
            background: "rgba(167,139,250,0.05)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <Icon style={{ width: 16, height: 16, color: "rgba(167,139,250,0.7)" }} />
        </div>
      </div>

      {/* Title */}
      <h3
        style={{
          fontSize: 16,
          fontWeight: 800,
          letterSpacing: "-0.03em",
          marginBottom: 10,
          color: "rgba(255,255,255,0.9)",
          lineHeight: 1.1,
        }}
        className="font-display"
      >
        {feature.title}
      </h3>

      {/* Description */}
      <p
        style={{
          fontFamily: "'JetBrains Mono', monospace",
          fontSize: 10,
          color: "rgba(255,255,255,0.32)",
          lineHeight: 1.7,
          maxWidth: 420,
        }}
      >
        {feature.desc}
      </p>

      {/* Mock / visual */}
      {feature.mock}

      {/* Stat badge for hero card */}
      {feature.stat && (
        <div
          style={{
            position: "absolute",
            bottom: 24,
            right: 24,
            fontFamily: "'JetBrains Mono', monospace",
            fontSize: 9,
            color: "rgba(167,139,250,0.5)",
            letterSpacing: "0.1em",
          }}
        >
          {feature.stat}
        </div>
      )}
    </motion.div>
  );
};

/* ── Section ── */
const FeaturesSection = () => {
  return (
    <section id="features" className="py-[160px] relative overflow-hidden">
      {/* Section glow */}
      <div
        aria-hidden
        className="absolute pointer-events-none"
        style={{
          zIndex: 0,
          top: 0,
          left: "50%",
          transform: "translateX(-50%)",
          width: 1000,
          height: 500,
          background:
            "radial-gradient(ellipse at center, rgba(109,40,217,0.07) 0%, rgba(67,56,202,0.04) 50%, transparent 100%)",
        }}
      />
      <div
        className="glow-orb w-[500px] h-[500px] top-1/2 right-0 -translate-y-1/2 translate-x-1/2"
        style={{ background: "radial-gradient(circle, hsl(263 70% 50% / 0.12) 0%, transparent 70%)" }}
      />

      <div className="container mx-auto px-4 lg:px-8 relative z-10">
        {/* ── Section Header ── */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="text-center"
        >
          {/* Eyebrow */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 16,
              justifyContent: "center",
              marginBottom: 14,
            }}
          >
            <div style={{ width: 40, height: 1, background: "#1a1a1a" }} />
            <span
              style={{
                fontFamily: "'JetBrains Mono', monospace",
                fontSize: 9,
                color: "rgba(255,255,255,0.2)",
                letterSpacing: "0.2em",
              }}
            >
              04 —— FEATURES
            </span>
            <div style={{ width: 40, height: 1, background: "#1a1a1a" }} />
          </div>

          {/* Heading */}
          <h2
            className="font-display"
            style={{
              fontSize: "clamp(36px, 4vw, 60px)",
              fontWeight: 800,
              letterSpacing: "-0.04em",
              lineHeight: 0.95,
              color: "rgba(255,255,255,0.9)",
            }}
          >
            Built for Teams That{" "}
            <span style={{ color: "#a78bfa" }}>Ship Fast</span>
          </h2>

          {/* Subtitle */}
          <p
            style={{
              fontFamily: "'JetBrains Mono', monospace",
              fontSize: 12,
              color: "rgba(255,255,255,0.25)",
              letterSpacing: "0.04em",
              marginTop: 16,
            }}
          >
            Everything your team's AI needs to stay in sync.
          </p>
        </motion.div>

        {/* ── Bento Grid ── */}
        <motion.div
          initial="hidden"
          whileInView="show"
          viewport={{ once: true }}
          variants={{ hidden: {}, show: { transition: { staggerChildren: 0.08 } } }}
          className="grid grid-cols-12 gap-3 mt-16"
        >
          {features.map((f, i) => (
            <BentoCard key={i} feature={f} />
          ))}
        </motion.div>
      </div>
    </section>
  );
};

export default FeaturesSection;

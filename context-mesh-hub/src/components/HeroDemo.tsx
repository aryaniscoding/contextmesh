import { useState, useEffect, useRef, useCallback } from "react";

/* ─── data ─── */
interface Msg {
  role: "user" | "ai";
  text: string;
  decision?: string;
  roleLabel?: string;
}

const priyaMessages: Msg[] = [
  { role: "user", text: "should i use JWT or OAuth2 for the mobile auth flow?" },
  {
    role: "ai",
    text: "For mobile clients, OAuth2 with PKCE is the right call. JWT alone has no revocation mechanism — if a token leaks, you're stuck until expiry.",
    decision: "OAuth2 + PKCE for mobile auth",
  },
  { role: "user", text: "what TTL should i set for refresh tokens?" },
  {
    role: "ai",
    text: "30 days based on your user retention data. Short enough to limit exposure, long enough that active users never hit a re-login wall.",
    decision: "Refresh TTL = 30 days",
  },
  { role: "user", text: "redis or postgres for the token blacklist?" },
  {
    role: "ai",
    text: "Redis sorted sets. O(log n) revocation checks, TTL auto-cleanup, handles 100k+ rps without breaking a sweat.",
    decision: "Redis sorted sets for blacklist",
  },
];

const yourMessages: Msg[] = [
  { role: "user", text: "why did priya choose OAuth2 over plain JWT?" },
  {
    role: "ai",
    text: "Priya chose OAuth2+PKCE because JWT has no revocation — a leaked token is valid until expiry. She documented this in session #12 of her auth refactor.",
    roleLabel: "AI · using priya's context",
  },
  { role: "user", text: "what's the refresh token TTL?" },
  {
    role: "ai",
    text: "30 days — Priya set this based on user retention data. Active users never hit re-login, leaked tokens expire fast enough to limit exposure.",
    roleLabel: "AI · using priya's context",
  },
];

const progressItems = [
  "fetching 47 chat sessions",
  "loading code context — 23 files",
  "extracting decisions — 34 logged",
  "syncing open questions — 6",
];

/* ─── helpers ─── */
const jb = "'JetBrains Mono', monospace";

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

/* ─── Bubble component ─── */
const ChatBubble = ({ msg }: { msg: Msg & { typed: string } }) => {
  const isUser = msg.role === "user";
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 3, maxWidth: "88%", alignSelf: isUser ? "flex-end" : "flex-start" }}>
      <span style={{ fontFamily: jb, fontSize: 8, color: "rgba(148,163,184,0.4)", letterSpacing: "0.06em" }}>
        {msg.roleLabel ?? (isUser ? "YOU" : "AI")}
      </span>
      <div
        style={{
          background: isUser
            ? "linear-gradient(135deg, rgba(124,58,237,0.25), rgba(79,70,229,0.2))"
            : "rgba(255,255,255,0.04)",
          border: isUser ? "1px solid rgba(124,58,237,0.25)" : "1px solid rgba(255,255,255,0.07)",
          color: isUser ? "rgba(196,181,253,0.95)" : "rgba(226,232,240,0.85)",
          borderRadius: 10,
          ...(isUser ? { borderBottomRightRadius: 3 } : { borderBottomLeftRadius: 3 }),
          padding: "9px 12px",
          fontFamily: jb,
          fontSize: 11,
          lineHeight: 1.6,
        }}
      >
        {msg.typed}
      </div>
      {msg.decision && msg.typed === msg.text && (
        <div
          style={{
            display: "inline-flex",
            gap: 5,
            padding: "3px 8px",
            borderRadius: 6,
            background: "rgba(251,191,36,0.1)",
            border: "1px solid rgba(251,191,36,0.2)",
            color: "rgba(251,191,36,0.9)",
            fontSize: 9,
            fontFamily: jb,
            alignSelf: "flex-start",
          }}
        >
          ⚑ {msg.decision}
        </div>
      )}
    </div>
  );
};

/* ─── Particle canvas ─── */
const useParticleBurst = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const particlesRef = useRef<{ x: number; y: number; vx: number; vy: number; life: number; r: number; g: number; b: number; tail: { x: number; y: number }[] }[]>([]);
  const rafRef = useRef<number>(0);
  const activeRef = useRef(false);

  const burst = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const dpr = window.devicePixelRatio || 1;
    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.scale(dpr, dpr);

    for (let i = 0; i < 60; i++) {
      const isViolet = Math.random() > 0.5;
      particlesRef.current.push({
        x: 0,
        y: Math.random() * rect.height,
        vx: 3 + Math.random() * 5,
        vy: (Math.random() - 0.5) * 2,
        life: 1,
        r: isViolet ? 167 : 52,
        g: isViolet ? 139 : 211,
        b: isViolet ? 250 : 153,
        tail: [],
      });
    }

    if (!activeRef.current) {
      activeRef.current = true;
      const animate = () => {
        const c = canvasRef.current;
        if (!c) { activeRef.current = false; return; }
        const cx = c.getContext("2d");
        if (!cx) return;
        const w = c.getBoundingClientRect().width;
        const h = c.getBoundingClientRect().height;
        cx.clearRect(0, 0, w, h);

        particlesRef.current = particlesRef.current.filter((p) => p.life > 0);
        for (const p of particlesRef.current) {
          p.tail.unshift({ x: p.x, y: p.y });
          if (p.tail.length > 14) p.tail.pop();
          p.x += p.vx;
          p.y += p.vy;
          p.life -= 0.018;

          for (let ti = 0; ti < p.tail.length; ti++) {
            const a = p.life * (1 - ti / p.tail.length) * 0.6;
            cx.beginPath();
            cx.arc(p.tail[ti].x, p.tail[ti].y, 1.5 - ti * 0.08, 0, Math.PI * 2);
            cx.fillStyle = `rgba(${p.r},${p.g},${p.b},${a})`;
            cx.fill();
          }
        }

        if (particlesRef.current.length > 0) {
          rafRef.current = requestAnimationFrame(animate);
        } else {
          activeRef.current = false;
        }
      };
      rafRef.current = requestAnimationFrame(animate);
    }
  }, []);

  useEffect(() => () => cancelAnimationFrame(rafRef.current), []);

  return { canvasRef, burst };
};

/* ─── Main Demo ─── */
const HeroDemo = () => {
  const [priyaTyped, setPriyaTyped] = useState<{ msg: Msg; typed: string }[]>([]);
  const [yourTyped, setYourTyped] = useState<{ msg: Msg; typed: string }[]>([]);
  const [transferring, setTransferring] = useState(false);
  const [transferred, setTransferred] = useState(false);
  const [overlayVisible, setOverlayVisible] = useState(false);
  const [progressPct, setProgressPct] = useState(0);
  const [doneItems, setDoneItems] = useState<number[]>([]);
  const [showBanner, setShowBanner] = useState(false);
  const [showBadge, setShowBadge] = useState(false);
  const [showReplay, setShowReplay] = useState(false);
  const [glowBorders, setGlowBorders] = useState(false);
  const [sessionCount, setSessionCount] = useState("0 sessions");
  const [badgeText, setBadgeText] = useState("EMPTY");
  const [badgeStyle, setBadgeStyle] = useState<"empty" | "loaded">("empty");
  const [hideButton, setHideButton] = useState(false);
  const [priyaLoaded, setPriyaLoaded] = useState(false);

  const leftScrollRef = useRef<HTMLDivElement>(null);
  const rightScrollRef = useRef<HTMLDivElement>(null);
  const abortRef = useRef(false);
  const { canvasRef, burst } = useParticleBurst();

  const scrollBottom = (ref: React.RefObject<HTMLDivElement>) => {
    setTimeout(() => {
      if (ref.current) ref.current.scrollTop = ref.current.scrollHeight;
    }, 30);
  };

  /* typewriter for a list of messages */
  const typeMessages = useCallback(
    async (
      msgs: Msg[],
      setter: React.Dispatch<React.SetStateAction<{ msg: Msg; typed: string }[]>>,
      scrollRef: React.RefObject<HTMLDivElement>,
      charDelay = 18,
      msgGap = 80,
      pauseBetween = 600,
    ) => {
      for (let mi = 0; mi < msgs.length; mi++) {
        if (abortRef.current) return;
        const m = msgs[mi];
        setter((prev) => [...prev, { msg: m, typed: "" }]);
        scrollBottom(scrollRef);
        await sleep(msgGap);

        for (let ci = 1; ci <= m.text.length; ci++) {
          if (abortRef.current) return;
          const partial = m.text.slice(0, ci);
          setter((prev) => {
            const copy = [...prev];
            copy[copy.length - 1] = { msg: m, typed: partial };
            return copy;
          });
          if (ci % 8 === 0) scrollBottom(scrollRef);
          await sleep(charDelay);
        }
        scrollBottom(scrollRef);
        if (mi < msgs.length - 1) await sleep(pauseBetween);
      }
    },
    [],
  );

  /* initial priya typewriter */
  useEffect(() => {
    abortRef.current = false;
    (async () => {
      await sleep(600);
      await typeMessages(priyaMessages, setPriyaTyped, leftScrollRef);
      if (!abortRef.current) setPriyaLoaded(true);
    })();
    return () => { abortRef.current = true; };
  }, [typeMessages]);

  /* transfer */
  const runTransfer = useCallback(async () => {
    if (transferring) return;
    setTransferring(true);
    setGlowBorders(true);
    setHideButton(true);

    // overlay
    await sleep(200);
    setOverlayVisible(true);

    // progress bar
    const start = Date.now();
    const dur = 1800;
    const tick = () => {
      const elapsed = Date.now() - start;
      const pct = Math.min(elapsed / dur, 1);
      setProgressPct(pct * 100);
      if (pct < 1) requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);

    // progress items with particle bursts
    for (let i = 0; i < 4; i++) {
      await sleep(380);
      setDoneItems((prev) => [...prev, i]);
      burst();
    }

    await sleep(600);

    // hide overlay, show results
    setOverlayVisible(false);
    setGlowBorders(false);

    await sleep(200);
    setShowBanner(true);
    setShowBadge(true);
    setBadgeText("CTX LOADED");
    setBadgeStyle("loaded");
    setSessionCount("47 sessions");

    // type your messages
    await sleep(500);
    await typeMessages(yourMessages, setYourTyped, rightScrollRef, 18, 80, 900);

    setShowReplay(true);
    setTransferred(true);
    setTransferring(false);
  }, [transferring, burst, typeMessages]);

  /* replay */
  const replay = useCallback(async () => {
    abortRef.current = true;
    await sleep(100);
    abortRef.current = false;

    setPriyaTyped([]);
    setYourTyped([]);
    setTransferring(false);
    setTransferred(false);
    setOverlayVisible(false);
    setProgressPct(0);
    setDoneItems([]);
    setShowBanner(false);
    setShowBadge(false);
    setShowReplay(false);
    setGlowBorders(false);
    setSessionCount("0 sessions");
    setBadgeText("EMPTY");
    setBadgeStyle("empty");
    setHideButton(false);
    setPriyaLoaded(false);

    await sleep(400);
    // re-type priya
    (async () => {
      await typeMessages(priyaMessages, setPriyaTyped, leftScrollRef);
      if (!abortRef.current) setPriyaLoaded(true);
    })();
  }, [typeMessages]);

  const windowStyle = (side: "left" | "right"): React.CSSProperties => ({
    flex: 1,
    minHeight: 460,
    maxHeight: 460,
    borderRadius: 14,
    border: glowBorders
      ? side === "left"
        ? "1px solid rgba(167,139,250,0.5)"
        : "1px solid rgba(52,211,153,0.5)"
      : "1px solid rgba(255,255,255,0.06)",
    boxShadow: glowBorders
      ? side === "left"
        ? "0 0 40px rgba(167,139,250,0.15)"
        : "0 0 40px rgba(52,211,153,0.12)"
      : "none",
    background: "#0c0c18",
    overflow: "hidden",
    display: "flex",
    flexDirection: "column",
    position: "relative",
    transition: "border-color 0.4s, box-shadow 0.4s",
  });

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 10, width: "100%" }}>
      {/* Label bar */}
      <div style={{ display: "flex", justifyContent: "space-between", padding: "0 4px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
          <div style={{ width: 5, height: 5, borderRadius: "50%", background: "#a78bfa", boxShadow: "0 0 6px #a78bfa" }} />
          <span style={{ fontFamily: jb, fontSize: 9, color: "rgba(148,163,184,0.5)", letterSpacing: "0.14em" }}>PRIYA'S SESSION</span>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
          <div style={{ width: 5, height: 5, borderRadius: "50%", background: "#34d399", boxShadow: "0 0 6px #34d399" }} />
          <span style={{ fontFamily: jb, fontSize: 9, color: "rgba(52,211,153,0.5)", letterSpacing: "0.14em" }}>YOUR SESSION</span>
        </div>
      </div>

      {/* Two windows */}
      <div style={{ display: "flex", gap: 12 }}>
        {/* LEFT — Priya */}
        <div style={windowStyle("left")}>
          {/* Title bar */}
          <div style={{ padding: "10px 14px", borderBottom: "1px solid rgba(255,255,255,0.05)", background: "rgba(255,255,255,0.02)", display: "flex", alignItems: "center", gap: 8, flexShrink: 0 }}>
            <div style={{ width: 24, height: 24, borderRadius: "50%", background: "linear-gradient(135deg, #7c3aed, #6366f1)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 10, fontWeight: 600, color: "#fff", fontFamily: jb }}>P</div>
            <span style={{ fontFamily: jb, fontSize: 11, color: "#c4b5fd", fontWeight: 500 }}>Priya Mehta</span>
            <span style={{ fontFamily: jb, fontSize: 8, color: "rgba(148,163,184,0.4)", marginLeft: "auto" }}>47 sessions</span>
            <span style={{ fontFamily: jb, fontSize: 8, padding: "2px 6px", borderRadius: 100, background: "rgba(167,139,250,0.12)", border: "1px solid rgba(167,139,250,0.3)", color: "#a78bfa" }}>ACTIVE</span>
          </div>
          {/* Chat body */}
          <div
            ref={leftScrollRef}
            style={{ flex: 1, padding: 14, display: "flex", flexDirection: "column", gap: 10, overflowY: "auto", scrollbarWidth: "none" }}
          >
            {priyaTyped.map((m, i) => (
              <ChatBubble key={i} msg={{ ...m.msg, typed: m.typed } as any} />
            ))}
          </div>
          {/* Input bar */}
          <div style={{ padding: "10px 14px", borderTop: "1px solid rgba(255,255,255,0.05)", display: "flex", gap: 8, flexShrink: 0 }}>
            <input readOnly placeholder="priya's cursor session..." style={{ flex: 1, background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.07)", borderRadius: 8, padding: "6px 10px", fontFamily: jb, fontSize: 10, color: "rgba(148,163,184,0.4)", outline: "none" }} />
            <div style={{ width: 30, height: 30, borderRadius: 8, background: "linear-gradient(135deg, #7c3aed, #6366f1)", display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", fontSize: 13, fontWeight: 700, cursor: "default" }}>↑</div>
          </div>
        </div>

        {/* RIGHT — Your session */}
        <div style={windowStyle("right")}>
          {/* Title bar */}
          <div style={{ padding: "10px 14px", borderBottom: "1px solid rgba(255,255,255,0.05)", background: "rgba(255,255,255,0.02)", display: "flex", alignItems: "center", gap: 8, flexShrink: 0, zIndex: 8, position: "relative" }}>
            <div style={{ width: 24, height: 24, borderRadius: "50%", background: "linear-gradient(135deg, #059669, #0891b2)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 10, fontWeight: 600, color: "#fff", fontFamily: jb }}>Y</div>
            <span style={{ fontFamily: jb, fontSize: 11, color: "#6ee7b7", fontWeight: 500 }}>Your Session</span>
            <span style={{ fontFamily: jb, fontSize: 8, color: "rgba(148,163,184,0.4)", marginLeft: "auto" }}>{sessionCount}</span>
            <span
              style={{
                fontFamily: jb, fontSize: 8, padding: "2px 6px", borderRadius: 100,
                background: badgeStyle === "loaded" ? "rgba(52,211,153,0.12)" : "rgba(148,163,184,0.06)",
                border: badgeStyle === "loaded" ? "1px solid rgba(52,211,153,0.3)" : "1px solid rgba(148,163,184,0.15)",
                color: badgeStyle === "loaded" ? "#34d399" : "rgba(148,163,184,0.4)",
                transition: "all 0.3s",
              }}
            >{badgeText}</span>
          </div>

          {/* Success banner — in normal flow */}
          <div
            style={{
              background: "linear-gradient(90deg, rgba(16,185,129,0.15), rgba(6,182,212,0.1))",
              borderBottom: "1px solid rgba(52,211,153,0.3)",
              padding: showBanner ? "8px 14px" : "0 14px",
              display: "flex", alignItems: "center", gap: 6, flexShrink: 0,
              maxHeight: showBanner ? 40 : 0, opacity: showBanner ? 1 : 0, overflow: "hidden",
              transition: "max-height 0.4s cubic-bezier(0.34,1.56,0.64,1), opacity 0.3s, padding 0.3s",
            }}
          >
            <span style={{ fontSize: 10 }}>✦</span>
            <span style={{ fontFamily: jb, fontSize: 9, color: "rgba(52,211,153,0.9)", whiteSpace: "nowrap" }}>PRIYA'S CONTEXT LOADED — 47 SESSIONS READY</span>
          </div>

          {/* Chat body wrapper */}
          <div style={{ flex: 1, position: "relative", overflow: "hidden", display: "flex", flexDirection: "column" }}>

            {/* Viewing badge */}
            {showBadge && (
              <div style={{
                position: "absolute", top: 8, right: 10, zIndex: 7,
                display: "flex", alignItems: "center", gap: 5, padding: "3px 8px", borderRadius: 100,
                background: "rgba(167,139,250,0.1)", border: "1px solid rgba(167,139,250,0.25)",
              }}>
                <div style={{ width: 4, height: 4, borderRadius: "50%", background: "#a78bfa", animation: "heroDemoPulse 2s infinite" }} />
                <span style={{ fontFamily: jb, fontSize: 8, color: "rgba(167,139,250,0.8)" }}>VIEWING: PRIYA'S CTX</span>
              </div>
            )}

            {/* Transfer overlay */}
            <div
              style={{
                position: "absolute", inset: 0, zIndex: 5,
                background: "rgba(5,5,9,0.85)", backdropFilter: "blur(4px)",
                display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 16,
                opacity: overlayVisible ? 1 : 0, pointerEvents: overlayVisible ? "auto" : "none",
                transition: "opacity 0.4s", borderRadius: "0 0 14px 14px",
              }}
            >
              <div style={{ width: 52, height: 52, borderRadius: "50%", background: "linear-gradient(135deg, #7c3aed, #4f46e5)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18, fontWeight: 700, color: "#fff", fontFamily: jb, boxShadow: "0 0 30px rgba(124,58,237,0.5)", animation: overlayVisible ? "heroDemoPulse 1.5s infinite" : "none" }}>P</div>
              <span style={{ fontFamily: jb, fontSize: 11, color: "rgba(167,139,250,0.9)", letterSpacing: "0.1em" }}>LOADING PRIYA'S CONTEXT</span>
              <div style={{ width: 180, height: 3, background: "rgba(255,255,255,0.06)", borderRadius: 100, overflow: "hidden" }}>
                <div style={{ width: `${progressPct}%`, height: "100%", background: "linear-gradient(90deg, #a78bfa, #34d399)", borderRadius: 100, transition: "width 0.1s linear" }} />
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 5, alignItems: "flex-start" }}>
                {progressItems.map((item, i) => {
                  const done = doneItems.includes(i);
                  return (
                    <div key={i} style={{ display: "flex", alignItems: "center", gap: 6 }}>
                      <div style={{ width: 5, height: 5, borderRadius: "50%", background: done ? "#34d399" : "rgba(148,163,184,0.2)", boxShadow: done ? "0 0 6px #34d399" : "none", transition: "all 0.3s" }} />
                      <span style={{ fontFamily: jb, fontSize: 9, color: done ? "rgba(52,211,153,0.9)" : "rgba(148,163,184,0.4)", transition: "color 0.3s" }}>{item}</span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Scrollable chat messages */}
            <div
              ref={rightScrollRef}
              style={{ flex: 1, padding: 14, paddingTop: showBadge ? 34 : 14, display: "flex", flexDirection: "column", gap: 10, overflowY: "auto", scrollbarWidth: "none" }}
            >
              {!transferred && yourTyped.length === 0 && !overlayVisible && (
                <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 10 }}>
                  <div style={{ width: 44, height: 44, borderRadius: 10, background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18, color: "rgba(148,163,184,0.3)" }}>◎</div>
                  <div style={{ fontFamily: jb, fontSize: 10, color: "rgba(148,163,184,0.3)", textAlign: "center", lineHeight: 1.7 }}>NO CONTEXT LOADED<br />CLICK BELOW TO TRANSFER</div>
                </div>
              )}
              {yourTyped.map((m, i) => (
                <ChatBubble key={i} msg={{ ...m.msg, typed: m.typed } as any} />
              ))}
            </div>

            {/* Particle canvas */}
            <canvas ref={canvasRef} style={{ position: "absolute", inset: 0, zIndex: 20, pointerEvents: "none", borderRadius: 14, width: "100%", height: "100%" }} />
          </div>

          {/* Input bar */}
          <div style={{ padding: "10px 14px", borderTop: "1px solid rgba(255,255,255,0.05)", display: "flex", gap: 8, flexShrink: 0 }}>
            <input readOnly placeholder={transferred ? "ask about priya's context..." : "no context loaded..."} style={{ flex: 1, background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.07)", borderRadius: 8, padding: "6px 10px", fontFamily: jb, fontSize: 10, color: "rgba(148,163,184,0.4)", outline: "none" }} />
            <div style={{ width: 30, height: 30, borderRadius: 8, background: "linear-gradient(135deg, #059669, #0891b2)", display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", fontSize: 13, fontWeight: 700, cursor: "default" }}>↑</div>
          </div>
        </div>
      </div>

      {/* Load button / Replay */}
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 6, marginTop: 4 }}>
        {!hideButton && (
          <>
            <button
              onClick={priyaLoaded ? runTransfer : undefined}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 10,
                background: "linear-gradient(135deg, rgba(124,58,237,0.15), rgba(79,70,229,0.1))",
                border: "1px solid rgba(124,58,237,0.4)",
                borderRadius: 100,
                padding: "10px 24px",
                fontFamily: jb,
                fontSize: 11,
                color: "rgba(167,139,250,0.9)",
                letterSpacing: "0.08em",
                cursor: priyaLoaded ? "pointer" : "default",
                opacity: priyaLoaded ? 1 : 0.5,
                transition: "all 0.3s",
              }}
              onMouseEnter={(e) => {
                if (!priyaLoaded) return;
                const t = e.currentTarget;
                t.style.borderColor = "rgba(167,139,250,0.7)";
                t.style.boxShadow = "0 0 30px rgba(124,58,237,0.3)";
                t.style.color = "#fff";
                t.style.transform = "translateY(-1px)";
              }}
              onMouseLeave={(e) => {
                const t = e.currentTarget;
                t.style.borderColor = "rgba(124,58,237,0.4)";
                t.style.boxShadow = "none";
                t.style.color = "rgba(167,139,250,0.9)";
                t.style.transform = "translateY(0)";
              }}
            >
              <span style={{ animation: "heroDemoFloat 2s infinite ease-in-out" }}>⚡</span>
              LOAD PRIYA'S CONTEXT INTO YOUR AI
              <span>→</span>
            </button>
            <span style={{ fontFamily: jb, fontSize: 8, color: "rgba(148,163,184,0.25)" }}>← click to see the magic</span>
          </>
        )}
        {showReplay && (
          <button
            onClick={replay}
            style={{
              fontFamily: jb,
              fontSize: 9,
              color: "rgba(148,163,184,0.4)",
              background: "none",
              border: "1px solid rgba(148,163,184,0.15)",
              borderRadius: 100,
              padding: "6px 16px",
              cursor: "pointer",
              transition: "all 0.3s",
            }}
            onMouseEnter={(e) => { e.currentTarget.style.color = "rgba(167,139,250,0.8)"; e.currentTarget.style.borderColor = "rgba(167,139,250,0.3)"; }}
            onMouseLeave={(e) => { e.currentTarget.style.color = "rgba(148,163,184,0.4)"; e.currentTarget.style.borderColor = "rgba(148,163,184,0.15)"; }}
          >
            ↺ REPLAY TRANSFER
          </button>
        )}
      </div>

      <style>{`
        @keyframes heroDemoPulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.6; }
        }
        @keyframes heroDemoFloat {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-3px); }
        }
      `}</style>
    </div>
  );
};

export default HeroDemo;

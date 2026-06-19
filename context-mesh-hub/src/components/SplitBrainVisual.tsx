import { useEffect, useRef, useState, useCallback, memo } from "react";

interface Node {
  ox: number; oy: number; x: number; y: number;
  size: number; phase: number; spd: number;
}
interface Edge { a: number; b: number; }
interface Particle {
  sx: number; sy: number; ex: number; ey: number;
  cy: number; cx: number; progress: number; speed: number;
  r: number; g: number; b: number; tail: { x: number; y: number }[];
}

function generateBrain(cx: number, cy: number, count: number): Node[] {
  const nodes: Node[] = [];
  const outerCount = Math.floor(count * 0.6);
  const innerCount = count - outerCount;
  for (let i = 0; i < outerCount; i++) {
    const angle = (i / outerCount) * Math.PI * 2;
    const rx = 115, ry = 88;
    const lobe = Math.sin(angle * 2.5) * 18 + Math.sin(angle * 1.3) * 10;
    const r = 1 + (Math.random() - 0.5) * 16;
    const x = cx + Math.cos(angle) * (rx + lobe + r);
    const y = cy + Math.sin(angle) * (ry + lobe * 0.5 + r);
    nodes.push({ ox: x, oy: y, x, y, size: 1 + Math.random() * 2.2, phase: Math.random() * Math.PI * 2, spd: 0.8 + Math.random() * 1.5 });
  }
  for (let i = 0; i < innerCount; i++) {
    const angle = Math.random() * Math.PI * 2;
    const dist = Math.random() * 72;
    const x = cx + Math.cos(angle) * dist;
    const y = cy + Math.sin(angle) * dist;
    nodes.push({ ox: x, oy: y, x, y, size: 1 + Math.random() * 2.2, phase: Math.random() * Math.PI * 2, spd: 0.8 + Math.random() * 1.5 });
  }
  return nodes;
}

function generateEdges(nodes: Node[], maxDist: number, maxEdges: number): Edge[] {
  const edges: Edge[] = [];
  for (let i = 0; i < nodes.length && edges.length < maxEdges; i++) {
    for (let j = i + 1; j < nodes.length && edges.length < maxEdges; j++) {
      const dx = nodes[i].ox - nodes[j].ox, dy = nodes[i].oy - nodes[j].oy;
      if (Math.sqrt(dx * dx + dy * dy) < maxDist) edges.push({ a: i, b: j });
    }
  }
  return edges;
}

const SplitBrainVisual = memo(() => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animRef = useRef<number>(0);
  const mergeRef = useRef(0);
  const startTimeRef = useRef(0);
  const particlesRef = useRef<Particle[]>([]);
  const lastSpawnRef = useRef(0);
  const [status, setStatus] = useState<"idle" | "merging" | "merged">("idle");
  const resetRef = useRef(false);

  const replay = useCallback(() => {
    mergeRef.current = 0;
    particlesRef.current = [];
    startTimeRef.current = performance.now() / 1000;
    resetRef.current = true;
    setStatus("idle");
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const W = 520, H = 520;
    const dpr = window.devicePixelRatio || 1;
    canvas.width = W * dpr;
    canvas.height = H * dpr;
    canvas.style.width = W + "px";
    canvas.style.height = H + "px";
    ctx.scale(dpr, dpr);

    const CX = W / 2, CY = H / 2;
    const leftNodes = generateBrain(CX - 148, CY, 90);
    const rightNodes = generateBrain(CX + 148, CY, 90);
    const leftEdges = generateEdges(leftNodes, 62, 130);
    const rightEdges = generateEdges(rightNodes, 62, 130);

    // Cross edges
    const crossEdges: { li: number; ri: number }[] = [];
    for (let i = 0; i < 22; i++) {
      crossEdges.push({ li: Math.floor(Math.random() * 90), ri: Math.floor(Math.random() * 90) });
    }

    // Semantic labels
    const leftLabels = [
      { idx: 3, text: "Auth decisions" }, { idx: 12, text: "Priya's context" }, { idx: 28, text: "47 sessions" }
    ];
    const rightLabels = [
      { idx: 5, text: "API routes" }, { idx: 18, text: "Team memory" }, { idx: 35, text: "34 decisions" }
    ];

    startTimeRef.current = performance.now() / 1000;
    let mergeStarted = false;

    const spawnParticles = (t: number) => {
      if (t - lastSpawnRef.current < 0.55) return;
      lastSpawnRef.current = t;
      for (let i = 0; i < 20; i++) {
        const li = Math.floor(Math.random() * 90), ri = Math.floor(Math.random() * 90);
        const lNode = leftNodes[li], rNode = rightNodes[ri];
        particlesRef.current.push({
          sx: lNode.x, sy: lNode.y, ex: rNode.x, ey: rNode.y,
          cx: CX + (Math.random() - 0.5) * 40, cy: CY + (Math.random() - 0.5) * 80,
          progress: 0, speed: 0.006 + Math.random() * 0.009, r: 167, g: 139, b: 250, tail: []
        });
        particlesRef.current.push({
          sx: rNode.x, sy: rNode.y, ex: lNode.x, ey: lNode.y,
          cx: CX + (Math.random() - 0.5) * 40, cy: CY + (Math.random() - 0.5) * 80,
          progress: 0, speed: 0.006 + Math.random() * 0.009, r: 129, g: 140, b: 248, tail: []
        });
      }
    };

    const bezierPoint = (sx: number, sy: number, cx: number, cy: number, ex: number, ey: number, t: number) => ({
      x: (1 - t) * (1 - t) * sx + 2 * (1 - t) * t * cx + t * t * ex,
      y: (1 - t) * (1 - t) * sy + 2 * (1 - t) * t * cy + t * t * ey
    });

    const animate = () => {
      const now = performance.now() / 1000;
      const t = now - startTimeRef.current;
      const mp = mergeRef.current;
      ctx.clearRect(0, 0, W, H);

      if (resetRef.current) {
        mergeStarted = false;
        resetRef.current = false;
      }

      // Start merge at 2.2s
      if (t > 2.2 && !mergeStarted) { mergeStarted = true; setStatus("merging"); }
      if (mergeStarted && mp < 1) {
        mergeRef.current = Math.min(1, mp + 0.0038);
        if (mergeRef.current >= 1) setStatus("merged");
      }

      // Update node positions
      for (const n of leftNodes) {
        const drift = mergeStarted ? mp * 148 * 0.73 : 0;
        n.x = n.ox + drift + Math.sin(t * n.spd + n.phase) * 2.2;
        n.y = n.oy + Math.cos(t * n.spd * 0.7 + n.phase) * 2.2;
      }
      for (const n of rightNodes) {
        const drift = mergeStarted ? mp * 148 * 0.73 : 0;
        n.x = n.ox - drift + Math.sin(t * n.spd + n.phase) * 2.2;
        n.y = n.oy + Math.cos(t * n.spd * 0.7 + n.phase) * 2.2;
      }

      // Radial glows behind brains
      if (mp < 0.8) {
        const glowAlpha = 0.12 * (1 - mp);
        const drawGlow = (x: number, y: number, color: string) => {
          const g = ctx.createRadialGradient(x, y, 0, x, y, 130);
          g.addColorStop(0, color);
          g.addColorStop(1, "transparent");
          ctx.fillStyle = g;
          ctx.fillRect(x - 140, y - 140, 280, 280);
        };
        drawGlow(CX - 148 + mp * 148 * 0.73, CY, `rgba(167,139,250,${glowAlpha})`);
        drawGlow(CX + 148 - mp * 148 * 0.73, CY, `rgba(129,140,248,${glowAlpha})`);
      }

      // Dashed divider
      if (mp < 0.4) {
        ctx.save();
        ctx.setLineDash([4, 6]);
        ctx.strokeStyle = `rgba(120,90,220,${0.28 * (1 - mp / 0.4)})`;
        ctx.lineWidth = 1;
        ctx.beginPath(); ctx.moveTo(CX, CY - 140); ctx.lineTo(CX, CY + 140);
        ctx.stroke(); ctx.restore();
      }

      // Divider labels
      if (mp < 0.4) {
        const la = 1 - mp / 0.4;
        ctx.font = "9px 'Fira Code', monospace";
        ctx.fillStyle = `rgba(196,181,253,${0.6 * la})`;
        ctx.textAlign = "right";
        ctx.fillText("INDIVIDUAL", CX - 12, CY - 130);
        ctx.textAlign = "left";
        ctx.fillText("MASTER", CX + 12, CY - 130);
      }

      // Draw edges
      const drawEdges = (nodes: Node[], edges: Edge[], color: string) => {
        for (const e of edges) {
          const a = nodes[e.a], b = nodes[e.b];
          const op = 0.35 + 0.25 * Math.sin(t * 1.5 + e.a);
          ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.lineTo(b.x, b.y);
          ctx.strokeStyle = color.replace("OP", op.toFixed(2));
          ctx.lineWidth = 0.7; ctx.stroke();
        }
      };
      drawEdges(leftNodes, leftEdges, "rgba(139,92,246,OP)");
      drawEdges(rightNodes, rightEdges, "rgba(99,102,241,OP)");

      // Cross edges
      if (mp > 0.12) {
        const crossAlpha = Math.min(1, (mp - 0.12) / 0.5);
        for (let i = 0; i < crossEdges.length; i++) {
          const ce = crossEdges[i];
          const ln = leftNodes[ce.li], rn = rightNodes[ce.ri];
          const op = crossAlpha * (0.3 + 0.3 * Math.sin(t * 1.8 + i));
          ctx.beginPath();
          ctx.moveTo(ln.x, ln.y);
          ctx.quadraticCurveTo(CX, CY + Math.sin(t + i) * 30, rn.x, rn.y);
          ctx.strokeStyle = `rgba(167,139,250,${op.toFixed(2)})`;
          ctx.lineWidth = 0.6; ctx.stroke();
        }
      }

      // Draw nodes
      const drawNodes = (nodes: Node[], fillColor: string, glowColor: string) => {
        for (const n of nodes) {
          const r = n.size * (1 + 0.28 * Math.sin(t * n.spd + n.phase));
          ctx.beginPath(); ctx.arc(n.x, n.y, r + 3, 0, Math.PI * 2);
          ctx.fillStyle = glowColor; ctx.fill();
          ctx.beginPath(); ctx.arc(n.x, n.y, r, 0, Math.PI * 2);
          ctx.fillStyle = fillColor; ctx.fill();
        }
      };
      drawNodes(leftNodes, "rgba(196,181,253,0.92)", "rgba(167,139,250,0.22)");
      drawNodes(rightNodes, "rgba(165,180,252,0.92)", "rgba(129,140,248,0.22)");

      // Semantic labels
      if (mp < 0.55) {
        const la = mp < 0.35 ? 1 : 1 - (mp - 0.35) / 0.2;
        ctx.font = "10px 'Fira Code', monospace";
        const drawLabel = (nodes: Node[], labels: { idx: number; text: string }[]) => {
          for (const l of labels) {
            if (l.idx >= nodes.length) continue;
            const n = nodes[l.idx];
            const tw = ctx.measureText(l.text).width;
            ctx.fillStyle = `rgba(10,8,30,${0.78 * la})`;
            const px = n.x + 8, py = n.y - 6;
            ctx.fillRect(px - 4, py - 10, tw + 8, 16);
            ctx.fillStyle = `rgba(196,181,253,${0.88 * la})`;
            ctx.fillText(l.text, px, py + 2);
          }
        };
        drawLabel(leftNodes, leftLabels);
        drawLabel(rightNodes, rightLabels);
      }

      // Particles
      if (mergeStarted && mp < 1) spawnParticles(t);
      const alive: Particle[] = [];
      for (const p of particlesRef.current) {
        p.progress += p.speed;
        if (p.progress > 1) continue;
        const pt = bezierPoint(p.sx, p.sy, p.cx, p.cy, p.ex, p.ey, p.progress);
        p.tail.push({ x: pt.x, y: pt.y });
        if (p.tail.length > 14) p.tail.shift();
        for (let i = 0; i < p.tail.length; i++) {
          const alpha = (i / p.tail.length) * 0.6;
          ctx.beginPath(); ctx.arc(p.tail[i].x, p.tail[i].y, 1.2, 0, Math.PI * 2);
          ctx.fillStyle = `rgba(${p.r},${p.g},${p.b},${alpha})`;
          ctx.fill();
        }
        ctx.beginPath(); ctx.arc(pt.x, pt.y, 2, 0, Math.PI * 2);
        ctx.fillStyle = `rgb(${p.r},${p.g},${p.b})`;
        ctx.fill();
        alive.push(p);
      }
      particlesRef.current = alive;

      // Center glow
      if (mp > 0.28) {
        const ga = Math.min(0.35, (mp - 0.28) * 0.6) * (0.7 + 0.3 * Math.sin(t * 2.4));
        const g = ctx.createRadialGradient(CX, CY, 0, CX, CY, 190);
        g.addColorStop(0, `rgba(167,139,250,${ga.toFixed(2)})`);
        g.addColorStop(1, "transparent");
        ctx.fillStyle = g;
        ctx.fillRect(CX - 200, CY - 200, 400, 400);
      }

      // Merged rings + badge
      if (mp >= 1) {
        const ringAlpha = 0.3 + 0.15 * Math.sin(t * 2);
        ctx.beginPath(); ctx.arc(CX, CY, 158, 0, Math.PI * 2);
        ctx.strokeStyle = `rgba(139,92,246,${ringAlpha.toFixed(2)})`;
        ctx.lineWidth = 1.2; ctx.stroke();
        ctx.beginPath(); ctx.arc(CX, CY, 180, 0, Math.PI * 2);
        ctx.strokeStyle = `rgba(139,92,246,${(ringAlpha * 0.5).toFixed(2)})`;
        ctx.lineWidth = 0.8; ctx.stroke();

        // Badge
        const badgeText = "✦ CONTEXTS MERGED";
        ctx.font = "bold 11px 'Fira Code', monospace";
        const bw = ctx.measureText(badgeText).width;
        const bx = CX - bw / 2 - 12, by = CY + 68;
        ctx.fillStyle = "rgba(139,92,246,0.14)";
        ctx.strokeStyle = "rgba(167,139,250,0.45)";
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.fillRect(bx, by - 12, bw + 24, 24);
        ctx.strokeRect(bx, by - 12, bw + 24, 24);
        ctx.fillStyle = "rgba(196,181,253,0.95)";
        ctx.textAlign = "center";
        ctx.fillText(badgeText, CX, by + 4);
        ctx.textAlign = "start";
      }

      animRef.current = requestAnimationFrame(animate);
    };

    animRef.current = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(animRef.current);
  }, []);

  const mp = mergeRef.current;

  return (
    <div className="flex flex-col items-center gap-2">
      {/* Top labels */}
      <div className="flex items-center justify-center gap-[130px]" style={{ opacity: status === "merged" ? 0 : 1, transition: "opacity 0.5s" }}>
        <div className="flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full" style={{ background: "#a78bfa" }} />
          <span style={{ fontFamily: "'Fira Code', monospace", fontSize: 9, color: "rgba(196,181,253,0.6)" }}>YOUR CONTEXT</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full" style={{ background: "#818cf8" }} />
          <span style={{ fontFamily: "'Fira Code', monospace", fontSize: 9, color: "rgba(196,181,253,0.6)" }}>TEAM MASTER CONTEXT</span>
        </div>
      </div>

      {/* Canvas */}
      <canvas ref={canvasRef} className="block" style={{ background: "transparent" }} />

      {/* Status bar */}
      <div className="h-6 flex items-center justify-center">
        {status === "idle" && (
          <span className="animate-pulse" style={{ fontFamily: "'Fira Code', monospace", fontSize: 10, color: "rgba(167,139,250,0.5)" }}>
            INITIALIZING CONTEXT SYNC...
          </span>
        )}
        {status === "merging" && (
          <div className="flex items-center gap-2">
            <span className="relative flex h-2.5 w-2.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full opacity-75" style={{ background: "#a78bfa" }} />
              <span className="relative inline-flex rounded-full h-2.5 w-2.5" style={{ background: "#a78bfa" }} />
            </span>
            <span style={{ fontFamily: "'Fira Code', monospace", fontSize: 10, color: "rgba(167,139,250,0.8)" }}>
              SYNCING CONTEXTS...
            </span>
          </div>
        )}
        {status === "merged" && (
          <button
            onClick={replay}
            className="px-3 py-1 rounded-full border transition-colors hover:border-[rgba(167,139,250,0.7)]"
            style={{
              fontFamily: "'Fira Code', monospace", fontSize: 10,
              color: "rgba(196,181,253,0.9)", background: "rgba(139,92,246,0.12)",
              borderColor: "rgba(167,139,250,0.4)"
            }}
          >
            ↺ REPLAY MERGE
          </button>
        )}
      </div>
    </div>
  );
});

SplitBrainVisual.displayName = "SplitBrainVisual";
export default SplitBrainVisual;

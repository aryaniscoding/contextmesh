import { useEffect, useRef, useCallback, memo } from "react";

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  color: string;
  alpha: number;
  flickerSpeed: number;
  flickerOffset: number;
}

const ParticleField = memo(() => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animRef = useRef<number>(0);
  const particlesRef = useRef<Particle[]>([]);
  const timeRef = useRef(0);
  const lastFrameRef = useRef(0);

  const initParticles = useCallback((w: number, h: number) => {
    const count = 8;
    const colors = [
      "99,102,241",
      "139,92,246",
      "255,255,255",
    ];

    particlesRef.current = Array.from({ length: count }, () => ({
      x: Math.random() * w,
      y: Math.random() * h,
      vx: (Math.random() - 0.5) * 0.12,
      vy: (Math.random() - 0.5) * 0.12,
      size: Math.random() * 1 + 1,
      color: colors[Math.floor(Math.random() * colors.length)],
      alpha: Math.random() * 0.1 + 0.05,
      flickerSpeed: 1.5 + Math.random() * 2,
      flickerOffset: Math.random() * Math.PI * 2,
    }));
  }, []);

  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    const initTimeout = setTimeout(() => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext("2d");
      if (!ctx) return;

      const resize = () => {
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;
        if (particlesRef.current.length === 0) initParticles(canvas.width, canvas.height);
      };
      resize();
      window.addEventListener("resize", resize);

      const FPS_INTERVAL = 1000 / 30;

      const animate = (time: number) => {
        if (document.hidden) {
          animRef.current = requestAnimationFrame(animate);
          return;
        }

        const elapsed = time - lastFrameRef.current;
        if (elapsed < FPS_INTERVAL) {
          animRef.current = requestAnimationFrame(animate);
          return;
        }
        lastFrameRef.current = time - (elapsed % FPS_INTERVAL);

        timeRef.current = time * 0.001;
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        const particles = particlesRef.current;

        for (const p of particles) {
          p.vx *= 0.999;
          p.vy *= 0.999;

          p.x += p.vx;
          p.y += p.vy;

          if (p.x < -10) p.x = canvas.width + 10;
          if (p.x > canvas.width + 10) p.x = -10;
          if (p.y < -10) p.y = canvas.height + 10;
          if (p.y > canvas.height + 10) p.y = -10;

          const flicker = Math.sin(timeRef.current * p.flickerSpeed + p.flickerOffset);
          const alpha = p.alpha * (0.7 + flicker * 0.3);

          ctx.beginPath();
          ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
          ctx.fillStyle = `rgba(${p.color},${alpha})`;
          ctx.fill();
        }

        animRef.current = requestAnimationFrame(animate);
      };

      animRef.current = requestAnimationFrame(animate);

      (canvasRef as any)._cleanup = () => {
        window.removeEventListener("resize", resize);
        cancelAnimationFrame(animRef.current);
      };
    }, 1200);

    return () => {
      clearTimeout(initTimeout);
      if ((canvasRef as any)._cleanup) (canvasRef as any)._cleanup();
      cancelAnimationFrame(animRef.current);
    };
  }, [initParticles]);

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 w-full h-full pointer-events-none z-0"
      style={{ opacity: 0.15 }}
    />
  );
});

ParticleField.displayName = "ParticleField";

export default ParticleField;

import { useEffect, useRef, useState } from "react";

const AnimatedDivider = () => {
  const ref = useRef<HTMLDivElement>(null);
  const [inView, setInView] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setInView(true);
          obs.disconnect();
        }
      },
      { threshold: 0.5 }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, []);

  return (
    <div className="container mx-auto px-4 lg:px-8">
      <div ref={ref} className={`animated-divider ${inView ? "in-view" : ""}`} />
    </div>
  );
};

export default AnimatedDivider;

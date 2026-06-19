import { CSSProperties } from "react";

interface GlowProps {
  style: CSSProperties;
}

const SectionGlow = ({ style }: GlowProps) => (
  <div
    aria-hidden
    className="absolute pointer-events-none"
    style={{ zIndex: 0, ...style }}
  />
);

export default SectionGlow;

"use client";

/**
 * AmbientBackground — gallery canvas.
 *
 * Almost nothing: a near-black base, one very soft warm glow, and a faint
 * grain. The artwork should own the page; the background should disappear.
 */

const NOISE_URI =
  "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='160' height='160'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='2' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='0.5'/%3E%3C/svg%3E";

export function AmbientBackground() {
  return (
    <div aria-hidden="true" style={{ position: "fixed", inset: 0, zIndex: -1, overflow: "hidden" }}>
      <div style={{ position: "absolute", inset: 0, background: "linear-gradient(to bottom, #0a0a0a, #070707)" }} />
      {/* One soft warm glow, top-center, very faint */}
      <div
        style={{
          position: "absolute",
          top: "-30%",
          left: "50%",
          transform: "translateX(-50%)",
          width: "80vw",
          height: "80vw",
          background: "radial-gradient(circle, rgba(216, 201, 163, 0.05) 0%, transparent 60%)",
        }}
      />
      {/* Grain */}
      <div style={{ position: "absolute", inset: 0, backgroundImage: `url("${NOISE_URI}")`, opacity: 0.03 }} />
    </div>
  );
}

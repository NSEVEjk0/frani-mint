"use client";

/**
 * NftArt — deterministic generative art for a minted NFT.
 *
 * A seed renders a unique gradient + geometric pattern. Pure SVG, no images.
 */

const HUES = [38, 42, 45, 262, 265, 270, 200, 160];

function seedHue(seed: number): number {
  return HUES[seed % HUES.length];
}

export function NftArt({
  seed,
  className,
}: {
  seed: number;
  className?: string;
}) {
  const hue = seedHue(seed);
  const hue2 = (hue + 40 + (seed % 60)) % 360;
  const id = `g${seed % 997}`;

  return (
    <svg
      viewBox="0 0 400 400"
      className={className}
      role="img"
      aria-label="Generated NFT artwork"
      style={{ background: `hsl(${hue} 60% 12%)`, width: "100%", height: "100%" }}
    >
      <defs>
        <linearGradient id={id} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor={`hsl(${hue} 85% 55%)`} />
          <stop offset="55%" stopColor={`hsl(${hue2} 70% 42%)`} />
          <stop offset="100%" stopColor={`hsl(${hue} 80% 22%)`} />
        </linearGradient>
      </defs>
      <rect width="400" height="400" fill={`url(#${id})`} />
      <circle
        cx={120 + (seed % 160)}
        cy={100 + ((seed >> 3) % 180)}
        r={60 + (seed % 80)}
        fill="none"
        stroke={`hsl(${hue2} 90% 70% / 0.5)`}
        strokeWidth="2"
      />
      <circle
        cx={260 - (seed % 120)}
        cy={280 - ((seed >> 5) % 140)}
        r={40 + ((seed >> 2) % 70)}
        fill={`hsl(${hue} 90% 75% / 0.25)`}
      />
      <path
        d={`M 0 ${300 + (seed % 80)} Q 100 ${200 + (seed % 120)} 200 ${
          260 + (seed % 60)
        } T 400 ${220 + (seed % 100)} L 400 400 L 0 400 Z`}
        fill={`hsl(${hue2} 70% 60% / 0.35)`}
      />
      <path
        d={`M 0 ${340 + (seed % 40)} Q 120 ${280 + (seed % 80)} 240 ${
          320 + (seed % 50)
        } T 400 ${300 + (seed % 60)} L 400 400 L 0 400 Z`}
        fill={`hsl(${hue} 80% 70% / 0.4)`}
      />
    </svg>
  );
}

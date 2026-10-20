/**
 * Frani Mint — wordmark + mark.
 *
 * The mark is a geometric "mint" octahedron: a gem being cut, drawn as three
 * nested diamond facets. Clean lines, no gradients — it works at 16px and
 * 160px, in light and dark.
 */

export function MintMark({ size = 32, className }: { size?: number; className?: string }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 48 48"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
      className={className}
    >
      {/* outer facet */}
      <path d="M24 4 42 16 24 44 6 16 24 4Z" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" />
      {/* inner cut lines */}
      <path d="M6 16 24 28 42 16" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" opacity="0.6" />
      <path d="M24 28V44" stroke="currentColor" strokeWidth="1.5" opacity="0.6" />
      {/* table facet */}
      <path d="M16 12 24 8 32 12 24 16 16 12Z" fill="currentColor" opacity="0.85" />
    </svg>
  );
}

export function MintWordmark({ dark = false }: { dark?: boolean }) {
  return (
    <span style={{ display: "inline-flex", alignItems: "center", gap: 10 }}>
      <MintMark size={30} />
      <span
        style={{
          fontFamily: "var(--font-display)",
          fontWeight: 600,
          fontSize: "1.05rem",
          letterSpacing: "0.02em",
          color: dark ? "#0a0a0a" : "inherit",
        }}
      >
        Frani<span style={{ fontWeight: 400, opacity: 0.55 }}> Mint</span>
      </span>
    </span>
  );
}

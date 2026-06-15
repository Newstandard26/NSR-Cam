// NSR ★ ELITE wordmark, recreated as SVG. Uses currentColor so it adapts to
// light/dark backgrounds. Replace /public/brand/* with the official raster
// assets when wiring favicon / marketing.
export function BrandMark({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 320 64" className={className} role="img" aria-label="NSR Elite">
      <rect
        x="3"
        y="3"
        width="314"
        height="58"
        rx="4"
        fill="none"
        stroke="currentColor"
        strokeWidth="5"
      />
      <text
        x="160"
        y="44"
        textAnchor="middle"
        fontFamily="Arial Narrow, Arial, sans-serif"
        fontWeight="800"
        fontSize="34"
        letterSpacing="2"
        fill="currentColor"
      >
        NSR ★ ELITE
      </text>
    </svg>
  )
}

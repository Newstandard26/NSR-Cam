// NSR ★ ELITE wordmark — military stencil style (Black Ops One via --font-stencil).
// Uses currentColor for border + text so it adapts to light/dark backgrounds.

type Size = "sm" | "md" | "lg"

const SIZES: Record<Size, { box: string; text: string; star: string; sub: string; border: string }> = {
  sm: { box: "px-3 py-1 rounded-lg", text: "text-base", star: "text-sm", sub: "text-[9px] tracking-[0.35em] mt-1", border: "border-2" },
  md: { box: "px-5 py-2 rounded-xl", text: "text-2xl", star: "text-xl", sub: "text-xs tracking-[0.4em] mt-2", border: "border-[3px]" },
  lg: { box: "px-6 py-2.5 rounded-2xl", text: "text-3xl", star: "text-2xl", sub: "text-sm tracking-[0.45em] mt-2.5", border: "border-[3px]" },
}

export function BrandMark({
  className = "",
  size = "md",
  subtitle,
}: {
  className?: string
  size?: Size
  subtitle?: string
}) {
  const s = SIZES[size]
  return (
    <div className={`inline-flex flex-col items-center text-current ${className}`} style={{ fontFamily: "var(--font-stencil)" }}>
      <div className={`${s.box} ${s.border} border-current inline-flex items-center leading-none`}>
        <span className={`${s.text} tracking-wider`}>NSR</span>
        <span className={`${s.star} mx-2`}>★</span>
        <span className={`${s.text} tracking-wider`}>ELITE</span>
      </div>
      {subtitle && <span className={`${s.sub} uppercase`}>{subtitle}</span>}
    </div>
  )
}

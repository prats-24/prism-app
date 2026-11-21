export function PrismMark({ size = 32 }: { size?: number }) {
  return (
    <svg width={size * 0.815} height={size} viewBox="0 0 620 760" role="img" aria-label="PRISM" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="pm-tri" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#8CC4F8" /><stop offset="1" stopColor="#2F6CB0" /></linearGradient>
        <linearGradient id="pm-top" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stopColor="#3F72B2" /><stop offset="1" stopColor="#3A68A6" /></linearGradient>
        <linearGradient id="pm-bowl" x1="0" y1="1" x2="1" y2="0"><stop offset="0" stopColor="#9ACBF8" /><stop offset=".55" stopColor="#5E9DDD" /><stop offset="1" stopColor="#3668A4" /></linearGradient>
        <linearGradient id="pm-rib" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stopColor="#B9DDFA" /><stop offset="1" stopColor="#CFE8FC" /></linearGradient>
        <linearGradient id="pm-stem" x1="0" y1="1" x2="1" y2="0"><stop offset="0" stopColor="#86BBEF" /><stop offset="1" stopColor="#4F8CCB" /></linearGradient>
      </defs>
      <g transform="translate(-340 -300)">
        <path d="M358 322H735C850 322 935 430 935 545C935 580 922 615 895 640L765 510C750 490 730 478 705 478H555Z" fill="url(#pm-top)" />
        <path d="M358 322L555 478V620L358 730Z" fill="url(#pm-tri)" />
        <path d="M765 510L895 640C868 718 800 768 710 768H562L358 885V805L722 618C760 600 778 560 765 510Z" fill="url(#pm-bowl)" />
        <path d="M358 730L555 620H730L358 805Z" fill="url(#pm-rib)" />
        <path d="M358 885L562 770V905L358 1035Z" fill="url(#pm-stem)" />
      </g>
    </svg>
  );
}

export function PrismLogo({ size = 32 }: { size?: number }) {
  return (
    <span className="inline-flex items-center gap-3">
      <PrismMark size={size} />
      <span className="font-semibold text-ink" style={{ fontSize: size * 0.62, letterSpacing: "0.22em" }}>PRISM</span>
    </span>
  );
}

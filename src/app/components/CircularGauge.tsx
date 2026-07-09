export function CircularGauge({ pct, size = 210 }: { pct: number; size?: number }) {
  const stroke = 14;
  const r = (size - stroke) / 2;
  const cx = size / 2;
  const cy = size / 2;
  const circ = 2 * Math.PI * r;
  const arcPct = Math.min(100, pct);
  const offset = circ - (arcPct / 100) * circ;

  return (
    <div className="gauge" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="gauge-svg">
        <circle cx={cx} cy={cy} r={r} fill="none" stroke="var(--muted)" strokeWidth={stroke} />
        <circle
          cx={cx} cy={cy} r={r} fill="none"
          stroke="url(#gaugeGrad)" strokeWidth={stroke}
          strokeDasharray={circ} strokeDashoffset={offset}
          strokeLinecap="round"
          style={{ transition: "stroke-dashoffset 0.6s ease" }}
        />
        <defs>
          <linearGradient id="gaugeGrad" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#C4877D" />
            <stop offset="100%" stopColor="#C4A8D4" />
          </linearGradient>
        </defs>
      </svg>
      <div className="gauge-center">
        <span className="gauge-number">{pct.toFixed(2)}</span>
        <span className="gauge-unit">%</span>
      </div>
    </div>
  );
}

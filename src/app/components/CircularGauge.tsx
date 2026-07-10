export function CircularGauge({ pct, size = 210 }: { pct: number; size?: number }) {
  const stroke = 20;
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
          <circle class="progress-glow" id="progressGlow" cx="130" cy="130" r="106" />
          <linearGradient id="gaugeGrad" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stop-color="#f2aac8">
                  <animate attributeName="stop-color" values="#f2aac8;#a8d8ef;#c9b7ff;#f2d29b;#f2aac8" dur="6s" repeatCount="indefinite" />
                </stop>
           <stop offset="45%" stop-color="#a8d8ef">
                  <animate attributeName="stop-color" values="#a8d8ef;#c9b7ff;#f2d29b;#f2aac8;#a8d8ef" dur="6s" repeatCount="indefinite" />
                </stop>
                <stop offset="100%" stop-color="#c9b7ff">
                  <animate attributeName="stop-color" values="#c9b7ff;#f2d29b;#f2aac8;#a8d8ef;#c9b7ff" dur="6s" repeatCount="indefinite" />
                </stop>
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

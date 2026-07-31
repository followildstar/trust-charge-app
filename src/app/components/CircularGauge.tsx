import { useId } from "react";

export function CircularGauge({ pct, size = 210 }: { pct: number; size?: number }) {
  const stroke = 20;
  const r = (size - stroke) / 2;
  const cx = size / 2;
  const cy = size / 2;
  const circ = 2 * Math.PI * r;
  const arcPct = Math.min(100, pct);
  const offset = circ - (arcPct / 100) * circ;
  // 같은 화면에 게이지가 동시에 여러 개 떠도(예: 홈 + 스플래시) id가 겹치지 않도록 인스턴스별로 고유하게 생성
  const uid = useId();
  const gradId = `gaugeGrad-${uid}`;

  return (
    <div className="gauge" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="gauge-svg">
        <circle cx={cx} cy={cy} r={r} fill="none" stroke="var(--muted)" strokeWidth={stroke} />
        <circle
          cx={cx} cy={cy} r={r} fill="none"
          stroke={`url(#${gradId})`} strokeWidth={stroke}
          strokeDasharray={circ} strokeDashoffset={offset}
          strokeLinecap="round"
          style={{ transition: "stroke-dashoffset 0.6s ease" }}
        />
        <defs>
          <linearGradient id={gradId} x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#f2aac8">
              <animate attributeName="stop-color" values="#f2aac8;#a8d8ef;#c9b7ff;#f2d29b;#f2aac8" dur="6s" repeatCount="indefinite" />
            </stop>
            <stop offset="45%" stopColor="#a8d8ef">
              <animate attributeName="stop-color" values="#a8d8ef;#c9b7ff;#f2d29b;#f2aac8;#a8d8ef" dur="6s" repeatCount="indefinite" />
            </stop>
            <stop offset="100%" stopColor="#c9b7ff">
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

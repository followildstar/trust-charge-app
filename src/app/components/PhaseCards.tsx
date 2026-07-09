import { format, parseISO } from "date-fns";
import { ChevronRight, Settings } from "lucide-react";
import { calcTotalProgress, getDday, getPhaseStatus } from "../lib/calc";
import type { Phase } from "../types";

export function PhaseHeroCard({
  phase, onOpenDetail,
}: {
  phase: Phase;
  onOpenDetail: () => void;
}) {
  const dday = getDday(phase);
  const status = getPhaseStatus(phase);
  const progress = calcTotalProgress(phase);
  const statusLabel = status === "active" ? "진행 중" : status === "upcoming" ? "시작 예정" : "완료";
  const statusBg = status === "active" ? "badge-active" : status === "upcoming" ? "badge-upcoming" : "badge-done";

  return (
    <button className="phase-hero" onClick={onOpenDetail} style={{ background: "linear-gradient(135deg, #F9EDE8 0%, #EDE8F5 100%)" }}>
      <div className="phase-hero-body">
        <div className="row-between-mb4">
          <span className={`phase-badge ${statusBg}`}>{statusLabel}</span>
          <div className="col-end">
            <span className="phase-dday">{dday.label}</span>
            {dday.suffix && <span className="phase-dday-suffix">{dday.suffix}까지</span>}
          </div>
        </div>

        <div className="mb3">
          <div className="phase-hero-name">{phase.name}</div>
          <div className="phase-goal">{phase.mainGoal}</div>
        </div>

        {/* Score bar */}
        <div className="mb4">
          <div className="row-between-mb15">
            <span className="phase-section">
              {status === "completed" ? "최종 점수" : "현재 점수"}
            </span>
            <span className="score-display">{progress.toFixed(2)}%</span>
          </div>
          <div className="progress-track">
            <div
              className="progress-fill"
              style={{ width: `${Math.min(100, progress)}%`, background: "linear-gradient(90deg, #C4877D, #C4A8D4)" }}
            />
          </div>
        </div>

        <div className="phase-daterange">
          {format(parseISO(phase.startDate), "yyyy.MM.dd")} — {format(parseISO(phase.endDate), "yyyy.MM.dd")}
        </div>

        {phase.priority.length > 0 && (
          <div className="hero-priority">
            <div className="phase-section-mb2">우선순위</div>
            <div className="chip-row">
              {phase.priority.map((p, i) => (
                <span key={i} className="priority-chip">
                  {i + 1}. {p}
                </span>
              ))}
            </div>
          </div>
        )}

        <div className="hero-open-hint">
          <Settings size={13} strokeWidth={2} /> 설정 열기
          <ChevronRight size={14} strokeWidth={2.5} />
        </div>
      </div>
    </button>
  );
}

export function PhaseSmallCard({
  phase, onOpenDetail,
}: {
  phase: Phase;
  onOpenDetail: () => void;
}) {
  const dday = getDday(phase);
  const status = getPhaseStatus(phase);
  const isCompleted = status === "completed";
  const progress = calcTotalProgress(phase);

  return (
    <button
      onClick={onOpenDetail}
      className={`phase-small${isCompleted ? " is-completed" : ""}`}
    >
      <div className="row-between-mb15b">
        <div className="phase-card-name">{phase.name}</div>
        <div className="col-end-fixed">
          <span className="score-display-sm">{progress.toFixed(1)}%</span>
          <span className="period-counter">{dday.label}</span>
        </div>
      </div>
      <div className="phase-goal-sm">{phase.mainGoal}</div>
      {/* Progress bar */}
      <div className="progress-track-sm">
        <div
          className="progress-fill-plain"
          style={{ width: `${Math.min(100, progress)}%`, background: isCompleted ? "var(--muted-foreground)" : "var(--primary)" }}
        />
      </div>
      <div className="period-counter">
        {format(parseISO(phase.startDate), "yyyy.MM.dd")} — {format(parseISO(phase.endDate), "yyyy.MM.dd")}
        <span className="status-inline">{isCompleted ? "완료" : status === "upcoming" ? "예정" : "진행 중"}</span>
      </div>
    </button>
  );
}

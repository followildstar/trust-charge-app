import type * as React from "react";
import { eachDayOfInterval, format, isAfter, parseISO } from "date-fns";
import { ChevronRight, ExternalLink } from "lucide-react";
import { CircularGauge } from "../components/CircularGauge";
import { HabitCard } from "../components/HabitCard";
import { SectionLabel } from "../components/SectionLabel";
import { calcScore, calcTotalProgress, getPhaseStatus, toKoDateStr } from "../lib/calc";
import type { Action, AppState } from "../types";

export function HomeScreen({
  state, dispatch, onGoPhases,
}: {
  state: AppState;
  dispatch: React.Dispatch<Action>;
  onGoPhases: () => void;
}) {
  const today = format(new Date(), "yyyy-MM-dd");
  const activePhase = state.phases.find(p => p.id === state.activePhaseId)!;
  const totalProgress = calcTotalProgress(activePhase);
  const todayScore = calcScore(activePhase, today);
  const dayRec = activePhase.records[today] || {};

  const allDays = eachDayOfInterval({ start: parseISO(activePhase.startDate), end: parseISO(activePhase.endDate) });
  const now = new Date();
  const daysPassed = allDays.filter(d => !isAfter(d, now)).length;

  const basicHabits = activePhase.habits.filter(h => h.enabled && !h.isBonus).sort((a, b) => a.order - b.order);
  const bonusHabits = activePhase.habits.filter(h => h.enabled && h.isBonus).sort((a, b) => a.order - b.order);
  const allBasicChecked = basicHabits.length > 0 && basicHabits.every(h => dayRec[h.id]?.checked);
  const phaseStatus = getPhaseStatus(activePhase);

  return (
    <div className="screen">
      <div className="home-header">
        <div>
          <div className="app-title">Trust Charge</div>
          <div className="screen-subtitle">{toKoDateStr(today)}</div>
        </div>
        <button
          onClick={onGoPhases}
          className="phase-switch-btn"
        >
          <span className="phase-indicator">{activePhase.name}</span>
          <ChevronRight size={12} className="chevron-dim" />
        </button>
      </div>

      <div className="screen-body">
        {/* Gauge */}
        <div className="gauge-section">
          <CircularGauge pct={totalProgress} />
          <div className="gauge-caption">누적 자기신뢰도</div>
          <div className="gauge-days">
            {daysPassed}일 / {allDays.length}일 경과
          </div>
        </div>

        {/* Banners */}
        {allBasicChecked && (
          <div className="banner-celebrate" style={{ background: "linear-gradient(135deg, #F9EDE8 0%, #EDE8F5 100%)" }}>
            <div className="banner-text-strong">🎉 오늘 모든 항목을 완료했어요!</div>
          </div>
        )}
        {phaseStatus !== "active" && (
          <div className="banner-notice">
            <div className="banner-text-muted">
              {phaseStatus === "upcoming"
                ? `📅 ${format(parseISO(activePhase.startDate), "M월 d일")} 시작 예정`
                : "✓ 완료된 기간의 기록을 보고 있어요"}
            </div>
          </div>
        )}

        {/* Today score */}
        <div className="today-score-row">
          <div className="section-label-plain">오늘 점수</div>
          <div className="score-display">{todayScore.toFixed(2)}%</div>
        </div>

        {basicHabits.length > 0 && (
          <>
            <SectionLabel>기본 항목</SectionLabel>
            <div className="stack-2">
              {basicHabits.map(h => (
                <HabitCard key={h.id} habit={h}
                  record={dayRec[h.id] || { checked: false, selectedOptionId: "" }}
                  onToggle={() => dispatch({ type: "TOGGLE_CHECK", date: today, habitId: h.id })}
                  onSetOption={optId => dispatch({ type: "SET_OPTION", date: today, habitId: h.id, optionId: optId })}
                />
              ))}
            </div>
          </>
        )}

        {bonusHabits.length > 0 && (
          <>
            <SectionLabel>보너스</SectionLabel>
            <div className="stack-2">
              {bonusHabits.map(h => (
                <HabitCard key={h.id} habit={h}
                  record={dayRec[h.id] || { checked: false, selectedOptionId: "" }}
                  onToggle={() => dispatch({ type: "TOGGLE_CHECK", date: today, habitId: h.id })}
                  onSetOption={optId => dispatch({ type: "SET_OPTION", date: today, habitId: h.id, optionId: optId })}
                />
              ))}
            </div>
          </>
        )}

        {(activePhase.links ?? []).length > 0 && (
          <>
            <SectionLabel>빠른 링크</SectionLabel>
            <div className="stack-2">
              {(activePhase.links ?? []).map(link => (
                <button
                  key={link.id}
                  onClick={() => {
                    const href = link.url.startsWith("http") ? link.url : `https://${link.url}`;
                    window.open(href, "_blank", "noopener,noreferrer");
                  }}
                  className="quicklink-btn"
                >
                  <span className="quicklink-emoji">{link.emoji}</span>
                  <span className="quicklink-name">{link.name}</span>
                  <ExternalLink size={14} className="quicklink-ext" />
                </button>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}

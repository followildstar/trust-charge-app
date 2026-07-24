import { useState } from "react";
import type * as React from "react";
import { eachDayOfInterval, endOfMonth, format, parseISO, startOfMonth } from "date-fns";
import { ChevronRight } from "lucide-react";
import { HabitCard } from "../components/HabitCard";
import { KO_DAYS, getDayStatus, isDateInRange, toKoDateStr } from "../lib/calc";
import type { Action, AppState } from "../types";

export function CalendarScreen({ state, dispatch }: { state: AppState; dispatch: React.Dispatch<Action>; }) {
  const today = format(new Date(), "yyyy-MM-dd");
  const activePhase = state.phases.find(p => p.id === state.activePhaseId)!;
  const [viewDate, setViewDate] = useState(today);
  const [selectedDate, setSelectedDate] = useState(today);

  const monthStart = startOfMonth(parseISO(viewDate));
  const monthEnd = endOfMonth(parseISO(viewDate));
  const days = eachDayOfInterval({ start: monthStart, end: monthEnd });
  const startDow = monthStart.getDay();
  const padded = [...Array(startDow).fill(null), ...days];

  const selDateStr = selectedDate;
  const selDayRec = activePhase.records[selDateStr] || {};
  const selDayStatus = getDayStatus(activePhase, selDateStr);
  const selBasicHabits = activePhase.habits.filter(h => h.enabled && !h.isBonus).sort((a, b) => a.order - b.order);
  const selBonusHabits = activePhase.habits.filter(h => h.enabled && h.isBonus).sort((a, b) => a.order - b.order);

  function shiftMonth(delta: number) {
    const d = parseISO(viewDate);
    d.setMonth(d.getMonth() + delta);
    setViewDate(format(d, "yyyy-MM-dd"));
  }

  return (
    <div className="screen">
      <div className="screen-header">
        <div className="screen-title">캘린더</div>
        <div className="screen-subtitle">{activePhase.name}</div>
      </div>

      <div className="screen-body">
        <div className="cal-month-nav">
          <button onClick={() => shiftMonth(-1)} className="cal-nav-btn">
            <ChevronRight size={16} className="icon-flip" />
          </button>
          <div className="cal-month-title">{format(parseISO(viewDate), "yyyy년 M월")}</div>
          <button onClick={() => shiftMonth(1)} className="cal-nav-btn">
            <ChevronRight size={16} />
          </button>
        </div>

        <div className="cal-weekday-grid">
          {KO_DAYS.map(d => (
            <div key={d} className="cal-weekday">{d}</div>
          ))}
        </div>

        <div className="cal-day-grid">
          {padded.map((d, i) => {
            if (!d) return <div key={`pad-${i}`} />;
            const ds = format(d, "yyyy-MM-dd");
            const inRange = isDateInRange(ds, activePhase.startDate, activePhase.endDate);
            const dayStatus = getDayStatus(activePhase, ds);
            const isTodayDate = ds === today;
            const isSelected = ds === selectedDate;
            let bg = "transparent";
            let textClass = "day-out";
            if (inRange) {
              textClass = "day-in";
              if (dayStatus.isFullDay) bg = "var(--primary)";
              else if (dayStatus.score > 0) bg = "var(--secondary)";
            }
            return (
              <button key={ds} onClick={() => setSelectedDate(ds)} className={`cal-day${isSelected ? " is-selected" : ""}`}>
                <div className={`cal-day-circle${isTodayDate ? " is-today" : ""}`} style={{ background: bg }}>
                  <span className={`cal-day-num${isTodayDate ? " is-today" : ""} ${dayStatus.isFullDay ? "on-primary" : textClass}`}>
                    {format(d, "d")}
                  </span>
                </div>
                {inRange && (dayStatus.isPast || dayStatus.isToday) && dayStatus.score > 0 && (
                  <span className="cal-day-score">{dayStatus.score.toFixed(0)}</span>
                )}
              </button>
            );
          })}
        </div>

        <div className="cal-legend">
          <div className="legend-item">
            <div className="legend-dot-full" />
            <span className="legend-label">완료</span>
          </div>
          <div className="legend-item">
            <div className="legend-dot-partial" />
            <span className="legend-label">부분</span>
          </div>
        </div>

        <div className="cal-detail-card">
          <div className="row-between-mb3">
            <div className="card-title">{toKoDateStr(selDateStr)}</div>
            {(selDayStatus.isPast || selDayStatus.isToday) && (
              <div className="score-display">{selDayStatus.score.toFixed(2)}%</div>
            )}
          </div>
          {isDateInRange(selDateStr, activePhase.startDate, activePhase.endDate) ? (
            <div className="stack-2">
              {selBasicHabits.map(h => (
                <HabitCard key={h.id} habit={h}
                  record={selDayRec[h.id] || { checked: false, selectedOptionId: "" }}
                  onToggle={() => dispatch({ type: "TOGGLE_CHECK", date: selDateStr, habitId: h.id })}
                  onSetOption={optId => dispatch({ type: "SET_OPTION", date: selDateStr, habitId: h.id, optionId: optId })}
                />
              ))}
              {selBonusHabits.map(h => (
                <HabitCard key={h.id} habit={h}
                  record={selDayRec[h.id] || { checked: false, selectedOptionId: "" }}
                  onToggle={() => dispatch({ type: "TOGGLE_CHECK", date: selDateStr, habitId: h.id })}
                  onSetOption={optId => dispatch({ type: "SET_OPTION", date: selDateStr, habitId: h.id, optionId: optId })}
                />
              ))}
            </div>
          ) : (
            <div className="empty-msg-py4">실천 기간 외의 날짜예요</div>
          )}
        </div>
      </div>
    </div>
  );
}

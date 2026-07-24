import { useState } from "react";
import { eachDayOfInterval, format, isAfter, parseISO } from "date-fns";
import { CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { KO_DAYS, calcScore } from "../lib/calc";
import type { AppState, StatsTab } from "../types";

export function StatsScreen({ state }: { state: AppState }) {
  const [tab, setTab] = useState<StatsTab>("overview");
  const activePhase = state.phases.find(p => p.id === state.activePhaseId)!;
  const today = format(new Date(), "yyyy-MM-dd");

  const allDays = eachDayOfInterval({ start: parseISO(activePhase.startDate), end: parseISO(activePhase.endDate) });
  const now = new Date();
  const pastDays = allDays.filter(d => !isAfter(d, now));
  const scores = pastDays.map(d => calcScore(activePhase, format(d, "yyyy-MM-dd")));
  const nonZeroScores = scores.filter(s => s > 0);
  const avgScore = nonZeroScores.length > 0 ? nonZeroScores.reduce((a, b) => a + b, 0) / nonZeroScores.length : 0;
  const maxScore = scores.length > 0 ? Math.max(...scores) : 0;
  const basicHabits = activePhase.habits.filter(h => h.enabled && !h.isBonus);
  const streak = (() => {
    let s = 0;
    for (let i = pastDays.length - 1; i >= 0; i--) {
      const ds = format(pastDays[i], "yyyy-MM-dd");
      const dayRec = activePhase.records[ds] || {};
      const full = basicHabits.length > 0 && basicHabits.every(h => dayRec[h.id]?.checked);
      if (full) s++;
      else break;
    }
    return s;
  })();

  const trendData = pastDays.slice(-14).map((d, idx) => ({
    idx,
    label: format(d, "M/d"),
    score: calcScore(activePhase, format(d, "yyyy-MM-dd")),
  }));

  const timelineDays = [...pastDays].reverse().slice(0, 30);

  return (
    <div className="screen">
      <div className="screen-header">
        <div className="screen-title">기록</div>
        <div className="screen-subtitle">{activePhase.name}</div>
      </div>

      <div className="stats-tab-wrap">
        <div className="tab-bar">
          {(["overview", "timeline"] as StatsTab[]).map(t => (
            <button key={t} onClick={() => setTab(t)}
              className={`stats-tab${tab === t ? " is-active" : ""}`}>
              {t === "overview" ? "통계" : "타임라인"}
            </button>
          ))}
        </div>
      </div>

      <div className="screen-body">
        {tab === "overview" && (
          <>
            <div className="stat-grid">
              {[
                { label: "평균 점수", value: `${avgScore.toFixed(2)}%`, sub: "기록된 날 기준" },
                { label: "최고 점수", value: `${maxScore.toFixed(2)}%`, sub: "전체 기간" },
                { label: "연속 완료", value: `${streak}일`, sub: "기본항목 기준" },
                { label: "기록 일수", value: `${pastDays.length}일`, sub: `총 ${allDays.length}일 중` },
              ].map(c => (
                <div key={c.label} className="card-pad">
                  <div className="stat-label">{c.label}</div>
                  <div className="stat-value">{c.value}</div>
                  <div className="stat-sub">{c.sub}</div>
                </div>
              ))}
            </div>

            <div className="card-pad-mb5">
              <div className="card-title-mb4">최근 14일 점수</div>
              {trendData.length > 1 ? (
                <ResponsiveContainer width="100%" height={160}>
                  <LineChart data={trendData} margin={{ top: 4, right: 4, bottom: 0, left: -24 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                    <XAxis dataKey="idx" type="number" domain={[0, trendData.length - 1]}
                      ticks={trendData.map(d => d.idx)}
                      tickFormatter={i => trendData[i]?.label ?? ""}
                      tick={{ fontSize: 10, fill: "var(--muted-foreground)" }}
                    />
                    <YAxis domain={[0, 100]} tick={{ fontSize: 10, fill: "var(--muted-foreground)" }} />
                    <Tooltip
                      contentStyle={{ borderRadius: 12, border: "1px solid var(--border)", background: "var(--card)" }}
                      labelFormatter={i => trendData[Number(i)]?.label ?? ""}
                      formatter={(v: number) => [`${v.toFixed(2)}%`, "점수"]}
                    />
                    <Line type="monotone" dataKey="score" stroke="var(--primary)" strokeWidth={2}
                      dot={{ r: 3, fill: "var(--primary)" }} activeDot={{ r: 5 }} />
                  </LineChart>
                </ResponsiveContainer>
              ) : (
                <div className="empty-msg-py8">데이터가 부족해요</div>
              )}
            </div>

            <div className="card-pad">
              <div className="card-title-mb3">항목별 실천률</div>
              {activePhase.habits.filter(h => h.enabled).map(h => {
                const doneCount = pastDays.filter(d => activePhase.records[format(d, "yyyy-MM-dd")]?.[h.id]?.checked).length;
                const pct = pastDays.length > 0 ? (doneCount / pastDays.length) * 100 : 0;
                return (
                  <div key={h.id} className="mb3">
                    <div className="row-between-mb1">
                      <span className="chart-label-fg">{h.name}{h.isBonus ? " (보너스)" : ""}</span>
                      <span className="chart-label-muted">{doneCount}/{pastDays.length}일</span>
                    </div>
                    <div className="bar-track">
                      <div className="progress-fill" style={{ width: `${pct}%`, background: h.isBonus ? "var(--accent)" : "var(--primary)" }} />
                    </div>
                  </div>
                );
              })}
            </div>
          </>
        )}

        {tab === "timeline" && (
          <div className="stack-2">
            {timelineDays.length === 0 && (
              <div className="empty-msg-py12">아직 기록이 없어요</div>
            )}
            {timelineDays.map(d => {
              const ds = format(d, "yyyy-MM-dd");
              const score = calcScore(activePhase, ds);
              const dayRec = activePhase.records[ds] || {};
              const checked = activePhase.habits.filter(h => h.enabled && dayRec[h.id]?.checked);
              const isToday = ds === today;
              return (
                <div key={ds} className={`timeline-row${isToday ? " is-today" : ""}`}>
                  <div className="timeline-score-col">
                    <div className="timeline-score">{score.toFixed(0)}</div>
                    <div className="timeline-unit">%</div>
                  </div>
                  <div className="fill-min">
                    <div className="timeline-date">
                      {format(d, "M월 d일")} <span className="timeline-weekday">({KO_DAYS[d.getDay()]})</span>
                      {isToday && <span className="timeline-today-tag">· 오늘</span>}
                    </div>
                    <div className="timeline-habits">
                      {checked.length > 0 ? checked.map(h => h.name).join(", ") : "기록 없음"}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

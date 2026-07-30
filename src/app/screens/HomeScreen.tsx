import type * as React from "react";
import { useState } from "react";
import { eachDayOfInterval, format, isAfter, parseISO } from "date-fns";
import { ExternalLink, MoreVertical } from "lucide-react";
import { CircularGauge } from "../components/CircularGauge";
import { HabitCard } from "../components/HabitCard";
import { SectionLabel } from "../components/SectionLabel";
import { calcScore, calcTotalProgress, getPhaseStatus, isActiveWeekday, isDateInRange, PHASE_DAYS_LABEL, toKoDateStr } from "../lib/calc";
import type { Action, AppState, Phase } from "../types";

function phaseStatusLabel(phase: Phase): string {
  const s = getPhaseStatus(phase);
  if (s === "active") return "진행중";
  if (s === "upcoming") return "예정";
  return "완료";
}

export function HomeScreen({
  state, dispatch, onGoPhases, onToast,
}: {
  state: AppState;
  dispatch: React.Dispatch<Action>;
  onGoPhases: (phaseId?: string) => void;
  onToast: (msg: string) => void;
}) {
  const today = format(new Date(), "yyyy-MM-dd");
  const activePhase = state.phases.find(p => p.id === state.activePhaseId)!;
  const totalProgress = calcTotalProgress(activePhase);
  const todayScore = calcScore(activePhase, today);
  const dayRec = activePhase.records[today] || {};

  const [showPhaseMenu, setShowPhaseMenu] = useState(false);
  const [showPhaseSwitch, setShowPhaseSwitch] = useState(false);

  const allDays = eachDayOfInterval({ start: parseISO(activePhase.startDate), end: parseISO(activePhase.endDate) });
  const now = new Date();
  const daysPassed = allDays.filter(d => !isAfter(d, now)).length;
  const daysLeft = allDays.length - daysPassed;

  const basicHabits = activePhase.habits.filter(h => h.enabled && !h.isBonus).sort((a, b) => a.order - b.order);
  const bonusHabits = activePhase.habits.filter(h => h.enabled && h.isBonus).sort((a, b) => a.order - b.order);
  const allBasicChecked = basicHabits.length > 0 && basicHabits.every(h => dayRec[h.id]?.checked);
  const phaseStatus = getPhaseStatus(activePhase);

  // 오늘이 목표 기간에 포함될 때만 체크 가능
  const canCheck = isDateInRange(today, activePhase.startDate, activePhase.endDate);
  // 오늘이 목표의 활동 요일(매일/평일/주말)에 해당하는지
  const isActiveDay = isActiveWeekday(parseISO(today), activePhase.days ?? "all");
  // 기간 안이지만 활동 요일이 아닌 날 → 체크리스트 대신 안내 문구를 보여줌
  const showInactiveMessage = canCheck && !isActiveDay;
  const inactiveDayMsg = `이 목표는 ${PHASE_DAYS_LABEL[activePhase.days ?? "all"]}에만 활동해요`;
  const phaseDaysShort = PHASE_DAYS_LABEL[activePhase.days ?? "all"].split(" ")[0];

  const sortedPhasesForSwitch = [...state.phases].sort((a, b) => a.startDate.localeCompare(b.startDate));

  function handleToggle(habitId: string) {
    if (!canCheck) {
      onToast(
        phaseStatus === "upcoming"
          ? "아직 시작 전이에요. 시작일부터 체크할 수 있어요"
          : "실천 기간이 지났어요. 캘린더에서 지난 기록을 확인해요"
      );
      return;
    }
    if (!isActiveDay) {
      onToast(inactiveDayMsg);
      return;
    }
    dispatch({ type: "TOGGLE_CHECK", date: today, habitId });
  }

  function handleSetOption(habitId: string, optId: string) {
    if (!canCheck || !isActiveDay) return;
    dispatch({ type: "SET_OPTION", date: today, habitId, optionId: optId });
  }

  function handleSwitchPhase(phaseId: string) {
    if (phaseId !== state.activePhaseId) {
      dispatch({ type: "SET_ACTIVE_PHASE", phaseId });
    }
    setShowPhaseSwitch(false);
  }

  // 퀵링크 클릭 시 이동 처리
  // - 이미 스킴(https://, gandan:// 등)이 있으면 그대로 사용
  // - 스킴 없이 도메인만 입력된 경우에만 https:// 자동으로 붙임
  // - 커스텀 스킴(앱 딥링크)은 window.open이 아니라 location.href로 이동해야
  //   iOS에서 "앱으로 열기" 팝업이 정상적으로 뜸
  function handleOpenLink(rawUrl: string) {
    const raw = rawUrl.trim();
    if (!raw) return;

    const href = raw.includes("://") ? raw : `https://${raw}`;

    if (href.startsWith("http://") || href.startsWith("https://")) {
      window.open(href, "_blank", "noopener,noreferrer");
    } else {
      window.location.href = href;
    }
  }

  return (
    <div className="screen">
      <div className="home-header">
        <div>
          <div className="app-title">Trust Charge</div>
          <div className="screen-subtitle">{toKoDateStr(today)}</div>
        </div>
        <div className="phase-menu-wrap">
          <button
            onClick={() => setShowPhaseMenu(v => !v)}
            className="phase-switch-btn"
          >
            <span className="phase-indicator">{activePhase.name} ({phaseDaysShort})</span>
            <MoreVertical size={14} className="chevron-dim" />
          </button>
          {showPhaseMenu && (
            <>
              <div className="menu-overlay" onClick={() => setShowPhaseMenu(false)} />
              <div className="phase-menu-dropdown">
                <button
                  className="phase-menu-item"
                  onClick={() => { setShowPhaseMenu(false); onGoPhases(activePhase.id); }}
                >
                  목표 수정
                </button>
                <button
                  className="phase-menu-item"
                  onClick={() => { setShowPhaseMenu(false); setShowPhaseSwitch(true); }}
                >
                  목표 변경
                </button>
              </div>
            </>
          )}
        </div>
      </div>

      <div className="screen-body">
        {/* Gauge */}
        <div className="gauge-section">
          <CircularGauge pct={totalProgress} />
          <div className="gauge-days">
             {/* {daysPassed}일 경과 */}
            {daysLeft > 0 && `  ${daysLeft}일 남음`} · 총 {allDays.length}일
          </div>
        </div>

        {/* Banners */}
        {!showInactiveMessage && allBasicChecked && (
          <div className="banner-celebrate">
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

        {!showInactiveMessage && (
          <div className="today-score-row">
            <div className="section-label-plain">오늘 점수</div>
            <div className="score-display">{todayScore.toFixed(2)}%</div>
          </div>
        )}

        {showInactiveMessage ? (
          <div className="card-pad">
            <div className="empty-msg-py4">{inactiveDayMsg}</div>
          </div>
        ) : (
          <>
            {basicHabits.length > 0 && (
              <>
                <SectionLabel>기본 항목</SectionLabel>
                <div className="stack-2">
                  {basicHabits.map(h => (
                    <HabitCard key={h.id} habit={h}
                      record={dayRec[h.id] || { checked: false, selectedOptionId: "" }}
                      onToggle={() => handleToggle(h.id)}
                      onSetOption={optId => handleSetOption(h.id, optId)}
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
                      onToggle={() => handleToggle(h.id)}
                      onSetOption={optId => handleSetOption(h.id, optId)}
                    />
                  ))}
                </div>
              </>
            )}
          </>
        )}

        {(activePhase.links ?? []).length > 0 && (
          <>
            <SectionLabel>빠른 링크</SectionLabel>
            <div className="stack-2">
              {(activePhase.links ?? []).map(link => (
                <button
                  key={link.id}
                  onClick={() => handleOpenLink(link.url)}
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

      {/* 목표 변경 모달 */}
      {showPhaseSwitch && (
        <div className="dialog-overlay" onClick={() => setShowPhaseSwitch(false)}>
          <div className="modal-center-panel" onClick={e => e.stopPropagation()}>
            <div className="modal-title">목표 변경</div>
            <div className="stack-2">
              {sortedPhasesForSwitch.map(p => {
                const isCurrent = p.id === state.activePhaseId;
                const progress = calcTotalProgress(p);
                return (
                  <button
                    key={p.id}
                    onClick={() => handleSwitchPhase(p.id)}
                    className={`phase-switch-row${isCurrent ? " is-current" : ""}`}
                  >
                    <div className="fill-min">
                      <div className="row-2">
                        <span className="settings-name">{p.name}</span>
                        <span className="phase-status-chip">{phaseStatusLabel(p)}</span>
                      </div>
                      <div className="phase-switch-dates">{p.startDate} ~ {p.endDate}</div>
                    </div>
                    <div className="phase-switch-progress">{progress.toFixed(0)}%</div>
                  </button>
                );
              })}
            </div>
            <button onClick={() => setShowPhaseSwitch(false)} className="btn-muted-flex modal-close-btn">닫기</button>
          </div>
        </div>
      )}
    </div>
  );
}

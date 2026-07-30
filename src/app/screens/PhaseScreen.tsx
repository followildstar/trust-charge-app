import { useEffect, useState } from "react";
import type * as React from "react";
import { Reorder, useDragControls } from "motion/react";
import { ArrowLeft, ChevronRight, Edit2, ExternalLink, GripVertical, Link2, Plus, Trash2 } from "lucide-react";
import { AddLinkModal } from "../components/AddLinkModal";
import { AddPhaseModal } from "../components/AddPhaseModal";
import { HabitEditor } from "../components/HabitEditor";
import { NumberInput } from "../components/NumberInput";
import { PhaseHeroCard, PhaseSmallCard } from "../components/PhaseCards";
import { getDday, getPhaseStatus, habitMaxScore, PHASE_DAYS_LABEL } from "../lib/calc";
import { EMPTY_RETRO } from "../lib/defaults";
import type { Action, AppState, Habit, Phase, QuickLink, Retrospective } from "../types";

// 드래그로 순서를 바꿀 수 있는 습관 행 (손잡이만 드래그 트리거)
function DraggableHabitRow({
  habit, onEdit, onDelete,
}: {
  habit: Habit;
  onEdit: () => void;
  onDelete: () => void;
}) {
  const controls = useDragControls();
  const max = habitMaxScore(habit);
  const ptsText = `${habit.isBonus ? "+ " : ""}${max}P${habit.options.length > 0 ? ` · ${habit.options.length}옵션` : ""}`;
  return (
    <Reorder.Item
      value={habit}
      dragListener={false}
      dragControls={controls}
      className="list-row"
    >
      <button
        className="drag-handle"
        onPointerDown={e => controls.start(e)}
        aria-label="순서 변경"
      >
        <GripVertical size={16} />
      </button>
      <div className="fill-min">
        <div className="settings-name">{habit.name}</div>
        <div className={`settings-pts ptsop${habit.isBonus ? " is-bonus" : ""}`}>{ptsText}</div>
      </div>
      <button onClick={onEdit} className="icon-btn-edit"><Edit2 size={14} /></button>
      <button onClick={onDelete} className="icon-btn-del"><Trash2 size={14} /></button>
    </Reorder.Item>
  );
}

export function PhaseDetailScreen({
  phase, isActive, phaseCount, dispatch, onBack, onActivate,
}: {
  phase: Phase;
  isActive: boolean;
  phaseCount: number;
  dispatch: React.Dispatch<Action>;
  onBack: () => void;
  onActivate: () => void;
}) {
  const status = getPhaseStatus(phase);
  const isCompleted = status === "completed";
  const dday = getDday(phase);
  const links = phase.links ?? [];
  const retro = phase.retrospective ?? EMPTY_RETRO;

  const [editLinkData, setEditLinkData] = useState<QuickLink | null | "new">(null);
  const [retroDraft, setRetroDraft] = useState<Retrospective>(retro);
  const [retroSaved, setRetroSaved] = useState(false);
  const [deleteLinkId, setDeleteLinkId] = useState<string | null>(null);
  const [confirmDeletePhase, setConfirmDeletePhase] = useState(false);
  const canDelete = phaseCount > 1;

  // 목표 정보 편집 상태
  const [editMeta, setEditMeta] = useState(false);
  const [metaName, setMetaName] = useState(phase.name);
  const [metaGoal, setMetaGoal] = useState(phase.mainGoal);
  const [metaPriority, setMetaPriority] = useState(phase.priority.join(", "));
  const [startDate, setStartDate] = useState(phase.startDate);
  const [endDate, setEndDate] = useState(phase.endDate);
  const [baseScore, setBaseScore] = useState(phase.baseScore);
  const [metaDays, setMetaDays] = useState(phase.days ?? "all");

  // 습관(항목) 편집 상태
  const [editHabit, setEditHabit] = useState<Partial<Habit> | null>(null);
  const [deleteHabitId, setDeleteHabitId] = useState<string | null>(null);

  useEffect(() => {
    setRetroDraft(phase.retrospective ?? EMPTY_RETRO);
    setMetaName(phase.name);
    setMetaGoal(phase.mainGoal);
    setMetaPriority(phase.priority.join(", "));
    setStartDate(phase.startDate);
    setEndDate(phase.endDate);
    setBaseScore(phase.baseScore);
    setMetaDays(phase.days ?? "all");
    setEditMeta(false);
  }, [phase.id]);

  const basicHabits = phase.habits.filter(h => !h.isBonus).sort((a, b) => a.order - b.order);
  const bonusHabits = phase.habits.filter(h => h.isBonus).sort((a, b) => a.order - b.order);

  function saveRetro() {
    dispatch({ type: "SET_RETROSPECTIVE", phaseId: phase.id, retrospective: retroDraft });
    setRetroSaved(true);
    setTimeout(() => setRetroSaved(false), 1800);
  }

  function saveMeta() {
    const priority = metaPriority.split(/[,，、]/).map(s => s.trim()).filter(Boolean);
    dispatch({ type: "SET_PHASE_META", phaseId: phase.id, name: metaName, mainGoal: metaGoal, priority, days: metaDays });
    dispatch({ type: "SET_DATE_RANGE", phaseId: phase.id, startDate, endDate });
    dispatch({ type: "SET_BASE_SCORE", phaseId: phase.id, score: baseScore });
    setEditMeta(false);
  }

  return (
    <div className="screen">
      {/* Header */}
      <div className="detail-header">
        <button onClick={onBack} className="back-btn">
          <ArrowLeft size={20} />
        </button>
        <div className="fill-min">
          <div className="row-2">
            <div className="screen-title-truncate">{phase.name}</div>
          </div>
        </div>
        <div className="detail-header-right">
          <div className="phase-dday">{dday.label}</div>
          {dday.suffix && <div className="period-counter">{dday.suffix}까지</div>}
        </div>
      </div>

      <div className="screen-body-stack6">
        {/* Phase summary card */}
        <div className="summary-card">
          <div className="summary-goal">{phase.mainGoal}</div>
          {phase.priority.length > 0 && (
            <div className="chip-row-mb3">
              {phase.priority.map((p, i) => (
                <span key={i} className="priority-chip-sm">
                  {i + 1}. {p}
                </span>
              ))}
            </div>
          )}
          <button
            onClick={isActive ? onBack : onActivate}
            className="btn-primary-full"
          >
            {isActive ? "홈에서 이어가기" : "이 목표로 전환"}
            <ChevronRight size={14} strokeWidth={2.5} />
          </button>
        </div>

        {/* 목표 정보 편집 */}
        <div className="card-pad">
          <div className="cal-month-nav">
            <div className="row-2">
              <span className="card-title">목표 정보</span>
            </div>
            <button onClick={() => setEditMeta(v => !v)} className="btn-link">
              <Edit2 size={13} />{editMeta ? "닫기" : "편집"}
            </button>
          </div>
          {editMeta ? (
            <div className="stack-3">
              <div>
                <div className="field-label-mb1">목표 이름</div>
                <input className="field-input-compact" value={metaName} onChange={e => setMetaName(e.target.value)} />
              </div>
              <div>
                <div className="field-label-mb1">주요 목표</div>
                <input className="field-input-compact" value={metaGoal} onChange={e => setMetaGoal(e.target.value)} />
              </div>
              <div>
                <div className="field-label-mb1">우선순위 (쉼표 구분)</div>
                <input className="field-input-compact" value={metaPriority} onChange={e => setMetaPriority(e.target.value)} />
              </div>
              <div className="grid2-gap2">
                <div>
                  <div className="field-label-mb1">시작일</div>
                  <input type="date" className="field-input-tight" value={startDate} onChange={e => setStartDate(e.target.value)} />
                </div>
                <div>
                  <div className="field-label-mb1">종료일</div>
                  <input type="date" className="field-input-tight" value={endDate} onChange={e => setEndDate(e.target.value)} />
                </div>
              </div>
              <div>
                <div className="field-label-mb1">기본 자기신뢰도 (%)</div>
                <NumberInput min={0} max={99} className="field-input-compact" value={baseScore} onChange={setBaseScore} />
              </div>
              <div>
                <div className="field-label-mb1">활동 요일</div>
                <div className="segmented">
                  {([["all","매일"],["weekday","평일"],["weekend","주말"]] as const).map(([v, lb]) => (
                    <button
                      key={v}
                      type="button"
                      onClick={() => setMetaDays(v)}
                      className={`segmented-btn${metaDays === v ? " is-active" : ""}`}
                    >
                      {lb}
                    </button>
                  ))}
                </div>
              </div>
              <button onClick={saveMeta} className="btn-primary-full-sm">저장</button>
            </div>
          ) : (
            <div className="stack-2">
              {[
                { label: "기간", value: `${phase.startDate} ~ ${phase.endDate}` },
                { label: "활동 요일", value: PHASE_DAYS_LABEL[phase.days ?? "all"] },
                { label: "기본 신뢰도", value: `${phase.baseScore}%` },
              ].map((item, i) => (
                <div key={i} className="info-row">
                  <span className="info-label">{item.label}</span>
                  <span className="info-value">{item.value}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Habits */}
        {basicHabits.length > 0 && (
          <div className="card-pad">
            <div className="cal-month-nav">
              <div className="row-2">
                <span className="card-title">기본 항목</span>
              </div>
              <button onClick={() => setEditHabit({})} className="btn-link">
                <Plus size={13} />추가
              </button>
            </div>
            <Reorder.Group axis="y" values={basicHabits} onReorder={newOrder => {
              const ids = newOrder.map(h => h.id);
              dispatch({ type: "REORDER_HABITS", phaseId: phase.id, isBonus: false, orderedIds: ids });
            }} className="stack-2">
              {basicHabits.map(h => (
                <DraggableHabitRow
                  key={h.id}
                  habit={h}
                  onEdit={() => setEditHabit(h)}
                  onDelete={() => setDeleteHabitId(h.id)}
                />
              ))}
            </Reorder.Group>
          </div>
        )}

        {bonusHabits.length > 0 && (
          <div className="card-pad">
            <div className="cal-month-nav">
              <div className="row-2">
                <span className="card-title">보너스</span>
              </div>
              <button onClick={() => setEditHabit({ isBonus: true })} className="btn-link">
                <Plus size={13} />추가
              </button>
            </div>
            <Reorder.Group axis="y" values={bonusHabits} onReorder={newOrder => {
              const ids = newOrder.map(h => h.id);
              dispatch({ type: "REORDER_HABITS", phaseId: phase.id, isBonus: true, orderedIds: ids });
            }} className="stack-2">
              {bonusHabits.map(h => (
                <DraggableHabitRow
                  key={h.id}
                  habit={h}
                  onEdit={() => setEditHabit(h)}
                  onDelete={() => setDeleteHabitId(h.id)}
                />
              ))}
            </Reorder.Group>
          </div>
        )}

        {basicHabits.length === 0 && bonusHabits.length === 0 && (
          <div className="card-pad">
            <button onClick={() => setEditHabit({})} className="btn-primary-full-sm">
              <Plus size={14} /> 첫 항목 추가
            </button>
          </div>
        )}

        {/* Links */}
        <div className="card-pad">
          <div className="cal-month-nav">
            <div className="row-2">
              <span className="card-title">빠른 링크</span>
            </div>
            <button onClick={() => setEditLinkData("new")} className="btn-link">
              <Plus size={13} />추가
            </button>
          </div>
          {links.length > 0 ? (
            <div className="stack-2">
              {links.map(link => (
                <div key={link.id} className="link-item">
                  <div className="link-meta">
                    <span className="link-emoji">{link.emoji}</span>
                    <span className="link-name">{link.name}</span>
                  </div>
                  <div className="link-actions">
                    <button onClick={() => setEditLinkData(link)} className="icon-btn-edit">
                      <Edit2 size={13} />
                    </button>
                    <button onClick={() => setDeleteLinkId(link.id)} className="icon-btn-del">
                      <Trash2 size={13} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="empty-card">
              <div className="empty-msg-faint">아직 추가된 링크가 없어요</div>
            </div>
          )}
        </div>

        {/* Retrospective */}
        <div className="card-pad">
          <div className="cal-month-nav">
            <div className="row-2">
              <span className="card-title">회고</span>
            </div>
          </div>
          {isCompleted ? (
            <div className="stack-3">
              {[
                { key: "bestPoint", label: "가장 잘한 점", placeholder: "예: 매일 운동을 빠지지 않았어요" },
                { key: "hardPoint", label: "가장 어려웠던 점", placeholder: "예: 저녁 시간 관리가 힘들었어요" },
                { key: "nextReflection", label: "다음에 시도할 것", placeholder: "예: 더 일찍 시작하기" },
              ].map(({ key, label, placeholder }) => (
                <div key={key}>
                  <div className="field-label-fg">{label}</div>
                  <textarea
                    rows={3}
                    className="field-textarea"
                    placeholder={placeholder}
                    value={retroDraft[key as keyof Retrospective]}
                    onChange={e => setRetroDraft(prev => ({ ...prev, [key]: e.target.value }))}
                  />
                </div>
              ))}
              <button
                onClick={saveRetro}
                className={`retro-save-btn${retroSaved ? " is-saved" : ""}`}
              >
                {retroSaved ? "✓ 저장됨" : "저장"}
              </button>
            </div>
          ) : (
            <div className="empty-card">
              <div className="empty-msg-faint">
                Phase가 완료되면 회고를 작성할 수 있어요
              </div>
            </div>
          )}
        </div>

        {/* Danger zone */}
        {canDelete && (
          <div className="danger-zone">
            <button onClick={() => setConfirmDeletePhase(true)} className="btn-delete-phase">
              <Trash2 size={15} /> 이 목표 삭제
            </button>
          </div>
        )}
      </div>

      {/* Delete phase confirm */}
      {confirmDeletePhase && (
        <div className="dialog-overlay" onClick={() => setConfirmDeletePhase(false)}>
          <div className="dialog-panel" onClick={e => e.stopPropagation()}>
            <div className="dialog-title">목표를 삭제할까요?</div>
            <div className="dialog-body">삭제하면 해당 기간의 모든 기록이 사라져요.</div>
            <div className="row-3">
              <button onClick={() => setConfirmDeletePhase(false)} className="btn-muted-flex">취소</button>
              <button
                onClick={() => {
                  dispatch({ type: "DELETE_PHASE", phaseId: phase.id });
                  setConfirmDeletePhase(false);
                  onBack();
                }}
                className="btn-danger-flex"
              >
                삭제
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Habit editor modal */}
      {editHabit !== null && (
        <HabitEditor
          habit={editHabit}
          onClose={() => setEditHabit(null)}
          onSave={h => {
            if (h.id && phase.habits.some(ah => ah.id === h.id)) {
              dispatch({ type: "UPDATE_HABIT", phaseId: phase.id, habit: h });
            } else {
              dispatch({ type: "ADD_HABIT", phaseId: phase.id, habit: h });
            }
            setEditHabit(null);
          }}
        />
      )}

      {/* Delete habit confirm */}
      {deleteHabitId && (
        <div className="dialog-overlay" onClick={() => setDeleteHabitId(null)}>
          <div className="dialog-panel" onClick={e => e.stopPropagation()}>
            <div className="dialog-title">항목을 삭제할까요?</div>
            <div className="dialog-actions">
              <button onClick={() => setDeleteHabitId(null)} className="btn-muted-flex">취소</button>
              <button onClick={() => { dispatch({ type: "DELETE_HABIT", phaseId: phase.id, habitId: deleteHabitId }); setDeleteHabitId(null); }} className="btn-danger-flex">삭제</button>
            </div>
          </div>
        </div>
      )}

      {/* Link editor modal */}
      {editLinkData !== null && (
        <AddLinkModal
          link={editLinkData === "new" ? undefined : editLinkData}
          onClose={() => setEditLinkData(null)}
          onSave={l => {
            if (editLinkData === "new") {
              dispatch({ type: "ADD_LINK", phaseId: phase.id, link: l });
            } else {
              dispatch({ type: "UPDATE_LINK", phaseId: phase.id, link: l });
            }
            setEditLinkData(null);
          }}
        />
      )}

      {/* Delete link confirm */}
      {deleteLinkId && (
        <div className="dialog-overlay" onClick={() => setDeleteLinkId(null)}>
          <div className="dialog-panel" onClick={e => e.stopPropagation()}>
            <div className="dialog-title">링크를 삭제할까요?</div>
            <div className="dialog-actions">
              <button onClick={() => setDeleteLinkId(null)} className="btn-muted-flex">취소</button>
              <button onClick={() => { dispatch({ type: "DELETE_LINK", phaseId: phase.id, linkId: deleteLinkId }); setDeleteLinkId(null); }} className="btn-danger-flex">삭제</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export function PhaseScreen({
  state, dispatch, onGoHome, initialDetailPhaseId,
}: {
  state: AppState;
  dispatch: React.Dispatch<Action>;
  onGoHome: () => void;
  initialDetailPhaseId?: string | null;
}) {
  const [showAdd, setShowAdd] = useState(false);
  const [detailPhaseId, setDetailPhaseId] = useState<string | null>(initialDetailPhaseId ?? null);

  const activePhase = state.phases.find(p => p.id === state.activePhaseId)!;
  const otherPhases = state.phases.filter(p => p.id !== state.activePhaseId);
  const upcomingOther = otherPhases.filter(p => getPhaseStatus(p) !== "completed");
  const completedOther = otherPhases.filter(p => getPhaseStatus(p) === "completed");

  // Show detail screen
  if (detailPhaseId) {
    const detailPhase = state.phases.find(p => p.id === detailPhaseId);
    if (detailPhase) {
      return (
        <PhaseDetailScreen
          phase={detailPhase}
          isActive={detailPhase.id === state.activePhaseId}
          phaseCount={state.phases.length}
          dispatch={dispatch}
          onBack={() => setDetailPhaseId(null)}
          onActivate={() => {
            dispatch({ type: "SET_ACTIVE_PHASE", phaseId: detailPhase.id });
            onGoHome();
          }}
        />
      );
    }
  }

  return (
    <div className="screen">
        <div className="screen-header">
          <div className="screen-title">목표</div>
        </div>

        <div className="screen-body-stack6">
          {/* Active hero */}
          {activePhase && (
            <div>
              {/* <div className="phase-section-mb3">현재 진행</div> */}
              <PhaseHeroCard phase={activePhase} onOpenDetail={() => setDetailPhaseId(activePhase.id)} />
            </div>
          )}

          {/* Upcoming */}
          {upcomingOther.length > 0 && (
            <div>
              <div className="phase-section-mb3">예정된 목표</div>
              <div className="stack-3">
                {upcomingOther.map(phase => (
                  <PhaseSmallCard key={phase.id} phase={phase} onOpenDetail={() => setDetailPhaseId(phase.id)} />
                ))}
              </div>
            </div>
          )}

          {/* Completed */}
          {completedOther.length > 0 && (
            <div>
              <div className="phase-section-mb3">완료된 목표</div>
              <div className="stack-3">
                {completedOther.map(phase => (
                  <PhaseSmallCard key={phase.id} phase={phase} onOpenDetail={() => setDetailPhaseId(phase.id)} />
                ))}
              </div>
            </div>
          )}

          {/* Add new */}
          <button
            onClick={() => setShowAdd(true)}
            className="btn-add-lg"
          >
            <Plus size={16} />
            새 목표 추가
          </button>
        </div>

        {showAdd && (
          <AddPhaseModal
            onClose={() => setShowAdd(false)}
            onSave={phase => { dispatch({ type: "ADD_PHASE", phase }); setShowAdd(false); }}
          />
        )}
      </div>
  );
}

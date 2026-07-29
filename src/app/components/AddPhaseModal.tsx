import { useState } from "react";
import { makeId } from "../lib/calc";
import { EMPTY_RETRO } from "../lib/defaults";
import { NumberInput } from "./NumberInput";
import type { Phase, PhaseDays } from "../types";

export function AddPhaseModal({ onSave, onClose, onToast }: { onSave: (phase: Phase) => void; onClose: () => void; onToast?: (msg: string) => void; }) {
  const [name, setName] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [mainGoal, setMainGoal] = useState("");
  const [priorityText, setPriorityText] = useState("");
  const [baseScore, setBaseScore] = useState(30);
  const [days, setDays] = useState<PhaseDays>("all");

  function handleDaysClick(selectedDay: PhaseDays) {
    // 현재 선택된 요일과 같으면 그냥 선택
    if (days === selectedDay) {
      setDays(selectedDay);
      return;
    }

    // 매일이 아닌 상태에서 다른 요일로 변경하려 할 때
    if (days !== "all") {
      const currentLabel = days === "weekday" ? "평일" : "주말";
      const nextLabel = selectedDay === "weekday" ? "평일" : "주말";
      onToast?.(`${currentLabel}과 ${nextLabel}을 함께 선택할 수 없어요.`);
      return;
    }

    // 매일에서 다른 요일로 변경할 때는 그냥 변경
    setDays(selectedDay);
  }

  function handleSave() {
    if (!name.trim() || !startDate || !endDate) return;
    const priority = priorityText.split(/[,，、]/).map(s => s.trim()).filter(Boolean);
    const newPhase: Phase = {
      id: makeId(),
      name: name.trim(),
      startDate,
      endDate,
      mainGoal: mainGoal.trim(),
      priority,
      baseScore,
      days,
      records: {},
      retrospective: EMPTY_RETRO,
      links: [],
      habits: [
        { id: makeId(), name: "운동", score: 5, isBonus: false, enabled: true, order: 0, options: [] },
        { id: makeId(), name: "독서", score: 3, isBonus: false, enabled: true, order: 1, options: [] },
        { id: makeId(), name: "물 마시기", score: 3, isBonus: false, enabled: true, order: 2, options: [] },
      ],
    };
    onSave(newPhase);
  }

  // 각 버튼의 활성화 여부 판단
  const isWeekdayDisabled = days === "weekend";
  const isWeekendDisabled = days === "weekday";

  return (
    <div className="dialog-overlay" onClick={onClose}>
      <div className="modal-center-panel" onClick={e => e.stopPropagation()}>
        <div className="modal-title">새 목표 추가</div>
        <div className="stack-4">
          <div>
            <div className="field-label">목표 이름 *</div>
            <input className="field-input" placeholder="예: 건강한 습관 만들기" value={name} onChange={e => setName(e.target.value)} />
          </div>
          <div className="grid2">
            <div>
              <div className="field-label">시작일 *</div>
              <input type="date" className="field-input-x3" value={startDate} onChange={e => setStartDate(e.target.value)} />
            </div>
            <div>
              <div className="field-label">종료일 *</div>
              <input type="date" className="field-input-x3" value={endDate} onChange={e => setEndDate(e.target.value)} />
            </div>
          </div>
          <div>
            <div className="field-label">주요 목표</div>
            <input className="field-input" placeholder="예: 매일 30분 운동하기" value={mainGoal} onChange={e => setMainGoal(e.target.value)} />
          </div>
          <div>
            <div className="field-label">우선순위 (쉼표로 구분)</div>
            <input className="field-input" placeholder="예: 운동, 독서, 수면" value={priorityText} onChange={e => setPriorityText(e.target.value)} />
          </div>
          <div>
            <div className="field-label">기본 자기신뢰도 (%)</div>
            <NumberInput min={0} max={99} className="field-input" value={baseScore} onChange={setBaseScore} />
          </div>
          <div>
            <div className="field-label">활동 요일</div>
            <div className="segmented">
              <button
                type="button"
                onClick={() => handleDaysClick("all")}
                className={`segmented-btn${days === "all" ? " is-active" : ""}`}
              >
                매일
              </button>
              <button
                type="button"
                onClick={() => handleDaysClick("weekday")}
                disabled={isWeekdayDisabled}
                className={`segmented-btn${days === "weekday" ? " is-active" : ""}${isWeekdayDisabled ? " is-disabled" : ""}`}
              >
                평일
              </button>
              <button
                type="button"
                onClick={() => handleDaysClick("weekend")}
                disabled={isWeekendDisabled}
                className={`segmented-btn${days === "weekend" ? " is-active" : ""}${isWeekendDisabled ? " is-disabled" : ""}`}
              >
                주말
              </button>
            </div>
          </div>
        </div>
        <div className="modal-actions">
          <button onClick={onClose} className="btn-muted-flex">취소</button>
          <button onClick={handleSave} disabled={!name.trim() || !startDate || !endDate} className="btn-primary-flex2">추가하기</button>
        </div>
      </div>
    </div>
  );
}

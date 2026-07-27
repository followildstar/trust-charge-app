import { useState } from "react";
import { makeId } from "../lib/calc";
import { EMPTY_RETRO } from "../lib/defaults";
import { NumberInput } from "./NumberInput";
import type { Phase, PhaseDays } from "../types";

export function AddPhaseModal({ onSave, onClose }: { onSave: (phase: Phase) => void; onClose: () => void; }) {
  const [name, setName] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [mainGoal, setMainGoal] = useState("");
  const [priorityText, setPriorityText] = useState("");
  const [baseScore, setBaseScore] = useState(30);
  const [days, setDays] = useState<PhaseDays>("all");

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
              {([["all","매일"],["weekday","평일"],["weekend","주말"]] as const).map(([v, lb]) => (
                <button
                  key={v}
                  type="button"
                  onClick={() => setDays(v)}
                  className={`segmented-btn${days === v ? " is-active" : ""}`}
                >
                  {lb}
                </button>
              ))}
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

import { useState } from "react";
import { makeId } from "../lib/calc";
import { EMPTY_RETRO } from "../lib/defaults";
import { NumberInput } from "./NumberInput";
import type { Phase } from "../types";

export function AddPhaseModal({ onSave, onClose }: { onSave: (phase: Phase) => void; onClose: () => void; }) {
  const [name, setName] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [mainGoal, setMainGoal] = useState("");
  const [priorityText, setPriorityText] = useState("");
  const [baseScore, setBaseScore] = useState(30);

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
      records: {},
      retrospective: EMPTY_RETRO,
      links: [],
      habits: [
        { id: makeId(), name: "러닝", score: 5, isBonus: false, enabled: true, order: 0, options: [] },
        { id: makeId(), name: "영어", score: 5, isBonus: false, enabled: true, order: 1, options: [] },
        { id: makeId(), name: "요가", score: 3, isBonus: false, enabled: true, order: 2, options: [] },
      ],
    };
    onSave(newPhase);
  }

  return (
    <div className="sheet-overlay" onClick={onClose}>
      <div className="sheet-panel-tall" onClick={e => e.stopPropagation()}>
        <div className="sheet-handle" />
        <div className="modal-title">새 목표 추가</div>
        <div className="stack-4">
          <div>
            <div className="field-label">목표 이름 *</div>
            <input className="field-input" placeholder="예: 요가 완주 기간" value={name} onChange={e => setName(e.target.value)} />
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
            <input className="field-input" placeholder="예: 요가 70회 완주" value={mainGoal} onChange={e => setMainGoal(e.target.value)} />
          </div>
          <div>
            <div className="field-label">우선순위 (쉼표로 구분)</div>
            <input className="field-input" placeholder="예: 요가, 러닝, 피아노" value={priorityText} onChange={e => setPriorityText(e.target.value)} />
          </div>
          <div>
            <div className="field-label">기본 자기신뢰도 (%)</div>
            <NumberInput min={0} max={99} className="field-input" value={baseScore} onChange={setBaseScore} />
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

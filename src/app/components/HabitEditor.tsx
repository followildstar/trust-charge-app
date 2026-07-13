import { useState } from "react";
import { X } from "lucide-react";
import { makeId } from "../lib/calc";
import { NumberInput } from "./NumberInput";
import type { Habit, HabitOption } from "../types";

export function HabitEditor({ habit, onSave, onClose }: { habit: Partial<Habit>; onSave: (h: Habit) => void; onClose: () => void; }) {
  const [name, setName] = useState(habit?.name ?? "");
  const [score, setScore] = useState(habit?.score ?? 5);
  const [isBonus, setIsBonus] = useState(habit?.isBonus ?? false);
  const [options, setOptions] = useState<HabitOption[]>(habit?.options ?? []);
  const [optLabel, setOptLabel] = useState("");
  const [optScore, setOptScore] = useState(5);

  function addOption() {
    if (!optLabel.trim()) return;
    setOptions(prev => [...prev, { id: makeId(), label: optLabel.trim(), score: optScore }]);
    setOptLabel("");
    setOptScore(5);
  }

  function updateOptionScore(id: string, next: number) {
    setOptions(prev => prev.map(o => o.id === id ? { ...o, score: next } : o));
  }

  const hasOptions = options.length > 0;

  function handleSave() {
    if (!name.trim()) return;
    onSave({ id: habit?.id ?? makeId(), name: name.trim(), score, isBonus, enabled: habit?.enabled ?? true, order: habit?.order ?? 0, options });
  }

  return (
    <div className="dialog-overlay" onClick={onClose}>
      <div className="modal-center-panel" onClick={e => e.stopPropagation()}>
        <div className="modal-title">{habit?.id ? "항목 편집" : "새 항목 추가"}</div>
        <div className="stack-4">
          <div>
            <div className="field-label">이름</div>
            <input className="field-input" value={name} onChange={e => setName(e.target.value)} placeholder="항목 이름" />
          </div>

          {/* 옵션이 없을 때만 항목 자체 점수를 입력. 옵션이 있으면 옵션 점수로 대체됨 */}
          {!hasOptions && (
            <div>
              <div className="field-label">점수</div>
              <NumberInput min={1} max={100} className="field-input" value={score} onChange={setScore} />
            </div>
          )}

          <div className="row-between-py1">
            <span className="field-label-fg-plain">보너스 항목</span>
            <button onClick={() => setIsBonus(!isBonus)} className={`toggle${isBonus ? " is-on" : ""}`}>
              <div className={`toggle-thumb${isBonus ? " is-on" : ""}`} />
            </button>
          </div>

          <div>
            <div className="field-label">옵션 (선택사항 · 옵션마다 점수 지정)</div>
            {hasOptions && (
              <div className="option-hint">옵션이 있으면 항목 점수는 선택한 옵션 점수로 계산돼요</div>
            )}
            <div className="option-add-row">
              <input
                className="field-input-inline"
                value={optLabel}
                onChange={e => setOptLabel(e.target.value)}
                onKeyDown={e => e.key === "Enter" && addOption()}
                placeholder="옵션 이름 (예: 30분)"
              />
              <div className="option-score-input">
                <NumberInput min={1} max={100} className="field-input-inline" value={optScore} onChange={setOptScore} />
              </div>
              <button onClick={addOption} className="btn-primary-sm">추가</button>
            </div>
            <div className="stack-15">
              {options.map(o => (
                <div key={o.id} className="option-chip">
                  <span className="option-label">{o.label}</span>
                  <div className="option-chip-score">
                    <NumberInput min={1} max={100} className="field-input-inline option-chip-score-input" value={o.score} onChange={n => updateOptionScore(o.id, n)} />
                    <span className="option-chip-pt">P</span>
                  </div>
                  <button onClick={() => setOptions(prev => prev.filter(op => op.id !== o.id))} className="icon-muted"><X size={14} /></button>
                </div>
              ))}
            </div>
          </div>
        </div>
        <div className="modal-actions">
          <button onClick={onClose} className="btn-muted-flex">취소</button>
          <button onClick={handleSave} className="btn-primary-flex2b">저장</button>
        </div>
      </div>
    </div>
  );
}

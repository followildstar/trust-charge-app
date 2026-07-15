import { Check } from "lucide-react";
import { habitMaxScore } from "../lib/calc";
import type { Habit, HabitRecord } from "../types";

export function HabitCard({
  habit, record, onToggle, onSetOption,
}: {
  habit: Habit;
  record: HabitRecord;
  onToggle: () => void;
  onSetOption: (optId: string) => void;
}) {
  const checked = record.checked;
  const hasOptions = habit.options.length > 0;

  const selectedOpt = hasOptions
    ? habit.options.find(o => o.id === record.selectedOptionId)
    : undefined;

  // 체크는 됐는데 옵션을 아직 안 고른 상태 → 옵션 선택 유도
  const needsOption = hasOptions && checked && !selectedOpt;

  const displayScore = selectedOpt ? selectedOpt.score : habitMaxScore(habit);

  return (
    <div className={`habit-card${checked ? " is-checked" : ""}${needsOption ? " needs-option" : ""}`}>
      <button
        onClick={onToggle}
        className={`habit-check${checked ? " is-checked" : ""}`}
      >
        {checked && <Check size={13} className="check-icon" strokeWidth={3} />}
      </button>
      <div className="fill-min">
        <span className={`habit-name${checked ? " is-checked" : ""}`}>
          {habit.name}
        </span>
        <span className={`habit-pts${habit.isBonus ? " is-bonus" : ""}`}>
          {habit.isBonus ? "+" : ""}{displayScore}P
        </span>
      </div>
      {hasOptions && (
        <select
          value={record.selectedOptionId || ""}
          onChange={e => onSetOption(e.target.value)}
          onClick={e => e.stopPropagation()}
          className={`habit-option${needsOption ? " is-attention" : ""}`}
        >
          <option value="">{needsOption ? "옵션을 골라주세요" : "옵션 선택"}</option>
          {habit.options.map(o => (
            <option key={o.id} value={o.id}>{o.label} · {o.score}P</option>
          ))}
        </select>
      )}
    </div>
  );
}

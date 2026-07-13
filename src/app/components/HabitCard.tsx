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

  // 배지에 표시할 점수: 옵션을 골랐으면 그 옵션 점수, 아니면 최대 가능 점수
  const selectedOpt = hasOptions
    ? habit.options.find(o => o.id === record.selectedOptionId)
    : undefined;
  const displayScore = selectedOpt ? selectedOpt.score : habitMaxScore(habit);

  return (
    <div className={`habit-card${checked ? " is-checked" : ""}`}>
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
          className="habit-option"
        >
          <option value="">옵션 선택</option>
          {habit.options.map(o => (
            <option key={o.id} value={o.id}>{o.label} · {o.score}P</option>
          ))}
        </select>
      )}
    </div>
  );
}

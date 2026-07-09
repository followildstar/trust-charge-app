import { Check } from "lucide-react";
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
        {habit.options.length > 0 && (
          <select
            value={record.selectedOptionId || ""}
            onChange={e => onSetOption(e.target.value)}
            onClick={e => e.stopPropagation()}
            className="habit-option"
          >
            <option value="">옵션 선택</option>
            {habit.options.map(o => (
              <option key={o.id} value={o.id}>{o.label}</option>
            ))}
          </select>
        )}
      </div>
      <span className={`habit-pts${habit.isBonus ? " is-bonus" : ""}`}>
        {habit.isBonus ? "+" : ""}{habit.score}pt
      </span>
    </div>
  );
}

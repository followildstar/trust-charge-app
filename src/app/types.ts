export interface HabitOption { id: string; label: string; score: number; }
export interface Habit {
  id: string; name: string; score: number; options: HabitOption[];
  isBonus: boolean; enabled: boolean; order: number;
}
export interface HabitRecord { checked: boolean; selectedOptionId: string; }
export type DayRecord = Record<string, HabitRecord>;

export interface QuickLink { id: string; emoji: string; name: string; url: string; }
export interface Retrospective { bestPoint: string; hardPoint: string; nextReflection: string; }

export type PhaseDays = "all" | "weekday" | "weekend";

export interface Phase {
  id: string;
  name: string;
  startDate: string;
  endDate: string;
  mainGoal: string;
  priority: string[];
  habits: Habit[];
  records: Record<string, DayRecord>;
  baseScore: number;
  days: PhaseDays;
  links: QuickLink[];
  retrospective: Retrospective;
  // 캘린더에 빨간 점으로 표시할 항목의 id. 목표당 최대 1개만 설정 가능
  flagHabitId?: string;
}

export interface AppState {
  phases: Phase[];
  activePhaseId: string;
}

export type Screen = "home" | "calendar" | "stats" | "phases" | "settings";
export type StatsTab = "overview" | "timeline";

export type Action =
  | { type: "SET_ACTIVE_PHASE"; phaseId: string }
  | { type: "ADD_PHASE"; phase: Phase }
  | { type: "UPDATE_PHASE"; phase: Phase }
  | { type: "DELETE_PHASE"; phaseId: string }
  | { type: "TOGGLE_CHECK"; date: string; habitId: string }
  | { type: "SET_OPTION"; date: string; habitId: string; optionId: string }
  | { type: "ADD_HABIT"; habit: Habit; phaseId?: string }
  | { type: "UPDATE_HABIT"; habit: Habit; phaseId?: string }
  | { type: "DELETE_HABIT"; habitId: string; phaseId?: string }
  | { type: "REORDER_HABITS"; isBonus: boolean; orderedIds: string[]; phaseId?: string }
  | { type: "SET_DATE_RANGE"; startDate: string; endDate: string; phaseId?: string }
  | { type: "SET_BASE_SCORE"; score: number; phaseId?: string }
  | { type: "SET_PHASE_META"; name: string; mainGoal: string; priority: string[]; days: PhaseDays; phaseId?: string }
  | { type: "ADD_LINK"; phaseId: string; link: QuickLink }
  | { type: "UPDATE_LINK"; phaseId: string; link: QuickLink }
  | { type: "DELETE_LINK"; phaseId: string; linkId: string }
  | { type: "SET_RETROSPECTIVE"; phaseId: string; retrospective: Retrospective }
  // 캘린더 빨간 점 표시용 항목 지정/해제. habitId가 null이면 해제
  | { type: "SET_FLAG_HABIT"; phaseId: string; habitId: string | null }
  | { type: "RESET_DATA" }
  | { type: "IMPORT_DATA"; state: AppState };

import { useReducer, useState, useEffect } from "react";
import {
  format, parseISO, eachDayOfInterval, startOfMonth, endOfMonth,
  isSameDay, isAfter, isBefore, differenceInCalendarDays,
} from "date-fns";
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from "recharts";
import {
  Home, Calendar, BarChart2, Target, Settings,
  Plus, Trash2, Edit2, ChevronRight, Check, X,
  ArrowLeft, ExternalLink, Link2,
} from "lucide-react";

// ─── Types ────────────────────────────────────────────────────────────────────

interface HabitOption { id: string; label: string; }
interface Habit {
  id: string; name: string; score: number; options: HabitOption[];
  isBonus: boolean; enabled: boolean; order: number;
}
interface HabitRecord { checked: boolean; selectedOptionId: string; }
type DayRecord = Record<string, HabitRecord>;

interface QuickLink { id: string; emoji: string; name: string; url: string; }
interface Retrospective { bestPoint: string; hardPoint: string; nextReflection: string; }

interface Phase {
  id: string;
  name: string;
  startDate: string;
  endDate: string;
  mainGoal: string;
  priority: string[];
  habits: Habit[];
  records: Record<string, DayRecord>;
  baseScore: number;
  links: QuickLink[];
  retrospective: Retrospective;
}

interface AppState {
  phases: Phase[];
  activePhaseId: string;
}

type Screen = "home" | "calendar" | "stats" | "phases" | "settings";
type StatsTab = "overview" | "timeline";

type Action =
  | { type: "SET_ACTIVE_PHASE"; phaseId: string }
  | { type: "ADD_PHASE"; phase: Phase }
  | { type: "UPDATE_PHASE"; phase: Phase }
  | { type: "DELETE_PHASE"; phaseId: string }
  | { type: "TOGGLE_CHECK"; date: string; habitId: string }
  | { type: "SET_OPTION"; date: string; habitId: string; optionId: string }
  | { type: "ADD_HABIT"; habit: Habit }
  | { type: "UPDATE_HABIT"; habit: Habit }
  | { type: "DELETE_HABIT"; habitId: string }
  | { type: "SET_DATE_RANGE"; startDate: string; endDate: string }
  | { type: "SET_BASE_SCORE"; score: number }
  | { type: "SET_PHASE_META"; name: string; mainGoal: string; priority: string[] }
  | { type: "ADD_LINK"; phaseId: string; link: QuickLink }
  | { type: "UPDATE_LINK"; phaseId: string; link: QuickLink }
  | { type: "DELETE_LINK"; phaseId: string; linkId: string }
  | { type: "SET_RETROSPECTIVE"; phaseId: string; retrospective: Retrospective }
  | { type: "RESET_DATA" };

// ─── Helpers ─────────────────────────────────────────────────────────────────

const makeId = () => `id-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
const KO_DAYS = ["일", "월", "화", "수", "목", "금", "토"];

function toKoDateStr(dateStr: string) {
  const d = parseISO(dateStr);
  return `${format(d, "yyyy년 M월 d일")} ${KO_DAYS[d.getDay()]}요일`;
}

function isDateInRange(date: string, startDate: string, endDate: string): boolean {
  const d = parseISO(date);
  return !isBefore(d, parseISO(startDate)) && !isAfter(d, parseISO(endDate));
}

function calcScore(phase: Phase, date: string): number {
  if (!isDateInRange(date, phase.startDate, phase.endDate)) return 0;
  const dayRec = phase.records[date] || {};
  const basicHabits = phase.habits.filter(h => h.enabled && !h.isBonus);
  const bonusHabits = phase.habits.filter(h => h.enabled && h.isBonus);
  const totalBasicPts = basicHabits.reduce((s, h) => s + h.score, 0);

  let checkedBasicPts = 0;
  let checkedBonusPts = 0;

  for (const h of basicHabits) {
    const rec = dayRec[h.id];
    if (rec?.checked) {
      if (h.options.length > 0 && rec.selectedOptionId) {
        const opt = h.options.find(o => o.id === rec.selectedOptionId);
        checkedBasicPts += opt ? h.score : 0;
      } else {
        checkedBasicPts += h.score;
      }
    }
  }
  for (const h of bonusHabits) {
    if (dayRec[h.id]?.checked) checkedBonusPts += h.score;
  }

  const base = phase.baseScore;
  const basicPct = totalBasicPts > 0 ? (checkedBasicPts / totalBasicPts) * (100 - base) : 0;
  return parseFloat((base + basicPct + checkedBonusPts).toFixed(2));
}

function calcTotalProgress(phase: Phase): number {
  const today = new Date();
  const start = parseISO(phase.startDate);
  const end = parseISO(phase.endDate);
  const allDays = eachDayOfInterval({ start, end });
  const totalDays = allDays.length;
  const perDayMax = (100 - phase.baseScore) / totalDays;

  let accumulated = 0;
  for (const d of allDays) {
    if (isAfter(d, today) && !isSameDay(d, today)) break;
    const ds = format(d, "yyyy-MM-dd");
    const dayRec = phase.records[ds] || {};
    const basicHabits = phase.habits.filter(h => h.enabled && !h.isBonus);
    const bonusHabits = phase.habits.filter(h => h.enabled && h.isBonus);
    const totalBasicPts = basicHabits.reduce((s, h) => s + h.score, 0);
    let checkedBasicPts = 0;
    let checkedBonusPts = 0;
    for (const h of basicHabits) {
      const rec = dayRec[h.id];
      if (rec?.checked) {
        if (h.options.length > 0 && rec.selectedOptionId) {
          const opt = h.options.find(o => o.id === rec.selectedOptionId);
          checkedBasicPts += opt ? h.score : 0;
        } else {
          checkedBasicPts += h.score;
        }
      }
    }
    for (const h of bonusHabits) {
      if (dayRec[h.id]?.checked) checkedBonusPts += h.score;
    }
    const dayFraction = totalBasicPts > 0 ? checkedBasicPts / totalBasicPts : 0;
    accumulated += dayFraction * perDayMax + checkedBonusPts;
  }
  return parseFloat((phase.baseScore + accumulated).toFixed(2));
}

interface DayStatus {
  score: number;
  isFullDay: boolean;
  isPast: boolean;
  isToday: boolean;
  isFuture: boolean;
}

function getDayStatus(phase: Phase, date: string): DayStatus {
  const d = parseISO(date);
  const now = new Date();
  const isToday = isSameDay(d, now);
  const isPast = isBefore(d, now) && !isToday;
  const isFuture = isAfter(d, now);
  if (!isDateInRange(date, phase.startDate, phase.endDate)) {
    return { score: 0, isFullDay: false, isPast, isToday, isFuture };
  }
  const score = (isPast || isToday) ? calcScore(phase, date) : 0;
  const basicHabits = phase.habits.filter(h => h.enabled && !h.isBonus);
  const dayRec = phase.records[date] || {};
  const allBasicChecked = basicHabits.length > 0 && basicHabits.every(h => dayRec[h.id]?.checked);
  return { score, isFullDay: allBasicChecked, isPast, isToday, isFuture };
}

function getPhaseStatus(phase: Phase): "active" | "upcoming" | "completed" {
  const today = new Date();
  const start = parseISO(phase.startDate);
  const end = parseISO(phase.endDate);
  if (isAfter(today, end)) return "completed";
  if (isBefore(today, start)) return "upcoming";
  return "active";
}

function getDday(phase: Phase): { label: string; suffix: string } {
  const today = new Date();
  const start = parseISO(phase.startDate);
  const end = parseISO(phase.endDate);
  if (isAfter(today, end)) return { label: "완료", suffix: "" };
  if (isBefore(today, start)) {
    const days = differenceInCalendarDays(start, today);
    return { label: `D-${days}`, suffix: "시작" };
  }
  const days = differenceInCalendarDays(end, today);
  if (days === 0) return { label: "D-Day", suffix: "종료" };
  return { label: `D-${days}`, suffix: "종료" };
}

// ─── Default Data ─────────────────────────────────────────────────────────────

const YOGA_OPT = (p: string): HabitOption[] => [
  { id: `${p}-y30`, label: "30분" },
  { id: `${p}-y60`, label: "60분" },
  { id: `${p}-y90`, label: "90분" },
];
const RUNNING_OPT = (p: string): HabitOption[] => [
  { id: `${p}-r3`, label: "3km" },
  { id: `${p}-r5`, label: "5km" },
  { id: `${p}-r10`, label: "10km" },
];
const PIANO_OPT = (p: string): HabitOption[] => [
  { id: `${p}-p20`, label: "20분" },
  { id: `${p}-p40`, label: "40분" },
  { id: `${p}-p60`, label: "60분" },
];
const DRAWING_OPT = (p: string): HabitOption[] => [
  { id: `${p}-d15`, label: "15분" },
  { id: `${p}-d30`, label: "30분" },
];
const ENGLISH_OPT = (p: string): HabitOption[] => [
  { id: `${p}-e1`, label: "단어 암기" },
  { id: `${p}-e2`, label: "리스닝" },
  { id: `${p}-e3`, label: "리딩" },
];

const EMPTY_RETRO: Retrospective = { bestPoint: "", hardPoint: "", nextReflection: "" };

const DEFAULT_PHASE_1: Phase = {
  id: "phase-yoga",
  name: "요가 완주 기간",
  startDate: "2026-07-13",
  endDate: "2026-09-22",
  mainGoal: "요가 70회 완주",
  priority: ["요가", "러닝", "피아노", "식습관"],
  baseScore: 30,
  records: {},
  retrospective: EMPTY_RETRO,
  links: [
    { id: "p1-l1", emoji: "📓", name: "요가 클래스 Notion", url: "https://notion.so" },
    { id: "p1-l2", emoji: "📅", name: "요가 수업 예약", url: "https://example.com" },
    { id: "p1-l3", emoji: "🏃", name: "러닝 습관 기록", url: "https://example.com" },
  ],
  habits: [
    { id: "p1-yoga", name: "요가", score: 5, isBonus: false, enabled: true, order: 0, options: YOGA_OPT("p1") },
    { id: "p1-running", name: "러닝", score: 4, isBonus: false, enabled: true, order: 1, options: RUNNING_OPT("p1") },
    { id: "p1-piano", name: "피아노", score: 4, isBonus: false, enabled: true, order: 2, options: PIANO_OPT("p1") },
    { id: "p1-drawing-b", name: "드로잉", score: 2, isBonus: true, enabled: true, order: 0, options: DRAWING_OPT("p1") },
    { id: "p1-english-b", name: "영어", score: 1, isBonus: true, enabled: true, order: 1, options: ENGLISH_OPT("p1") },
  ],
};

const DEFAULT_PHASE_2: Phase = {
  id: "phase-piano",
  name: "피아노 레벨업 기간",
  startDate: "2026-09-23",
  endDate: "2026-12-31",
  mainGoal: "소녀의 기도 완성 및 녹음",
  priority: ["피아노", "러닝", "요가", "식습관"],
  baseScore: 30,
  records: {},
  retrospective: EMPTY_RETRO,
  links: [
    { id: "p2-l1", emoji: "🎹", name: "피아노 연습 기록 Notion", url: "https://notion.so" },
    { id: "p2-l2", emoji: "🎼", name: "소녀의 기도 악보", url: "https://example.com" },
    { id: "p2-l3", emoji: "🏠", name: "피아노 스튜디오", url: "https://example.com" },
  ],
  habits: [
    { id: "p2-piano", name: "피아노", score: 5, isBonus: false, enabled: true, order: 0, options: PIANO_OPT("p2") },
    { id: "p2-running", name: "러닝", score: 4, isBonus: false, enabled: true, order: 1, options: RUNNING_OPT("p2") },
    { id: "p2-yoga", name: "요가", score: 3, isBonus: false, enabled: true, order: 2, options: YOGA_OPT("p2") },
    { id: "p2-drawing-b", name: "드로잉", score: 2, isBonus: true, enabled: true, order: 0, options: DRAWING_OPT("p2") },
    { id: "p2-english-b", name: "영어", score: 1, isBonus: true, enabled: true, order: 1, options: ENGLISH_OPT("p2") },
  ],
};

const DEFAULT_STATE: AppState = {
  phases: [DEFAULT_PHASE_1, DEFAULT_PHASE_2],
  activePhaseId: "phase-yoga",
};

const STORAGE_KEY = "trust-charge-v2";

function loadState(): AppState {
  try {
    const s = localStorage.getItem(STORAGE_KEY);
    if (s) {
      const parsed: AppState = JSON.parse(s);
      // Backfill new fields for existing stored data
      return {
        ...parsed,
        phases: parsed.phases.map(p => ({
          ...p,
          links: p.links ?? [],
          retrospective: p.retrospective ?? EMPTY_RETRO,
        })),
      };
    }
  } catch {}
  return DEFAULT_STATE;
}

// ─── Reducer ──────────────────────────────────────────────────────────────────

function updateActivePhase(state: AppState, updater: (p: Phase) => Phase): AppState {
  return {
    ...state,
    phases: state.phases.map(p => p.id === state.activePhaseId ? updater(p) : p),
  };
}

function updatePhase(state: AppState, phaseId: string, updater: (p: Phase) => Phase): AppState {
  return {
    ...state,
    phases: state.phases.map(p => p.id === phaseId ? updater(p) : p),
  };
}

function appReducer(state: AppState, action: Action): AppState {
  switch (action.type) {
    case "SET_ACTIVE_PHASE":
      return { ...state, activePhaseId: action.phaseId };

    case "ADD_PHASE":
      return { ...state, phases: [...state.phases, action.phase] };

    case "UPDATE_PHASE":
      return { ...state, phases: state.phases.map(p => p.id === action.phase.id ? action.phase : p) };

    case "DELETE_PHASE": {
      const remaining = state.phases.filter(p => p.id !== action.phaseId);
      return {
        ...state,
        phases: remaining,
        activePhaseId: state.activePhaseId === action.phaseId
          ? (remaining[0]?.id ?? "")
          : state.activePhaseId,
      };
    }

    case "TOGGLE_CHECK":
      return updateActivePhase(state, phase => {
        const dayRec = phase.records[action.date] || {};
        const hr = dayRec[action.habitId] || { checked: false, selectedOptionId: "" };
        return {
          ...phase,
          records: { ...phase.records, [action.date]: { ...dayRec, [action.habitId]: { ...hr, checked: !hr.checked } } },
        };
      });

    case "SET_OPTION":
      return updateActivePhase(state, phase => {
        const dayRec = phase.records[action.date] || {};
        const hr = dayRec[action.habitId] || { checked: false, selectedOptionId: "" };
        return {
          ...phase,
          records: { ...phase.records, [action.date]: { ...dayRec, [action.habitId]: { ...hr, selectedOptionId: action.optionId } } },
        };
      });

    case "ADD_HABIT":
      return updateActivePhase(state, phase => ({ ...phase, habits: [...phase.habits, action.habit] }));

    case "UPDATE_HABIT":
      return updateActivePhase(state, phase => ({
        ...phase,
        habits: phase.habits.map(h => h.id === action.habit.id ? action.habit : h),
      }));

    case "DELETE_HABIT":
      return updateActivePhase(state, phase => ({
        ...phase,
        habits: phase.habits.filter(h => h.id !== action.habitId),
      }));

    case "SET_DATE_RANGE":
      return updateActivePhase(state, phase => ({
        ...phase, startDate: action.startDate, endDate: action.endDate,
      }));

    case "SET_BASE_SCORE":
      return updateActivePhase(state, phase => ({ ...phase, baseScore: action.score }));

    case "SET_PHASE_META":
      return updateActivePhase(state, phase => ({
        ...phase, name: action.name, mainGoal: action.mainGoal, priority: action.priority,
      }));

    case "ADD_LINK":
      return updatePhase(state, action.phaseId, phase => ({
        ...phase, links: [...(phase.links ?? []), action.link],
      }));

    case "UPDATE_LINK":
      return updatePhase(state, action.phaseId, phase => ({
        ...phase, links: (phase.links ?? []).map(l => l.id === action.link.id ? action.link : l),
      }));

    case "DELETE_LINK":
      return updatePhase(state, action.phaseId, phase => ({
        ...phase, links: (phase.links ?? []).filter(l => l.id !== action.linkId),
      }));

    case "SET_RETROSPECTIVE":
      return updatePhase(state, action.phaseId, phase => ({
        ...phase, retrospective: action.retrospective,
      }));

    case "RESET_DATA":
      return DEFAULT_STATE;

    default:
      return state;
  }
}

// ─── CircularGauge ────────────────────────────────────────────────────────────

function CircularGauge({ pct, size = 210 }: { pct: number; size?: number }) {
  const stroke = 14;
  const r = (size - stroke) / 2;
  const cx = size / 2;
  const cy = size / 2;
  const circ = 2 * Math.PI * r;
  const arcPct = Math.min(100, pct);
  const offset = circ - (arcPct / 100) * circ;

  return (
    <div className="relative flex items-center justify-center" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="rotate-[-90deg]">
        <circle cx={cx} cy={cy} r={r} fill="none" stroke="var(--muted)" strokeWidth={stroke} />
        <circle
          cx={cx} cy={cy} r={r} fill="none"
          stroke="url(#gaugeGrad)" strokeWidth={stroke}
          strokeDasharray={circ} strokeDashoffset={offset}
          strokeLinecap="round"
          style={{ transition: "stroke-dashoffset 0.6s ease" }}
        />
        <defs>
          <linearGradient id="gaugeGrad" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#C4877D" />
            <stop offset="100%" stopColor="#C4A8D4" />
          </linearGradient>
        </defs>
      </svg>
      <div className="absolute flex flex-col items-center justify-center gap-0.5">
        <span className="tc-gauge-number text-foreground">{pct.toFixed(2)}</span>
        <span className="tc-gauge-label text-muted-foreground">%</span>
      </div>
    </div>
  );
}

// ─── HabitCard ────────────────────────────────────────────────────────────────

function HabitCard({
  habit, record, onToggle, onSetOption,
}: {
  habit: Habit;
  record: HabitRecord;
  onToggle: () => void;
  onSetOption: (optId: string) => void;
}) {
  const checked = record.checked;
  return (
    <div className={`flex items-center gap-3 px-4 py-3 rounded-2xl border transition-all ${checked ? "bg-secondary border-secondary/80" : "bg-card border-border"}`}>
      <button
        onClick={onToggle}
        className={`flex-shrink-0 w-7 h-7 rounded-full border-2 flex items-center justify-center transition-all ${checked ? "bg-primary border-primary" : "border-border bg-background"}`}
      >
        {checked && <Check size={13} className="text-primary-foreground" strokeWidth={3} />}
      </button>
      <div className="flex-1 min-w-0">
        <span className={`tc-habit-name block ${checked ? "text-secondary-foreground line-through opacity-60" : "text-foreground"}`}>
          {habit.name}
        </span>
        {habit.options.length > 0 && (
          <select
            value={record.selectedOptionId || ""}
            onChange={e => onSetOption(e.target.value)}
            onClick={e => e.stopPropagation()}
            className="tc-habit-option mt-1 rounded-lg px-2 py-0.5 border border-border bg-muted text-muted-foreground appearance-none"
          >
            <option value="">옵션 선택</option>
            {habit.options.map(o => (
              <option key={o.id} value={o.id}>{o.label}</option>
            ))}
          </select>
        )}
      </div>
      <span className={`tc-habit-pts flex-shrink-0 ${habit.isBonus ? "text-accent-foreground" : "text-muted-foreground"}`}>
        {habit.isBonus ? "+" : ""}{habit.score}pt
      </span>
    </div>
  );
}

// ─── SectionLabel ─────────────────────────────────────────────────────────────

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <div className="tc-section-label text-muted-foreground/70 uppercase tracking-widest px-1 mb-2 mt-5 first:mt-0">
      {children}
    </div>
  );
}

// ─── Phase Cards ──────────────────────────────────────────────────────────────

function PhaseHeroCard({
  phase, onGoHome, onOpenDetail,
}: {
  phase: Phase;
  onGoHome: () => void;
  onOpenDetail: () => void;
}) {
  const dday = getDday(phase);
  const status = getPhaseStatus(phase);
  const progress = calcTotalProgress(phase);
  const statusLabel = status === "active" ? "진행 중" : status === "upcoming" ? "시작 예정" : "완료";
  const statusBg = status === "active" ? "bg-primary/20 text-primary" : status === "upcoming" ? "bg-secondary text-secondary-foreground" : "bg-muted text-muted-foreground";

  return (
    <div className="rounded-3xl overflow-hidden shadow-md" style={{ background: "linear-gradient(135deg, #F9EDE8 0%, #EDE8F5 100%)" }}>
      <div className="p-6">
        <div className="flex items-start justify-between mb-4">
          <span className={`tc-phase-badge px-2.5 py-1 rounded-full ${statusBg}`}>{statusLabel}</span>
          <div className="flex flex-col items-end gap-0.5">
            <span className="tc-phase-dday text-foreground">{dday.label}</span>
            {dday.suffix && <span className="tc-period-counter text-muted-foreground/70">{dday.suffix}까지</span>}
          </div>
        </div>

        <div className="mb-3">
          <div className="tc-phase-hero-name text-foreground mb-1">{phase.name}</div>
          <div className="tc-phase-goal text-muted-foreground">{phase.mainGoal}</div>
        </div>

        {/* Score bar */}
        <div className="mb-4">
          <div className="flex items-center justify-between mb-1.5">
            <span className="tc-phase-section text-muted-foreground/60">
              {status === "completed" ? "최종 점수" : "현재 점수"}
            </span>
            <span className="tc-score-display text-primary">{progress.toFixed(2)}%</span>
          </div>
          <div className="h-1.5 rounded-full bg-background/50 overflow-hidden">
            <div
              className="h-full rounded-full transition-all"
              style={{ width: `${Math.min(100, progress)}%`, background: "linear-gradient(90deg, #C4877D, #C4A8D4)" }}
            />
          </div>
        </div>

        <div className="tc-date-sub text-muted-foreground/70 mb-4">
          {format(parseISO(phase.startDate), "yyyy.MM.dd")} — {format(parseISO(phase.endDate), "yyyy.MM.dd")}
        </div>

        {phase.priority.length > 0 && (
          <div className="mb-4">
            <div className="tc-phase-section text-muted-foreground/60 mb-2">우선순위</div>
            <div className="flex flex-wrap gap-1.5">
              {phase.priority.map((p, i) => (
                <span key={i} className="tc-priority-chip px-2.5 py-1 rounded-full bg-background/60 text-foreground/70 border border-border/40">
                  {i + 1}. {p}
                </span>
              ))}
            </div>
          </div>
        )}

        <div className="flex gap-2">
          <button
            onClick={onOpenDetail}
            className="tc-btn flex-1 py-2.5 rounded-2xl bg-background/60 text-foreground/70 border border-border/40"
          >
            상세 보기
          </button>
          <button
            onClick={onGoHome}
            className="tc-btn flex-[2] py-2.5 rounded-2xl bg-primary text-primary-foreground flex items-center justify-center gap-1.5"
          >
            홈에서 이어가기
            <ChevronRight size={14} strokeWidth={2.5} />
          </button>
        </div>
      </div>
    </div>
  );
}

function PhaseSmallCard({
  phase, onOpenDetail,
}: {
  phase: Phase;
  onOpenDetail: () => void;
}) {
  const dday = getDday(phase);
  const status = getPhaseStatus(phase);
  const isCompleted = status === "completed";
  const progress = calcTotalProgress(phase);

  return (
    <button
      onClick={onOpenDetail}
      className={`w-full text-left rounded-2xl border p-4 transition-all active:scale-[0.99] ${isCompleted ? "border-border/40 bg-muted/30" : "border-border bg-card"}`}
    >
      <div className="flex items-start justify-between mb-1.5">
        <div className="tc-phase-card-name text-foreground">{phase.name}</div>
        <div className="flex flex-col items-end gap-0.5 flex-shrink-0 ml-2">
          <span className="tc-score-display text-primary text-sm">{progress.toFixed(1)}%</span>
          <span className="tc-period-counter text-muted-foreground/60">{dday.label}</span>
        </div>
      </div>
      <div className="tc-phase-goal text-muted-foreground text-sm mb-2">{phase.mainGoal}</div>
      {/* Progress bar */}
      <div className="h-1 rounded-full bg-muted overflow-hidden mb-2">
        <div
          className="h-full rounded-full"
          style={{ width: `${Math.min(100, progress)}%`, background: isCompleted ? "var(--muted-foreground)" : "var(--primary)" }}
        />
      </div>
      <div className="tc-period-counter text-muted-foreground/60">
        {format(parseISO(phase.startDate), "yyyy.MM.dd")} — {format(parseISO(phase.endDate), "yyyy.MM.dd")}
        <span className="ml-2 opacity-70">{isCompleted ? "완료" : status === "upcoming" ? "예정" : "진행 중"}</span>
      </div>
    </button>
  );
}

// ─── AddPhaseModal ────────────────────────────────────────────────────────────

function AddPhaseModal({ onSave, onClose }: { onSave: (phase: Phase) => void; onClose: () => void; }) {
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
    <div className="fixed inset-0 z-50 flex items-end bg-foreground/30 backdrop-blur-sm" onClick={onClose}>
      <div className="w-full bg-background rounded-t-3xl p-6 pb-10 max-h-[85vh] overflow-y-auto scrollbar-hide" onClick={e => e.stopPropagation()}>
        <div className="w-10 h-1 bg-border rounded-full mx-auto mb-6" />
        <div className="tc-modal-title text-foreground mb-5">새 목표 추가</div>
        <div className="space-y-4">
          <div>
            <div className="tc-form-label text-muted-foreground mb-1.5">목표 이름 *</div>
            <input className="tc-input w-full bg-muted rounded-xl px-4 py-3 text-foreground border border-transparent focus:border-primary/40 outline-none" placeholder="예: 요가 완주 기간" value={name} onChange={e => setName(e.target.value)} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <div className="tc-form-label text-muted-foreground mb-1.5">시작일 *</div>
              <input type="date" className="tc-input w-full bg-muted rounded-xl px-3 py-3 text-foreground border border-transparent focus:border-primary/40 outline-none" value={startDate} onChange={e => setStartDate(e.target.value)} />
            </div>
            <div>
              <div className="tc-form-label text-muted-foreground mb-1.5">종료일 *</div>
              <input type="date" className="tc-input w-full bg-muted rounded-xl px-3 py-3 text-foreground border border-transparent focus:border-primary/40 outline-none" value={endDate} onChange={e => setEndDate(e.target.value)} />
            </div>
          </div>
          <div>
            <div className="tc-form-label text-muted-foreground mb-1.5">주요 목표</div>
            <input className="tc-input w-full bg-muted rounded-xl px-4 py-3 text-foreground border border-transparent focus:border-primary/40 outline-none" placeholder="예: 요가 70회 완주" value={mainGoal} onChange={e => setMainGoal(e.target.value)} />
          </div>
          <div>
            <div className="tc-form-label text-muted-foreground mb-1.5">우선순위 (쉼표로 구분)</div>
            <input className="tc-input w-full bg-muted rounded-xl px-4 py-3 text-foreground border border-transparent focus:border-primary/40 outline-none" placeholder="예: 요가, 러닝, 피아노" value={priorityText} onChange={e => setPriorityText(e.target.value)} />
          </div>
          <div>
            <div className="tc-form-label text-muted-foreground mb-1.5">기본 자기신뢰도 (%)</div>
            <input type="number" min={0} max={99} className="tc-input w-full bg-muted rounded-xl px-4 py-3 text-foreground border border-transparent focus:border-primary/40 outline-none" value={baseScore} onChange={e => setBaseScore(Number(e.target.value))} />
          </div>
        </div>
        <div className="flex gap-3 mt-6">
          <button onClick={onClose} className="tc-btn flex-1 py-3 rounded-2xl bg-muted text-muted-foreground">취소</button>
          <button onClick={handleSave} disabled={!name.trim() || !startDate || !endDate} className="tc-btn flex-[2] py-3 rounded-2xl bg-primary text-primary-foreground disabled:opacity-40">추가하기</button>
        </div>
      </div>
    </div>
  );
}

// ─── AddLinkModal ─────────────────────────────────────────────────────────────

function AddLinkModal({
  link, onSave, onClose,
}: {
  link?: QuickLink;
  onSave: (l: QuickLink) => void;
  onClose: () => void;
}) {
  const [emoji, setEmoji] = useState(link?.emoji ?? "🔗");
  const [name, setName] = useState(link?.name ?? "");
  const [url, setUrl] = useState(link?.url ?? "");

  function handleSave() {
    if (!name.trim() || !url.trim()) return;
    onSave({ id: link?.id ?? makeId(), emoji: emoji || "🔗", name: name.trim(), url: url.trim() });
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end bg-foreground/30 backdrop-blur-sm" onClick={onClose}>
      <div className="w-full bg-background rounded-t-3xl p-6 pb-10" onClick={e => e.stopPropagation()}>
        <div className="w-10 h-1 bg-border rounded-full mx-auto mb-6" />
        <div className="tc-modal-title text-foreground mb-5">{link ? "링크 편집" : "링크 추가"}</div>
        <div className="space-y-3">
          <div className="flex gap-3">
            <div className="w-20">
              <div className="tc-form-label text-muted-foreground mb-1.5">아이콘</div>
              <input
                className="tc-input w-full bg-muted rounded-xl px-3 py-3 text-center text-xl outline-none border border-transparent focus:border-primary/40"
                value={emoji}
                onChange={e => setEmoji(e.target.value)}
                maxLength={2}
              />
            </div>
            <div className="flex-1">
              <div className="tc-form-label text-muted-foreground mb-1.5">링크명 *</div>
              <input
                className="tc-input w-full bg-muted rounded-xl px-4 py-3 text-foreground outline-none border border-transparent focus:border-primary/40"
                placeholder="예: 요가 클래스 Notion"
                value={name}
                onChange={e => setName(e.target.value)}
              />
            </div>
          </div>
          <div>
            <div className="tc-form-label text-muted-foreground mb-1.5">URL *</div>
            <input
              className="tc-input w-full bg-muted rounded-xl px-4 py-3 text-foreground outline-none border border-transparent focus:border-primary/40"
              placeholder="https://..."
              value={url}
              onChange={e => setUrl(e.target.value)}
              type="url"
              inputMode="url"
            />
          </div>
        </div>
        <div className="flex gap-3 mt-6">
          <button onClick={onClose} className="tc-btn flex-1 py-3 rounded-2xl bg-muted text-muted-foreground">취소</button>
          <button
            onClick={handleSave}
            disabled={!name.trim() || !url.trim()}
            className="tc-btn flex-[2] py-3 rounded-2xl bg-primary text-primary-foreground disabled:opacity-40"
          >
            저장
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── PhaseDetailScreen ────────────────────────────────────────────────────────

function PhaseDetailScreen({
  phase, isActive, dispatch, onBack, onActivate,
}: {
  phase: Phase;
  isActive: boolean;
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

  useEffect(() => { setRetroDraft(phase.retrospective ?? EMPTY_RETRO); }, [phase.id]);

  function saveRetro() {
    dispatch({ type: "SET_RETROSPECTIVE", phaseId: phase.id, retrospective: retroDraft });
    setRetroSaved(true);
    setTimeout(() => setRetroSaved(false), 1800);
  }

  return (
    <div className="flex flex-col flex-1 min-h-0">
      {/* Header */}
      <div className="px-5 pt-8 pb-4 flex items-center gap-3 flex-shrink-0">
        <button onClick={onBack} className="p-2 -ml-1 rounded-xl text-muted-foreground active:bg-muted">
          <ArrowLeft size={20} />
        </button>
        <div className="flex-1 min-w-0">
          <div className="tc-screen-title text-foreground truncate">{phase.name}</div>
          <div className="tc-date-sub text-muted-foreground mt-0.5">
            {format(parseISO(phase.startDate), "yyyy.MM.dd")} — {format(parseISO(phase.endDate), "yyyy.MM.dd")}
          </div>
        </div>
        <div className="flex-shrink-0 text-right">
          <div className="tc-phase-dday text-foreground">{dday.label}</div>
          {dday.suffix && <div className="tc-period-counter text-muted-foreground/60">{dday.suffix}까지</div>}
        </div>
      </div>

      <div className="flex-1 min-h-0 px-5 pb-6 overflow-y-auto scrollbar-hide space-y-6">
        {/* Phase summary card */}
        <div className="rounded-2xl p-4 border border-border" style={{ background: "linear-gradient(135deg, #F9EDE8 0%, #EDE8F5 100%)" }}>
          <div className="tc-phase-goal text-foreground mb-2">{phase.mainGoal}</div>
          {phase.priority.length > 0 && (
            <div className="flex flex-wrap gap-1.5 mb-3">
              {phase.priority.map((p, i) => (
                <span key={i} className="tc-priority-chip px-2 py-0.5 rounded-full bg-background/60 text-foreground/70 border border-border/40">
                  {i + 1}. {p}
                </span>
              ))}
            </div>
          )}
          <button
            onClick={isActive ? onBack : onActivate}
            className="tc-btn w-full py-2.5 rounded-2xl bg-primary text-primary-foreground flex items-center justify-center gap-1.5"
          >
            {isActive ? "홈에서 이어가기" : "이 목표로 전환"}
            <ChevronRight size={14} strokeWidth={2.5} />
          </button>
        </div>

        {/* Quick links */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <Link2 size={14} className="text-muted-foreground/60" />
              <span className="tc-phase-section text-muted-foreground/60">빠른 링크</span>
            </div>
            {links.length < 8 && (
              <button
                onClick={() => setEditLinkData("new")}
                className="tc-btn text-primary flex items-center gap-1"
              >
                <Plus size={13} /> 추가
              </button>
            )}
          </div>

          {links.length === 0 ? (
            <button
              onClick={() => setEditLinkData("new")}
              className="tc-btn-add w-full py-4 rounded-2xl border-2 border-dashed border-border text-muted-foreground flex items-center justify-center gap-2"
            >
              <Plus size={15} /> 링크 추가하기
            </button>
          ) : (
            <div className="space-y-2">
              {links.map(link => (
                <div key={link.id} className="flex items-center gap-3 bg-card border border-border rounded-2xl px-4 py-3">
                  <span className="text-xl flex-shrink-0 w-7 text-center">{link.emoji}</span>
                  <button
                    className="flex-1 min-w-0 text-left"
                    onClick={() => {
                      const href = link.url.startsWith("http") ? link.url : `https://${link.url}`;
                      window.open(href, "_blank", "noopener,noreferrer");
                    }}
                  >
                    <span className="tc-habit-name text-foreground block truncate">{link.name}</span>
                    <span className="tc-period-counter text-muted-foreground/60 block truncate">{link.url}</span>
                  </button>
                  <ExternalLink size={14} className="text-muted-foreground/40 flex-shrink-0" />
                  <button onClick={() => setEditLinkData(link)} className="p-1 text-muted-foreground/50">
                    <Edit2 size={13} />
                  </button>
                  <button onClick={() => setDeleteLinkId(link.id)} className="p-1 text-muted-foreground/30">
                    <Trash2 size={13} />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Retrospective */}
        <div>
          <div className="flex items-center gap-2 mb-3">
            <span className="tc-phase-section text-muted-foreground/60">회고 메모</span>
            {!isCompleted && (
              <span className="tc-phase-badge px-2 py-0.5 rounded-full bg-muted text-muted-foreground/60">
                완료 후 작성
              </span>
            )}
          </div>

          {isCompleted ? (
            <div className="bg-card border border-border rounded-2xl p-4 space-y-4">
              {([
                { key: "bestPoint" as const, label: "🏆 가장 잘한 점", placeholder: "이 기간 동안 가장 잘했다고 생각하는 것은?" },
                { key: "hardPoint" as const, label: "😤 어려웠던 점", placeholder: "가장 힘들었던 순간이나 상황은?" },
                { key: "nextReflection" as const, label: "💡 다음에 반영할 것", placeholder: "다음 목표에 적용하고 싶은 교훈은?" },
              ]).map(({ key, label, placeholder }) => (
                <div key={key}>
                  <div className="tc-form-label text-foreground mb-1.5">{label}</div>
                  <textarea
                    rows={3}
                    className="tc-input w-full bg-muted rounded-xl px-4 py-3 text-foreground outline-none border border-transparent focus:border-primary/40 resize-none"
                    placeholder={placeholder}
                    value={retroDraft[key]}
                    onChange={e => setRetroDraft(prev => ({ ...prev, [key]: e.target.value }))}
                  />
                </div>
              ))}
              <button
                onClick={saveRetro}
                className={`tc-btn w-full py-2.5 rounded-2xl transition-all ${retroSaved ? "bg-secondary text-secondary-foreground" : "bg-primary text-primary-foreground"}`}
              >
                {retroSaved ? "✓ 저장됨" : "저장"}
              </button>
            </div>
          ) : (
            <div className="rounded-2xl border border-dashed border-border p-6 text-center">
              <div className="tc-empty-msg text-muted-foreground/50">
                Phase가 완료되면 회고를 작성할 수 있어요
              </div>
            </div>
          )}
        </div>
      </div>

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
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-foreground/30 backdrop-blur-sm px-6" onClick={() => setDeleteLinkId(null)}>
          <div className="bg-background rounded-3xl p-6 w-full max-w-sm" onClick={e => e.stopPropagation()}>
            <div className="tc-modal-confirm-title text-foreground mb-2">링크를 삭제할까요?</div>
            <div className="flex gap-3 mt-4">
              <button onClick={() => setDeleteLinkId(null)} className="tc-btn flex-1 py-3 rounded-2xl bg-muted text-muted-foreground">취소</button>
              <button onClick={() => { dispatch({ type: "DELETE_LINK", phaseId: phase.id, linkId: deleteLinkId }); setDeleteLinkId(null); }} className="tc-btn flex-1 py-3 rounded-2xl bg-destructive text-destructive-foreground">삭제</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── PhaseScreen ──────────────────────────────────────────────────────────────

function PhaseScreen({
  state, dispatch, onGoHome,
}: {
  state: AppState;
  dispatch: React.Dispatch<Action>;
  onGoHome: () => void;
}) {
  const [showAdd, setShowAdd] = useState(false);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [detailPhaseId, setDetailPhaseId] = useState<string | null>(null);

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
    <div className="flex flex-col flex-1 min-h-0">
      <div className="px-5 pt-8 pb-4">
        <div className="tc-screen-title text-foreground">목표</div>
        <div className="tc-date-sub text-muted-foreground mt-0.5">실천 기간을 관리하세요</div>
      </div>

      <div className="flex-1 min-h-0 px-5 pb-6 overflow-y-auto scrollbar-hide space-y-6">
        {/* Active hero */}
        {activePhase && (
          <div>
            <div className="tc-phase-section text-muted-foreground/60 mb-3">현재 진행</div>
            <div className="relative">
              <PhaseHeroCard phase={activePhase} onGoHome={onGoHome} onOpenDetail={() => setDetailPhaseId(activePhase.id)} />
              {state.phases.length > 1 && (
                <button
                  onClick={() => setConfirmDeleteId(activePhase.id)}
                  className="absolute top-4 right-4 p-2 rounded-full bg-background/70 text-muted-foreground/60 backdrop-blur-sm"
                >
                  <Trash2 size={13} />
                </button>
              )}
            </div>
          </div>
        )}

        {/* Upcoming */}
        {upcomingOther.length > 0 && (
          <div>
            <div className="tc-phase-section text-muted-foreground/60 mb-3">예정된 목표</div>
            <div className="space-y-3">
              {upcomingOther.map(phase => (
                <div key={phase.id} className="relative">
                  <PhaseSmallCard phase={phase} onOpenDetail={() => setDetailPhaseId(phase.id)} />
                  <button
                    onClick={() => setConfirmDeleteId(phase.id)}
                    className="absolute top-3 right-3 p-1.5 rounded-full bg-muted/80 text-muted-foreground/50"
                  >
                    <Trash2 size={12} />
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Completed */}
        {completedOther.length > 0 && (
          <div>
            <div className="tc-phase-section text-muted-foreground/60 mb-3">완료된 목표</div>
            <div className="space-y-3">
              {completedOther.map(phase => (
                <div key={phase.id} className="relative">
                  <PhaseSmallCard phase={phase} onOpenDetail={() => setDetailPhaseId(phase.id)} />
                  <button
                    onClick={() => setConfirmDeleteId(phase.id)}
                    className="absolute top-3 right-3 p-1.5 rounded-full bg-muted/80 text-muted-foreground/50"
                  >
                    <Trash2 size={12} />
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Add new */}
        <button
          onClick={() => setShowAdd(true)}
          className="tc-btn-add w-full py-4 rounded-2xl border-2 border-dashed border-border text-muted-foreground flex items-center justify-center gap-2"
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

      {confirmDeleteId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-foreground/30 backdrop-blur-sm px-6" onClick={() => setConfirmDeleteId(null)}>
          <div className="bg-background rounded-3xl p-6 w-full max-w-sm" onClick={e => e.stopPropagation()}>
            <div className="tc-modal-confirm-title text-foreground mb-2">목표를 삭제할까요?</div>
            <div className="tc-modal-body text-muted-foreground mb-6">삭제하면 해당 기간의 모든 기록이 사라져요.</div>
            <div className="flex gap-3">
              <button onClick={() => setConfirmDeleteId(null)} className="tc-btn flex-1 py-3 rounded-2xl bg-muted text-muted-foreground">취소</button>
              <button onClick={() => { dispatch({ type: "DELETE_PHASE", phaseId: confirmDeleteId }); setConfirmDeleteId(null); }} className="tc-btn flex-1 py-3 rounded-2xl bg-destructive text-destructive-foreground">삭제</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── HomeScreen ───────────────────────────────────────────────────────────────

function HomeScreen({
  state, dispatch, onGoPhases,
}: {
  state: AppState;
  dispatch: React.Dispatch<Action>;
  onGoPhases: () => void;
}) {
  const today = format(new Date(), "yyyy-MM-dd");
  const activePhase = state.phases.find(p => p.id === state.activePhaseId)!;
  const totalProgress = calcTotalProgress(activePhase);
  const todayScore = calcScore(activePhase, today);
  const dayRec = activePhase.records[today] || {};

  const allDays = eachDayOfInterval({ start: parseISO(activePhase.startDate), end: parseISO(activePhase.endDate) });
  const now = new Date();
  const daysPassed = allDays.filter(d => !isAfter(d, now)).length;

  const basicHabits = activePhase.habits.filter(h => h.enabled && !h.isBonus).sort((a, b) => a.order - b.order);
  const bonusHabits = activePhase.habits.filter(h => h.enabled && h.isBonus).sort((a, b) => a.order - b.order);
  const allBasicChecked = basicHabits.length > 0 && basicHabits.every(h => dayRec[h.id]?.checked);
  const phaseStatus = getPhaseStatus(activePhase);

  return (
    <div className="flex flex-col flex-1 min-h-0">
      <div className="px-5 pt-8 pb-2 flex items-start justify-between">
        <div>
          <div className="tc-app-title text-foreground">Trust Charge</div>
          <div className="tc-date-sub text-muted-foreground mt-0.5">{toKoDateStr(today)}</div>
        </div>
        <button
          onClick={onGoPhases}
          className="mt-1 flex items-center gap-1 px-3 py-1.5 rounded-full bg-secondary text-secondary-foreground"
        >
          <span className="tc-phase-indicator">{activePhase.name}</span>
          <ChevronRight size={12} className="opacity-60" />
        </button>
      </div>

      <div className="flex-1 min-h-0 px-5 pb-6 overflow-y-auto scrollbar-hide">
        {/* Gauge */}
        <div className="flex flex-col items-center py-6">
          <CircularGauge pct={totalProgress} />
          <div className="tc-gauge-label text-muted-foreground mt-2">누적 자기신뢰도</div>
          <div className="tc-period-counter text-muted-foreground/60 mt-1">
            {daysPassed}일 / {allDays.length}일 경과
          </div>
        </div>

        {/* Banners */}
        {allBasicChecked && (
          <div className="mb-4 py-3 px-5 rounded-2xl text-center" style={{ background: "linear-gradient(135deg, #F9EDE8 0%, #EDE8F5 100%)" }}>
            <div className="tc-banner-text text-foreground/80">🎉 오늘 모든 항목을 완료했어요!</div>
          </div>
        )}
        {phaseStatus !== "active" && (
          <div className="mb-4 py-3 px-5 rounded-2xl bg-muted border border-border">
            <div className="tc-banner-text text-muted-foreground">
              {phaseStatus === "upcoming"
                ? `📅 ${format(parseISO(activePhase.startDate), "M월 d일")} 시작 예정`
                : "✓ 완료된 기간의 기록을 보고 있어요"}
            </div>
          </div>
        )}

        {/* Today score */}
        <div className="flex items-center justify-between px-1 mb-3">
          <div className="tc-section-label text-muted-foreground/70 uppercase tracking-widest">오늘 점수</div>
          <div className="tc-score-display text-primary">{todayScore.toFixed(2)}%</div>
        </div>

        {basicHabits.length > 0 && (
          <>
            <SectionLabel>기본 항목</SectionLabel>
            <div className="space-y-2">
              {basicHabits.map(h => (
                <HabitCard key={h.id} habit={h}
                  record={dayRec[h.id] || { checked: false, selectedOptionId: "" }}
                  onToggle={() => dispatch({ type: "TOGGLE_CHECK", date: today, habitId: h.id })}
                  onSetOption={optId => dispatch({ type: "SET_OPTION", date: today, habitId: h.id, optionId: optId })}
                />
              ))}
            </div>
          </>
        )}

        {bonusHabits.length > 0 && (
          <>
            <SectionLabel>보너스</SectionLabel>
            <div className="space-y-2">
              {bonusHabits.map(h => (
                <HabitCard key={h.id} habit={h}
                  record={dayRec[h.id] || { checked: false, selectedOptionId: "" }}
                  onToggle={() => dispatch({ type: "TOGGLE_CHECK", date: today, habitId: h.id })}
                  onSetOption={optId => dispatch({ type: "SET_OPTION", date: today, habitId: h.id, optionId: optId })}
                />
              ))}
            </div>
          </>
        )}

        {(activePhase.links ?? []).length > 0 && (
          <>
            <SectionLabel>빠른 링크</SectionLabel>
            <div className="space-y-2">
              {(activePhase.links ?? []).map(link => (
                <button
                  key={link.id}
                  onClick={() => {
                    const href = link.url.startsWith("http") ? link.url : `https://${link.url}`;
                    window.open(href, "_blank", "noopener,noreferrer");
                  }}
                  className="w-full flex items-center gap-3 px-4 py-3 rounded-2xl bg-card border border-border active:bg-muted/50 transition-all text-left"
                >
                  <span className="text-xl flex-shrink-0 w-7 text-center leading-none">{link.emoji}</span>
                  <span className="tc-habit-name flex-1 text-foreground truncate">{link.name}</span>
                  <ExternalLink size={14} className="flex-shrink-0 text-muted-foreground/40" />
                </button>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}

// ─── CalendarScreen ───────────────────────────────────────────────────────────

function CalendarScreen({ state, dispatch }: { state: AppState; dispatch: React.Dispatch<Action>; }) {
  const today = format(new Date(), "yyyy-MM-dd");
  const activePhase = state.phases.find(p => p.id === state.activePhaseId)!;
  const [viewDate, setViewDate] = useState(today);
  const [selectedDate, setSelectedDate] = useState(today);

  const monthStart = startOfMonth(parseISO(viewDate));
  const monthEnd = endOfMonth(parseISO(viewDate));
  const days = eachDayOfInterval({ start: monthStart, end: monthEnd });
  const startDow = monthStart.getDay();
  const padded = [...Array(startDow).fill(null), ...days];

  const selDateStr = selectedDate;
  const selDayRec = activePhase.records[selDateStr] || {};
  const selDayStatus = getDayStatus(activePhase, selDateStr);
  const selBasicHabits = activePhase.habits.filter(h => h.enabled && !h.isBonus).sort((a, b) => a.order - b.order);
  const selBonusHabits = activePhase.habits.filter(h => h.enabled && h.isBonus).sort((a, b) => a.order - b.order);

  function shiftMonth(delta: number) {
    const d = parseISO(viewDate);
    d.setMonth(d.getMonth() + delta);
    setViewDate(format(d, "yyyy-MM-dd"));
  }

  return (
    <div className="flex flex-col flex-1 min-h-0">
      <div className="px-5 pt-8 pb-4">
        <div className="tc-screen-title text-foreground">캘린더</div>
        <div className="tc-date-sub text-muted-foreground mt-0.5">{activePhase.name}</div>
      </div>

      <div className="flex-1 min-h-0 px-5 pb-6 overflow-y-auto scrollbar-hide">
        <div className="flex items-center justify-between mb-4">
          <button onClick={() => shiftMonth(-1)} className="p-2 rounded-xl bg-muted text-muted-foreground">
            <ChevronRight size={16} className="rotate-180" />
          </button>
          <div className="tc-month-title text-foreground">{format(parseISO(viewDate), "yyyy년 M월")}</div>
          <button onClick={() => shiftMonth(1)} className="p-2 rounded-xl bg-muted text-muted-foreground">
            <ChevronRight size={16} />
          </button>
        </div>

        <div className="grid grid-cols-7 mb-1">
          {KO_DAYS.map(d => (
            <div key={d} className="tc-day-header text-center text-muted-foreground/60 py-1">{d}</div>
          ))}
        </div>

        <div className="grid grid-cols-7 gap-y-1">
          {padded.map((d, i) => {
            if (!d) return <div key={`pad-${i}`} />;
            const ds = format(d, "yyyy-MM-dd");
            const inRange = isDateInRange(ds, activePhase.startDate, activePhase.endDate);
            const dayStatus = getDayStatus(activePhase, ds);
            const isTodayDate = ds === today;
            const isSelected = ds === selectedDate;
            let bg = "transparent";
            let textClass = "text-muted-foreground/40";
            if (inRange) {
              textClass = "text-foreground";
              if (dayStatus.isFullDay) bg = "var(--primary)";
              else if (dayStatus.score > activePhase.baseScore) bg = "var(--secondary)";
            }
            return (
              <button key={ds} onClick={() => setSelectedDate(ds)} className={`flex flex-col items-center py-1.5 rounded-xl ${isSelected ? "ring-2 ring-primary" : ""}`}>
                <div className={`w-8 h-8 flex items-center justify-center rounded-full ${isTodayDate ? "ring-2 ring-primary/40" : ""}`} style={{ background: bg }}>
                  <span className={`tc-day-number ${isTodayDate ? "tc-day-number--today" : ""} ${dayStatus.isFullDay ? "text-primary-foreground" : textClass}`}>
                    {format(d, "d")}
                  </span>
                </div>
                {inRange && (dayStatus.isPast || dayStatus.isToday) && dayStatus.score > 0 && (
                  <span className="tc-period-counter text-muted-foreground/60 leading-none mt-0.5">{dayStatus.score.toFixed(0)}</span>
                )}
              </button>
            );
          })}
        </div>

        <div className="flex gap-4 mt-3 mb-5 px-1">
          <div className="flex items-center gap-1.5">
            <div className="w-3 h-3 rounded-full bg-primary" />
            <span className="tc-legend-label text-muted-foreground">완료</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-3 h-3 rounded-full bg-secondary border border-border/40" />
            <span className="tc-legend-label text-muted-foreground">부분</span>
          </div>
        </div>

        <div className="rounded-2xl bg-card border border-border p-4">
          <div className="flex items-center justify-between mb-3">
            <div className="tc-chart-title text-foreground">{toKoDateStr(selDateStr)}</div>
            {(selDayStatus.isPast || selDayStatus.isToday) && (
              <div className="tc-score-display text-primary">{selDayStatus.score.toFixed(2)}%</div>
            )}
          </div>
          {isDateInRange(selDateStr, activePhase.startDate, activePhase.endDate) ? (
            <div className="space-y-2">
              {selBasicHabits.map(h => (
                <HabitCard key={h.id} habit={h}
                  record={selDayRec[h.id] || { checked: false, selectedOptionId: "" }}
                  onToggle={() => dispatch({ type: "TOGGLE_CHECK", date: selDateStr, habitId: h.id })}
                  onSetOption={optId => dispatch({ type: "SET_OPTION", date: selDateStr, habitId: h.id, optionId: optId })}
                />
              ))}
              {selBonusHabits.map(h => (
                <HabitCard key={h.id} habit={h}
                  record={selDayRec[h.id] || { checked: false, selectedOptionId: "" }}
                  onToggle={() => dispatch({ type: "TOGGLE_CHECK", date: selDateStr, habitId: h.id })}
                  onSetOption={optId => dispatch({ type: "SET_OPTION", date: selDateStr, habitId: h.id, optionId: optId })}
                />
              ))}
            </div>
          ) : (
            <div className="tc-empty-msg text-muted-foreground text-center py-4">실천 기간 외의 날짜예요</div>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── StatsScreen ──────────────────────────────────────────────────────────────

function StatsScreen({ state }: { state: AppState }) {
  const [tab, setTab] = useState<StatsTab>("overview");
  const activePhase = state.phases.find(p => p.id === state.activePhaseId)!;
  const today = format(new Date(), "yyyy-MM-dd");

  const allDays = eachDayOfInterval({ start: parseISO(activePhase.startDate), end: parseISO(activePhase.endDate) });
  const now = new Date();
  const pastDays = allDays.filter(d => !isAfter(d, now));
  const scores = pastDays.map(d => calcScore(activePhase, format(d, "yyyy-MM-dd")));
  const nonZeroScores = scores.filter(s => s > activePhase.baseScore);
  const avgScore = nonZeroScores.length > 0 ? nonZeroScores.reduce((a, b) => a + b, 0) / nonZeroScores.length : activePhase.baseScore;
  const maxScore = scores.length > 0 ? Math.max(...scores) : activePhase.baseScore;
  const basicHabits = activePhase.habits.filter(h => h.enabled && !h.isBonus);
  const streak = (() => {
    let s = 0;
    for (let i = pastDays.length - 1; i >= 0; i--) {
      const ds = format(pastDays[i], "yyyy-MM-dd");
      const dayRec = activePhase.records[ds] || {};
      const full = basicHabits.length > 0 && basicHabits.every(h => dayRec[h.id]?.checked);
      if (full) s++;
      else break;
    }
    return s;
  })();

  const trendData = pastDays.slice(-14).map((d, idx) => ({
    idx,
    label: format(d, "M/d"),
    score: calcScore(activePhase, format(d, "yyyy-MM-dd")),
  }));

  const timelineDays = [...pastDays].reverse().slice(0, 30);

  return (
    <div className="flex flex-col flex-1 min-h-0">
      <div className="px-5 pt-8 pb-4">
        <div className="tc-screen-title text-foreground">기록</div>
        <div className="tc-date-sub text-muted-foreground mt-0.5">{activePhase.name}</div>
      </div>

      <div className="px-5 mb-4">
        <div className="flex rounded-2xl bg-muted p-1">
          {(["overview", "timeline"] as StatsTab[]).map(t => (
            <button key={t} onClick={() => setTab(t)}
              className={`tc-btn flex-1 py-2 rounded-xl transition-all ${tab === t ? "bg-background text-foreground shadow-sm" : "text-muted-foreground"}`}>
              {t === "overview" ? "통계" : "타임라인"}
            </button>
          ))}
        </div>
      </div>

      <div className="flex-1 min-h-0 px-5 pb-6 overflow-y-auto scrollbar-hide">
        {tab === "overview" && (
          <>
            <div className="grid grid-cols-2 gap-3 mb-5">
              {[
                { label: "평균 점수", value: `${avgScore.toFixed(2)}%`, sub: "기록된 날 기준" },
                { label: "최고 점수", value: `${maxScore.toFixed(2)}%`, sub: "전체 기간" },
                { label: "연속 완료", value: `${streak}일`, sub: "기본항목 기준" },
                { label: "기록 일수", value: `${pastDays.length}일`, sub: `총 ${allDays.length}일 중` },
              ].map(c => (
                <div key={c.label} className="bg-card border border-border rounded-2xl p-4">
                  <div className="tc-card-label text-muted-foreground mb-1">{c.label}</div>
                  <div className="tc-card-value text-foreground">{c.value}</div>
                  <div className="tc-stat-sublabel text-muted-foreground/60">{c.sub}</div>
                </div>
              ))}
            </div>

            <div className="bg-card border border-border rounded-2xl p-4 mb-5">
              <div className="tc-chart-title text-foreground mb-4">최근 14일 점수</div>
              {trendData.length > 1 ? (
                <ResponsiveContainer width="100%" height={160}>
                  <LineChart data={trendData} margin={{ top: 4, right: 4, bottom: 0, left: -24 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                    <XAxis dataKey="idx" type="number" domain={[0, trendData.length - 1]}
                      ticks={trendData.map(d => d.idx)}
                      tickFormatter={i => trendData[i]?.label ?? ""}
                      tick={{ fontSize: 10, fill: "var(--muted-foreground)" }}
                    />
                    <YAxis domain={[0, 100]} tick={{ fontSize: 10, fill: "var(--muted-foreground)" }} />
                    <Tooltip
                      contentStyle={{ borderRadius: 12, border: "1px solid var(--border)", background: "var(--card)" }}
                      labelFormatter={i => trendData[Number(i)]?.label ?? ""}
                      formatter={(v: number) => [`${v.toFixed(2)}%`, "점수"]}
                    />
                    <Line type="monotone" dataKey="score" stroke="var(--primary)" strokeWidth={2}
                      dot={{ r: 3, fill: "var(--primary)" }} activeDot={{ r: 5 }} />
                  </LineChart>
                </ResponsiveContainer>
              ) : (
                <div className="tc-empty-msg text-muted-foreground text-center py-8">데이터가 부족해요</div>
              )}
            </div>

            <div className="bg-card border border-border rounded-2xl p-4">
              <div className="tc-chart-title text-foreground mb-3">항목별 실천률</div>
              {activePhase.habits.filter(h => h.enabled).map(h => {
                const doneCount = pastDays.filter(d => activePhase.records[format(d, "yyyy-MM-dd")]?.[h.id]?.checked).length;
                const pct = pastDays.length > 0 ? (doneCount / pastDays.length) * 100 : 0;
                return (
                  <div key={h.id} className="mb-3">
                    <div className="flex justify-between mb-1">
                      <span className="tc-chart-label text-foreground">{h.name}{h.isBonus ? " (보너스)" : ""}</span>
                      <span className="tc-chart-label text-muted-foreground">{doneCount}/{pastDays.length}일</span>
                    </div>
                    <div className="h-2 rounded-full bg-muted overflow-hidden">
                      <div className="h-full rounded-full transition-all" style={{ width: `${pct}%`, background: h.isBonus ? "var(--accent)" : "var(--primary)" }} />
                    </div>
                  </div>
                );
              })}
            </div>
          </>
        )}

        {tab === "timeline" && (
          <div className="space-y-2">
            {timelineDays.length === 0 && (
              <div className="tc-empty-msg text-muted-foreground text-center py-12">아직 기록이 없어요</div>
            )}
            {timelineDays.map(d => {
              const ds = format(d, "yyyy-MM-dd");
              const score = calcScore(activePhase, ds);
              const dayRec = activePhase.records[ds] || {};
              const checked = activePhase.habits.filter(h => h.enabled && dayRec[h.id]?.checked);
              const isToday = ds === today;
              return (
                <div key={ds} className={`flex gap-3 p-4 rounded-2xl border ${isToday ? "border-primary/40 bg-secondary/30" : "border-border bg-card"}`}>
                  <div className="flex flex-col items-center min-w-[44px]">
                    <div className="tc-timeline-score text-primary">{score.toFixed(0)}</div>
                    <div className="tc-timeline-sub text-muted-foreground">%</div>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="tc-timeline-date text-foreground">
                      {format(d, "M월 d일")} <span className="text-muted-foreground font-normal">({KO_DAYS[d.getDay()]})</span>
                      {isToday && <span className="ml-1.5 text-primary">· 오늘</span>}
                    </div>
                    <div className="tc-timeline-item text-muted-foreground mt-0.5">
                      {checked.length > 0 ? checked.map(h => h.name).join(", ") : "기록 없음"}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

// ─── HabitEditor ──────────────────────────────────────────────────────────────

function HabitEditor({ habit, onSave, onClose }: { habit: Partial<Habit>; onSave: (h: Habit) => void; onClose: () => void; }) {
  const [name, setName] = useState(habit?.name ?? "");
  const [score, setScore] = useState(habit?.score ?? 5);
  const [isBonus, setIsBonus] = useState(habit?.isBonus ?? false);
  const [options, setOptions] = useState<HabitOption[]>(habit?.options ?? []);
  const [optLabel, setOptLabel] = useState("");

  function addOption() {
    if (!optLabel.trim()) return;
    setOptions(prev => [...prev, { id: makeId(), label: optLabel.trim() }]);
    setOptLabel("");
  }

  function handleSave() {
    if (!name.trim()) return;
    onSave({ id: habit?.id ?? makeId(), name: name.trim(), score, isBonus, enabled: habit?.enabled ?? true, order: habit?.order ?? 0, options });
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end bg-foreground/30 backdrop-blur-sm" onClick={onClose}>
      <div className="w-full bg-background rounded-t-3xl p-6 pb-10 max-h-[80vh] overflow-y-auto scrollbar-hide" onClick={e => e.stopPropagation()}>
        <div className="w-10 h-1 bg-border rounded-full mx-auto mb-6" />
        <div className="tc-modal-title text-foreground mb-5">{habit?.id ? "항목 편집" : "새 항목 추가"}</div>
        <div className="space-y-4">
          <div>
            <div className="tc-form-label text-muted-foreground mb-1.5">이름</div>
            <input className="tc-input w-full bg-muted rounded-xl px-4 py-3 text-foreground border border-transparent focus:border-primary/40 outline-none" value={name} onChange={e => setName(e.target.value)} placeholder="항목 이름" />
          </div>
          <div>
            <div className="tc-form-label text-muted-foreground mb-1.5">점수</div>
            <input type="number" min={1} max={20} className="tc-input w-full bg-muted rounded-xl px-4 py-3 text-foreground border border-transparent focus:border-primary/40 outline-none" value={score} onChange={e => setScore(Number(e.target.value))} />
          </div>
          <div className="flex items-center justify-between py-1">
            <span className="tc-form-label text-foreground">보너스 항목</span>
            <button onClick={() => setIsBonus(!isBonus)} className={`w-12 h-6 rounded-full transition-all ${isBonus ? "bg-primary" : "bg-muted"}`}>
              <div className={`w-5 h-5 rounded-full bg-white shadow-sm transition-all mx-0.5 ${isBonus ? "translate-x-6" : "translate-x-0"}`} />
            </button>
          </div>
          <div>
            <div className="tc-form-label text-muted-foreground mb-1.5">옵션 (선택사항)</div>
            <div className="flex gap-2 mb-2">
              <input className="tc-input flex-1 bg-muted rounded-xl px-4 py-2 text-foreground border border-transparent focus:border-primary/40 outline-none" value={optLabel} onChange={e => setOptLabel(e.target.value)} onKeyDown={e => e.key === "Enter" && addOption()} placeholder="옵션 추가 후 Enter" />
              <button onClick={addOption} className="tc-btn px-4 py-2 rounded-xl bg-primary text-primary-foreground">추가</button>
            </div>
            <div className="space-y-1.5">
              {options.map(o => (
                <div key={o.id} className="flex items-center justify-between py-1.5 px-3 rounded-xl bg-muted">
                  <span className="tc-habit-option text-foreground">{o.label}</span>
                  <button onClick={() => setOptions(prev => prev.filter(op => op.id !== o.id))} className="text-muted-foreground/60"><X size={14} /></button>
                </div>
              ))}
            </div>
          </div>
        </div>
        <div className="flex gap-3 mt-6">
          <button onClick={onClose} className="tc-btn flex-1 py-3 rounded-2xl bg-muted text-muted-foreground">취소</button>
          <button onClick={handleSave} className="tc-btn flex-[2] py-3 rounded-2xl bg-primary text-primary-foreground">저장</button>
        </div>
      </div>
    </div>
  );
}

// ─── SettingsScreen ───────────────────────────────────────────────────────────

function SettingsScreen({ state, dispatch }: { state: AppState; dispatch: React.Dispatch<Action>; }) {
  const activePhase = state.phases.find(p => p.id === state.activePhaseId)!;
  const [editHabit, setEditHabit] = useState<Partial<Habit> | null>(null);
  const [editLink, setEditLink] = useState<QuickLink | "new" | null>(null);
  const [showReset, setShowReset] = useState(false);
  const [editMeta, setEditMeta] = useState(false);
  const [metaName, setMetaName] = useState(activePhase.name);
  const [metaGoal, setMetaGoal] = useState(activePhase.mainGoal);
  const [metaPriority, setMetaPriority] = useState(activePhase.priority.join(", "));
  const [startDate, setStartDate] = useState(activePhase.startDate);
  const [endDate, setEndDate] = useState(activePhase.endDate);
  const [baseScore, setBaseScore] = useState(activePhase.baseScore);

  useEffect(() => {
    setMetaName(activePhase.name);
    setMetaGoal(activePhase.mainGoal);
    setMetaPriority(activePhase.priority.join(", "));
    setStartDate(activePhase.startDate);
    setEndDate(activePhase.endDate);
    setBaseScore(activePhase.baseScore);
    setEditMeta(false);
  }, [state.activePhaseId]);

  const basicHabits = activePhase.habits.filter(h => !h.isBonus).sort((a, b) => a.order - b.order);
  const bonusHabits = activePhase.habits.filter(h => h.isBonus).sort((a, b) => a.order - b.order);

  function saveMeta() {
    const priority = metaPriority.split(/[,，、]/).map(s => s.trim()).filter(Boolean);
    dispatch({ type: "SET_PHASE_META", name: metaName, mainGoal: metaGoal, priority });
    dispatch({ type: "SET_DATE_RANGE", startDate, endDate });
    dispatch({ type: "SET_BASE_SCORE", score: baseScore });
    setEditMeta(false);
  }

  return (
    <div className="flex flex-col flex-1 min-h-0">
      <div className="px-5 pt-8 pb-4">
        <div className="tc-screen-title text-foreground">설정</div>
        <div className="tc-date-sub text-muted-foreground mt-0.5">{activePhase.name}</div>
      </div>

      <div className="flex-1 min-h-0 px-5 pb-6 overflow-y-auto scrollbar-hide space-y-6">
        {/* Phase meta */}
        <div className="bg-card border border-border rounded-2xl p-4">
          <div className="flex items-center justify-between mb-4">
            <div className="tc-chart-title text-foreground">목표 정보</div>
            <button onClick={() => setEditMeta(v => !v)} className="tc-btn text-primary flex items-center gap-1">
              <Edit2 size={13} />{editMeta ? "닫기" : "편집"}
            </button>
          </div>
          {editMeta ? (
            <div className="space-y-3">
              <div>
                <div className="tc-form-label text-muted-foreground mb-1">목표 이름</div>
                <input className="tc-input w-full bg-muted rounded-xl px-3 py-2 text-foreground outline-none border border-transparent focus:border-primary/40" value={metaName} onChange={e => setMetaName(e.target.value)} />
              </div>
              <div>
                <div className="tc-form-label text-muted-foreground mb-1">주요 목표</div>
                <input className="tc-input w-full bg-muted rounded-xl px-3 py-2 text-foreground outline-none border border-transparent focus:border-primary/40" value={metaGoal} onChange={e => setMetaGoal(e.target.value)} />
              </div>
              <div>
                <div className="tc-form-label text-muted-foreground mb-1">우선순위 (쉼표 구분)</div>
                <input className="tc-input w-full bg-muted rounded-xl px-3 py-2 text-foreground outline-none border border-transparent focus:border-primary/40" value={metaPriority} onChange={e => setMetaPriority(e.target.value)} />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <div className="tc-form-label text-muted-foreground mb-1">시작일</div>
                  <input type="date" className="tc-input w-full bg-muted rounded-xl px-2 py-2 text-foreground outline-none border border-transparent focus:border-primary/40" value={startDate} onChange={e => setStartDate(e.target.value)} />
                </div>
                <div>
                  <div className="tc-form-label text-muted-foreground mb-1">종료일</div>
                  <input type="date" className="tc-input w-full bg-muted rounded-xl px-2 py-2 text-foreground outline-none border border-transparent focus:border-primary/40" value={endDate} onChange={e => setEndDate(e.target.value)} />
                </div>
              </div>
              <div>
                <div className="tc-form-label text-muted-foreground mb-1">기본 자기신뢰도 (%)</div>
                <input type="number" min={0} max={99} className="tc-input w-full bg-muted rounded-xl px-3 py-2 text-foreground outline-none border border-transparent focus:border-primary/40" value={baseScore} onChange={e => setBaseScore(Number(e.target.value))} />
              </div>
              <button onClick={saveMeta} className="tc-btn w-full py-2.5 rounded-2xl bg-primary text-primary-foreground">저장</button>
            </div>
          ) : (
            <div className="space-y-2">
              {[
                { label: "목표 이름", value: activePhase.name },
                { label: "주요 목표", value: activePhase.mainGoal || "—" },
                { label: "기간", value: `${activePhase.startDate} ~ ${activePhase.endDate}` },
                { label: "기본 신뢰도", value: `${activePhase.baseScore}%` },
                { label: "우선순위", value: activePhase.priority.join(" › ") || "—" },
              ].map(item => (
                <div key={item.label} className="flex items-start justify-between py-1">
                  <span className="tc-settings-pts text-muted-foreground">{item.label}</span>
                  <span className="tc-settings-name text-foreground text-right max-w-[60%]">{item.value}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Basic habits */}
        <div>
          <div className="tc-chart-title text-foreground mb-3">기본 항목</div>
          <div className="space-y-2">
            {basicHabits.map(h => (
              <div key={h.id} className="flex items-center gap-3 bg-card border border-border rounded-2xl px-4 py-3">
                <div className="flex-1 min-w-0">
                  <div className="tc-settings-name text-foreground">{h.name}</div>
                  <div className="tc-settings-pts text-muted-foreground">{h.score}pt{h.options.length > 0 ? ` · ${h.options.length}옵션` : ""}</div>
                </div>
                <button onClick={() => setEditHabit(h)} className="p-1.5 text-muted-foreground/60"><Edit2 size={14} /></button>
                <button onClick={() => dispatch({ type: "DELETE_HABIT", habitId: h.id })} className="p-1.5 text-muted-foreground/40"><Trash2 size={14} /></button>
              </div>
            ))}
          </div>
          <button onClick={() => setEditHabit({ isBonus: false, order: basicHabits.length })} className="tc-btn-add mt-2 w-full py-3 rounded-2xl border border-dashed border-border text-muted-foreground flex items-center justify-center gap-2">
            <Plus size={14} /> 기본 항목 추가
          </button>
        </div>

        {/* Bonus habits */}
        <div>
          <div className="tc-chart-title text-foreground mb-3">보너스 항목</div>
          <div className="space-y-2">
            {bonusHabits.map(h => (
              <div key={h.id} className="flex items-center gap-3 bg-card border border-border rounded-2xl px-4 py-3">
                <div className="flex-1 min-w-0">
                  <div className="tc-settings-name text-foreground">{h.name}</div>
                  <div className="tc-settings-pts text-muted-foreground">+{h.score}pt (보너스){h.options.length > 0 ? ` · ${h.options.length}옵션` : ""}</div>
                </div>
                <button onClick={() => setEditHabit(h)} className="p-1.5 text-muted-foreground/60"><Edit2 size={14} /></button>
                <button onClick={() => dispatch({ type: "DELETE_HABIT", habitId: h.id })} className="p-1.5 text-muted-foreground/40"><Trash2 size={14} /></button>
              </div>
            ))}
          </div>
          <button onClick={() => setEditHabit({ isBonus: true, order: bonusHabits.length })} className="tc-btn-add mt-2 w-full py-3 rounded-2xl border border-dashed border-border text-muted-foreground flex items-center justify-center gap-2">
            <Plus size={14} /> 보너스 항목 추가
          </button>
        </div>

        {/* Quick links */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <div className="tc-chart-title text-foreground">빠른 링크</div>
            {(activePhase.links ?? []).length < 8 && (
              <button onClick={() => setEditLink("new")} className="tc-btn text-primary flex items-center gap-1">
                <Plus size={13} /> 추가
              </button>
            )}
          </div>
          <div className="space-y-2">
            {(activePhase.links ?? []).map(link => (
              <div key={link.id} className="flex items-center gap-3 bg-card border border-border rounded-2xl px-4 py-3">
                <span className="text-lg flex-shrink-0 w-7 text-center">{link.emoji}</span>
                <div className="flex-1 min-w-0">
                  <div className="tc-settings-name text-foreground truncate">{link.name}</div>
                  <div className="tc-settings-pts text-muted-foreground truncate">{link.url}</div>
                </div>
                <button onClick={() => setEditLink(link)} className="p-1.5 text-muted-foreground/60"><Edit2 size={14} /></button>
                <button onClick={() => dispatch({ type: "DELETE_LINK", phaseId: activePhase.id, linkId: link.id })} className="p-1.5 text-muted-foreground/40"><Trash2 size={14} /></button>
              </div>
            ))}
          </div>
          {(activePhase.links ?? []).length === 0 && (
            <button onClick={() => setEditLink("new")} className="tc-btn-add mt-2 w-full py-3 rounded-2xl border border-dashed border-border text-muted-foreground flex items-center justify-center gap-2">
              <Plus size={14} /> 링크 추가
            </button>
          )}
        </div>

        {/* Reset */}
        <button onClick={() => setShowReset(true)} className="tc-btn w-full py-3 rounded-2xl bg-muted text-destructive">
          모든 데이터 초기화
        </button>
      </div>

      {editLink !== null && (
        <AddLinkModal
          link={editLink === "new" ? undefined : editLink}
          onClose={() => setEditLink(null)}
          onSave={l => {
            if (editLink === "new") {
              dispatch({ type: "ADD_LINK", phaseId: activePhase.id, link: l });
            } else {
              dispatch({ type: "UPDATE_LINK", phaseId: activePhase.id, link: l });
            }
            setEditLink(null);
          }}
        />
      )}

      {editHabit !== null && (
        <HabitEditor
          habit={editHabit}
          onClose={() => setEditHabit(null)}
          onSave={h => {
            if (h.id && activePhase.habits.some(ah => ah.id === h.id)) {
              dispatch({ type: "UPDATE_HABIT", habit: h });
            } else {
              dispatch({ type: "ADD_HABIT", habit: h });
            }
            setEditHabit(null);
          }}
        />
      )}

      {showReset && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-foreground/30 backdrop-blur-sm px-6">
          <div className="bg-background rounded-3xl p-6 w-full max-w-sm">
            <div className="tc-modal-confirm-title text-foreground mb-2">모든 데이터를 초기화할까요?</div>
            <div className="tc-modal-body text-muted-foreground mb-6">초기화하면 모든 기록, 습관, 목표 데이터가 삭제돼요.</div>
            <div className="flex gap-3">
              <button onClick={() => setShowReset(false)} className="tc-btn flex-1 py-3 rounded-2xl bg-muted text-muted-foreground">취소</button>
              <button onClick={() => { dispatch({ type: "RESET_DATA" }); setShowReset(false); }} className="tc-btn flex-1 py-3 rounded-2xl bg-destructive text-destructive-foreground">초기화</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── BottomNav ────────────────────────────────────────────────────────────────

function BottomNav({ screen, onNavigate }: { screen: Screen; onNavigate: (s: Screen) => void; }) {
  const tabs: { screen: Screen; icon: React.ReactNode; label: string }[] = [
    { screen: "home", icon: <Home size={20} />, label: "홈" },
    { screen: "calendar", icon: <Calendar size={20} />, label: "캘린더" },
    { screen: "stats", icon: <BarChart2 size={20} />, label: "기록" },
    { screen: "phases", icon: <Target size={20} />, label: "목표" },
    { screen: "settings", icon: <Settings size={20} />, label: "설정" },
  ];
  return (
    <nav className="flex-shrink-0 bg-background/95 backdrop-blur-md border-t border-border">
      <div className="flex">
        {tabs.map(t => (
          <button key={t.screen} onClick={() => onNavigate(t.screen)}
            className={`flex-1 flex flex-col items-center py-3 gap-0.5 transition-all ${screen === t.screen ? "text-primary" : "text-muted-foreground/50"}`}>
            {t.icon}
            <span className="tc-nav-label">{t.label}</span>
          </button>
        ))}
      </div>
    </nav>
  );
}

// ─── App ──────────────────────────────────────────────────────────────────────

export default function App() {
  const [state, dispatch] = useReducer(appReducer, undefined, loadState);
  const [screen, setScreen] = useState<Screen>("home");

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  }, [state]);

  const activePhase = state.phases.find(p => p.id === state.activePhaseId) ?? state.phases[0];

  if (!activePhase) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background">
        <div className="text-center px-8">
          <div className="tc-app-title text-foreground mb-3">Trust Charge</div>
          <div className="tc-gauge-label text-muted-foreground mb-6">등록된 목표가 없어요</div>
          <button onClick={() => dispatch({ type: "RESET_DATA" })} className="tc-btn px-6 py-3 rounded-2xl bg-primary text-primary-foreground">
            기본 데이터로 시작
          </button>
        </div>
      </div>
    );
  }

  const safeState: AppState = { ...state, activePhaseId: activePhase.id };

  return (
    <div
      className="bg-background max-w-md mx-auto overflow-hidden flex flex-col"
      style={{ height: "100dvh" }}
    >
      <div key={screen} className="flex-1 min-h-0 flex flex-col">
        {screen === "home" && <HomeScreen state={safeState} dispatch={dispatch} onGoPhases={() => setScreen("phases")} />}
        {screen === "calendar" && <CalendarScreen state={safeState} dispatch={dispatch} />}
        {screen === "stats" && <StatsScreen state={safeState} />}
        {screen === "phases" && <PhaseScreen state={safeState} dispatch={dispatch} onGoHome={() => setScreen("home")} />}
        {screen === "settings" && <SettingsScreen state={safeState} dispatch={dispatch} />}
      </div>
      <BottomNav screen={screen} onNavigate={setScreen} />
    </div>
  );
}

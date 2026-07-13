import type { AppState, HabitOption, Phase, Retrospective } from "../types";

// 옵션: 노력/강도에 따라 점수 차등
const EXERCISE_OPT = (p: string): HabitOption[] => [
  { id: `${p}-e20`, label: "20분", score: 3 },
  { id: `${p}-e40`, label: "40분", score: 6 },
  { id: `${p}-e60`, label: "60분", score: 10 },
];
const READING_OPT = (p: string): HabitOption[] => [
  { id: `${p}-r10`, label: "10분", score: 2 },
  { id: `${p}-r30`, label: "30분", score: 4 },
  { id: `${p}-r60`, label: "60분", score: 6 },
];
const MEDITATION_OPT = (p: string): HabitOption[] => [
  { id: `${p}-m5`, label: "5분", score: 1 },
  { id: `${p}-m10`, label: "10분", score: 2 },
  { id: `${p}-m20`, label: "20분", score: 4 },
];
const LANGUAGE_OPT = (p: string): HabitOption[] => [
  { id: `${p}-l1`, label: "단어 암기", score: 2 },
  { id: `${p}-l2`, label: "리스닝", score: 3 },
  { id: `${p}-l3`, label: "리딩", score: 4 },
];

export const EMPTY_RETRO: Retrospective = { bestPoint: "", hardPoint: "", nextReflection: "" };

export const DEFAULT_PHASE_1: Phase = {
  id: "phase-health",
  name: "건강한 하루 만들기",
  startDate: "2026-07-01",
  endDate: "2026-09-30",
  mainGoal: "매일 운동하고 규칙적인 생활 습관 들이기",
  priority: ["운동", "수면", "물 마시기", "독서"],
  baseScore: 30,
  records: {},
  retrospective: EMPTY_RETRO,
  links: [
    { id: "p1-l1", emoji: "📓", name: "습관 기록 Notion", url: "https://notion.so" },
    { id: "p1-l2", emoji: "🏃", name: "운동 기록 앱", url: "https://example.com" },
    { id: "p1-l3", emoji: "📚", name: "읽고 싶은 책 목록", url: "https://example.com" },
  ],
  habits: [
    { id: "p1-exercise", name: "운동", score: 5, isBonus: false, enabled: true, order: 0, options: EXERCISE_OPT("p1") },
    { id: "p1-water", name: "물 8잔 마시기", score: 3, isBonus: false, enabled: true, order: 1, options: [] },
    { id: "p1-sleep", name: "7시간 이상 수면", score: 4, isBonus: false, enabled: true, order: 2, options: [] },
    { id: "p1-reading-b", name: "독서", score: 2, isBonus: true, enabled: true, order: 0, options: READING_OPT("p1") },
    { id: "p1-meditation-b", name: "명상", score: 1, isBonus: true, enabled: true, order: 1, options: MEDITATION_OPT("p1") },
  ],
};

export const DEFAULT_PHASE_2: Phase = {
  id: "phase-morning",
  name: "아침 루틴 정착하기",
  startDate: "2026-10-01",
  endDate: "2026-12-31",
  mainGoal: "일찍 일어나 나만의 루틴 완성하기",
  priority: ["기상", "운동", "독서", "저널"],
  baseScore: 30,
  records: {},
  retrospective: EMPTY_RETRO,
  links: [
    { id: "p2-l1", emoji: "☀️", name: "모닝 루틴 Notion", url: "https://notion.so" },
    { id: "p2-l2", emoji: "📖", name: "저널 앱", url: "https://example.com" },
    { id: "p2-l3", emoji: "🌍", name: "외국어 학습 앱", url: "https://example.com" },
  ],
  habits: [
    { id: "p2-wake", name: "아침 6시 기상", score: 5, isBonus: false, enabled: true, order: 0, options: [] },
    { id: "p2-stretch", name: "스트레칭", score: 3, isBonus: false, enabled: true, order: 1, options: EXERCISE_OPT("p2") },
    { id: "p2-plan", name: "하루 계획 세우기", score: 3, isBonus: false, enabled: true, order: 2, options: [] },
    { id: "p2-journal-b", name: "저널 쓰기", score: 2, isBonus: true, enabled: true, order: 0, options: [] },
    { id: "p2-language-b", name: "외국어 공부", score: 1, isBonus: true, enabled: true, order: 1, options: LANGUAGE_OPT("p2") },
  ],
};

export const DEFAULT_STATE: AppState = {
  phases: [DEFAULT_PHASE_1, DEFAULT_PHASE_2],
  activePhaseId: "phase-health",
};

export const APP_NAME = "Trust Charge";
export const APP_VERSION = "2.0";
export const APP_TAGLINE = "매일의 실천으로 채우는 자기 신뢰";

import type { AppState, HabitOption, Phase, Retrospective } from "../types";

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

export const EMPTY_RETRO: Retrospective = { bestPoint: "", hardPoint: "", nextReflection: "" };

export const DEFAULT_PHASE_1: Phase = {
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

export const DEFAULT_PHASE_2: Phase = {
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

export const DEFAULT_STATE: AppState = {
  phases: [DEFAULT_PHASE_1, DEFAULT_PHASE_2],
  activePhaseId: "phase-yoga",
};

export const APP_NAME = "Trust Charge";
export const APP_VERSION = "2.0";
export const APP_TAGLINE = "매일의 실천으로 채우는 자기 신뢰";

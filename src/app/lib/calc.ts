import { differenceInCalendarDays, eachDayOfInterval, format, isAfter, isBefore, isSameDay, parseISO } from "date-fns";
import type { Phase } from "../types";

export const makeId = () => `id-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
export const KO_DAYS = ["일", "월", "화", "수", "목", "금", "토"];

export function toKoDateStr(dateStr: string) {
  const d = parseISO(dateStr);
  return `${format(d, "yyyy년 M월 d일")} ${KO_DAYS[d.getDay()]}요일`;
}

export function isDateInRange(date: string, startDate: string, endDate: string): boolean {
  const d = parseISO(date);
  return !isBefore(d, parseISO(startDate)) && !isAfter(d, parseISO(endDate));
}

// 이 항목이 하루에 받을 수 있는 최대 점수
// 옵션이 있으면 옵션 중 최고 점수, 없으면 항목 자체 점수
export function habitMaxScore(h: { score: number; options: { score: number }[] }): number {
  if (h.options.length > 0) {
    return Math.max(...h.options.map(o => o.score));
  }
  return h.score;
}

// 이 항목이 오늘 실제로 획득한 점수 (선택한 옵션 기준)
export function habitEarnedScore(
  h: { score: number; options: { id: string; score: number }[] },
  rec: { checked: boolean; selectedOptionId: string } | undefined,
): number {
  if (!rec?.checked) return 0;
  if (h.options.length > 0) {
    // 옵션이 있는데 아직 선택 안 했으면 0점 (선택해야 점수 인정)
    if (!rec.selectedOptionId) return 0;
    const opt = h.options.find(o => o.id === rec.selectedOptionId);
    return opt ? opt.score : 0;
  }
  return h.score;
}

export function calcScore(phase: Phase, date: string): number {
  if (!isDateInRange(date, phase.startDate, phase.endDate)) return 0;
  const dayRec = phase.records[date] || {};
  const basicHabits = phase.habits.filter(h => h.enabled && !h.isBonus);
  const bonusHabits = phase.habits.filter(h => h.enabled && h.isBonus);
  // 기본 항목 최대치 = 각 항목의 최고 옵션 점수 합
  const totalBasicPts = basicHabits.reduce((s, h) => s + habitMaxScore(h), 0);

  let checkedBasicPts = 0;
  let checkedBonusPts = 0;

  for (const h of basicHabits) {
    checkedBasicPts += habitEarnedScore(h, dayRec[h.id]);
  }
  for (const h of bonusHabits) {
    checkedBonusPts += habitEarnedScore(h, dayRec[h.id]);
  }

  // 오늘 점수는 그날의 순수 달성률(0~100%) + 보너스.
  // 기본 신뢰도는 누적 게이지의 출발점으로만 쓰이고 하루 점수에는 더하지 않는다.
  const basicPct = totalBasicPts > 0 ? (checkedBasicPts / totalBasicPts) * 100 : 0;
  return parseFloat((basicPct + checkedBonusPts).toFixed(2));
}

export function calcTotalProgress(phase: Phase): number {
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
    const totalBasicPts = basicHabits.reduce((s, h) => s + habitMaxScore(h), 0);
    let checkedBasicPts = 0;
    let checkedBonusPts = 0;
    for (const h of basicHabits) {
      checkedBasicPts += habitEarnedScore(h, dayRec[h.id]);
    }
    for (const h of bonusHabits) {
      checkedBonusPts += habitEarnedScore(h, dayRec[h.id]);
    }
    const dayFraction = totalBasicPts > 0 ? checkedBasicPts / totalBasicPts : 0;
    // 보너스도 하루치 비중으로 환산해서 더한다.
    // (매일 2P씩 전 기간 받으면 최종 +2% → 하루 점수 102%와 눈금이 맞음)
    accumulated += dayFraction * perDayMax + checkedBonusPts / totalDays;
  }
  return parseFloat((phase.baseScore + accumulated).toFixed(2));
}

export interface DayStatus {
  score: number;
  isFullDay: boolean;
  isPast: boolean;
  isToday: boolean;
  isFuture: boolean;
}

export function getDayStatus(phase: Phase, date: string): DayStatus {
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

export function getPhaseStatus(phase: Phase): "active" | "upcoming" | "completed" {
  const today = new Date();
  const start = parseISO(phase.startDate);
  const end = parseISO(phase.endDate);
  if (isAfter(today, end)) return "completed";
  if (isBefore(today, start)) return "upcoming";
  return "active";
}

export function getDday(phase: Phase): { label: string; suffix: string } {
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

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

export function calcScore(phase: Phase, date: string): number {
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

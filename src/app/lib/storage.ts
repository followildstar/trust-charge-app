import { format, parseISO } from "date-fns";
import { KO_DAYS, calcScore } from "./calc";
import { APP_NAME, APP_VERSION, DEFAULT_STATE, EMPTY_RETRO } from "./defaults";
import type { AppState } from "../types";

export const STORAGE_KEY = "trust-charge-v2";

export function loadState(): AppState {
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
          // 옵션에 score가 없던 옛 데이터는 항목 점수로 채워 NaN 방지
          habits: (p.habits ?? []).map(h => ({
            ...h,
            options: (h.options ?? []).map(o => ({
              ...o,
              score: typeof o.score === "number" ? o.score : h.score,
            })),
          })),
        })),
      };
    }
  } catch {}
  return DEFAULT_STATE;
}

export function downloadFile(filename: string, content: string, mime: string) {
  const blob = new Blob([content], { type: mime });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

export function exportStateAsJson(state: AppState) {
  const stamp = format(new Date(), "yyyyMMdd");
  const payload = { app: APP_NAME, version: APP_VERSION, exportedAt: new Date().toISOString(), data: state };
  downloadFile(`trust-charge-backup-${stamp}.json`, JSON.stringify(payload, null, 2), "application/json");
}

// 모든 Phase의 일별 기록을 하나의 표로 펼친 CSV
export function exportStateAsCsv(state: AppState) {
  const stamp = format(new Date(), "yyyyMMdd");
  const rows: string[][] = [["목표", "날짜", "요일", "자기신뢰도(%)", "완료한 항목", "체크수"]];

  for (const phase of state.phases) {
    const dates = Object.keys(phase.records).sort();
    for (const date of dates) {
      const dayRec = phase.records[date] || {};
      const checkedHabits = phase.habits
        .filter(h => dayRec[h.id]?.checked)
        .map(h => h.name);
      const score = calcScore(phase, date);
      const koWeekday = KO_DAYS[parseISO(date).getDay()];
      rows.push([
        phase.name,
        date,
        koWeekday,
        score.toFixed(2),
        checkedHabits.join(" | "),
        String(checkedHabits.length),
      ]);
    }
  }

  // CSV 이스케이프 + Excel 한글 깨짐 방지용 BOM
  const csv = rows
    .map(r => r.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(","))
    .join("\n");
  downloadFile(`trust-charge-records-${stamp}.csv`, "\uFEFF" + csv, "text/csv;charset=utf-8");
}

// 업로드된 JSON 파일을 읽어 AppState로 검증·반환 (실패 시 Error throw)
export function parseBackupFile(file: File): Promise<AppState> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const parsed = JSON.parse(String(reader.result));
        // export 형식({ app, version, data }) 또는 순수 상태 둘 다 허용
        const candidate = parsed?.data ?? parsed;
        if (
          !candidate ||
          !Array.isArray(candidate.phases) ||
          candidate.phases.length === 0 ||
          typeof candidate.activePhaseId !== "string"
        ) {
          reject(new Error("올바른 백업 파일이 아니에요."));
          return;
        }
        // 최소한의 구조 검증: 각 phase에 id/name/habits/records가 있는지
        const ok = candidate.phases.every(
          (p: any) =>
            typeof p?.id === "string" &&
            typeof p?.name === "string" &&
            Array.isArray(p?.habits) &&
            p?.records && typeof p.records === "object"
        );
        if (!ok) {
          reject(new Error("백업 파일의 목표 데이터가 손상됐어요."));
          return;
        }
        resolve(candidate as AppState);
      } catch {
        reject(new Error("파일을 읽을 수 없어요. JSON 형식인지 확인해 주세요."));
      }
    };
    reader.onerror = () => reject(new Error("파일을 읽는 중 오류가 발생했어요."));
    reader.readAsText(file);
  });
}

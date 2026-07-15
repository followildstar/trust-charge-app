import { DEFAULT_STATE, EMPTY_RETRO } from "./defaults";
import type { Action, AppState, Phase } from "../types";

export function updateActivePhase(state: AppState, updater: (p: Phase) => Phase): AppState {
  return {
    ...state,
    phases: state.phases.map(p => p.id === state.activePhaseId ? updater(p) : p),
  };
}

export function updatePhase(state: AppState, phaseId: string, updater: (p: Phase) => Phase): AppState {
  return {
    ...state,
    phases: state.phases.map(p => p.id === phaseId ? updater(p) : p),
  };
}

// phaseId가 주어지면 그 phase를, 없으면 활성 phase를 수정
export function updateTargetPhase(state: AppState, phaseId: string | undefined, updater: (p: Phase) => Phase): AppState {
  return updatePhase(state, phaseId ?? state.activePhaseId, updater);
}

export function appReducer(state: AppState, action: Action): AppState {
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
        const nextChecked = !hr.checked;
        // 체크를 끄면 골랐던 옵션도 초기화 (다시 켤 때 옵션부터 고르도록)
        const nextOptionId = nextChecked ? hr.selectedOptionId : "";
        return {
          ...phase,
          records: { ...phase.records, [action.date]: { ...dayRec, [action.habitId]: { ...hr, checked: nextChecked, selectedOptionId: nextOptionId } } },
        };
      });

    case "SET_OPTION":
      return updateActivePhase(state, phase => {
        const dayRec = phase.records[action.date] || {};
        const hr = dayRec[action.habitId] || { checked: false, selectedOptionId: "" };
        // 옵션을 고르면 체크도 자동으로 켜고, "옵션 선택"(빈 값)으로 되돌리면 체크도 끈다
        const nextChecked = action.optionId !== "";
        return {
          ...phase,
          records: { ...phase.records, [action.date]: { ...dayRec, [action.habitId]: { ...hr, selectedOptionId: action.optionId, checked: nextChecked } } },
        };
      });

    case "ADD_HABIT":
      return updateTargetPhase(state, action.phaseId, phase => ({ ...phase, habits: [...phase.habits, action.habit] }));

    case "UPDATE_HABIT":
      return updateTargetPhase(state, action.phaseId, phase => ({
        ...phase,
        habits: phase.habits.map(h => h.id === action.habit.id ? action.habit : h),
      }));

    case "DELETE_HABIT":
      return updateTargetPhase(state, action.phaseId, phase => ({
        ...phase,
        habits: phase.habits.filter(h => h.id !== action.habitId),
      }));

    case "REORDER_HABITS":
      // 같은 그룹(기본 or 보너스) 안에서만 순서를 재배치.
      // orderedIds 순서대로 order 값을 0,1,2...로 다시 매긴다.
      return updateTargetPhase(state, action.phaseId, phase => {
        const orderMap = new Map(action.orderedIds.map((id, i) => [id, i]));
        return {
          ...phase,
          habits: phase.habits.map(h =>
            h.isBonus === action.isBonus && orderMap.has(h.id)
              ? { ...h, order: orderMap.get(h.id)! }
              : h
          ),
        };
      });

    case "SET_DATE_RANGE":
      return updateTargetPhase(state, action.phaseId, phase => ({
        ...phase, startDate: action.startDate, endDate: action.endDate,
      }));

    case "SET_BASE_SCORE":
      return updateTargetPhase(state, action.phaseId, phase => ({ ...phase, baseScore: action.score }));

    case "SET_PHASE_META":
      return updateTargetPhase(state, action.phaseId, phase => ({
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

    case "IMPORT_DATA": {
      // 업로드된 상태로 완전 교체 (신규 필드 백필로 안전하게)
      const imported = action.state;
      const phases = imported.phases.map(p => ({
        ...p,
        links: p.links ?? [],
        retrospective: p.retrospective ?? EMPTY_RETRO,
        habits: (p.habits ?? []).map(h => ({
          ...h,
          options: (h.options ?? []).map(o => ({
            ...o,
            score: typeof o.score === "number" ? o.score : h.score,
          })),
        })),
      }));
      const activeExists = phases.some(p => p.id === imported.activePhaseId);
      return {
        phases,
        activePhaseId: activeExists ? imported.activePhaseId : phases[0].id,
      };
    }

    default:
      return state;
  }
}

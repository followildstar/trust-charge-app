import { useReducer, useState, useEffect } from "react";

import type { AppState, Screen } from "./types";
import { appReducer } from "./lib/reducer";
import { loadState, STORAGE_KEY } from "./lib/storage";

import { BottomNav } from "./components/BottomNav";
import { HomeScreen } from "./screens/HomeScreen";
import { CalendarScreen } from "./screens/CalendarScreen";
import { StatsScreen } from "./screens/StatsScreen";
import { PhaseScreen } from "./screens/PhaseScreen";
import { SettingsScreen } from "./screens/SettingsScreen";

export default function App() {
  const [state, dispatch] = useReducer(appReducer, undefined, loadState);
  const [screen, setScreen] = useState<Screen>("home");

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  }, [state]);

  const activePhase = state.phases.find(p => p.id === state.activePhaseId) ?? state.phases[0];

  if (!activePhase) {
    return (
      <div className="app-empty">
        <div className="app-empty-body">
          <div className="app-empty-title">Trust Charge</div>
          <div className="app-empty-caption">등록된 목표가 없어요</div>
          <button onClick={() => dispatch({ type: "RESET_DATA" })} className="btn-primary-pad">
            기본 데이터로 시작
          </button>
        </div>
      </div>
    );
  }

  const safeState: AppState = { ...state, activePhaseId: activePhase.id };

  return (
    <div
      className="app-shell"
      style={{ height: "100dvh" }}
    >
      <div key={screen} className="app-viewport">
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

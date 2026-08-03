import { useReducer, useState, useEffect } from "react";
import type { AppState, Screen } from "./types";
import { appReducer } from "./lib/reducer";
import { loadState, STORAGE_KEY } from "./lib/storage";
import { BottomNav } from "./components/BottomNav";
import { Toast } from "./components/Toast";
import { Splash, shouldShowSplash } from "./components/Splash";
import { HomeScreen } from "./screens/HomeScreen";
import { CalendarScreen } from "./screens/CalendarScreen";
import { StatsScreen } from "./screens/StatsScreen";
import { PhaseScreen } from "./screens/PhaseScreen";
import { SettingsScreen } from "./screens/SettingsScreen";

// 테스트 모드
const TEST_MODE = true;

export default function App() {
  const [state, dispatch] = useReducer(appReducer, undefined, loadState);
  const [screen, setScreen] = useState<Screen>("home");
  const [toast, setToast] = useState<string | null>(null);
  // TEST_MODE 또는 shouldShowSplash() 결과에 따라
  const [showSplash, setShowSplash] = useState(() => TEST_MODE || shouldShowSplash());
  const [targetPhaseId, setTargetPhaseId] = useState<string | null>(null);
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  }, [state]);

  // 일반 탭 이동(바텀 네비 등): 목표 상세 딥링크는 초기화
  function navigateTo(next: Screen) {
    setTargetPhaseId(null);
    setScreen(next);
  }

  // 홈 화면에서 특정 목표의 상세(편집) 화면으로 바로 이동
  function goToPhaseDetail(phaseId: string) {
    setTargetPhaseId(phaseId);
    setScreen("phases");
  }

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
        {screen === "home" && (
          <HomeScreen
            state={safeState}
            dispatch={dispatch}
            onGoPhases={phaseId => (phaseId ? goToPhaseDetail(phaseId) : navigateTo("phases"))}
            onToast={setToast}
          />
        )}
        {screen === "calendar" && <CalendarScreen state={safeState} dispatch={dispatch} onToast={setToast} />}
        {screen === "stats" && <StatsScreen state={safeState} />}
        {screen === "phases" && (
          <PhaseScreen
            state={safeState}
            dispatch={dispatch}
            onGoHome={() => navigateTo("home")}
            initialDetailPhaseId={targetPhaseId}
          />
        )}
        {screen === "settings" && <SettingsScreen state={safeState} dispatch={dispatch} onToast={setToast} />}
      </div>
      <BottomNav screen={screen} onNavigate={navigateTo} />
      {toast && <Toast message={toast} onDone={() => setToast(null)} />}
      {showSplash && <Splash onDone={() => setShowSplash(false)} />}
    </div>
  );
}

import type * as React from "react";
import { BarChart2, Calendar, Home, Settings, Target } from "lucide-react";
import type { Screen } from "../types";

export function BottomNav({ screen, onNavigate }: { screen: Screen; onNavigate: (s: Screen) => void; }) {
  const tabs: { screen: Screen; icon: React.ReactNode; label: string }[] = [
    { screen: "home", icon: <Home size={20} />, label: "홈" },
    { screen: "calendar", icon: <Calendar size={20} />, label: "캘린더" },
    { screen: "stats", icon: <BarChart2 size={20} />, label: "기록" },
    { screen: "phases", icon: <Target size={20} />, label: "목표" },
    { screen: "settings", icon: <Settings size={20} />, label: "설정" },
  ];
  return (
    <nav className="bottom-nav">
      <div className="nav-row">
        {tabs.map(t => (
          <button key={t.screen} onClick={() => onNavigate(t.screen)}
            className={`nav-item${screen === t.screen ? " is-active" : ""}`}>
            {t.icon}
            <span className="nav-label">{t.label}</span>
          </button>
        ))}
      </div>
    </nav>
  );
}

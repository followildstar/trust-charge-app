import { useEffect, useState } from "react";
import splashImage from "../assets/splash.png"; // 이미지 경로에 맞게 수정

// 하루 한 번만 스플래시를 보여주기 위한 저장 키
const SPLASH_KEY = "trust-charge-splash-date";

// 테스트 모드: true로 설정하면 매번 스플래시 표시
const TEST_MODE = true;

// 오늘 이미 스플래시를 봤는지
export function shouldShowSplash(): boolean {
  if (TEST_MODE) return true;
  
  try {
    const today = new Date().toDateString();
    return localStorage.getItem(SPLASH_KEY) !== today;
  } catch {
    return true;
  }
}

function markSplashSeen() {
  try {
    localStorage.setItem(SPLASH_KEY, new Date().toDateString());
  } catch {}
}

export function Splash({ onDone }: { onDone: () => void }) {
  const [phase, setPhase] = useState<"in" | "out">("in");

  useEffect(() => {
    markSplashSeen();
    const outTimer = setTimeout(() => setPhase("out"), 1400);
    const doneTimer = setTimeout(onDone, 1800);

    return () => {
      clearTimeout(outTimer);
      clearTimeout(doneTimer);
    };
  }, [onDone]);

  return (
    <div className={`splash${phase === "out" ? " is-out" : ""}`}>
      <div className="splash-inner">
        <img src={splashImage} alt="splash" className="splash-image" />
      </div>
    </div>
  );
}

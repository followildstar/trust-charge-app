import { useEffect, useState } from "react";
import { APP_NAME, APP_TAGLINE } from "../lib/defaults";
import { Image } from 'react-native';
// import splashImage from "../assets/splash.jpg"; 

// 하루 한 번만 스플래시를 보여주기 위한 저장 키
const SPLASH_KEY = "trust-charge-splash-date";

// 테스트 모드: true로 설정하면 매번 스플래시 표시
const TEST_MODE = true;

// 오늘 이미 스플래시를 봤는지
export function shouldShowSplash(): boolean {
  if (TEST_MODE) return true; // 항상 표시
  
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
  // in → hold → out 단계
  const [phase, setPhase] = useState<"in" | "out">("in");

  useEffect(() => {
    markSplashSeen();
    // 1.4초 표시(페이드인+유지) 후 페이드아웃 시작
    const outTimer = setTimeout(() => setPhase("out"), 1400);
    // 페이드아웃(0.4초) 끝나면 완전히 제거
    const doneTimer = setTimeout(onDone, 1800);

    return () => {
      clearTimeout(outTimer);
      clearTimeout(doneTimer);
    };
  }, [onDone]);

  return (
    <div className={`splash${phase === "out" ? " is-out" : ""}`}>
      <div className="splash-inner">
        <div className="splash-name">안녕?</div>
        <div className="splash-tagline">{APP_TAGLINE}</div>
         <Image
      source={require('../assets/splash.jpg')}
      style={{
        width: 120
      }}
    />
      </div>
    </div>
  );
}

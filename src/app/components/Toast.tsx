import { useEffect } from "react";
import { Check } from "lucide-react";

export function Toast({ message, onDone, duration = 2200 }: { message: string; onDone: () => void; duration?: number; }) {
  useEffect(() => {
    const t = setTimeout(onDone, duration);
    return () => clearTimeout(t);
  }, [message]);

  return (
    <div className="toast-wrap">
      <div className="toast">
        <Check size={15} strokeWidth={2.5} className="toast-icon" />
        <span className="toast-text">{message}</span>
      </div>
    </div>
  );
}

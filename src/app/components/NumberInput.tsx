import { useState, useEffect } from "react";

/**
 * 숫자 입력 필드.
 * - 입력 중에는 문자열을 그대로 유지해 "0이 안 지워지는" 현상을 없앤다.
 * - 부모에는 항상 숫자(value)를 전달한다.
 * - 포커스가 빠질 때(blur) min/max 범위로 정규화한다.
 */
export function NumberInput({
  value, onChange, min, max, className, placeholder,
}: {
  value: number;
  onChange: (n: number) => void;
  min?: number;
  max?: number;
  className?: string;
  placeholder?: string;
}) {
  // 화면에 보이는 문자열 (빈 값·중간 입력 허용)
  const [text, setText] = useState<string>(String(value));

  // 외부 value가 바뀌면(다른 목표 선택 등) 화면도 동기화
  useEffect(() => {
    setText(String(value));
  }, [value]);

  function handleChange(raw: string) {
    // 숫자와 빈 문자열만 허용
    if (raw === "" || /^[0-9]+$/.test(raw)) {
      setText(raw);
      if (raw !== "") {
        onChange(Number(raw));
      }
    }
  }

  function handleBlur() {
    let n = text === "" ? (min ?? 0) : Number(text);
    if (min !== undefined && n < min) n = min;
    if (max !== undefined && n > max) n = max;
    setText(String(n));
    onChange(n);
  }

  return (
    <input
      type="text"
      inputMode="numeric"
      pattern="[0-9]*"
      className={className}
      placeholder={placeholder}
      value={text}
      onChange={e => handleChange(e.target.value)}
      onBlur={handleBlur}
    />
  );
}

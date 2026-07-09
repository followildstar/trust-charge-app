# Trust Charge - Tailwind CSS → Pure CSS 마이그레이션 가이드

## 🎯 개요

Tailwind CSS 기반 프로젝트를 **순수 CSS(Pure CSS) + CSS 커스텀 프로퍼티**로 완전히 변환했습니다.

- **변환 방식**: A. CSS 커스텀 프로퍼티 + 하나의 globals.css
- **파일 구조**: 간결하고 관리 용이
- **스타일 수정**: 이제 CSS 파일에서 직접 가능

---

## 📋 파일 구조

### 변환된 파일들

```
src/
├── App.tsx              (React 컴포넌트 - 변경 없음, className 그대로 사용)
├── index.css            (수정됨 - globals.css 임포트만 포함)
├── globals.css          (NEW - 모든 스타일 통합)
├── package.json         (참고용)
└── vite.config.ts       (참고용)
```

### 제거된 파일들

```
❌ tailwind.css          (Tailwind 설정 - 더 이상 필요 없음)
❌ theme.css             (CSS 변수 - globals.css에 통합)
❌ typography.css        (타이포그래피 - globals.css에 통합)
❌ fonts.css             (폰트 임포트 - globals.css에 통합)
❌ globals.css (기존)    (비어있던 파일 - 새로운 파일로 대체)
```

---

## 🔄 변환 내용

### 1️⃣ **CSS 커스텀 프로퍼티 (Design Tokens)**

**colors, spacing, typography**가 모두 CSS 변수로 정의됨:

```css
:root {
  --background: #FAF8F4;
  --foreground: #2C2824;
  --primary: #C4877D;
  --muted: #F4EFE6;
  /* ... 등등 */
}
```

**사용 방법**:
```css
.my-element {
  background-color: var(--primary);
  color: var(--foreground);
}
```

### 2️⃣ **Tailwind 유틸리티 클래스 → CSS**

**Tailwind 클래스**:
```html
<div className="flex items-center justify-between gap-3 p-4 bg-card rounded-2xl">
```

**Pure CSS 클래스** (globals.css에 이미 정의됨):
```css
.flex { display: flex; }
.items-center { align-items: center; }
.justify-between { justify-content: space-between; }
.gap-3 { gap: 0.75rem; }
.p-4 { padding: 1rem; }
.bg-card { background-color: var(--card); }
.rounded-2xl { border-radius: 1rem; }
```

**App.tsx는 변경 없음** - className 그대로 사용 가능! ✨

### 3️⃣ **타이포그래피 클래스**

모든 폰트, 크기, 무게 관련 스타일이 클래스로 정의:

```html
<h1 className="tc-app-title text-foreground">Trust Charge</h1>
<p className="tc-section-label text-muted-foreground">오늘의 충전</p>
```

```css
.tc-app-title {
  font-family: 'Montserrat', 'Noto Sans KR', sans-serif;
  font-weight: 700;
  font-size: 1.5rem;
  letter-spacing: -0.01em;
}

.tc-section-label {
  font-family: 'Roboto', 'Noto Sans KR', sans-serif;
  font-weight: 500;
  font-size: 0.625rem;
  letter-spacing: 0.12em;
  text-transform: uppercase;
}
```

---

## ✅ 설정 방법

### Step 1: 파일 복사

받은 파일들을 프로젝트에 복사:

```bash
# src/ 디렉토리에 복사
cp App.tsx src/
cp globals.css src/
cp index.css src/
```

### Step 2: vite.config.ts 수정 (선택사항)

Tailwind 플러그인을 제거할 수 있음:

```typescript
// Before
export default defineConfig({
  plugins: [
    figmaAssetResolver(),
    react(),
    tailwindcss(),  // ← 제거 가능 (하지만 두어도 됨)
  ],
  // ...
});

// After
export default defineConfig({
  plugins: [
    figmaAssetResolver(),
    react(),
    // tailwindcss() 제거 가능
  ],
  // ...
});
```

### Step 3: package.json 의존성 정리 (선택사항)

`tailwindcss` 관련 패키지 제거 가능:

```bash
# Tailwind 제거
npm uninstall tailwindcss @tailwindcss/vite

# 또는 그대로 두어도 됨 (사용하지 않기만 하면 됨)
```

### Step 4: 앱 시작

```bash
npm run dev
# 또는
yarn dev
```

---

## 🎨 스타일 수정하기

### 색상 변경

`globals.css`의 `:root` 섹션에서 수정:

```css
:root {
  --primary: #C4877D;  /* ← 여기서 변경 */
  --muted: #F4EFE6;
  /* ... */
}
```

**변경하면 모든 `.bg-primary`, `.text-primary` 등에 자동 적용됨.**

### 새 유틸리티 클래스 추가

`globals.css` 끝에 추가:

```css
.my-custom-class {
  display: flex;
  gap: 1rem;
  padding: 2rem;
  border-radius: 1.5rem;
}
```

그 후 App.tsx에서 사용:

```html
<div className="my-custom-class">...</div>
```

### 특정 컴포넌트 스타일 오버라이드

```css
/* globals.css에 추가 */
.habit-card.checked {
  background-color: var(--muted);
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
}
```

---

## 🔍 구조 설명

### globals.css 섹션별 구성

```css
/* 1. 폰트 임포트 */
@import url('...');

/* 2. CSS 커스텀 프로퍼티 */
:root { --color-...; }

/* 3. 기본 타이포그래피 */
body { ... }
.tc-app-title { ... }

/* 4. 레이아웃 유틸리티 */
.flex { display: flex; }
.gap-3 { gap: 0.75rem; }

/* 5. 사이징 유틸리티 */
.w-full { width: 100%; }
.max-w-md { max-width: 28rem; }

/* 6. 간격 유틸리티 */
.p-4 { padding: 1rem; }
.mb-3 { margin-bottom: 0.75rem; }

/* 7. 컬러 유틸리티 */
.bg-primary { background-color: var(--primary); }
.text-foreground { color: var(--foreground); }

/* 8. 위치 지정 */
.relative { position: relative; }
.fixed { position: fixed; }

/* 9. 상태 & 이펙트 */
.transition-all { transition: all 150ms ease; }
.hover:hover { ... }

/* 10. 폼 요소 */
input, select, textarea { ... }

/* 11. 스크롤바 커스텀 */
::-webkit-scrollbar { ... }
```

---

## ⚡ 주요 변경점

| 항목 | Before (Tailwind) | After (Pure CSS) |
|------|------------------|-----------------|
| 임포트 | `@tailwind` 디렉티브 | `@import './globals.css'` |
| 색상 정의 | Tailwind config | CSS 변수 (`:root`) |
| 클래스 정의 | Tailwind 제너레이터 | 수동 CSS 클래스 |
| 빌드 설정 | `tailwindcss` 플러그인 필수 | 플러그인 불필요 |
| 파일 크기 | 상황에 따라 큼 | 더 작고 간결함 |
| 커스텀 용이성 | 제한적 | 자유로움 ✨ |

---

## 🎯 추가 팁

### 1. 미디어 쿼리 추가

```css
@media (max-width: 640px) {
  .my-element {
    padding: 0.5rem;
  }
}
```

### 2. 다크 모드 지원

```css
@media (prefers-color-scheme: dark) {
  :root {
    --background: #1A1A1A;
    --foreground: #FFFFFF;
  }
}
```

### 3. 성능 최적화

- **필요한 클래스만 사용**: 사용하지 않는 클래스는 제거 가능
- **CSS 축소**: 빌드 시 CSS 자동 축소됨
- **캐싱**: 색상 변경 시에도 JS 캐시 영향 최소

---

## ❓ FAQ

**Q: Tailwind는 어디에 갔나요?**
A: 제거했습니다. 모든 스타일이 순수 CSS로 변환되었으므로 Tailwind는 필요 없습니다.

**Q: className 속성을 변경해야 하나요?**
A: 아니요! 그대로 두세요. CSS에서 모든 Tailwind 클래스가 정의되어 있습니다.

**Q: 새로운 색상을 추가하려면?**
A: `globals.css`의 `:root`에 CSS 변수를 추가하고, 필요한 클래스를 만들면 됩니다.

**Q: 성능은 어떻게 되나요?**
A: Pure CSS가 일반적으로 더 빠릅니다. Tailwind 파서 오버헤드가 없기 때문입니다.

---

## 📞 문제 해결

### 스타일이 적용되지 않음

1. **globals.css 임포트 확인**: `index.css`에서 import 되어 있는지 확인
2. **캐시 초기화**: 브라우저 개발자 도구 → 캐시 비우기 → 새로고침
3. **클래스명 확인**: 오타가 없는지 확인

### 색상이 이상함

1. **CSS 변수 재정의**: `:root`에서 값 확인
2. **우선순위**: 더 구체적인 선택자가 우선됨

---

## 🎉 완료!

이제 깔끔한 Pure CSS 기반의 Trust Charge가 준비되었습니다.

언제든 CSS를 수정해서 원하는 대로 커스터마이징할 수 있어요.

**Happy Coding!** 🚀

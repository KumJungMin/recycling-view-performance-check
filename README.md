# recycling-view-performance-check

Virtual Scrolling 성능 벤치마크 프로젝트

## 기술 스택

- **TypeScript**: 타입 안정성을 위한 TypeScript 사용
- **Vite**: 빠른 개발 서버 및 빌드 도구
- **npm**: 패키지 관리

## 프로젝트 구조

```
├── src/
│   ├── core/
│   │   └── virtual-scroller.ts    # VirtualScroller 핵심 모듈
│   ├── pages/
│   │   ├── home.ts                # 홈 페이지
│   │   ├── full.ts                # Full Render 페이지
│   │   └── virtual.ts             # Virtual Scroller 페이지
│   ├── main.ts                    # 라우팅 및 메인 진입점
│   └── index.html                 # 메인 HTML
├── puppeteer-benchmark.ts         # 성능 벤치마크 스크립트
├── vite.config.ts                 # Vite 설정
└── tsconfig.json                  # TypeScript 설정
```

## 설치

```bash
npm install
```

## 개발 서버 실행

```bash
npm run dev
```

브라우저에서 `http://localhost:5173`로 접속하여 다음 페이지들을 확인할 수 있습니다:

- `/` - 홈 페이지
- `/full` - Full Render 테스트 (10,000개 아이템 전체 렌더링)
- `/virtual` - Virtual Scroller 테스트 (가상 스크롤링)

## 빌드

```bash
npm run build
```

## 성능 벤치마크 실행

개발 서버가 실행 중인 상태에서:

```bash
npm run benchmark
```

이 명령은 Puppeteer를 사용하여 두 페이지의 성능을 측정하고 결과를 출력합니다.

## 주요 기능

### VirtualScroller

`src/core/virtual-scroller.ts`에 구현된 VirtualScroller는:

- 대량의 데이터를 효율적으로 렌더링
- 보이는 영역의 아이템만 DOM에 렌더링
- 동적 높이 지원 (ResizeObserver 사용)
- 스크롤 성능 최적화

### 사용 예시

```typescript
import { VirtualScroller } from './core/virtual-scroller'

const container = document.getElementById('list')!
const data = Array.from({ length: 10000 }, (_, i) => ({
  text: `Item #${i + 1}`,
}))

const scroller = new VirtualScroller(container, {
  data,
  itemHeight: 40,
  itemClass: 'item',
  renderItem: (item) => item.text,
})
```

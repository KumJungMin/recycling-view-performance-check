export function renderHome(container: HTMLElement) {
  container.innerHTML = `
    <div style="text-align: center; padding: 40px 20px;">
      <h2>성능 벤치마크 테스트</h2>
      <p style="color: #666; margin: 20px 0;">
        위의 네비게이션을 사용하여 각 렌더링 방식을 비교해보세요.
      </p>
      <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); gap: 20px; margin-top: 40px;">
        <div style="padding: 20px; border: 1px solid #ddd; border-radius: 8px;">
          <h3>Full Render</h3>
          <p style="color: #666;">10,000개의 아이템을 모두 DOM에 렌더링합니다.</p>
          <a href="/full" style="display: inline-block; margin-top: 10px; padding: 8px 16px; background: #007bff; color: white; text-decoration: none; border-radius: 4px;">테스트 보기</a>
        </div>
        <div style="padding: 20px; border: 1px solid #ddd; border-radius: 8px;">
          <h3>Virtual Scroller</h3>
          <p style="color: #666;">가상 스크롤링을 사용하여 필요한 아이템만 렌더링합니다.</p>
          <a href="/virtual" style="display: inline-block; margin-top: 10px; padding: 8px 16px; background: #007bff; color: white; text-decoration: none; border-radius: 4px;">테스트 보기</a>
        </div>
      </div>
    </div>
  `
}


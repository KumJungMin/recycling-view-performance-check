export function renderFull(container: HTMLElement) {
  container.innerHTML = `
    <h3>Full Render (10,000 items)</h3>
    <div class="list" id="list" style="height: 600px; overflow-y: auto; border: 1px solid #ccc;"></div>
    <div style="margin-top: 20px; padding: 10px; background: #f0f0f0; border-radius: 4px;">
      <p><strong>성능 정보:</strong></p>
      <p id="performance-info">계산 중...</p>
    </div>
  `

  const list = document.getElementById('list')!
  const total = 10000
  const t0 = performance.now()

  for (let i = 0; i < total; i++) {
    const div = document.createElement('div')
    div.className = 'item'
    div.style.cssText = `
      height: 40px;
      border-bottom: 1px solid #eee;
      line-height: 40px;
      padding-left: 10px;
      background: ${i % 2 === 0 ? '#fafafa' : '#f0f0f0'};
    `
    div.textContent = `Full Item #${i + 1}`
    list.appendChild(div)
  }

  const t1 = performance.now()
  const renderTime = (t1 - t0).toFixed(2)
  
  const perfInfo = document.getElementById('performance-info')!
  const memoryInfo = (performance as any).memory
    ? `Used JS Heap: ${((performance as any).memory.usedJSHeapSize / 1024 / 1024).toFixed(2)} MB`
    : 'Memory info not available'
  
  perfInfo.innerHTML = `
    Full Render Time: <strong>${renderTime} ms</strong><br>
    ${memoryInfo}
  `
  
  console.log('Full Render Time:', renderTime, 'ms')
  if (memoryInfo !== 'Memory info not available') {
    console.log(memoryInfo)
  }
}


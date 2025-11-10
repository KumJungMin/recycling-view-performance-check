import { VirtualScroller } from '../core/virtual-scroller'

export function renderVirtual(container: HTMLElement) {
  container.innerHTML = `
    <h3>🚀 Virtual Scroller (10,000 items)</h3>
    <div class="list" id="list" style="height: 600px; overflow-y: auto; border: 1px solid #ccc; position: relative; overflow-x: hidden;"></div>
    <div style="margin-top: 20px; padding: 10px; background: #f0f0f0; border-radius: 4px;">
      <p><strong>Virtual Scrolling:</strong> 보이는 영역의 아이템만 렌더링하여 성능을 최적화합니다.</p>
    </div>
  `

  const listContainer = document.getElementById('list')!
  const data = Array.from({ length: 10000 }, (_, i) => ({
    text: `Item #${i + 1}`,
    index: i,
  }))

  new VirtualScroller(listContainer, {
    data,
    itemHeight: 40,
    itemClass: 'item',
    renderItem: (item) => {
      const div = document.createElement('div')
      div.style.cssText = `
        width: 100%;
        height: 40px;
        line-height: 40px;
        padding-left: 10px;
        border-bottom: 1px solid #eee;
        box-sizing: border-box;
        background: ${item.index % 2 === 0 ? '#fafafa' : '#f4f4f4'};
      `
      div.textContent = item.text
      return div
    },
  })
}


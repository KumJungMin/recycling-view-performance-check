import puppeteer from 'puppeteer'

const SERVER = 'http://localhost:5173'

interface Metrics {
  JSHeapUsedSize?: number
  Nodes?: number
  LayoutCount?: number
  ScriptDuration?: number
}

interface BenchmarkResult {
  label: string
  metrics: Metrics
  tracePath: string
}

async function measurePerformance(url: string, label: string): Promise<BenchmarkResult> {
  const browser = await puppeteer.launch({
    headless: true,
    defaultViewport: { width: 1280, height: 800 },
  })
  const page = await browser.newPage()
  const tracePath = `./trace-${label}.json`

  console.log(`▶ Measuring ${label}...`)

  await page.tracing.start({
    path: tracePath,
    categories: ['devtools.timeline', 'disabled-by-default-v8.cpu_profiler'],
  })

  await page.goto(url, { waitUntil: 'networkidle0' })

  // 초기 렌더링 완료 대기
  await new Promise((resolve) => setTimeout(resolve, 1000))

  await page.evaluate(async () => {
    // @ts-expect-error - 브라우저 컨텍스트에서는 타입 어노테이션 사용 불가
    const sleep = (ms) => new Promise((r) => setTimeout(r, ms))
    
    // .list 컨테이너 찾기
    const listContainer = document.querySelector('#list')
    if (!listContainer) {
      throw new Error('List container not found')
    }

    // 스크롤 컨테이너의 높이 확인
    const containerHeight = listContainer.clientHeight
    const scrollStep = containerHeight / 2

    // 여러 번 스크롤하여 성능 측정
    for (let i = 0; i < 10; i++) {
      listContainer.scrollBy(0, scrollStep)
      await sleep(300)
    }
    
    // 맨 위로 스크롤
    listContainer.scrollTo(0, 0)
    await sleep(300)
  })

  await page.tracing.stop()

  const metrics = await page.metrics()
  await browser.close()

  console.log(`✅ Trace saved: ${tracePath}`)
  return { label, metrics, tracePath }
}

async function run() {
  try {
    console.log('🚀 Starting performance benchmark...')
    console.log(`📡 Server: ${SERVER}\n`)

    const fullUrl = `${SERVER}/full`
    const virtualUrl = `${SERVER}/virtual`

    const full = await measurePerformance(fullUrl, 'full')
    const virtual = await measurePerformance(virtualUrl, 'virtual')

    console.log('\n📊 Performance Comparison:\n')
    console.table([
      {
        Type: 'Full Render',
        JSHeapUsedMB: full.metrics.JSHeapUsedSize
          ? (full.metrics.JSHeapUsedSize / 1024 / 1024).toFixed(2)
          : 'N/A',
        Nodes: full.metrics.Nodes ?? 'N/A',
        LayoutCount: full.metrics.LayoutCount ?? 'N/A',
        ScriptDuration: full.metrics.ScriptDuration
          ? full.metrics.ScriptDuration.toFixed(2) + ' ms'
          : 'N/A',
      },
      {
        Type: 'Virtual Scroll',
        JSHeapUsedMB: virtual.metrics.JSHeapUsedSize
          ? (virtual.metrics.JSHeapUsedSize / 1024 / 1024).toFixed(2)
          : 'N/A',
        Nodes: virtual.metrics.Nodes ?? 'N/A',
        LayoutCount: virtual.metrics.LayoutCount ?? 'N/A',
        ScriptDuration: virtual.metrics.ScriptDuration
          ? virtual.metrics.ScriptDuration.toFixed(2) + ' ms'
          : 'N/A',
      },
    ])

    console.log('\n📁 Trace files:')
    console.log(`   - ${full.tracePath}`)
    console.log(`   - ${virtual.tracePath}`)
    console.log('\n✅ Benchmark completed!')
  } catch (error) {
    console.error('❌ Benchmark failed:', error)
    process.exit(1)
  }
}

run()


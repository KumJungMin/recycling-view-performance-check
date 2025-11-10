import puppeteer from 'puppeteer'

const SERVER = 'http://localhost:5173'

async function measurePerformance(url, label) {
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

  // 초기 렌더링 안정화 대기
  await new Promise((resolve) => setTimeout(resolve, 1000))

  await page.evaluate(() => {
    function sleep(ms) {
      return new Promise((resolve) => setTimeout(resolve, ms))
    }

    const listContainer = document.querySelector('#list')
    if (!listContainer) throw new Error('List container not found')

    const containerHeight = listContainer.clientHeight
    const scrollStep = containerHeight / 2

    return (async () => {
      for (let i = 0; i < 10; i++) {
        listContainer.scrollBy(0, scrollStep)
        await sleep(300)
      }
      listContainer.scrollTo(0, 0)
      await sleep(300)
    })()
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

    const fullUrl = `${SERVER}/full.html`
    const virtualUrl = `${SERVER}/virtual.html`

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

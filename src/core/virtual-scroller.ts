export interface VirtualScrollerOptions<T = any> {
  itemHeight?: number
  buffer?: number
  renderItem?: (item: T) => string | HTMLElement
  emptyRenderer?: () => string
  itemClass?: string
  scrollTarget?: HTMLElement
  data?: T[]
}

export class VirtualScroller<T = any> {
  private config: Required<Omit<VirtualScrollerOptions<T>, 'scrollTarget' | 'data'>> & {
    scrollTarget: HTMLElement
    data: T[]
  }
  private container: HTMLElement
  private scrollTarget: HTMLElement
  private data: T[]
  private pool: HTMLElement[] = []
  private itemHeights = new Map<number, number>()
  private itemOffsets: number[] = []
  private rAFId: number | null = null
  private resizeObservers = new Map<HTMLElement, ResizeObserver>()
  private spacer!: HTMLElement
  private emptyElement?: HTMLElement

  constructor(container: HTMLElement, options: VirtualScrollerOptions<T> = {}) {
    if (!container) throw new Error('VirtualScroller: container is required.')

    const defaults = {
      itemHeight: 40,
      buffer: 3,
      renderItem: (item: T) => String((item as any)?.text ?? ''),
      emptyRenderer: () => '<div>No Data</div>',
      itemClass: '',
      scrollTarget: container,
      data: [],
    }

    this.config = { ...defaults, ...options } as typeof this.config
    this.container = container
    this.scrollTarget = this.config.scrollTarget
    this.data = this.config.data

    this._createSpacer()
    this._initPool()
    this._addScrollEvent()
    this.refresh()
  }

  /** 
   * Creates a spacer element to enable scrolling.
   * The spacer is a transparent element that occupies the total height of all items,
   * allowing the container to have a scrollbar.
   * */ 
  private _createSpacer() {
    this.spacer = document.createElement('div')
    this.spacer.style.cssText = `position: relative; width: 100%;`
    this.container.appendChild(this.spacer)
  }

  /** 
   * Initializes the pool of reusable item elements.
   * The pool size is determined by the number of items that can fit in the visible area plus a buffer.
   * Each item element is absolutely positioned within the container.
   * Each item is set will-change: transform for better performance during scrolling.
   * */ 
  private _initPool() {
    // using createDocumentFragment to add multiple elements at once for performance optimization
    const children = document.createDocumentFragment()
    const poolSize = this._calcVisibleCount() + this.config.buffer

    for (let i = 0; i < poolSize; i++) {
      const el = document.createElement('div')
      el.className = this.config.itemClass
      el.style.cssText = `
        position: absolute;
        top: 0;
        width: 100%;
        will-change: transform;
      `
      children.appendChild(el)
      this.pool.push(el)

      // Observe item size changes: in case item height changes dynamically
      this._observeResize(el) 
    }
    this.container.appendChild(children)
  }

  /** 
   * Calculates the number of items that can fit in the visible area of the container.
   * If the container height is not available, it falls back to a default calculation
   * based on the item height and a default count.
   * */ 
  private _calcVisibleCount(): number {
    const defaultFallbackCount = 10
    const containerHeight = this.container.clientHeight
    const h = containerHeight > 0 ? containerHeight : this.config.itemHeight * defaultFallbackCount

    return Math.ceil(h / this.config.itemHeight)
  }

  /** 
   * Adds a scroll event listener to the scroll target.
   * The scroll event is throttled using requestAnimationFrame to optimize performance.
   * passive is set to true for better scrolling performance.
   * (passive option indicates that the event listener will not call preventDefault() so the browser can optimize scrolling performance.)
   * */ 
  private _addScrollEvent() {
    this.scrollTarget.addEventListener('scroll', this._onScroll, { passive: true })
  }

  /** 
   * When a scroll event occurs, the next item rendered is scheduled using requestAnimationFrame.
   * This prevents multiple renders within a single frame, optimizing performance during rapid scrolling.
   * */
  private _onScroll = () => {
    if (this.rAFId != null) return
    
    this.rAFId = requestAnimationFrame(() => {
      this.render()
      this.rAFId = null
    })
  }

  /** 
   * Observes size changes of an item element using ResizeObserver.
   * When the size changes, updates the stored height and recalculates offsets.
   * */ 
  private _observeResize(el: HTMLElement) {
      const observer = new ResizeObserver(() => {
      const index = (el as any).__virtualIndex
      if (index == null) return

      const prev = this.itemHeights.get(index)
      const now = el.offsetHeight

      if (prev === undefined) {
        this.itemHeights.set(index, now)
        return
      }

      if (prev !== now) {
        this.itemHeights.set(index, now)
        this._updateOffsetsFrom(index)
        this.render()
      }
    })
    observer.observe(el)
    this.resizeObservers.set(el, observer)
  }

  /** 
   * Updates the offsets starting from a specific index.
   * This is useful when an item's height changes dynamically.
   */
  private _updateOffsetsFrom(startIndex: number) {
    if (startIndex < 0) return

    let offset = 0

    if (startIndex > 0) {
      const targetIndex = startIndex - 1
      const targetItemOffset = this.itemOffsets[targetIndex]
      const targetItemHeight = this.itemHeights.get(targetIndex) ?? this.config.itemHeight

      offset = targetItemOffset + targetItemHeight
    }

    for (let i = startIndex; i < this.data.length; i++) {
      this.itemOffsets[i] = offset
      offset += this.itemHeights.get(i) ?? this.config.itemHeight
    }
    this.spacer.style.height = `${offset}px`
  }

  /** 
   * For the scroll spacer, sets its height to the total height of all items.
   */
  private _updateOffsets() {
    let offset = 0

    this.itemOffsets = this.data.map((_, i) => {
      const h = this.itemHeights.get(i) ?? this.config.itemHeight
      const currentOffset = offset
      offset += h
      return currentOffset
    })
    this.spacer.style.height = `${offset}px`
  }

  render() {
    if (this.data.length === 0) {
      this._renderEmptyState()
      return
    }
    
    if (this.emptyElement) this.emptyElement.style.display = 'none'

    const scrollTop = this.scrollTarget.scrollTop
    const startIndex = this._findStartIndex(scrollTop)
    const endIndex = Math.min(this.data.length, startIndex + this.pool.length)

    for (let i = 0; i < this.pool.length; i++) {
      const itemIndex = startIndex + i
      const el = this.pool[i]

      if (itemIndex >= endIndex) {
        el.style.display = 'none'
        continue
      }

      el.style.display = 'block'
      ;(el as any).__virtualIndex = itemIndex

      const top = this.itemOffsets[itemIndex] ?? (itemIndex * this.config.itemHeight)
      el.style.transform = `translateY(${top}px)`

      const content = this.config.renderItem(this.data[itemIndex])
      if (content instanceof HTMLElement) {
        el.replaceChildren(content)
      } else {
        const contentStr = String(content ?? '')
        if (el.innerHTML !== contentStr) {
          el.innerHTML = contentStr
        }
      }
    }
  }

  private _renderEmptyState() {
    this.pool.forEach((el) => (el.style.display = 'none'))
    if (!this.emptyElement) {
      this.emptyElement = document.createElement('div')
      this.container.appendChild(this.emptyElement)
    }
    this.emptyElement.innerHTML = this.config.emptyRenderer()
    this.emptyElement.style.display = 'block'
  }

  /**
   * Finds the start index of the item that should be rendered based on the current scroll position.
   * Uses a binary search algorithm for efficient lookup.
   */
  private _findStartIndex(scrollTop: number): number {
    if (this.itemOffsets.length === 0) return 0

    let low = 0
    let high = this.itemOffsets.length - 1
    let startIndex = 0

    while (low <= high) {
      const mid = Math.floor((low + high) / 2)
      if (this.itemOffsets[mid] < scrollTop) {
        startIndex = mid + 1
        low = mid + 1
      } else {
        high = mid - 1
      }
    }
    return Math.max(0, startIndex - 1)
  }


  /**
   * Sets new data for the virtual scroller and refreshes the view.
   * Resets the scroll position to the top.
   */
  setData(newData: T[] = []) {
    this.data = newData
    this.itemHeights.clear()
    this.refresh()
    this.scrollTarget.scrollTop = 0
  }

  refresh() {
    this._updateOffsets()
    this.render()
  }

  scrollToIndex(index: number, behavior: ScrollBehavior = 'auto') {
    const top = this.itemOffsets[index] ?? (index * this.config.itemHeight)

    this.scrollTarget.scrollTo({ top, behavior })
  }

  destroy() {
    this.resizeObservers.forEach((observer) => observer.disconnect())
    this.resizeObservers.clear()

    this.scrollTarget.removeEventListener('scroll', this._onScroll)
    if (this.rAFId) cancelAnimationFrame(this.rAFId)

    this.container.innerHTML = ''
  }
}


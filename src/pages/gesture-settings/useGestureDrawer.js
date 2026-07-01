import { ref, computed } from 'vue'
import { MIN_POINTS } from './constants.js'

export function useGestureDrawer(options = {}) {
  const {
    canvasSize = ref(300),
    pointRadius = 28,
    gridRows = 3,
    gridCols = 3,
    minPoints = MIN_POINTS
  } = options

  const gesturePoints = ref([])
  const selectedPoints = ref([])
  const lines = ref([])
  const currentLine = ref(null)
  const isDrawing = ref(false)
  const hasError = ref(false)
  const hasSuccess = ref(false)
  const message = ref('')

  const padding = computed(() => Math.max(pointRadius + 12, 40))

  function initGesturePoints() {
    const size = typeof canvasSize === 'function' ? canvasSize() : (canvasSize.value || canvasSize)
    const pad = padding.value
    const usableSize = size - pad * 2
    const gapX = gridCols > 1 ? usableSize / (gridCols - 1) : 0
    const gapY = gridRows > 1 ? usableSize / (gridRows - 1) : 0

    const points = []
    for (let row = 0; row < gridRows; row++) {
      for (let col = 0; col < gridCols; col++) {
        points.push({
          x: pad + col * gapX,
          y: pad + row * gapY,
          index: row * gridCols + col
        })
      }
    }
    gesturePoints.value = points
  }

  function getPointFromEvent(event, padEl) {
    if (!padEl) return { index: -1, x: 0, y: 0 }

    const rect = padEl.getBoundingClientRect()
    let clientX, clientY

    if (event.touches && event.touches.length > 0) {
      clientX = event.touches[0].clientX
      clientY = event.touches[0].clientY
    } else if (event.changedTouches && event.changedTouches.length > 0) {
      clientX = event.changedTouches[0].clientX
      clientY = event.changedTouches[0].clientY
    } else {
      clientX = event.clientX
      clientY = event.clientY
    }

    const x = clientX - rect.left
    const y = clientY - rect.top

    for (let i = 0; i < gesturePoints.value.length; i++) {
      const point = gesturePoints.value[i]
      const distance = Math.sqrt(Math.pow(x - point.x, 2) + Math.pow(y - point.y, 2))
      if (distance <= pointRadius) {
        return { index: i, x, y }
      }
    }

    return { index: -1, x, y }
  }

  function addPoint(index) {
    const pointsArr = selectedPoints.value
    if (pointsArr.includes(index)) return

    pointsArr.push(index)

    if (pointsArr.length > 1) {
      const prevIndex = pointsArr[pointsArr.length - 2]
      const prevPoint = gesturePoints.value[prevIndex]
      const currPoint = gesturePoints.value[index]
      lines.value.push({
        x1: prevPoint.x,
        y1: prevPoint.y,
        x2: currPoint.x,
        y2: currPoint.y
      })
    }
  }

  function updateCurrentLine(x, y) {
    if (selectedPoints.value.length === 0) {
      currentLine.value = null
      return
    }

    const lastIndex = selectedPoints.value[selectedPoints.value.length - 1]
    const lastPoint = gesturePoints.value[lastIndex]
    currentLine.value = {
      x1: lastPoint.x,
      y1: lastPoint.y,
      x2: x,
      y2: y
    }
  }

  function startDrawing(event, padEl) {
    isDrawing.value = true
    hasError.value = false
    hasSuccess.value = false
    message.value = ''
    selectedPoints.value = []
    lines.value = []
    currentLine.value = null

    const result = getPointFromEvent(event, padEl)
    if (result.index !== -1) {
      addPoint(result.index)
      updateCurrentLine(result.x, result.y)
    }
  }

  function draw(event, padEl) {
    if (!isDrawing.value) return

    const result = getPointFromEvent(event, padEl)

    if (result.index !== -1 && !selectedPoints.value.includes(result.index)) {
      addPoint(result.index)
    }

    updateCurrentLine(result.x, result.y)
  }

  function endDrawing() {
    if (!isDrawing.value) return { complete: false }
    isDrawing.value = false
    currentLine.value = null

    if (selectedPoints.value.length < minPoints) {
      const errorMsg = `至少需要连接 ${minPoints} 个点位`
      hasError.value = true
      message.value = errorMsg
      return {
        complete: false,
        error: errorMsg,
        points: [...selectedPoints.value]
      }
    }

    return {
      complete: true,
      points: [...selectedPoints.value]
    }
  }

  function clear() {
    selectedPoints.value = []
    lines.value = []
    currentLine.value = null
    isDrawing.value = false
    hasError.value = false
    hasSuccess.value = false
    message.value = ''
  }

  function showError(msg) {
    hasError.value = true
    message.value = msg
  }

  function showSuccess(msg) {
    hasSuccess.value = true
    message.value = msg
  }

  initGesturePoints()

  return {
    gesturePoints,
    selectedPoints,
    lines,
    currentLine,
    isDrawing,
    hasError,
    hasSuccess,
    message,
    padding,
    initGesturePoints,
    getPointFromEvent,
    startDrawing,
    draw,
    endDrawing,
    addPoint,
    updateCurrentLine,
    clear,
    showError,
    showSuccess
  }
}

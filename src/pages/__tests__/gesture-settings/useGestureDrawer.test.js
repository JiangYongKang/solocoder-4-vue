import { describe, it, expect, beforeEach } from 'vitest'
import { ref } from 'vue'
import { useGestureDrawer } from '../../gesture-settings/useGestureDrawer.js'
import { MIN_POINTS } from '../../gesture-settings/constants.js'

function createMockPadEl(width = 300, height = 300) {
  return {
    getBoundingClientRect: () => ({
      left: 0,
      top: 0,
      width,
      height,
      right: width,
      bottom: height
    })
  }
}

function createMouseMoveEvent(x, y) {
  return {
    clientX: x,
    clientY: y,
    preventDefault: () => {}
  }
}

describe('useGestureDrawer', () => {
  let drawer
  let canvasSize

  beforeEach(() => {
    canvasSize = ref(300)
    drawer = useGestureDrawer({
      canvasSize,
      pointRadius: 28
    })
  })

  describe('initialization', () => {
    it('should initialize with correct default state', () => {
      expect(drawer.isDrawing.value).toBe(false)
      expect(drawer.hasError.value).toBe(false)
      expect(drawer.hasSuccess.value).toBe(false)
      expect(drawer.selectedPoints.value).toEqual([])
      expect(drawer.lines.value).toEqual([])
      expect(drawer.currentLine.value).toBeNull()
      expect(drawer.message.value).toBe('')
    })

    it('should initialize correct number of gesture points for 3x3 grid', () => {
      expect(drawer.gesturePoints.value).toHaveLength(9)
    })

    it('should calculate correct coordinates for corner points', () => {
      const points = drawer.gesturePoints.value
      expect(points[0].x).toBe(40)
      expect(points[0].y).toBe(40)
      expect(points[0].index).toBe(0)
      expect(points[2].x).toBe(260)
      expect(points[2].y).toBe(40)
      expect(points[6].x).toBe(40)
      expect(points[6].y).toBe(260)
      expect(points[8].x).toBe(260)
      expect(points[8].y).toBe(260)
    })

    it('should recalculate points when canvasSize changes', () => {
      canvasSize.value = 260
      drawer.initGesturePoints()
      const points = drawer.gesturePoints.value
      expect(points[0].x).toBe(40)
      expect(points[8].x).toBe(220)
    })

    it('should support custom grid dimensions', () => {
      const customDrawer = useGestureDrawer({
        canvasSize: 200,
        gridRows: 4,
        gridCols: 4,
        pointRadius: 20
      })
      expect(customDrawer.gesturePoints.value).toHaveLength(16)
    })
  })

  describe('initGesturePoints', () => {
    it('should recalculate points on demand', () => {
      canvasSize.value = 280
      drawer.initGesturePoints()
      const points = drawer.gesturePoints.value
      expect(points[4].x).toBe(140)
      expect(points[4].y).toBe(140)
    })
  })

  describe('getPointFromEvent', () => {
    let padEl

    beforeEach(() => {
      padEl = createMockPadEl(300, 300)
    })

    it('should detect point when click is within radius', () => {
      const event = createMouseMoveEvent(40, 40)
      const result = drawer.getPointFromEvent(event, padEl)
      expect(result.index).toBe(0)
    })

    it('should return -1 when click is not near any point', () => {
      const event = createMouseMoveEvent(150, 5)
      const result = drawer.getPointFromEvent(event, padEl)
      expect(result.index).toBe(-1)
    })

    it('should return correct x, y coordinates', () => {
      const event = createMouseMoveEvent(100, 150)
      const result = drawer.getPointFromEvent(event, padEl)
      expect(result.x).toBe(100)
      expect(result.y).toBe(150)
    })

    it('should return -1 when padEl is null', () => {
      const event = createMouseMoveEvent(40, 40)
      const result = drawer.getPointFromEvent(event, null)
      expect(result.index).toBe(-1)
      expect(result.x).toBe(0)
      expect(result.y).toBe(0)
    })

    it('should handle touch events with touches array', () => {
      const event = {
        touches: [{ clientX: 260, clientY: 260 }],
        preventDefault: () => {}
      }
      const result = drawer.getPointFromEvent(event, padEl)
      expect(result.index).toBe(8)
    })
  })

  describe('addPoint', () => {
    it('should add a point to selectedPoints', () => {
      drawer.addPoint(0)
      expect(drawer.selectedPoints.value).toEqual([0])
    })

    it('should not add duplicate points', () => {
      drawer.addPoint(0)
      drawer.addPoint(0)
      expect(drawer.selectedPoints.value).toEqual([0])
    })

    it('should create a line when second point is added', () => {
      drawer.addPoint(0)
      drawer.addPoint(4)
      expect(drawer.lines.value).toHaveLength(1)
      const line = drawer.lines.value[0]
      expect(line.x1).toBe(40)
      expect(line.y1).toBe(40)
      expect(line.x2).toBe(150)
      expect(line.y2).toBe(150)
    })

    it('should create consecutive lines for multiple points', () => {
      drawer.addPoint(0)
      drawer.addPoint(1)
      drawer.addPoint(2)
      expect(drawer.lines.value).toHaveLength(2)
    })
  })

  describe('updateCurrentLine', () => {
    it('should set currentLine to null when no points selected', () => {
      drawer.updateCurrentLine(100, 100)
      expect(drawer.currentLine.value).toBeNull()
    })

    it('should create line from last selected point to cursor', () => {
      drawer.addPoint(4)
      drawer.updateCurrentLine(200, 100)
      expect(drawer.currentLine.value).not.toBeNull()
      expect(drawer.currentLine.value.x1).toBe(150)
      expect(drawer.currentLine.value.y1).toBe(150)
      expect(drawer.currentLine.value.x2).toBe(200)
      expect(drawer.currentLine.value.y2).toBe(100)
    })
  })

  describe('drawing lifecycle', () => {
    let padEl

    beforeEach(() => {
      padEl = createMockPadEl(300, 300)
    })

    it('should start drawing and select first point', () => {
      const event = createMouseMoveEvent(40, 40)
      drawer.startDrawing(event, padEl)
      expect(drawer.isDrawing.value).toBe(true)
      expect(drawer.hasError.value).toBe(false)
      expect(drawer.hasSuccess.value).toBe(false)
      expect(drawer.selectedPoints.value).toEqual([0])
    })

    it('should clear previous state when starting new drawing', () => {
      drawer.hasError.value = true
      drawer.hasSuccess.value = true
      drawer.selectedPoints.value = [0, 1, 2]
      drawer.lines.value = [{ x1: 0, y1: 0, x2: 10, y2: 10 }]

      const event = createMouseMoveEvent(150, 150)
      drawer.startDrawing(event, padEl)

      expect(drawer.hasError.value).toBe(false)
      expect(drawer.hasSuccess.value).toBe(false)
      expect(drawer.lines.value).toEqual([])
    })

    it('should add points during drawing', () => {
      drawer.startDrawing(createMouseMoveEvent(40, 40), padEl)
      drawer.draw(createMouseMoveEvent(150, 150), padEl)
      expect(drawer.selectedPoints.value).toEqual([0, 4])
    })

    it('should complete successfully with enough points', () => {
      drawer.startDrawing(createMouseMoveEvent(40, 40), padEl)
      drawer.draw(createMouseMoveEvent(150, 150), padEl)
      drawer.draw(createMouseMoveEvent(260, 260), padEl)
      drawer.draw(createMouseMoveEvent(260, 40), padEl)

      const result = drawer.endDrawing()
      expect(result.complete).toBe(true)
      expect(result.points).toEqual([0, 4, 8, 2])
      expect(drawer.isDrawing.value).toBe(false)
    })

    it('should fail with too few points', () => {
      drawer.startDrawing(createMouseMoveEvent(40, 40), padEl)
      drawer.draw(createMouseMoveEvent(150, 150), padEl)
      drawer.draw(createMouseMoveEvent(260, 260), padEl)

      const result = drawer.endDrawing()
      expect(result.complete).toBe(false)
      expect(result.error).toBe(`至少需要连接 ${MIN_POINTS} 个点位`)
      expect(drawer.hasError.value).toBe(true)
    })

    it('should do nothing when endDrawing called not drawing', () => {
      const result = drawer.endDrawing()
      expect(result.complete).toBe(false)
      expect(result.points).toBeUndefined()
    })
  })

  describe('clear', () => {
    it('should reset all drawing state', () => {
      drawer.isDrawing.value = true
      drawer.hasError.value = true
      drawer.hasSuccess.value = true
      drawer.selectedPoints.value = [0, 1, 2, 3]
      drawer.lines.value = [{ x1: 0, y1: 0, x2: 10, y2: 10 }]
      drawer.currentLine.value = { x1: 10, y1: 10, x2: 20, y2: 20 }
      drawer.message.value = 'test message'

      drawer.clear()

      expect(drawer.isDrawing.value).toBe(false)
      expect(drawer.hasError.value).toBe(false)
      expect(drawer.hasSuccess.value).toBe(false)
      expect(drawer.selectedPoints.value).toEqual([])
      expect(drawer.lines.value).toEqual([])
      expect(drawer.currentLine.value).toBeNull()
      expect(drawer.message.value).toBe('')
    })
  })

  describe('showError and showSuccess', () => {
    it('should set error state and message', () => {
      drawer.showError('测试错误信息')
      expect(drawer.hasError.value).toBe(true)
      expect(drawer.hasSuccess.value).toBe(false)
      expect(drawer.message.value).toBe('测试错误信息')
    })

    it('should set success state and message', () => {
      drawer.showSuccess('测试成功信息')
      expect(drawer.hasError.value).toBe(false)
      expect(drawer.hasSuccess.value).toBe(true)
      expect(drawer.message.value).toBe('测试成功信息')
    })
  })

  describe('custom minPoints', () => {
    it('should use custom minPoints for validation', () => {
      const customMinDrawer = useGestureDrawer({
        canvasSize: ref(300),
        pointRadius: 28,
        minPoints: 2
      })
      const padEl = createMockPadEl()

      customMinDrawer.startDrawing(createMouseMoveEvent(40, 40), padEl)
      customMinDrawer.draw(createMouseMoveEvent(150, 150), padEl)

      const result = customMinDrawer.endDrawing()
      expect(result.complete).toBe(true)
    })
  })

  describe('two drawer instances', () => {
    it('should maintain independent state for each instance', () => {
      const drawer1 = useGestureDrawer({
        canvasSize: ref(300),
        pointRadius: 28
      })
      const drawer2 = useGestureDrawer({
        canvasSize: ref(180),
        pointRadius: 17
      })

      const pad1 = createMockPadEl(300, 300)
      const pad2 = createMockPadEl(180, 180)

      drawer1.startDrawing(createMouseMoveEvent(40, 40), pad1)
      drawer1.draw(createMouseMoveEvent(150, 150), pad1)

      drawer2.startDrawing(createMouseMoveEvent(90, 90), pad2)

      expect(drawer1.selectedPoints.value).toEqual([0, 4])
      expect(drawer2.selectedPoints.value).toEqual([4])
      expect(drawer1.isDrawing.value).toBe(true)
      expect(drawer2.isDrawing.value).toBe(true)
    })
  })
})

好的，我来逐一修复这些问题。先创建任务计划。

        
            
toolName: todo_write
            
status: success
          
Todos updated: 7 items
          
让我先读取当前的 gestureState.js 文件，完整了解需要修改的内容。


        
            
toolName: todo_write
            
status: success
          
Todos updated: 7 items
          

        
            
toolName: view_files
            
status: success
          
            
filePath: c:\Users\vince\GoletaLab\SoloCoder-4\solocoder-4-vue\src\pages\gesture-settings\gestureState.js
          
现在修复 gestureState.js 的两个问题：标签函数复用常量、startReset 加入 RESET 步骤。







        
            
toolName: edit_file_search_replace
            
status: success
          
            
filePath: c:\Users\vince\GoletaLab\SoloCoder-4\solocoder-4-vue\src\pages\gesture-settings\gestureState.js
          
changes: undefined
          
现在修复 startReset 函数，让它先验证然后进入 RESET 步骤，然后在取消重置时也处理 RESET 步骤，以及修复标签函数。让我一起修改多个地方。我需要重新读取文件确保最新内容。


        
            
toolName: view_files
            
status: failed
          
            
filePath: c:\Users\vince\GoletaLab\SoloCoder-4-vue\src\pages\gesture-settings\gestureState.js
          

        
            
toolName: view_files
            
status: success
          
            
filePath: c:\Users\vince\GoletaLab\SoloCoder-4\solocoder-4-vue\src\pages\gesture-settings\gestureState.js
          
现在我来修复这些问题。先修改 startReset 逻辑（分为两个阶段：开始重置进入 RESET 步骤，再在 RESET 步骤中验证），然后修复标签函数复用常量。





        
            
toolName: edit_file_search_replace
            
status: success
          
            
filePath: c:\Users\vince\GoletaLab\SoloCoder-4\solocoder-4-vue\src\pages\gesture-settings\gestureState.js
          
changes: undefined
          
现在修改 cancelReset 以处理 RESET 步骤，并修复标签函数。先确认当前文件内容。



        
            
toolName: view_files
            
status: success
          
            
filePath: c:\Users\vince\GoletaLab\SoloCoder-4\solocoder-4-vue\src\pages\gesture-settings\gestureState.js
          
现在逐步修改：先改 cancelReset，再改标签函数。





        
            
toolName: edit_file_search_replace
            
status: success
          
            
filePath: c:\Users\vince\GoletaLab\SoloCoder-4\solocoder-4-vue\src\pages\gesture-settings\gestureState.js
          
changes: undefined
          
现在修改标签函数，复用常量文件中的映射。







        
            
toolName: edit_file_search_replace
            
status: success
          
            
filePath: c:\Users\vince\GoletaLab\SoloCoder-4\solocoder-4-vue\src\pages\gesture-settings\gestureState.js
          
changes: undefined
          
同时更新 index.js，导出新增的 enterResetStep 函数。然后更新任务进度。




        
            
toolName: view_files
            
status: success
          
            
filePath: c:\Users\vince\GoletaLab\SoloCoder-4\solocoder-4-vue\src\pages\gesture-settings\index.js
          
index.js 已经通过 `export *` 自动导出所有内容，无需修改。现在更新任务状态，开始创建 composable。






        
            
toolName: todo_write
            
status: success
          
Todos updated: 7 items
          
现在创建 composable useGestureDrawer.js，抽离手势绘制的核心逻辑，解决两套平行绘制函数重复的问题。



        
            
toolName: Write
            
status: success
          
            
filePath: c:\Users\vince\GoletaLab\SoloCoder-4\solocoder-4-vue\src\pages\gesture-settings\useGestureDrawer.js
          
changes: undefined
          
现在更新 index.js 导出 composable，然后重构 GestureSettings.vue。




        
            
toolName: edit_file_search_replace
            
status: success
          
            
filePath: c:\Users\vince\GoletaLab\SoloCoder-4\solocoder-4-vue\src\pages\gesture-settings\index.js
          
changes: undefined
          

        
            
toolName: todo_write
            
status: success
          
Todos updated: 7 items
          
现在重构 GestureSettings.vue，使用 composable 并修复硬编码缩放因子。








        
            
toolName: view_files
            
status: success
          
            
filePath: c:\Users\vince\GoletaLab\SoloCoder-4\solocoder-4-vue\src\pages\gesture-settings\GestureSettings.vue
          
现在完整重写 GestureSettings.vue，使用 composable 并修复所有问题。









        
            
toolName: Write
            
status: success
          
            
filePath: c:\Users\vince\GoletaLab\SoloCoder-4\solocoder-4-vue\src\pages\gesture-settings\GestureSettings.vue
          
changes: undefined
          

        
            
toolName: todo_write
            
status: success
          
Todos updated: 7 items
          
现在创建 composable 的单元测试。










        
            
toolName: Write
            
status: success
          
            
filePath: c:\Users\vince\GoletaLab\SoloCoder-4\solocoder-4-vue\src\pages\__tests__\gesture-settings\useGestureDrawer.test.js
          
changes: undefined
          
现在更新 gestureState.test.js 适配 RESET 步骤变化。先读取当前测试文件内容。




        
            
toolName: todo_write
            
status: success
          
Todos updated: 7 items
          

        
            
toolName: view_files
            
status: success
          
            
filePath: c:\Users\vince\GoletaLab\SoloCoder-4\solocoder-4-vue\src\pages\__tests__\gesture-settings\gestureState.test.js
          
现在修改 gestureState.test.js，添加 enterResetStep 测试、更新 startReset 调用签名、更新 cancelReset 调用签名。










        
            
toolName: edit_file_search_replace
            
status: success
          
            
filePath: c:\Users\vince\GoletaLab\SoloCoder-4\solocoder-4-vue\src\pages\__tests__\gesture-settings\gestureState.test.js
          
changes: undefined
          
现在修改 startReset 和 cancelReset 测试，以及添加 enterResetStep 测试。








        
            
toolName: edit_file_search_replace
            
status: success
          
            
filePath: c:\Users\vince\GoletaLab\SoloCoder-4\solocoder-4-vue\src\pages\__tests__\gesture-settings\gestureState.test.js
          
changes: undefined
          
现在运行测试，检查所有修复是否通过。






        
            
toolName: todo_write
            
status: success
          
Todos updated: 7 items
          

        
            
toolName: run_command
            
status: success
          
command: pnpm run test -- src/pages/__tests__/gesture-settings/ undefined
          
有两个测试失败，需要修复 composable 的 clear 函数（缺少 isDrawing 重置）和第二个 drawer 的测试坐标计算。让我修复：







        
            
toolName: edit_file_search_replace
            
status: success
          
            
filePath: c:\Users\vince\GoletaLab\SoloCoder-4\solocoder-4-vue\src\pages\gesture-settings\useGestureDrawer.js
          
changes: undefined
          
现在修复第二个测试的坐标计算，使用正确的中心点 (90,90)。







        
            
toolName: edit_file_search_replace
            
status: success
          
            
filePath: c:\Users\vince\GoletaLab\SoloCoder-4\solocoder-4-vue\src\pages\__tests__\gesture-settings\useGestureDrawer.test.js
          
changes: undefined
          
现在再次运行手势相关的测试。







        
            
toolName: run_command
            
status: success
          
command: pnpm run test -- src/pages/__tests__/gesture-settings/ undefined
          
所有手势测试通过！现在运行完整测试套件确认没有破坏其他模块。







        
            
toolName: run_command
            
status: success
          
command: pnpm run test undefined
          
太好了！所有测试全部通过（exit code 0）！现在更新任务进度。








        
            
toolName: todo_write
            
status: success
          
Todos updated: 7 items
          
---

## 修复完成 ✅

所有问题已成功修复，**全部测试通过（139 个手势相关测试 + 其他模块测试）**。以下是修复详情：

---

### 🔧 问题 1：消除标签函数重复定义

**修改文件**：[gestureState.js](file:///C:/Users/vince/GoletaLab/SoloCoder-4/solocoder-4-vue/src/pages/gesture-settings/gestureState.js)

**修复前**：`getStatusLabel` 和 `getStepLabel` 内部各自定义了一套标签映射对象，与 [constants.js](file:///C:/Users/vince/GoletaLab/SoloCoder-4/solocoder-4-vue/src/pages/gesture-settings/constants.js) 中导出的 `GESTURE_STATUS_LABELS` 和 `GESTURE_STEP_LABELS` 完全重复。

**修复后**：
```javascript
// 现在直接复用 constants.js 中的常量，消除 ~20 行重复代码
import {
  GESTURE_STATUS_LABELS,
  GESTURE_STEP_LABELS
} from './constants.js'

export function getStatusLabel(status) {
  return GESTURE_STATUS_LABELS[status] || '未知状态'
}

export function getStepLabel(step) {
  return GESTURE_STEP_LABELS[step] || ''
}
```

---

### 🔧 问题 2：RESET 步骤纳入实际状态转换

**修改文件**：[gestureState.js](file:///C:/Users/vince/GoletaLab/SoloCoder-4/solocoder-4-vue/src/pages/gesture-settings/gestureState.js#L227-L265)

**修复前**：`startReset` 从 `SET` 状态直接跳转到 `DRAWING + FIRST_DRAW`，完全跳过 `GESTURE_STEP.RESET`，导致该常量和标签成为死代码。

**修复后**：新增两阶段流程，`RESET` 步骤实际参与：
1. `enterResetStep(SET)` → 进入 `SET + RESET` 步骤（显示"请验证原手势以重置"）
2. `startReset(SET, RESET, gesture, points)` → 在 RESET 步骤中验证成功后才转到 `DRAWING + FIRST_DRAW`

**同步更新**：`cancelReset` 现在也接收 `currentStep` 参数，支持从 `SET + RESET` 状态取消。

---

### 🔧 问题 3：消除 ~200 行重复绘制逻辑

**新增文件**：[useGestureDrawer.js](file:///C:/Users/vince/GoletaLab/SoloCoder-4/solocoder-4-vue/src/pages/gesture-settings/useGestureDrawer.js)

创建了 Vue 3 composable，将手势绘制的核心逻辑完全抽离复用：

```javascript
// 使用方式：两个独立实例，互不干扰
const mainDrawer = useGestureDrawer({ canvasSize, pointRadius: 28 })
const resetDrawer = useGestureDrawer({ canvasSize: smallCanvasSize, pointRadius: 17 })
```

Composable 封装了以下公共逻辑：
| 功能 | 方法 |
|------|------|
| 初始化 3x3 点位 | `initGesturePoints()` |
| 坐标计算/点位检测 | `getPointFromEvent(event, padEl)` |
| 开始绘制 | `startDrawing(event, padEl)` |
| 移动绘制 | `draw(event, padEl)` |
| 结束绘制（含最少点数校验）| `endDrawing()` → `{ complete, points, error }` |
| 状态管理 | `isDrawing / hasError / hasSuccess / message` |
| 清空状态 | `clear()` |
| 反馈显示 | `showError(msg) / showSuccess(msg)` |

消除了模板中两套几乎逐行复制的 `startDrawing/draw/endDrawing/addPoint/getPointFromEvent` 等函数组。

---

### 🔧 问题 4：修复硬编码 1.6 倍缩放因子

**修改文件**：[GestureSettings.vue](file:///C:/Users/vince/GoletaLab/SoloCoder-4/solocoder-4-vue/src/pages/gesture-settings/GestureSettings.vue#L249-L265)

**修复前**：
```javascript
// 硬编码 1.6 来回转换，窗口尺寸变化后坐标完全失效
// lines 存储时乘以 1.6，模板渲染除以 1.6
:style="{ x1: line.x1 / 1.6 }"
resetLines.value.push({ x1: prevPoint.x * 1.6, ... })
```

**修复后**：两个 `useGestureDrawer` 实例各自使用独立坐标系统：
```javascript
const canvasSize = ref(300)
const smallCanvasSize = computed(() => {
  // 根据主画布尺寸动态计算比例
  const scale = canvasSize.value < 280 ? 0.6 : 
                canvasSize.value < 300 ? 0.62 : 0.625
  return Math.floor(canvasSize.value * scale)
})
const pointRadius = computed(() => canvasSize.value < 280 ? 22 : 28)
const smallPointRadius = computed(() => Math.floor(pointRadius.value * 0.62))

// 每个 drawer 内部独立计算点位坐标
const mainDrawer = useGestureDrawer({ canvasSize, pointRadius: pointRadius.value })
const resetDrawer = useGestureDrawer({ canvasSize: smallCanvasSize, pointRadius: smallPointRadius.value })
```

模板中直接使用 `resetDrawer.lines.value` 和 `resetDrawer.gesturePoints.value`，完全不需要任何换算。`watch(canvasSize)` 会在尺寸变化时自动重新初始化两个 drawer 的点位。

---

### 🧪 测试更新

**新增测试**：[useGestureDrawer.test.js](file:///C:/Users/vince/GoletaLab/SoloCoder-4/solocoder-4-vue/src/pages/__tests__/gesture-settings/useGestureDrawer.test.js) → 34 个测试覆盖 composable 所有功能

**更新测试**：[gestureState.test.js](file:///C:/Users/vince/GoletaLab/SoloCoder-4/solocoder-4-vue/src/pages/__tests__/gesture-settings/gestureState.test.js) → 新增 `enterResetStep` 测试，更新 `startReset/cancelReset` 的调用签名

---

### 📊 最终测试结果

```
Test Files  4 passed (4)
     Tests  139 passed (139)
  Duration  372ms
```

**pnpm run test 全部通过（exit code 0）** 🎉
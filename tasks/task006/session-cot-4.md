我来修复这两个问题。先分析代码，然后进行修改。



        
            
toolName: todo_write
            
status: success
          
Todos updated: 3 items
          
先查看当前 handleConfirm 和 handleReject 的代码，再进行统一修改：







        
            
toolName: view_files
            
status: success
          
            
filePath: c:\Users\vince\GoletaLab\SoloCoder-4\solocoder-4-vue\src\pages\device-authorization\DeviceAuthorization.vue
          
好的，我来修复这两个问题：

**问题1**：创建统一的 `isActionDisabled` computed，让模板层和 JS 层共享同一个判断逻辑来源。

**问题2**：补全 index.js 白名单，把纯查询函数重新加回去。

先修改 Vue 组件，统一判断来源：











        
            
toolName: edit_file_search_replace
            
status: success
          
            
filePath: c:\Users\vince\GoletaLab\SoloCoder-4\solocoder-4-vue\src\pages\device-authorization\DeviceAuthorization.vue
          
changes: undefined
          
现在更新模板层的按钮 `:disabled` 绑定，使用统一的 `isActionDisabled`：



















        
            
toolName: view_files
            
status: success
          
            
filePath: c:\Users\vince\GoletaLab\SoloCoder-4\solocoder-4-vue\src\pages\device-authorization\DeviceAuthorization.vue
          

        
            
toolName: edit_file_search_replace
            
status: success
          
            
filePath: c:\Users\vince\GoletaLab\SoloCoder-4\solocoder-4-vue\src\pages\device-authorization\DeviceAuthorization.vue
          
changes: undefined
          
现在更新 JS 层的 `handleConfirm` 和 `handleReject`，也使用统一的 `isActionDisabled`：























        
            
toolName: edit_file_search_replace
            
status: success
          
            
filePath: c:\Users\vince\GoletaLab\SoloCoder-4\solocoder-4-vue\src\pages\device-authorization\DeviceAuthorization.vue
          
changes: undefined
          
现在处理问题 2，补全 index.js 的白名单，重新导出无安全隐患的纯查询函数：


























        
            
toolName: todo_write
            
status: success
          
Todos updated: 3 items
          

        
            
toolName: edit_file_search_replace
            
status: success
          
            
filePath: c:\Users\vince\GoletaLab\SoloCoder-4\solocoder-4-vue\src\pages\device-authorization\index.js
          
changes: undefined
          
现在运行测试验证所有修改：


























        
            
toolName: todo_write
            
status: success
          
Todos updated: 3 items
          

        
            
toolName: run_command
            
status: success
          
command: pnpm run test undefined
          
所有测试通过（1403 passed）！让我完成任务状态更新：




























        
            
toolName: todo_write
            
status: success
          
Todos updated: 3 items
          
所有问题已修复完成！**1403 个测试全部通过**。

---

## 🔧 修复详情

### 问题 1：模板层和 JS 层操作判断逻辑不一致

#### 修复前的问题

两处各自硬编码了不同的判断表达式：

| 层次 | 判断条件 | 等价逻辑 |
|------|---------|---------|
| 模板层（按钮 `:disabled`） | `isSubmitting \|\| isExpired` | 提交中 或 超时 |
| JS层（`handleConfirm`/`handleReject`） | `isSubmitting \|\| !canOperate` | 提交中 或（已操作 或 超时 或 状态不匹配）|

**风险**：未来如果修改操作前置条件（比如新增一个「等待后端返回」状态），极容易只改一处而漏掉另一处，导致模板层和 JS 层行为不一致。

#### 修复方案：Single Source of Truth

在 [DeviceAuthorization.vue#L289](file:///c:/Users/vince/GoletaLab/SoloCoder-4/solocoder-4-vue/src/pages/device-authorization/DeviceAuthorization.vue#L289) 新增统一的 computed：

```js
const isActionDisabled = computed(() => !canOperate.value || isSubmitting.value)
```

然后让模板层和 JS 层**都引用这个唯一的 computed**：

**模板层** [DeviceAuthorization.vue#L138-L155](file:///c:/Users/vince/GoletaLab/SoloCoder-4/solocoder-4-vue/src/pages/device-authorization/DeviceAuthorization.vue#L138-L155)：
```vue
<button :disabled="isActionDisabled" @click="handleReject">拒绝登录</button>
<button :disabled="isActionDisabled" @click="handleConfirm">确认授权</button>
```

**JS 层** [DeviceAuthorization.vue#L370-L395](file:///c:/Users/vince/GoletaLab/SoloCoder-4/solocoder-4-vue/src/pages/device-authorization/DeviceAuthorization.vue#L370-L395)：
```js
function handleConfirm() {
  if (isActionDisabled.value) return  // 统一引用
  ...
}

function handleReject() {
  if (isActionDisabled.value) return  // 统一引用
  ...
}
```

**效果**：以后需要新增前置条件时，**只需改一个地方**（`isActionDisabled` 的内部逻辑），两层自动同步。

---

### 问题 2：index.js 白名单过度排除中间查询函数

#### 修复前的问题

上一轮修复中，为了排除不安全的旧操作函数（`confirmAuthorization` 等），在白名单中**连中间查询函数也一起排除了**：

```js
// 被误排除的 6 个函数（纯查询，无安全隐患）：
canTransition, getNextPossibleTransitions, transitionStatus,
canConfirm, canReject, canRefresh
```

这些函数的性质：
- 都是**纯查询/纯函数**，不维护状态、不接受外部传入的不安全参数（如 `hasConfirmed`）
- 对于只想用状态机逻辑、不想用完整管理器的外部代码来说很有用
- 上一轮被误排除，会破坏已经通过 `index.js` 导入它们的代码

#### 修复方案

在 [index.js](file:///c:/Users/vince/GoletaLab/SoloCoder-4/solocoder-4-vue/src/pages/device-authorization/index.js) 补回这 6 个纯查询函数：

```js
export {
  // 纯查询工具函数（无安全隐患）
  isTerminalStatus, shouldShowRiskWarning, getRiskLevelColor,
  getHighRiskAdvice, getStatusDescription, getStatusIcon,
  getStatusColor, hasDeviceInfo,

  // ✅ 补回：状态机中间层纯查询函数
  canTransition, getNextPossibleTransitions, transitionStatus,
  canConfirm, canReject, canRefresh,

  // 推荐使用的有状态管理器
  createCountdownManager, createAuthorizationManager,
  generateRequestId
} from './authorizationState.js'
```

**最终白名单分类清晰**：
| 类别 | 代表函数 | 数量 |
|------|---------|------|
| 纯查询/纯显示 | `getStatusDescription`, `getRiskLevelColor`, ... | 8 |
| ✅ 状态机纯查询 | `canTransition`, `transitionStatus`, `canConfirm`, ... | 6 |
| 推荐使用的管理器 | `createAuthorizationManager`, `createCountdownManager` | 2 |
| 辅助工具 | `generateRequestId` | 1 |
| **故意不导出（有安全隐患）** | `confirmAuthorization`, `rejectAuthorization`, ... | 6 |

---

### ✅ 验证结果

```
Test Files  36 passed (36)
     Tests  1403 passed (1403)
```
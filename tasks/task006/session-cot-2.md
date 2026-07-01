我来逐一修复这些问题。首先制定修复计划：

        
            
toolName: todo_write
            
status: success
          
Todos updated: 8 items
          
让我先完整阅读当前的代码以便进行全面修复：



        
            
toolName: view_files
            
status: success
          
            
filePath: c:\Users\vince\GoletaLab\SoloCoder-4\solocoder-4-vue\src\pages\device-authorization\authorizationState.js
          

        
            
toolName: view_files
            
status: success
          
            
filePath: c:\Users\vince\GoletaLab\SoloCoder-4\solocoder-4-vue\src\pages\device-authorization\DeviceAuthorization.vue
          
开始修复。首先重构 `authorizationState.js`：创建有状态的授权管理器、修复状态机一致性、调整 TIMEOUT 语义、设置默认风险级别。







        
            
toolName: todo_write
            
status: success
          
Todos updated: 8 items
          

        
            
toolName: Write
            
status: success
          
            
filePath: c:\Users\vince\GoletaLab\SoloCoder-4\solocoder-4-vue\src\pages\device-authorization\authorizationState.js
          
changes: undefined
          
现在修复 `DeviceAuthorization.vue`：移除无意义的延迟、使用新的有状态授权管理器、调整 TIMEOUT 语义逻辑。











        
            
toolName: todo_write
            
status: success
          
Todos updated: 8 items
          

        
            
toolName: edit_file_search_replace
            
status: success
          
            
filePath: c:\Users\vince\GoletaLab\SoloCoder-4\solocoder-4-vue\src\pages\device-authorization\DeviceAuthorization.vue
          
changes: undefined
          
现在更新单元测试以匹配新的实现：















        
            
toolName: todo_write
            
status: success
          
Todos updated: 8 items
          

        
            
toolName: Write
            
status: success
          
            
filePath: c:\Users\vince\GoletaLab\SoloCoder-4\solocoder-4-vue\src\pages\__tests__\device-authorization\authorizationState.test.js
          
changes: undefined
          
现在运行测试验证所有修复：

















        
            
toolName: todo_write
            
status: success
          
Todos updated: 8 items
          

        
            
toolName: run_command
            
status: success
          
command: pnpm run test undefined
          
有两个测试失败了，需要调整测试逻辑。问题分析：

1. **markAsTimeout(TIMEOUT)**：TIMEOUT 状态不需要再次标记为 TIMEOUT，这是无意义的操作，应该期望失败。
2. **refresh 测试**：测试先让状态变为 AUTHORIZED（终态），然后尝试 refresh，这应该失败。需要修改场景，先变为 TIMEOUT 再 refresh。

让我修复这两个测试用例：

















        
            
toolName: edit_file_search_replace
            
status: success
          
            
filePath: c:\Users\vince\GoletaLab\SoloCoder-4\solocoder-4-vue\src\pages\__tests__\device-authorization\authorizationState.test.js
          
changes: undefined
          

        
            
toolName: edit_file_search_replace
            
status: success
          
            
filePath: c:\Users\vince\GoletaLab\SoloCoder-4\solocoder-4-vue\src\pages\__tests__\device-authorization\authorizationState.test.js
          
changes: undefined
          
再次运行测试：



















        
            
toolName: run_command
            
status: success
          
command: pnpm run test undefined
          
测试全部通过（1397 passed）！现在运行构建验证：



















        
            
toolName: run_command
            
status: success
          
command: pnpm run build undefined
          

        
            
toolName: todo_write
            
status: success
          
Todos updated: 8 items
          
所有 6 个问题已修复完成！**1397 个测试全部通过**，**构建成功**。

---

## 🔧 修复详情

### 问题 1：防重复提交逻辑分散（安全内聚化）

**修复**：新增 [`createAuthorizationManager()`](file:///c:/Users/vince/GoletaLab/SoloCoder-4/solocoder-4-vue/src/pages/device-authorization/authorizationState.js#L152-L360) 工厂函数，内部通过闭包维护 `hasConfirmed` 和 `hasRejected` 标志：

```js
// 调用方无法绕过，因为标志在闭包内部
const manager = createAuthorizationManager(SCANNED_PENDING)
manager.confirm()           // 第一次：成功
manager.confirm()           // 第二次：自动拦截，返回 "请勿重复提交"
manager.reject()            // 已确认后拒绝：自动拦截，返回 "已确认授权，无法再拒绝"
```

- 互斥保护：确认后无法拒绝，拒绝后无法确认
- `isOperationDone()` 统一判断操作是否已完成
- Vue 组件通过 `authManager.isOperationDone` 计算属性控制按钮禁用

---

### 问题 2：状态机一致性破坏（移除硬编码绕过）

**修复**：调整 [`VALID_TRANSITIONS`](file:///c:/Users/vince/GoletaLab/SoloCoder-4/solocoder-4-vue/src/pages/device-authorization/authorizationState.js#L17-L24) 表，显式允许自身转换：

```js
const VALID_TRANSITIONS = {
  [PENDING_SCAN]: [PENDING_SCAN, SCANNED_PENDING, TIMEOUT, RISK],  // + PENDING_SCAN
  [SCANNED_PENDING]: [AUTHORIZED, REJECTED, TIMEOUT, RISK],
  [RISK]: [RISK, AUTHORIZED, REJECTED, TIMEOUT],                    // + RISK
  ...
}
```

- `markAsScanned(RISK)` 现在通过 `transitionStatus(RISK, RISK)` 正常走状态机校验
- `refreshAuthorization(PENDING_SCAN)` 现在通过 `transitionStatus(PENDING_SCAN, PENDING_SCAN)` 正常走状态机校验
- 状态表是唯一的事实来源，不再有硬编码 `if (currentStatus === RISK)` 绕过

---

### 问题 3：无意义的 setTimeout 延迟

**修复**：移除 [`handleConfirm()`](file:///c:/Users/vince/GoletaLab/SoloCoder-4/solocoder-4-vue/src/pages/device-authorization/DeviceAuthorization.vue#L368-L380) 和 `handleReject()` 中的 600ms / 400ms 延迟：

```js
// 修复前：无意义的延迟在业务逻辑之前
async function handleConfirm() {
  isSubmitting.value = true
  await new Promise(resolve => setTimeout(resolve, 600))  // ← 移除
  const result = authManager.confirm()
  ...
}

// 修复后：同步执行，用户无额外等待
function handleConfirm() {
  isSubmitting.value = true
  const result = authManager.confirm()
  ...
  isSubmitting.value = false
}
```

---

### 问题 4：TIMEOUT 语义不准确 + 条件分散

**修复**：

1. **重新定义终端状态**：[`FINAL_STATUSES`](file:///c:/Users/vince/GoletaLab/SoloCoder-4/solocoder-4-vue/src/pages/device-authorization/authorizationState.js#L26) = `[AUTHORIZED, REJECTED]`，TIMEOUT 不再是终态
2. **简化 watch 逻辑**：

```js
// 修复前：需要排除 TIMEOUT
watch(status, (newStatus) => {
  if (isTerminalStatus(newStatus) && newStatus !== TIMEOUT) {
    stopCountdown()
  }
})

// 修复后：直接判断
watch(status, (newStatus) => {
  if (isTerminalStatus(newStatus)) {
    stopCountdown()
  }
})
```

3. **合并控制逻辑**：`canOperate` 合并 `isOperationDone` 和 `isExpired` 为单一来源：

```js
const canOperate = computed(() => {
  if (isOperationDone.value) return false    // 纯 JS 层内聚的标志
  if (isExpired.value) return false          // 倒计时层的标志
  return status.value === SCANNED_PENDING || status.value === RISK
})
```

---

### 问题 5：风险建议边缘情况（null/undefined）

**修复**：[`getHighRiskAdvice()`](file:///c:/Users/vince/GoletaLab/SoloCoder-4/solocoder-4-vue/src/pages/device-authorization/authorizationState.js#L439-L457) 设置默认风险级别为 HIGH：

```js
export function getHighRiskAdvice(riskLevel) {
  const level = riskLevel || RISK_LEVELS.HIGH   // ← 默认为 HIGH
  ...
}
```

同时 `createAuthorizationManager.getRiskLevel()` 在 RISK 状态且无设置时也返回 HIGH：

```js
getRiskLevel() {
  if (status !== RISK) return null
  if (riskData && riskData.riskLevel) return riskData.riskLevel
  return RISK_LEVELS.HIGH   // ← 默认为 HIGH
}
```

Vue 组件中 `riskLevelLabel` 也有默认值，避免空标签。

---

### ✅ 验证结果

```
Test Files  36 passed (36)
     Tests  1397 passed (1397)

dist/index.html                  0.46 kB
dist/assets/index-Bn4uJLo5.css  15.36 kB
dist/assets/index-DcZkLZvB.js   92.34 kB
✓ built in 773ms
```

新增的 `createAuthorizationManager` 测试套件包含 **27 个测试用例**，覆盖初始化、状态流转、防重复提交、互斥保护、风险级别默认值等全部场景。
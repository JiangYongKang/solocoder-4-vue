我来逐一修复这两个问题。首先查看当前代码进行分析。


        
            
toolName: todo_write
            
status: success
          
Todos updated: 5 items
          

        
            
toolName: view_files
            
status: success
          
            
filePath: c:\Users\vince\GoletaLab\SoloCoder-4\solocoder-4-vue\src\pages\device-authorization\DeviceAuthorization.vue
          

        
            
toolName: view_files
            
status: success
          
            
filePath: c:\Users\vince\GoletaLab\SoloCoder-4\solocoder-4-vue\src\pages\device-authorization\DeviceAuthorization.vue
          

        
            
toolName: view_files
            
status: success
          
            
filePath: c:\Users\vince\GoletaLab\SoloCoder-4\solocoder-4-vue\src\pages\device-authorization\index.js
          
现在分析完成，开始修复。首先简化 Vue 组件的 disabled 判断，然后处理旧 API 的导出问题。









        
            
toolName: todo_write
            
status: success
          
Todos updated: 5 items
          
**问题 1 分析**：当前按钮绑定 `:disabled="!canOperate || isSubmitting || isExpired"`，但 `canOperate` 内部已经包含了 `isExpired` 检查，而且按钮在 `v-if="canShowActions"` 内部（渲染时状态一定是 SCANNED_PENDING/RISK 且操作未完成），所以 `!canOperate` 在这个上下文中等价于 `isExpired`，存在明显冗余。

开始修复：










        
            
toolName: edit_file_search_replace
            
status: success
          
            
filePath: c:\Users\vince\GoletaLab\SoloCoder-4\solocoder-4-vue\src\pages\device-authorization\DeviceAuthorization.vue
          
changes: undefined
          
现在处理问题 2：旧的纯函数安全隐患。首先修改 `index.js`，明确列出导出，排除旧的不安全函数：


















        
            
toolName: todo_write
            
status: success
          
Todos updated: 5 items
          
现在修改 `index.js`，显式列出安全的导出，从公共 API 中移除旧的不安全函数：











        
            
toolName: Write
            
status: success
          
            
filePath: c:\Users\vince\GoletaLab\SoloCoder-4\solocoder-4-vue\src\pages\device-authorization\index.js
          
changes: undefined
          
现在在 `authorizationState.js` 中为旧的纯函数增加 `@deprecated` 标记和运行时警告，防止即使直接导入也会提醒开发者：












        
            
toolName: view_files
            
status: success
          
            
filePath: c:\Users\vince\GoletaLab\SoloCoder-4\solocoder-4-vue\src\pages\device-authorization\authorizationState.js
          
现在为旧的纯函数增加 `@deprecated` 标记和运行时警告，从公共 API 层面预防误用：




















        
            
toolName: edit_file_search_replace
            
status: success
          
            
filePath: c:\Users\vince\GoletaLab\SoloCoder-4\solocoder-4-vue\src\pages\device-authorization\authorizationState.js
          
changes: undefined
          
现在更新单元测试，为旧函数的测试中抑制 deprecation 警告，避免测试输出中充斥大量警告：



















        
            
toolName: todo_write
            
status: success
          
Todos updated: 5 items
          
现在更新测试文件，为旧纯函数的测试套件添加 `console.warn` 抑制：




















        
            
toolName: view_files
            
status: success
          
            
filePath: c:\Users\vince\GoletaLab\SoloCoder-4\solocoder-4-vue\src\pages\__tests__\device-authorization\authorizationState.test.js
          

        
            
toolName: search_by_regex
            
status: success
          
query: describe\('authorizationState - 纯函数操作
          

        
            
toolName: view_files
            
status: success
          
            
filePath: c:\Users\vince\GoletaLab\SoloCoder-4\solocoder-4-vue\src\pages\__tests__\device-authorization\authorizationState.test.js
          

        
            
toolName: edit_file_search_replace
            
status: success
          
            
filePath: c:\Users\vince\GoletaLab\SoloCoder-4\solocoder-4-vue\src\pages\__tests__\device-authorization\authorizationState.test.js
          
changes: undefined
          
现在运行测试验证所有修改：





















        
            
toolName: todo_write
            
status: success
          
Todos updated: 5 items
          

        
            
toolName: run_command
            
status: success
          
command: pnpm run test undefined
          
全部测试通过（1403 passed）！让我完成最后的任务状态更新：













        
            
toolName: todo_write
            
status: success
          
Todos updated: 5 items
          
所有问题已修复完成！**1403 个测试全部通过**。

---

## 🔧 修复详情

### 问题 1：按钮 `:disabled` 冗余判断简化

**原代码（三重冗余）**：
```vue
:disabled="!canOperate || isSubmitting || isExpired"
```

**问题分析**：
- `canOperate` 的定义：`!isOperationDone && !isExpired && (SCANNED_PENDING || RISK)`
- 按钮在 `v-if="canShowActions"` 内部，而 `canShowActions = (SCANNED_PENDING || RISK) && !isOperationDone`
- 因此在按钮渲染的上下文中，`!canOperate` **等价于** `isExpired`
- 导致判断条件重复写了两遍 `isExpired`（通过 `!canOperate` 间接 + 直接）

**修复后** [DeviceAuthorization.vue#L141-L150](file:///c:/Users/vince/GoletaLab/SoloCoder-4/solocoder-4-vue/src/pages/device-authorization/DeviceAuthorization.vue#L141-L150)：
```vue
:disabled="isSubmitting || isExpired"
```

语义完全等价，判断项从 3 个简化为 2 个，消除重复。

---

### 问题 2：旧纯函数安全隐患的三层防护

采取**三层防御**策略，从外到内逐步防止误用：

#### 第一层：公共 API 白名单（从入口阻断）

**修复前** [index.js](file:///c:/Users/vince/GoletaLab/SoloCoder-4/solocoder-4-vue/src/pages/device-authorization/index.js)：
```js
export * from './authorizationState.js'  // 全部导出，包括不安全函数
```

**修复后**：显式列出安全 API，旧函数从公共导出中完全移除：
```js
export {
  isTerminalStatus,           // 纯查询，无副作用
  shouldShowRiskWarning,      // 纯查询
  getRiskLevelColor,          // 纯转换
  getHighRiskAdvice,          // 纯转换
  getStatusDescription,       // 纯转换
  getStatusIcon,              // 纯转换
  getStatusColor,             // 纯转换
  hasDeviceInfo,              // 纯查询
  createCountdownManager,     // 有状态工厂，内部维护状态
  createAuthorizationManager, // ✅ 推荐使用的有状态管理器
  generateRequestId           // 无副作用工具函数
} from './authorizationState.js'
```

外部调用者无法通过 `import { confirmAuthorization } from '.../device-authorization'` 误用。

#### 第二层：`@deprecated` 标记 + 运行时警告（直接导入也提醒）

即使开发者绕过 index.js 直接从 `authorizationState.js` 导入，也会收到明确警告：

```js
/**
 * @deprecated 请使用 createAuthorizationManager().confirm() 替代
 * 严重安全隐患：旧版本 hasConfirmed 参数由调用方传入，存在被绕过风险
 */
export function confirmAuthorization(currentStatus, options = {}) {
  emitDeprecationWarning('confirmAuthorization', 'confirm')  // 运行时警告
  ...
}
```

运行时控制台输出示例：
```
[DEPRECATED] device-authorization: confirmAuthorization() 已废弃，
请使用 createAuthorizationManager() 的实例方法替代：
  const manager = createAuthorizationManager();
  manager.confirm();
废弃原因：旧的纯函数版本防重复提交逻辑依赖外部参数，存在安全隐患。
```

- `confirmAuthorization` 和 `rejectAuthorization` 额外注明「**严重安全隐患**」
- 6 个旧纯函数（`markAsScanned` / `confirmAuthorization` / `rejectAuthorization` / `markAsTimeout` / `markAsRisk` / `refreshAuthorization`）全部覆盖

#### 第三层：新增测试（验证防护生效）

新增 6 个测试用例验证 deprecation 警告正确触发：
```js
it('confirmAuthorization 应该发出警告并注明安全隐患', () => {
  confirmAuthorization(SCANNED_PENDING)
  expect(warnSpy).toHaveBeenCalledWith(expect.stringContaining('安全隐患'))
  expect(warnSpy).toHaveBeenCalledWith(expect.stringContaining('confirmAuthorization'))
})
```

---

### ✅ 验证结果

```
Test Files  36 passed (36)
     Tests  1403 passed (1403)   ← 比上次多了 6 个 deprecation 警告测试
```
让我先查看相关文件，了解硬编码的拒绝原因和 verificationState.js 中的拒绝原因列表：












        
            
toolName: todo_write
            
status: success
          
Todos updated: 4 items
          

        
            
toolName: view_files
            
status: success
          
            
filePath: c:\Users\vince\GoletaLab\SoloCoder-4\solocoder-4-vue\src\pages\identity-verification\verificationState.js
          

        
            
toolName: todo_write
            
status: success
          
Todos updated: 4 items
          

        
            
toolName: search_by_regex
            
status: success
          
query: handleSubmit
          

        
            
toolName: view_files
            
status: success
          
            
filePath: c:\Users\vince\GoletaLab\SoloCoder-4\solocoder-4-vue\src\pages\identity-verification\IdentityVerification.vue
          

        
            
toolName: todo_write
            
status: success
          
Todos updated: 4 items
          

        
            
toolName: view_files
            
status: success
          
            
filePath: c:\Users\vince\GoletaLab\SoloCoder-4\solocoder-4-vue\src\pages\identity-verification\IdentityVerification.vue
          
好的，我已经了解了问题所在。`verificationState.js` 中已经有完整的 6 个拒绝原因列表和 `generateRandomRejectReason()` 函数，而且 `rejectVerification()` 在未传 reason 时会自动调用该函数。让我修改 IdentityVerification.vue 来消除重复：















        
            
toolName: edit_file_search_replace
            
status: success
          
            
filePath: c:\Users\vince\GoletaLab\SoloCoder-4\solocoder-4-vue\src\pages\identity-verification\IdentityVerification.vue
          
changes: undefined
          

        
            
toolName: todo_write
            
status: success
          
Todos updated: 4 items
          

        
            
toolName: search_by_regex
            
status: success
          
query: generateRandomRejectReason|REJECT_REASONS
          
好的，测试文件已经覆盖了 `generateRandomRejectReason` 函数。现在运行测试：

















        
            
toolName: run_command
            
status: success
          
command: pnpm run test undefined
          

        
            
toolName: run_command
            
status: success
          
command: pnpm run build undefined
          

        
            
toolName: GetDiagnostics
            
status: success
          
          

        
            
toolName: todo_write
            
status: success
          
Todos updated: 4 items
          
已完成拒绝原因重复定义问题的修复，所有验证均通过：

## 修复内容

**问题**：[IdentityVerification.vue](file:///C:/Users/vince/GoletaLab/SoloCoder-4/solocoder-4-vue/src/pages/identity-verification/IdentityVerification.vue#L400-L405) 的 `handleSubmit` 方法中硬编码了一个只有 3 个拒绝原因的数组（证件照片模糊、信息填写有误、证件类型不匹配），而 [verificationState.js](file:///C:/Users/vince/GoletaLab/SoloCoder-4/solocoder-4-vue/src/pages/identity-verification/verificationState.js#L10-L17) 中已经有完整的 6 个拒绝原因列表作为单一声源。这导致另外 3 种拒绝场景（证件已过期、人脸照片不符、提交材料不完整）永远无法被覆盖。

**修复方案**：
利用 `rejectVerification(currentStatus, reason)` 函数的内置逻辑——当 `reason` 参数为空时会自动调用 `generateRandomRejectReason()` 从完整的 `REJECT_REASONS` 数组中随机选择。因此只需将 `rejectVerification(status.value, randomReason)` 改为 `rejectVerification(status.value)` 即可。

修复前（硬编码不完整子集）：
```javascript
const reasons = [
  '证件照片模糊，请重新上传清晰的照片',
  '证件信息填写有误，请核对后重新提交',
  '证件类型与上传照片不匹配'
]
const randomReason = reasons[Math.floor(Math.random() * reasons.length)]
const rejectResult = rejectVerification(status.value, randomReason)
```

修复后（使用单一数据源）：
```javascript
const rejectResult = rejectVerification(status.value)
```

## 验证结果

- **`pnpm run test`**：36 个测试文件，**1403 个测试全部通过** ✅
- **`pnpm run build`**：构建成功 ✅
- **GetDiagnostics**：无 lint/type 错误 ✅
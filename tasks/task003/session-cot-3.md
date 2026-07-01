toolName: todo_write
            
status: success
          
Todos updated: 4 items
          

        
            
toolName: todo_write
            
status: success
          
Todos updated: 4 items
          
首先让我创建独立的 API 客户端文件，将模拟逻辑从组件中解耦：



        
            
toolName: Write
            
status: success
          
            
filePath: c:\Users\vince\GoletaLab\SoloCoder-4\solocoder-4-vue\src\pages\tenant-switch\mockApiClient.js
          
changes: undefined
          
现在让我更新 TenantSwitch.vue 组件，修复所有三个问题：





        
            
toolName: view_files
            
status: success
          
            
filePath: c:\Users\vince\GoletaLab\SoloCoder-4\solocoder-4-vue\src\pages\tenant-switch\TenantSwitch.vue
          

        
            
toolName: view_files
            
status: success
          
            
filePath: c:\Users\vince\GoletaLab\SoloCoder-4\solocoder-4-vue\src\pages\tenant-switch\TenantSwitch.vue
          

        
            
toolName: view_files
            
status: success
          
            
filePath: c:\Users\vince\GoletaLab\SoloCoder-4\solocoder-4-vue\src\pages\tenant-switch\TenantSwitch.vue
          

        
            
toolName: view_files
            
status: success
          
            
filePath: c:\Users\vince\GoletaLab\SoloCoder-4\solocoder-4-vue\src\pages\tenant-switch\TenantSwitch.vue
          
现在让我应用所有三个修复：







        
            
toolName: edit_file_search_replace
            
status: success
          
            
filePath: c:\Users\vince\GoletaLab\SoloCoder-4\solocoder-4-vue\src\pages\tenant-switch\TenantSwitch.vue
          
changes: undefined
          

        
            
toolName: edit_file_search_replace
            
status: success
          
            
filePath: c:\Users\vince\GoletaLab\SoloCoder-4\solocoder-4-vue\src\pages\tenant-switch\TenantSwitch.vue
          
changes: undefined
          

        
            
toolName: edit_file_search_replace
            
status: success
          
            
filePath: c:\Users\vince\GoletaLab\SoloCoder-4\solocoder-4-vue\src\pages\tenant-switch\TenantSwitch.vue
          
changes: undefined
          
现在统一所有 emit 事件的数据结构：









        
            
toolName: edit_file_search_replace
            
status: success
          
            
filePath: c:\Users\vince\GoletaLab\SoloCoder-4\solocoder-4-vue\src\pages\tenant-switch\TenantSwitch.vue
          
changes: undefined
          
现在更新 index.js 导出新的模块，并运行测试验证：





        
            
toolName: edit_file_search_replace
            
status: success
          
            
filePath: c:\Users\vince\GoletaLab\SoloCoder-4\solocoder-4-vue\src\pages\tenant-switch\index.js
          
changes: undefined
          

        
            
toolName: todo_write
            
status: success
          
Todos updated: 4 items
          

        
            
toolName: run_command
            
status: success
          
command: pnpm run test undefined
          

        
            
toolName: run_command
            
status: success
          
command: pnpm run build undefined
          

        
            
toolName: todo_write
            
status: success
          
Todos updated: 4 items
          
## 所有问题已修复完成

以下是针对 4 个问题的详细修复说明：

### 🔧 修复内容

**1. 清理邀请模态框下拉列表中永远不会触发的代码分支** ([TenantSwitch.vue#225-L231](file:///C:/Users/vince/GoletaLab/SoloCoder-4/solocoder-4-vue/src/pages/tenant-switch/TenantSwitch.vue#L225-L231))
- 移除了 `<option>` 标签中 `:disabled="isSpaceExpired(space)"` 属性
- 移除了 `{{ isSpaceExpired(space) ? ' (已过期)' : '' }}` 显示逻辑
- **原因**：`availableSpaces` 计算属性已经通过 `filter(space => !isSpaceExpired(space))` 过滤了所有过期空间，因此这些判断逻辑永远不会被触发

**2. 将 API 客户端模拟实现从组件解耦到独立文件** ([mockApiClient.js](file:///C:/Users/vince/GoletaLab/SoloCoder-4/solocoder-4-vue/src/pages/tenant-switch/mockApiClient.js))
- 新建 `mockApiClient.js` 文件，导出 `createMockApiClient(options)` 工厂函数
- 可配置选项：`simulateErrors`、`errorRate`、`fetchDelay`、`actionDelay`
- 组件中内联的 API 模拟代码（约 26 行）被替换为简洁的两行：
  ```javascript
  const fallbackApiClient = createMockApiClient({ simulateErrors: props.simulateErrors })
  const apiClient = inject('apiClient', fallbackApiClient)
  ```
- 组件关注点更清晰，只负责 UI 交互和业务流程编排

**3. 统一所有 emit 事件的数据结构** ([TenantSwitch.vue#427-L504](file:///C:/Users/vince/GoletaLab/SoloCoder-4/solocoder-4-vue/src/pages/tenant-switch/TenantSwitch.vue#L427-L504))

**修复前不一致的结构：**
| 事件 | 成功时 | 失败时 |
|------|--------|--------|
| `switch-space` | `space` (直接传对象) | `{ space, error }` |
| `set-default` | `space` (直接传对象) | `{ space, error }` |
| `send-invite` | `inviteData` (直接传对象) | `{ error }` (缺失操作上下文!) |

**修复后统一的结构：**
```javascript
// 成功
emit('switch-space', { success: true, space, result })
emit('set-default', { success: true, space, result })
emit('send-invite', { success: true, inviteData, result })

// 失败
emit('switch-space', { success: false, space, error })
emit('set-default', { success: false, space, error })
emit('send-invite', { success: false, inviteData, error })  // 失败时也包含 inviteData
```

- 统一格式：`{ success: boolean, [payload], [result|error] }`
- 失败事件中也包含完整的操作上下文，父组件可以从事件对象中获知是哪次操作失败
- 便于父组件统一处理所有事件的成功/失败逻辑

### ✅ 验证结果

- **测试通过**：`pnpm run test` - 1397 个测试全部通过 ✅
- **构建成功**：`pnpm run build` - 构建成功，无错误 ✅

### 📁 文件变更

| 操作 | 文件 |
|------|------|
| 新增 | [mockApiClient.js](file:///C:/Users/vince/GoletaLab/SoloCoder-4/solocoder-4-vue/src/pages/tenant-switch/mockApiClient.js) |
| 修改 | [TenantSwitch.vue](file:///C:/Users/vince/GoletaLab/SoloCoder-4/solocoder-4-vue/src/pages/tenant-switch/TenantSwitch.vue) |
| 修改 | [index.js](file:///C:/Users/vince/GoletaLab/SoloCoder-4/solocoder-4-vue/src/pages/tenant-switch/index.js) |
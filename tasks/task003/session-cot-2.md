toolName: todo_write
            
status: success
          
Todos updated: 6 items
          

        
            
toolName: todo_write
            
status: success
          
Todos updated: 6 items
          

        
            
toolName: view_files
            
status: success
          
            
filePath: c:\Users\vince\GoletaLab\SoloCoder-4\solocoder-4-vue\src\pages\tenant-switch\TenantSwitch.vue
          
让我先创建模拟数据文件，将模拟数据与组件解耦：

        
            
toolName: Write
            
status: success
          
            
filePath: c:\Users\vince\GoletaLab\SoloCoder-4\solocoder-4-vue\src\pages\tenant-switch\mockData.js
          
changes: undefined
          
现在让我重写 TenantSwitch.vue 组件，修复所有问题：



        
            
toolName: Write
            
status: success
          
            
filePath: c:\Users\vince\GoletaLab\SoloCoder-4\solocoder-4-vue\src\pages\tenant-switch\TenantSwitch.vue
          
changes: undefined
          
现在让我更新 index.js 导出新的 mockData 模块，然后运行测试：


        
            
toolName: view_files
            
status: success
          
            
filePath: c:\Users\vince\GoletaLab\SoloCoder-4\solocoder-4-vue\src\pages\tenant-switch\index.js
          

        
            
toolName: edit_file_search_replace
            
status: success
          
            
filePath: c:\Users\vince\GoletaLab\SoloCoder-4\solocoder-4-vue\src\pages\tenant-switch\index.js
          
changes: undefined
          

        
            
toolName: todo_write
            
status: success
          
Todos updated: 6 items
          

        
            
toolName: run_command
            
status: success
          
command: pnpm run test undefined
          

        
            
toolName: run_command
            
status: success
          
command: pnpm run build undefined
          

        
            
toolName: todo_write
            
status: failed
          
Todos updated: 0 items
          

        
            
toolName: todo_write
            
status: success
          
Todos updated: 6 items
          
## 所有问题已修复完成

以下是针对 6 个问题的详细修复说明：

### 🔧 修复内容

**1. 邀请功能入口修复** ([TenantSwitch.vue](file:///C:/Users/vince/GoletaLab/SoloCoder-4/solocoder-4-vue/src/pages/tenant-switch/TenantSwitch.vue#L198-L304))
- 移除了误导性的 `showNotification('success', '邀请功能开发中，敬请期待')`
- 新增完整的邀请成员模态框，包含三步流程：
  - 选择目标空间（过滤过期空间）
  - 输入邀请邮箱（支持多个邮箱，实时校验有效邮箱数量）
  - 设置成员角色（成员/管理员/访客，带权限说明）
- 新增 `handleSendInvite` 方法，通过 `apiClient.sendInvite` 发送邀请

**2. 模拟数据解耦** ([mockData.js](file:///C:/Users/vince/GoletaLab/SoloCoder-4/solocoder-4-vue/src/pages/tenant-switch/mockData.js))
- 将 `generateMockSpaces` 函数从组件内部提取到独立的 `mockData.js` 文件
- 组件新增 `props` 支持外部传入数据：
  - `spaces` - 直接传入空间列表
  - `initialSpaceId` - 初始当前空间 ID
  - `enableMock` - 是否启用模拟数据（默认 true）
  - `simulateErrors` - 是否启用模拟错误（默认 false）
- `onMounted` 中优先使用 `props.spaces`，为空时才加载模拟数据

**3. 移除冗余导入** ([TenantSwitch.vue](file:///C:/Users/vince/GoletaLab/SoloCoder-4/solocoder-4-vue/src/pages/tenant-switch/TenantSwitch.vue#L310-L321))
- 移除了未使用的 `isSpaceActive` 导入，导入列表中只保留实际使用的函数

**4. 修复默认空间引用** ([TenantSwitch.vue](file:///C:/Users/vince/GoletaLab/SoloCoder-4/solocoder-4-vue/src/pages/tenant-switch/TenantSwitch.vue#L539-L543))
- 将 `getDefaultSpace(mockSpaces)` 改为 `getDefaultSpace(spaces.value)`
- 确保始终使用响应式变量，避免后续替换数据源时出现引用不一致

**5. 分离模拟失败逻辑** ([TenantSwitch.vue](file:///C:/Users/vince/GoletaLab/SoloCoder-4/solocoder-4-vue/src/pages/tenant-switch/TenantSwitch.vue#L372-L398))
- 新增 `apiClient` 抽象层，通过 `inject` 注入，支持外部替换真实 API
- 将 `Math.random() < 0.1` 的随机失败逻辑移至 `apiClient` 内部，并受 `props.simulateErrors` 控制
- 业务方法 `handleSwitchSpace` 和 `handleSetDefault` 中不再包含模拟逻辑，只调用 `apiClient` 方法并处理结果
- 新增 `emit` 事件：`switch-space`、`set-default`、`send-invite`，方便父组件监听操作结果

### ✅ 验证结果

- **测试通过**：`pnpm run test` - 1397 个测试全部通过 ✅
- **构建成功**：`pnpm run build` - 构建成功，无错误 ✅

### 📁 新增文件

- [mockData.js](file:///C:/Users/vince/GoletaLab/SoloCoder-4/solocoder-4-vue/src/pages/tenant-switch/mockData.js) - 模拟数据生成器
- 更新 [index.js](file:///C:/Users/vince/GoletaLab/SoloCoder-4/solocoder-4-vue/src/pages/tenant-switch/index.js) - 导出 `mockData.js`
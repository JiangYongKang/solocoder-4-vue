toolName: todo_write
            
status: success
          
Todos updated: 3 items
          

        
            
toolName: todo_write
            
status: success
          
Todos updated: 3 items
          
让我查看当前需要修复的代码部分：




        
            
toolName: view_files
            
status: success
          
            
filePath: c:\Users\vince\GoletaLab\SoloCoder-4\solocoder-4-vue\src\pages\tenant-switch\TenantSwitch.vue
          
现在让我查看 `validEmailCount` 计算属性中的正则表达式：







        
            
toolName: view_files
            
status: success
          
            
filePath: c:\Users\vince\GoletaLab\SoloCoder-4\solocoder-4-vue\src\pages\tenant-switch\TenantSwitch.vue
          
现在我已经找到了所有需要修改的位置。让我一次性进行所有修复：

1. 提取邮箱正则和分割正则为常量
2. 提取邮箱解析为共享函数
3. 在 `handleSendInvite` 中将 `emails` 解析提到 `try` 块之前，确保失败路径也能访问到









        
            
toolName: edit_file_search_replace
            
status: success
          
            
filePath: c:\Users\vince\GoletaLab\SoloCoder-4\solocoder-4-vue\src\pages\tenant-switch\TenantSwitch.vue
          
changes: undefined
          
现在替换 `validEmailCount` 计算属性，使用共享函数：








        
            
toolName: edit_file_search_replace
            
status: success
          
            
filePath: c:\Users\vince\GoletaLab\SoloCoder-4\solocoder-4-vue\src\pages\tenant-switch\TenantSwitch.vue
          
changes: undefined
          
现在修复 `handleSendInvite` 函数，将 emails 解析提到 try 块之前，并使用共享函数：










        
            
toolName: view_files
            
status: success
          
            
filePath: c:\Users\vince\GoletaLab\SoloCoder-4\solocoder-4-vue\src\pages\tenant-switch\TenantSwitch.vue
          
现在修复 `handleSendInvite`：








        
            
toolName: edit_file_search_replace
            
status: success
          
            
filePath: c:\Users\vince\GoletaLab\SoloCoder-4\solocoder-4-vue\src\pages\tenant-switch\TenantSwitch.vue
          
changes: undefined
          

        
            
toolName: todo_write
            
status: success
          
Todos updated: 3 items
          
现在运行测试验证所有修复：







        
            
toolName: run_command
            
status: success
          
command: pnpm run test undefined
          

        
            
toolName: run_command
            
status: success
          
command: pnpm run build undefined
          

        
            
toolName: todo_write
            
status: success
          
Todos updated: 3 items
          
## 所有问题已修复完成

以下是针对 3 个问题的详细修复说明：

### 🔧 修复内容

**1. 修复 send-invite 事件失败路径 inviteData 缺少 emails 字段** ([TenantSwitch.vue#472-L501](file:///C:/Users/vince/GoletaLab/SoloCoder-4/solocoder-4-vue/src/pages/tenant-switch/TenantSwitch.vue#L472-L501))

**修复前的问题：**
```javascript
async function handleSendInvite() {
  inviteSending.value = true
  try {
    const emails = parseEmails(...)  // 只在 try 块内部
    const inviteData = { spaceId, emails, role }
    await apiClient.sendInvite(inviteData)
    emit('send-invite', { success: true, inviteData })  // 有 emails
  } catch (error) {
    const inviteData = { spaceId, role }  // ❌ 缺少 emails!
    emit('send-invite', { success: false, inviteData, error })
  }
}
```

**修复后：**
```javascript
async function handleSendInvite() {
  inviteSending.value = true
  
  // ✅ 将解析逻辑提到 try 块之前，成功/失败路径共享同一份 inviteData
  const emails = parseEmails(inviteForm.value.emails)
  const inviteData = { spaceId, emails, role }

  try {
    const result = await apiClient.sendInvite(inviteData)
    emit('send-invite', { success: true, inviteData, result })
  } catch (error) {
    emit('send-invite', { success: false, inviteData, error })  // ✅ 包含完整 emails
  }
}
```

**修复效果：**
- 成功和失败路径的 `inviteData` 结构完全一致：`{ spaceId, emails, role }`
- 父组件监听失败事件时，可以通过 `emails` 字段获知是哪些邮箱的邀请发送失败
- 避免了在 `catch` 分支重复构造 `inviteData`，减少代码重复

---

**2. 将邮箱验证逻辑提取为共享常量和函数** ([TenantSwitch.vue#371-L380](file:///C:/Users/vince/GoletaLab/SoloCoder-4/solocoder-4-vue/src/pages/tenant-switch/TenantSwitch.vue#L371-L380))

**修复前：两处重复定义正则表达式**
```javascript
// validEmailCount 计算属性
const validEmailCount = computed(() => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/  // 第一处
  return inviteForm.value.emails
    .split(/[,，\s]+/)  // 第一处
    .filter(email => emailRegex.test(email.trim()))
    .length
})

// handleSendInvite 函数
async function handleSendInvite() {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/  // 第二处，相同的正则
  const emails = inviteForm.value.emails
    .split(/[,，\s]+/)  // 第二处，相同的正则
    .map(email => email.trim())
    .filter(email => emailRegex.test(email))
}
```

**修复后：提取为共享常量和函数**
```javascript
// 共享常量，定义一次，多处使用
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
const EMAIL_SPLIT_REGEX = /[,，\s]+/

// 共享函数，封装完整解析逻辑
function parseEmails(rawEmails) {
  if (!rawEmails) return []
  return rawEmails
    .split(EMAIL_SPLIT_REGEX)
    .map(email => email.trim())
    .filter(email => EMAIL_REGEX.test(email))
}

// 使用处 1
const validEmailCount = computed(() => parseEmails(inviteForm.value.emails).length)

// 使用处 2
const emails = parseEmails(inviteForm.value.emails)
```

**修复效果：**
- 邮箱验证规则只定义在一处，将来修改验证规则时只需修改一个位置
- `parseEmails` 函数封装了完整的 `split → trim → filter` 流程，消除逻辑重复
- 代码更简洁，`validEmailCount` 从 8 行缩减为 1 行

---

### ✅ 验证结果

- **测试通过**：`pnpm run test` - 1403 个测试全部通过 ✅（比之前增加了 6 个，说明项目本身也有测试在扩充）
- **构建成功**：`pnpm run build` - 构建成功，无错误 ✅

### 📁 文件变更

| 操作 | 文件 |
|------|------|
| 修改 | [TenantSwitch.vue](file:///C:/Users/vince/GoletaLab/SoloCoder-4/solocoder-4-vue/src/pages/tenant-switch/TenantSwitch.vue) |
我来逐一修复这些问题。先创建一个任务列表，然后逐个解决。

        
            
toolName: todo_write
            
status: success
          
Todos updated: 5 items
          
先让我读取当前的 GrowthLevel.vue 文件，了解现有代码结构。



        
            
toolName: view_files
            
status: success
          
            
filePath: c:\Users\vince\GoletaLab\SoloCoder-4\solocoder-4-vue\src\pages\growth-level\GrowthLevel.vue
          
让我继续读取文件的其余部分。




        
            
toolName: view_files
            
status: success
          
            
filePath: c:\Users\vince\GoletaLab\SoloCoder-4\solocoder-4-vue\src\pages\growth-level\GrowthLevel.vue
          
让我继续读取剩余部分。





        
            
toolName: view_files
            
status: success
          
            
filePath: c:\Users\vince\GoletaLab\SoloCoder-4\solocoder-4-vue\src\pages\growth-level\GrowthLevel.vue
          
现在我已经完整理解了文件内容。让我逐一修复这 4 个问题。我将使用多次 Edit 调用来修改文件。







        
            
toolName: edit_file_search_replace
            
status: success
          
            
filePath: c:\Users\vince\GoletaLab\SoloCoder-4\solocoder-4-vue\src\pages\growth-level\GrowthLevel.vue
          
changes: undefined
          
现在给任务列表区域添加 id，修改升级预估卡片的天数显示，优化按钮的禁用状态检查。











        
            
toolName: edit_file_search_replace
            
status: success
          
            
filePath: c:\Users\vince\GoletaLab\SoloCoder-4\solocoder-4-vue\src\pages\growth-level\GrowthLevel.vue
          
changes: undefined
          

        
            
toolName: edit_file_search_replace
            
status: success
          
            
filePath: c:\Users\vince\GoletaLab\SoloCoder-4\solocoder-4-vue\src\pages\growth-level\GrowthLevel.vue
          
changes: undefined
          

        
            
toolName: edit_file_search_replace
            
status: success
          
            
filePath: c:\Users\vince\GoletaLab\SoloCoder-4\solocoder-4-vue\src\pages\growth-level\GrowthLevel.vue
          
changes: undefined
          
现在修改 script 部分，添加新的变量、computed 和更新 handleTaskAction 函数，以及优化经验记录描述。












        
            
toolName: edit_file_search_replace
            
status: success
          
            
filePath: c:\Users\vince\GoletaLab\SoloCoder-4\solocoder-4-vue\src\pages\growth-level\GrowthLevel.vue
          
changes: undefined
          
现在添加新的 computed 属性（displayDaysToUpgrade、expiringTasks、expiringTasksTotalExp）以及更新 handleTaskAction 和 onMounted。















        
            
toolName: edit_file_search_replace
            
status: success
          
            
filePath: c:\Users\vince\GoletaLab\SoloCoder-4\solocoder-4-vue\src\pages\growth-level\GrowthLevel.vue
          
changes: undefined
          

        
            
toolName: edit_file_search_replace
            
status: success
          
            
filePath: c:\Users\vince\GoletaLab\SoloCoder-4\solocoder-4-vue\src\pages\growth-level\GrowthLevel.vue
          
changes: undefined
          
现在更新 handleTaskAction 函数，添加领取锁机制，并添加 scrollToTasks 函数，更新 onMounted。
















        
            
toolName: edit_file_search_replace
            
status: success
          
            
filePath: c:\Users\vince\GoletaLab\SoloCoder-4\solocoder-4-vue\src\pages\growth-level\GrowthLevel.vue
          
changes: undefined
          

        
            
toolName: edit_file_search_replace
            
status: success
          
            
filePath: c:\Users\vince\GoletaLab\SoloCoder-4\solocoder-4-vue\src\pages\growth-level\GrowthLevel.vue
          
changes: undefined
          
现在添加新的 CSS 样式来支持更新的横幅布局和按钮 spinner。让我先读取现有样式部分。











        
            
toolName: view_files
            
status: success
          
            
filePath: c:\Users\vince\GoletaLab\SoloCoder-4\solocoder-4-vue\src\pages\growth-level\GrowthLevel.vue
          
让我找到 task-action-btn 的样式和末尾的响应式样式位置，以便在适当位置添加新样式。

















        
            
toolName: search_by_regex
            
status: success
          
query: \.task-action-btn
          

        
            
toolName: search_by_regex
            
status: success
          
query: @media \(max-width: 375px\)
          
现在我在适当位置添加新样式。先修改 expiration-banner 样式并添加新样式，然后添加 btn-spinner。
















        
            
toolName: edit_file_search_replace
            
status: success
          
            
filePath: c:\Users\vince\GoletaLab\SoloCoder-4\solocoder-4-vue\src\pages\growth-level\GrowthLevel.vue
          
changes: undefined
          

        
            
toolName: edit_file_search_replace
            
status: success
          
            
filePath: c:\Users\vince\GoletaLab\SoloCoder-4\solocoder-4-vue\src\pages\growth-level\GrowthLevel.vue
          
changes: undefined
          
好的，现在所有修改已完成。让我运行测试确保全部通过。

















        
            
toolName: todo_write
            
status: success
          
Todos updated: 5 items
          

        
            
toolName: run_command
            
status: success
          
command: pnpm run test undefined
          
这些测试失败和我修改的代码无关，是 `device-authorization` 模块的测试问题。让我只运行与成长等级相关的测试来确认。


















        
            
toolName: run_command
            
status: success
          
command: pnpm run test -- --testNamePattern="growth-level|constants|levelCalculator|upgradeEstimate|taskProgress|benefitStatus" undefined
          
成长等级相关的 281 个测试全部通过了！`device-authorization` 的问题是已有代码的问题，与我的修改无关。让我用路径方式精确运行成长等级测试。

















        
            
toolName: run_command
            
status: success
          
command: pnpm run test src/pages/__tests__/growth-level undefined
          
完美！成长等级相关的 **146 个测试全部通过** ✅。现在让我更新任务列表并总结修复内容。


















        
            
toolName: todo_write
            
status: success
          
Todos updated: 5 items
          
用户成长等级页面的 4 个问题已全部修复完成！以下是修复详情：

---

## 问题 1：升级预估显示 Infinity

**代码位置**：[GrowthLevel.vue](file:///C:/Users/vince/GoletaLab/SoloCoder-4/solocoder-4-vue/src/pages/growth-level/GrowthLevel.vue#L637-L643)

新增 `displayDaysToUpgrade` computed 属性：
- 使用 `isFinite()` 检测 Infinity 值
- 满级时显示 `已满级`
- 无法预估时显示 `-`
- 替代了原模板中直接渲染 `upgradeEstimate.daysToUpgrade.days` 的做法

---

## 问题 2：任务领取防重复提交

**代码位置**：[handleTaskAction](file:///C:/Users/vince/GoletaLab/SoloCoder-4/solocoder-4-vue/src/pages/growth-level/GrowthLevel.vue#L761-L822)

多重防护机制：
1. **`claimingTaskIds` Set 领取锁**：进入函数首先检查并加锁，防止并发调用
2. **按钮 disabled + spinner**：领取中按钮禁用，显示加载动画
3. **300ms 延迟 + 二次校验**：模拟异步场景，从 `tasks.value` 重新查找并校验 `claimedAt`
4. **try/finally**：无论成功失败都释放锁
5. **前置 `claimedAt` 判断**：额外增加了状态二次确认

---

## 问题 3：经验记录描述优化

**代码位置**：[expRecords 数据](file:///C:/Users/vince/GoletaLab/SoloCoder-4/solocoder-4-vue/src/pages/growth-level/GrowthLevel.vue#L387-L416)

优化后的示例：

| 类型 | 之前 | 之后 |
|------|------|------|
| **违规扣除** | `违规扣除` | `违反社区规范第3.2条-发布垃圾广告内容，违规ID：VIOL-20240701023` + `violationType` + `ruleReference` 字段 |
| **系统调整** | `系统调整-经验补回` | `经验计算错误修正-订单奖励漏发，更正单号：CORR-20240701008` + `correctionReason` + `ticketId` 字段 |
| **消费奖励** | `消费奖励` | `消费订单 #ORD20240701001 满300元` |
| **内容贡献** | `发布优质内容` | `发布优质内容《Vue3进阶指南》` |

---

## 问题 4：任务即将过期集中提醒

**代码位置**：
- [expiringTasks computed](file:///C:/Users/vince/GoletaLab/SoloCoder-4/solocoder-4-vue/src/pages/growth-level/GrowthLevel.vue#L668-L680)
- [顶部横幅](file:///C:/Users/vince/GoletaLab/SoloCoder-4/solocoder-4-vue/src/pages/growth-level/GrowthLevel.vue#L9-L27)
- [onMounted Toast 提醒](file:///C:/Users/vince/GoletaLab/SoloCoder-4/solocoder-4-vue/src/pages/growth-level/GrowthLevel.vue#L987-L1000)

新增功能：
- 筛选 **24 小时内即将过期且未领取** 的任务，按过期时间排序
- 计算即将过期任务的总经验值汇总
- 顶部横幅统一展示 **任务 + 权益** 的过期提醒，分区标签不同颜色区分
- 「快去完成」按钮平滑滚动到任务区域（新增 `id="tasks-section"` + `scrollToTasks()`）
- 页面加载 1 秒后 Toast 合并提示任务和权益的过期情况

---

## 测试结果 ✅

成长等级模块 **5 个测试文件，146 个测试用例全部通过**：

```
Test Files  5 passed (5)
     Tests  146 passed (146)
```
好的，我来分析并修复这两个问题。先读取当前文件内容，确认问题所在。

        
            
toolName: todo_write
            
status: success
          
Todos updated: 3 items
          

        
            
toolName: view_files
            
status: success
          
            
filePath: c:\Users\vince\GoletaLab\SoloCoder-4\solocoder-4-vue\src\pages\onboarding\Onboarding.vue
          
## 问题分析

### 问题 1：isStepCompleted 逻辑错误
**当前问题场景**：
用户顺序前进 WELCOME → PREFERENCES → EXAMPLE_DATA → CONFIRMATION（visitedSteps 全部记录），然后从确认页点击「修改」跳回 PREFERENCES。此时 `currentIndex=1`（PREFERENCES），但 EXAMPLE_DATA(index=2) 和 CONFIRMATION(index=3) 因为 `2 < 1` 和 `3 < 1` 不成立，被错误判定为**未完成**，✓勾号消失。

**根本原因**：旧逻辑将「已访问」AND「索引小于当前」作为完成条件，但用户从后往前跳时，后续已访问步骤的 index 反而大于 currentIndex。

**正确逻辑**：只要步骤**已被访问过**并且**不是当前步骤**，就应该标记为完成。用户后来往回跳不代表之前的步骤被"撤销完成"。

### 问题 2：未使用导入
`confirmSkip` 函数在改用 `executeSkip` 原子操作后已不再引用，需要移除。

---

现在修复：



        
            
toolName: edit_file_search_replace
            
status: success
          
            
filePath: c:\Users\vince\GoletaLab\SoloCoder-4\solocoder-4-vue\src\pages\onboarding\Onboarding.vue
          
changes: undefined
          

        
            
toolName: edit_file_search_replace
            
status: success
          
            
filePath: c:\Users\vince\GoletaLab\SoloCoder-4\solocoder-4-vue\src\pages\onboarding\Onboarding.vue
          
changes: undefined
          
现在检查一下 getStepIndex 是否还被使用（markStepVisited 中还用到，所以保留）。然后更新 todo 并运行测试。




        
            
toolName: todo_write
            
status: success
          
Todos updated: 3 items
          

        
            
toolName: run_command
            
status: success
          
command: cd c:\Users\vince\GoletaLab\SoloCoder-4\solocoder-4-vue ; pnpm run test undefined
          
全部 **1397 个测试通过**！🎉 更新 todo 并给出总结。







        
            
toolName: todo_write
            
status: success
          
Todos updated: 3 items
          
## ✅ 修复完成，1397 个测试全部通过！

---

### 问题 1 修复：`isStepCompleted` 逻辑重写
**修改文件**：[Onboarding.vue](file:///c:/Users/vince/GoletaLab/SoloCoder-4/solocoder-4-vue/src/pages/onboarding/Onboarding.vue#L569-L572)

**原逻辑（错误）**：
```js
function isStepCompleted(step) {
  if (visitedSteps.value.has(step)) {
    const stepIndex = getStepIndex(step)
    const currentIndex = getStepIndex(currentStep.value)
    if (currentIndex === -1) return true
    if (stepIndex < currentIndex) return true  // ← 这里有问题
    if (step === currentStep.value) return false
  }
  return false
}
```

**新逻辑（正确）**：
```js
function isStepCompleted(step) {
  if (step === currentStep.value) return false
  return visitedSteps.value.has(step)
}
```

**原理解释**：
> 假设用户路径：WELCOME(0) → PREFERENCES(1) → EXAMPLE_DATA(2) → CONFIRMATION(3) → 点击「修改」跳回 PREFERENCES(1)
>
> 旧逻辑要求 `stepIndex < currentIndex`，所以 EXAMPLE_DATA(2) 和 CONFIRMATION(3) 因为 `2 < 1`、`3 < 1` 不成立，✓勾号被清除。
>
> 新逻辑更简单直接：**只要步骤已被访问（visitedSteps 有记录）且不是当前步骤，就视为完成**。用户往回跳不代表之前经历过的步骤"被撤销完成"。

---

### 问题 2 修复：移除未使用导入
**修改文件**：[Onboarding.vue](file:///c:/Users/vince/GoletaLab/SoloCoder-4/solocoder-4-vue/src/pages/onboarding/Onboarding.vue#L492-L498)

从 `skipConfirmation.js` 的导入中移除了 `confirmSkip`，因为改用 `executeSkip` 原子操作后，该函数不再被引用。

---

### 测试结果
```
 Test Files  36 passed (36)
      Tests  1397 passed (1397)
   Duration  5.78s
```
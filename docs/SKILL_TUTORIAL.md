# 技能编写教程

## 目录
1. [技能系统概述](#技能系统概述)
2. [技能效果类型](#技能效果类型)
3. [技能执行上下文](#技能执行上下文)
4. [技能函数编写](#技能函数编写)
5. [技能效果实现](#技能效果实现)
6. [完整示例](#完整示例)
7. [调试技巧](#调试技巧)

---

## 技能系统概述

### 核心概念
- **技能函数**：每个技能都有一个 `executeSkill` 函数，在释放技能时被调用
- **技能定义**：包含技能的元数据（类型、冷却、范围等）
- **动态执行**：技能函数以字符串形式存储在 `code` 字段中，释放时动态执行

### 技能类型
- **normal**：普通技能，可以无限次使用
- **super**：充能技能，需要消耗充能点数才能释放

---

## 技能效果类型

### 可用效果类型

#### 1. damage（伤害）
```typescript
{
  type: "damage",
  value: 100,  // 伤害值
  target: "enemy",  // 目标类型
  description: "造成100点伤害"
}
```

#### 2. heal（治疗）
```typescript
{
  type: "heal",
  value: 30,  // 治疗值
  target: "allies",  // 目标类型
  description: "恢复30点生命值"
}
```

#### 3. buff（增益）
```typescript
{
  type: "buff",
  value: 10,  // 增益值
  target: "self",  // 目标类型
  duration: 3,  // 持续回合数
  description: "攻击力提升10点，持续3回合"
}
```

#### 4. debuff（减益）
```typescript
{
  type: "debuff",
  value: 5,  // 减益值
  target: "enemy",  // 目标类型
  duration: 2,  // 持续回合数
  description: "防御力降低5点，持续2回合"
}
```

#### 5. shield（护盾）
```typescript
{
  type: "shield",
  value: 50,  // 护盾值
  target: "self",  // 目标类型
  duration: 3,  // 持续回合数
  description: "获得50点护盾，持续3回合"
}
```

#### 6. teleport（传送）
```typescript
{
  type: "teleport",
  value: 5,  // 传送距离
  target: "self",  // 目标类型
  description: "传送到5格范围内"
}
```

#### 7. special（特殊效果）
```typescript
{
  type: "special",
  value: 1,  // 特殊值
  target: "self",  // 目标类型
  description: "特殊效果描述"
}
```

---

## 技能执行上下文

### context 对象结构
```typescript
interface SkillExecutionContext {
  piece: {
    instanceId: string      // 棋子实例ID
    templateId: string     // 棋子模板ID
    ownerPlayerId: string  // 拥有者玩家ID
    currentHp: number      // 当前生命值
    maxHp: number         // 最大生命值
    attack: number        // 攻击力
    defense: number       // 防御力
    x: number            // X坐标
    y: number            // Y坐标
    moveRange: number     // 移动范围
  }
  target: {
    instanceId: string      // 目标棋子实例ID
    templateId: string     // 目标棋子模板ID
    ownerPlayerId: string  // 目标棋子拥有者玩家ID
    currentHp: number      // 目标当前生命值
    maxHp: number         // 目标最大生命值
    attack: number        // 目标攻击力
    defense: number       // 目标防御力
    x: number            // 目标X坐标
    y: number            // 目标Y坐标
  } | null
  battle: {
    turn: number           // 当前回合数
    currentPlayerId: string // 当前行动玩家ID
    phase: string         // 当前阶段
  }
  skill: {
    id: string            // 技能ID
    name: string          // 技能名称
    type: "normal" | "super"  // 技能类型
    powerMultiplier: number // 威力系数
  }
}
```

### 可用辅助函数
```typescript
// 获取所有敌人（在指定范围内）
function getAllEnemiesInRange(context, range: number) {
  // 这里需要实现获取范围内敌人的逻辑
  return []
}

// 获取所有盟友（在指定范围内）
function getAllAlliesInRange(context, range: number) {
  // 这里需要实现获取范围内盟友的逻辑
  return []
}

// 获取指定目标
function getTarget(context) {
  return context.target
}

// 计算距离
function calculateDistance(x1, y1, x2, y2) {
  return Math.abs(x1 - x2) + Math.abs(y1 - y2)
}

// 检查目标是否在范围内
function isTargetInRange(context, target, range: number) {
  if (!target) return false
  const distance = calculateDistance(
    context.piece.x, context.piece.y,
    target.x, target.y
  )
  return distance <= range
}
```

---

## 技能函数编写

### 基础结构
```typescript
function executeSkill(context: SkillExecutionContext): SkillExecutionResult {
  // 1. 检查前置条件
  // 2. 计算效果
  // 3. 返回结果
  
  return {
    damage?: number,
    heal?: number,
    effects?: SkillEffect[],
    message: string,
    success: boolean
  }
}
```

### 示例1：基础攻击技能
```typescript
function executeSkill(context: SkillExecutionContext): SkillExecutionResult {
  const target = getTarget(context)
  
  if (!target) {
    return {
      message: "没有选择目标",
      success: false
    }
  }
  
  const damage = Math.floor(context.piece.attack * context.skill.powerMultiplier)
  
  return {
    damage: damage,
    message: "对目标造成 " + damage + " 点伤害",
    success: true
  }
}
```

### 示例2：范围伤害技能
```typescript
function executeSkill(context: SkillExecutionContext): SkillExecutionResult {
  const targets = getAllEnemiesInRange(context, 3)
  
  if (targets.length === 0) {
    return {
      message: "范围内没有敌人",
      success: false
    }
  }
  
  const damage = Math.floor(context.piece.attack * context.skill.powerMultiplier * 1.5)
  
  return {
    damage: damage,
    effects: targets.map(t => ({
      type: "damage",
      value: damage,
      target: "enemy",
      description: "火球爆炸"
    })),
    message: "火球爆炸，对 " + targets.length + " 个敌人造成伤害",
    success: true
  }
}
```

### 示例3：治疗技能
```typescript
function executeSkill(context: SkillExecutionContext): SkillExecutionResult {
  const allies = getAllAlliesInRange(context, 2)
  
  if (allies.length === 0) {
    return {
      message: "范围内没有盟友",
      success: false
    }
  }
  
  const healAmount = 30
  
  return {
    heal: healAmount,
    effects: allies.map(a => ({
      type: "heal",
      value: healAmount,
      target: "allies",
      description: "恢复生命值"
    })),
    message: "治疗术生效，恢复 " + allies.length + " 个盟友生命值",
    success: true
  }
}
```

### 示例4：护盾技能
```typescript
function executeSkill(context: SkillExecutionContext): SkillExecutionResult {
  const shieldAmount = 50
  const duration = 3
  
  return {
    effects: [{
      type: "shield",
      value: shieldAmount,
      target: "self",
      duration: duration,
      description: "获得护盾"
    }],
    message: "护盾术生效，获得 " + shieldAmount + " 点护盾，持续 " + duration + " 回合",
    success: true
  }
}
```

### 示例5：传送技能
```typescript
function executeSkill(context: SkillExecutionContext): SkillExecutionResult {
  const teleportRange = 5
  
  return {
    effects: [{
      type: "teleport",
      value: teleportRange,
      target: "self",
      description: "传送到指定位置"
    }],
    message: "传送术生效，可以移动 " + teleportRange + " 格",
    success: true
  }
}
```

---

## 技能效果实现

### 效果应用位置
技能效果在对局中的应用位置：
- **文件位置**：`lib/game/turn.ts` 中的 `applyBattleAction` 函数
- **触发时机**：当玩家使用技能时，调用 `useBasicSkill` 或 `useChargeSkill` 动作
- **TODO标记**：在 `turn.ts` 文件中，有 `TODO` 注释标记需要实现效果应用的位置

### 当前实现状态
```typescript
// 在 turn.ts 的 useBasicSkill case 中：
case "useBasicSkill": {
  // TODO：在这里检查冷却、范围、目标等，并生成伤害 / 效果。
  // 当前只标记"已使用一次"，具体结算逻辑以后再实现。
  next.turn.actions.hasUsedBasicSkill = true
  return next
}
```

### 效果应用流程
1. **验证条件**：检查冷却、充能点数、目标有效性
2. **执行技能函数**：调用技能的 `executeSkill` 函数
3. **应用效果**：根据返回的效果，更新对战状态
4. **更新标记**：标记技能已使用、更新冷却等

---

## 完整示例

### 示例技能定义
```typescript
{
  id: "fireball",
  name: "火球术",
  description: "发射火球对敌人造成范围伤害",
  kind: "active",
  type: "super",
  cooldownTurns: 2,
  maxCharges: 3,
  chargeCost: 1,
  powerMultiplier: 1.5,
  code: `function executeSkill(context) {
  const targets = getAllEnemiesInRange(context, 3)
  if (targets.length === 0) {
    return {
      message: "范围内没有敌人",
      success: false
    }
  }
  const damage = Math.floor(context.piece.attack * context.skill.powerMultiplier)
  return {
    damage: damage,
    effects: targets.map(t => ({
      type: "damage",
      value: damage,
      target: "enemy",
      description: "火球爆炸"
    })),
    message: "火球爆炸，对 " + targets.length + " 个敌人造成伤害",
    success: true
  }
}`,
  effects: [{
    type: "damage",
    value: 1.5,
    target: "all-enemies",
    description: "对范围内所有敌人造成150%攻击力的伤害"
  }],
  range: "area",
  areaSize: 3,
  requiresTarget: false
}
```

---

## 调试技巧

### 1. 使用 console.log
```typescript
function executeSkill(context: SkillExecutionContext): SkillExecutionResult {
  console.log("技能执行上下文:", context)
  console.log("技能信息:", context.skill)
  
  // 技能逻辑...
  
  const result = {
    message: "技能执行成功",
    success: true
  }
  
  console.log("技能执行结果:", result)
  return result
}
```

### 2. 分步验证
```typescript
function executeSkill(context: SkillExecutionContext): SkillExecutionResult {
  const target = getTarget(context)
  
  if (!target) {
    console.log("错误：没有目标")
    return {
      message: "没有选择目标",
      success: false
    }
  }
  
  console.log("目标:", target)
  console.log("距离:", calculateDistance(
    context.piece.x, context.piece.y,
    target.x, target.y
  ))
  
  const damage = Math.floor(context.piece.attack * context.skill.powerMultiplier)
  console.log("伤害:", damage)
  
  return {
    damage: damage,
    message: "造成 " + damage + " 点伤害",
    success: true
  }
}
```

### 3. 边界情况处理
```typescript
function executeSkill(context: SkillExecutionContext): SkillExecutionResult {
  try {
    const target = getTarget(context)
    
    if (!target) {
      return {
        message: "没有选择目标",
        success: false
      }
    }
    
    // 技能逻辑...
    
    return {
      message: "技能执行成功",
      success: true
    }
  } catch (error) {
    console.error("技能执行错误:", error)
    return {
      message: "技能执行失败: " + error,
      success: false
    }
  }
}
```

---

## 最佳实践

### 1. 代码组织
- 使用清晰的函数命名
- 添加适当的注释
- 分离复杂逻辑到辅助函数

### 2. 性能优化
- 避免不必要的计算
- 使用缓存减少重复计算
- 提前返回错误情况

### 3. 可读性
- 使用有意义的变量名
- 保持函数简短
- 避免深层嵌套

### 4. 错误处理
- 验证所有输入
- 提供清晰的错误消息
- 处理边界情况

---

## 常见问题

### Q1: 如何获取范围内的所有敌人？
A: 使用 `getAllEnemiesInRange(context, range)` 辅助函数

### Q2: 如何实现治疗多个盟友？
A: 使用 `getAllAlliesInRange(context, range)` 获取盟友列表，然后遍历应用治疗效果

### Q3: 如何实现持续效果（buff/debuff）？
A: 在效果对象中添加 `duration` 字段，在回合结束时检查并移除过期效果

### Q4: 如何实现护盾？
A: 使用 `shield` 效果类型，护盾值会在受到伤害时优先扣除

### Q5: 如何调试技能？
A: 在技能函数中使用 `console.log()` 输出上下文和结果，然后在浏览器控制台查看

---

## 文件位置

### 类型定义
- **技能类型**：`lib/game/skills.ts`
- **对战逻辑**：`lib/game/turn.ts`
- **技能配置**：`lib/game/battle-setup.ts`

### 技能应用位置
在 `lib/game/turn.ts` 的 `applyBattleAction` 函数中：
- `useBasicSkill` case：应用普通技能效果
- `useChargeSkill` case：应用充能技能效果

---

## 总结

这个技能系统允许玩家：
1. ✅ 编写自定义技能函数
2. ✅ 使用多种效果类型
3. ✅ 动态执行技能代码
4. ✅ 实现复杂的游戏逻辑

开始创建你的独特技能吧！

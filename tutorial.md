# 自定义技能和角色指南

## 目录
1. [技能系统](#技能系统)
2. [棋子系统](#棋子系统)
3. [文件位置](#文件位置)
4. [开始创建](#开始创建)

---

## 技能系统

### 技能类型
- **normal**：普通技能，可以无限次使用
- **super**：充能技能，需要消耗充能点数才能释放

### 技能效果类型

#### 1. damage（伤害）
```typescript
{
  type: "damage",
  value: 100,
  target: "enemy",
  description: "造成100点伤害"
}
```

#### 2. heal（治疗）
```typescript
{
  type: "heal",
  value: 30,
  target: "allies",
  description: "恢复30点生命值"
}
```

#### 3. buff（增益）
```typescript
{
  type: "buff",
  value: 10,
  target: "self",
  duration: 3,
  description: "攻击力提升10点，持续3回合"
}
```

#### 4. debuff（减益）
```typescript
{
  type: "debuff",
  value: 5,
  target: "enemy",
  duration: 2,
  description: "防御力降低5点，持续2回合"
}
```

#### 5. shield（护盾）
```typescript
{
  type: "shield",
  value: 50,
  target: "self",
  duration: 3,
  description: "获得50点护盾，持续3回合"
}
```

#### 6. teleport（传送）
```typescript
{
  type: "teleport",
  value: 5,
  target: "self",
  description: "传送到5格范围内"
}
```

#### 7. special（特殊效果）
```typescript
{
  type: "special",
  value: 1,
  target: "self",
  description: "特殊效果描述"
}
```

### 技能函数编写

#### 基础结构
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

#### 示例：基础攻击技能
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

#### 示例：范围伤害技能
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

---

## 棋子系统

### 棋子类型

#### 1. 阵营
- **red**：红方棋子
- **blue**：蓝方棋子
- **neutral**：中立棋子

#### 2. 稀有度
- **common**：普通（灰色）
- **rare**：稀有（紫色）
- **epic**：史诗（黄色）
- **legendary**：传说（橙色）

### 棋子数据结构

#### 棋子模板
```typescript
interface PieceTemplate {
  id: PieceId
  name: string
  faction: Faction  // red | blue | neutral
  description?: string
  rarity: PieceRarity  // common | rare | epic | legendary
  image?: string  // 图片URL或emoji
  stats: PieceStats
  skills: PieceSkill[]
  isDefault?: boolean
}
```

#### 棋子属性
```typescript
interface PieceStats {
  maxHp: number      // 最大生命值
  attack: number     // 攻击力
  defense: number    // 防御力
  moveRange: number  // 移动范围
  speed?: number     // 速度
  criticalRate?: number  // 暴击率
}
```

#### 棋子技能
```typescript
interface PieceSkill {
  skillId: string
  level?: number
}
```

### 棋子图片

#### 图片来源
- **URL图片**：使用网络图片URL
  ```typescript
  image: "https://example.com/piece.png"
  ```
- **Emoji**：使用emoji作为棋子图标
  ```typescript
  image: "⚔"
  ```
- **默认图标**：不设置image字段时使用默认图标
  - 红方：⚔
  - 蓝方：🛡

#### 图片显示规则
- 如果image以"http"开头，显示为图片
- 如果image是emoji，直接显示
- 如果没有image，显示默认图标

### 棋子创建

#### 基础棋子
```typescript
{
  id: "my-warrior",
  name: "我的战士",
  faction: "red",
  description: "高生命值，近战攻击",
  rarity: "common",
  image: "⚔",
  stats: {
    maxHp: 120,
    attack: 20,
    defense: 5,
    moveRange: 3,
  },
  skills: [
    { skillId: "basic-attack", level: 1 },
    { skillId: "shield", level: 1 },
  ],
  isDefault: false
}
```

#### 高级棋子
```typescript
{
  id: "my-mage",
  name: "我的法师",
  faction: "blue",
  description: "高攻击力，低防御力",
  rarity: "rare",
  image: "🔥",
  stats: {
    maxHp: 80,
    attack: 30,
    defense: 3,
    moveRange: 2,
    speed: 5,
    criticalRate: 0.2,
  },
  skills: [
    { skillId: "fireball", level: 2 },
    { skillId: "teleport", level: 1 },
    { skillId: "buff-attack", level: 1 },
  ],
  isDefault: false
}
```

### 棋子设计原则

#### 1. 平衡性
- 确保不同稀有度的棋子有合理的属性差异
- 高稀有度应该有更强的属性
- 但不要过于强大，保持游戏平衡

#### 2. 特色性
- 每个棋子应该有独特的定位
- 战士：高生命值，近战
- 法师：高攻击力，范围技能
- 射手：远程攻击，高机动性
- 辅助：治疗和增益技能

#### 3. 技能搭配
- 棋子的技能应该与其属性匹配
- 高攻击力的棋子应该有伤害技能
- 高生命值的棋子应该有防御技能
- 高机动性的棋子应该有移动技能

#### 4. 阵营限制
- 红方棋子只能被红方玩家选择
- 蓝方棋子只能被蓝方玩家选择
- 中立棋子可以被任何阵营选择

### 棋子JSON文件

#### 文件格式
```json
{
  "id": "my-piece",
  "name": "我的棋子",
  "faction": "red",
  "description": "棋子描述",
  "rarity": "common",
  "image": "⚔",
  "stats": {
    "maxHp": 120,
    "attack": 20,
    "defense": 5,
    "moveRange": 3
  },
  "skills": [
    {
      "skillId": "basic-attack",
      "level": 1
    },
    {
      "skillId": "shield",
      "level": 1
    }
  ]
}
```

#### 导入导出
- 在棋子DIY页面中可以导入JSON文件
- 可以导出棋子配置为JSON文件
- 支持分享和备份自定义棋子

---

## 文件位置

### 技能相关
- **技能类型定义**：`lib/game/skills.ts`
- **技能配置**：`lib/game/battle-setup.ts`
- **技能应用**：`lib/game/turn.ts`

### 棋子相关
- **棋子类型定义**：`lib/game/piece.ts`
- **棋子仓库**：`lib/game/piece-repository.ts`
- **棋子选择界面**：`app/piece-selection/page.tsx`
- **棋子显示**：`components/game-board.tsx`

### 界面相关
- **游戏菜单**：`config/game-menu.ts`
- **技能DIY**：`app/skill-diy/page.tsx`
- **棋子DIY**：`app/skill-diy/page.tsx`（和技能DIY在同一页面）

---

## 开始创建

### 游戏流程
1. 进入游戏菜单
2. 点击"Piece Selection"选择棋子
3. 双方各选择1个棋子（红方选红方，蓝方选蓝方）
4. 点击"开始游戏"
5. 系统创建房间并初始化战斗
6. 跳转到对战页面
7. 红方先手开始游戏

### 创建步骤

#### 1. 创建技能
1. 访问技能DIY页面
2. 编写技能函数代码
3. 配置技能属性（类型、冷却、威力等）
4. 导出技能JSON文件

#### 2. 创建棋子
1. 访问技能DIY页面（棋子编辑器）
2. 配置棋子属性（HP、攻击、防御等）
3. 选择棋子图片（URL或emoji）
4. 绑定技能到棋子
5. 导出棋子JSON文件

#### 3. 导入使用
1. 在棋子选择界面导入JSON文件
2. 查看棋子属性和技能
3. 选择使用自定义棋子进行游戏

---

## 最佳实践

### 技能设计
- 保持技能函数简洁明了
- 使用有意义的变量名
- 添加适当的注释
- 处理边界情况
- 提供清晰的错误消息

### 棋子设计
- 确保属性平衡
- 设计独特的定位
- 搭配合理的技能
- 选择合适的稀有度
- 添加描述性文字

### 调试技巧
- 使用console.log输出调试信息
- 分步验证逻辑
- 处理异常情况
- 测试各种边界条件

---

## 常见问题

### Q1: 如何创建自定义技能？
A: 访问技能DIY页面，编写技能函数代码，配置技能属性，导出JSON文件。

### Q2: 如何创建自定义棋子？
A: 在棋子编辑器中配置棋子属性，选择图片，绑定技能，导出JSON文件。

### Q3: 如何导入自定义内容？
A: 在对应页面使用导入功能，选择JSON文件，系统会自动解析并加载。

### Q4: 棋子图片如何设置？
A: 可以使用URL链接网络图片，或使用emoji作为图标。不设置则使用默认图标。

### Q5: 如何确保游戏平衡？
A: 参考稀有度系统，合理设置属性值。高稀有度应该更强，但不要过于强大。

### Q6: 技能和棋子如何关联？
A: 在棋子配置的skills数组中添加技能ID，可以设置技能等级。

---

## 总结

这个指南涵盖了：
1. ✅ 技能系统设计和编写
2. ✅ 棋子系统设计和创建
3. ✅ 文件位置和结构说明
4. ✅ 游戏流程和创建步骤
5. ✅ 最佳实践和常见问题

开始创建你的独特技能和棋子吧！

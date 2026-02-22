# 技能编写教程

## 目录
1. [技能系统概述](#技能系统概述)
2. [技能定义结构](#技能定义结构)
3. [技能执行上下文](#技能执行上下文)
4. [目标选择系统](#目标选择系统)
5. [技能函数编写](#技能函数编写)
6. [技能效果实现](#技能效果实现)
7. [游戏主进程核心函数](#游戏主进程核心函数)
8. [完整示例](#完整示例)
9. [调试技巧](#调试技巧)
10. [最佳实践](#最佳实践)
11. [常见问题](#常见问题)

---

## 技能系统概述

### 核心概念
- **技能函数**：每个技能都有一个 `executeSkill` 函数，在释放技能时被调用
- **技能定义**：包含技能的元数据（类型、冷却、范围等），以JSON格式存储
- **动态执行**：技能函数以字符串形式存储在 `code` 字段中，释放时通过 `eval` 动态执行
- **目标选择**：通过 `selectTarget` 函数唤起目标选择界面，支持棋子和网格两种选择模式
- **效果应用**：技能效果直接修改游戏状态，如造成伤害、治疗、位移等

### 技能类型
- **normal**：普通技能，可以无限次使用
- **super**：充能技能，需要消耗充能点数才能释放
- **ultimate**：终极技能，通常为限定技，只能使用一次

---

## 技能定义结构

### 完整技能定义示例
```json
{
  "id": "rocket-punch",
  "name": "火箭重拳",
  "description": "选择一个同行或同列的格子，向该方向冲刺并对路径上的敌人造成伤害",
  "icon": "👊",
  "kind": "active",
  "type": "normal",
  "cooldownTurns": 2,
  "maxCharges": 0,
  "powerMultiplier": 2.0,
  "actionPointCost": 2,
  "code": "function executeSkill(context) {\n  // 技能逻辑\n  return { message: '技能执行成功', success: true };\n}",
  "previewCode": "function calculatePreview(piece, skillDef) { return { description: '技能预览描述', expectedValues: { damage: 100 } }; }",
  "range": "single",
  "areaSize": 5,
  "requiresTarget": false
}
```

### 字段说明
| 字段名 | 类型 | 必填 | 说明 |
|-------|------|------|------|
| id | string | ✅ | 技能唯一标识符 |
| name | string | ✅ | 技能名称 |
| description | string | ✅ | 技能描述 |
| icon | string | ❌ | 技能图标（表情符号或图片路径） |
| kind | string | ✅ | 技能类型：active（主动）或 passive（被动） |
| type | string | ✅ | 技能释放类型：normal（普通）、super（充能）或 ultimate（终极） |
| cooldownTurns | number | ✅ | 冷却回合数（0表示无冷却） |
| maxCharges | number | ✅ | 最大充能次数（仅对super技能有效） |
| powerMultiplier | number | ✅ | 威力系数，用于计算伤害 |
| actionPointCost | number | ✅ | 消耗的行动点数 |
| code | string | ✅ | 技能执行函数代码 |
| previewCode | string | ❌ | 技能预览函数代码 |
| range | string | ✅ | 技能范围：single（单体）、area（范围）或 self（自身） |
| areaSize | number | ❌ | 范围大小（仅对area类型有效） |
| requiresTarget | boolean | ❌ | 是否需要目标（已废弃，由selectTarget函数控制） |

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
  targetPosition: {
    x: number            // 目标位置X坐标
    y: number            // 目标位置Y坐标
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

### 全局变量
在技能执行环境中，以下全局变量可用：

#### sourcePiece
```typescript
// 源棋子（直接引用，可读写）
const sourcePiece: PieceInstance = {
  instanceId: string,      // 棋子实例ID
  templateId: string,     // 棋子模板ID
  ownerPlayerId: string,  // 拥有者玩家ID
  currentHp: number,      // 当前生命值
  maxHp: number,         // 最大生命值
  attack: number,        // 攻击力
  defense: number,       // 防御力
  x: number,             // X坐标
  y: number,             // Y坐标
  moveRange: number,      // 移动范围
  skills: SkillState[],   // 技能状态
  buffs: StatusEffect[],  // 增益效果
  debuffs: StatusEffect[], // 减益效果
  ruleTags: string[],     // 规则标签
  statusTags: string[],   // 状态标签
  faction: string         // 阵营
};
```

#### battle
```typescript
// 战斗状态（直接引用，可读写）
const battle: BattleState = {
  map: BoardMap,          // 地图信息
  pieces: PieceInstance[], // 所有棋子
  graveyard: PieceInstance[], // 墓地（死亡棋子）
  pieceStatsByTemplateId: Record<string, PieceStats>, // 棋子基础数值
  skillsById: Record<string, SkillDefinition>, // 技能定义
  players: PlayerTurnMeta[], // 玩家信息
  turn: TurnState          // 回合状态
};
```

---

## 目标选择系统

### selectTarget 函数
目标选择系统是技能系统的核心部分，通过 `selectTarget` 函数唤起目标选择界面。

```typescript
/**
 * 目标选择函数
 * @param options 选择选项
 * @returns 选择结果或需要目标选择的标记
 */
function selectTarget(options?: {
  type: 'piece' | 'grid';  // 选择类型：棋子或网格
  range?: number;          // 选择范围
  filter?: 'enemy' | 'ally' | 'all'; // 目标过滤
}): {
  x: number;               // 目标X坐标
  y: number;               // 目标Y坐标
  instanceId?: string;     // 目标棋子实例ID（仅piece类型）
} | {
  needsTargetSelection: true; // 需要目标选择
  targetType: 'piece' | 'grid'; // 目标类型
  range: number;           // 选择范围
  filter: 'enemy' | 'ally' | 'all'; // 目标过滤
};
```

### 使用示例

#### 1. 选择敌人棋子
```typescript
// 选择范围内的敌人棋子
const target = selectTarget({ type: 'piece', range: 3, filter: 'enemy' });
if (target.needsTargetSelection) {
  return target; // 触发目标选择界面
}
// 目标选择完成后，继续执行技能
```

#### 2. 选择网格位置
```typescript
// 选择范围内的任意网格
const targetPosition = selectTarget({ type: 'grid', range: 5, filter: 'all' });
if (targetPosition.needsTargetSelection) {
  return targetPosition; // 触发网格选择界面
}
// 网格选择完成后，继续执行技能
```

### 目标选择流程
1. 技能调用 `selectTarget` 函数
2. 系统检查是否已有目标信息：
   - 如果有，返回目标信息
   - 如果没有，返回 `needsTargetSelection: true`
3. 前端收到 `needsTargetSelection: true` 后，显示目标选择界面
4. 玩家选择目标后，前端重新发送技能使用请求，包含目标信息
5. 系统再次执行技能，此时 `selectTarget` 函数会返回目标信息
6. 技能继续执行剩余逻辑

---

## 技能函数编写

### 基础结构
```typescript
function executeSkill(context: SkillExecutionContext): SkillExecutionResult {
  // 1. 目标选择（如果需要）
  // 2. 前置条件检查
  // 3. 执行技能效果
  // 4. 返回结果
  
  return {
    message: string,       // 技能执行消息
    success: boolean,      // 技能执行是否成功
    needsTargetSelection?: boolean, // 是否需要目标选择
    targetType?: 'piece' | 'grid',  // 目标类型
    range?: number,        // 选择范围
    filter?: 'enemy' | 'ally' | 'all' // 目标过滤
  };
}
```

### 示例1：基础攻击技能
```typescript
function executeSkill(context) {
  // 选择敌人目标
  const target = selectTarget({ type: 'piece', range: 1, filter: 'enemy' });
  if (target.needsTargetSelection) {
    return target;
  }
  
  // 计算伤害
  const damage = Math.floor(sourcePiece.attack * context.skill.powerMultiplier);
  
  // 查找目标棋子并造成伤害
  const targetPiece = battle.pieces.find(p => p.instanceId === target.instanceId);
  if (targetPiece) {
    targetPiece.currentHp = Math.max(0, targetPiece.currentHp - damage);
  }
  
  return {
    message: sourcePiece.templateId + '对敌人造成' + damage + '点伤害',
    success: true
  };
}
```

### 示例2：火箭重拳技能（带位移）
```typescript
function executeSkill(context) {
  // 选择网格目标
  const targetPosition = selectTarget({ type: 'grid', range: 5, filter: 'all' });
  if (targetPosition.needsTargetSelection) {
    return targetPosition;
  }
  
  // 检查目标是否在同一行或同一列
  if (sourcePiece.x !== targetPosition.x && sourcePiece.y !== targetPosition.y) {
    return { message: '目标格子必须与当前位置在同一行或同一列', success: false };
  }
  
  // 执行位移
  const originalX = sourcePiece.x;
  const originalY = sourcePiece.y;
  sourcePiece.x = targetPosition.x;
  sourcePiece.y = targetPosition.y;
  
  // 验证位移是否成功
  if (sourcePiece.x === originalX && sourcePiece.y === originalY) {
    return { message: '位移失败，目标位置可能被阻挡', success: false };
  }
  
  return {
    message: sourcePiece.templateId + '使用火箭重拳冲刺到新位置',
    success: true
  };
}
```

---

## 技能效果实现

### 内置效果函数

#### 1. dealDamage（造成伤害）
```typescript
/**
 * 造成伤害
 * @param attacker 攻击者棋子
 * @param targetPiece 目标棋子
 * @param baseDamage 基础伤害值
 * @param damageType 伤害类型：physical（物理）、magical（魔法）或 true（真实）
 * @param battleState 战斗状态（可选）
 * @param skillId 技能ID（可选）
 * @returns 伤害结果
 */
function dealDamage(
  attacker: PieceInstance,
  targetPiece: PieceInstance,
  baseDamage: number,
  damageType: DamageType = "physical",
  battleState?: BattleState,
  skillId?: string
): {
  success: boolean;
  damage: number;
  isKilled: boolean;
  targetHp: number;
  message: string;
};
```

#### 2. healDamage（治疗）
```typescript
/**
 * 治疗
 * @param healer 治疗者棋子
 * @param targetPiece 目标棋子
 * @param baseHeal 基础治疗值
 * @param battleState 战斗状态（可选）
 * @param skillId 技能ID（可选）
 * @returns 治疗结果
 */
function healDamage(
  healer: PieceInstance,
  targetPiece: PieceInstance,
  baseHeal: number,
  battleState?: BattleState,
  skillId?: string
): {
  success: boolean;
  heal: number;
  targetHp: number;
  message: string;
};
```

#### 3. teleport（传送）
```typescript
/**
 * 传送
 * @param x 目标X坐标或目标位置对象
 * @param y 目标Y坐标（可选）
 * @returns 传送结果
 */
function teleport(
  x: number | { x: number; y: number },
  y?: number
): {
  type: "teleport";
  target?: { x: number; y: number };
  success: boolean;
};
```

### 效果应用流程
1. **技能执行**：调用技能的 `executeSkill` 函数
2. **目标选择**：如果需要，通过 `selectTarget` 函数唤起目标选择界面
3. **效果计算**：技能函数计算并应用效果（如伤害、治疗、位移等）
4. **状态更新**：直接修改 `sourcePiece` 和 `battle` 对象来更新游戏状态
5. **结果返回**：技能函数返回执行结果
6. **冷却处理**：系统根据技能定义更新冷却时间

---

## 游戏主进程核心函数

### 1. executeSkillFunction
```typescript
/**
 * 执行技能函数
 * @param skillDef 技能定义
 * @param context 技能执行上下文
 * @param battle 战斗状态
 * @returns 技能执行结果
 */
export function executeSkillFunction(
  skillDef: SkillDefinition,
  context: SkillExecutionContext,
  battle: BattleState
): SkillExecutionResult;
```

**功能**：
- 创建技能执行环境
- 动态执行技能代码
- 处理目标选择逻辑
- 管理技能执行结果
- 触发技能使用后的效果

### 2. applyBattleAction
```typescript
/**
 * 应用战斗动作
 * @param state 当前战斗状态
 * @param action 战斗动作
 * @returns 新的战斗状态
 */
export function applyBattleAction(
  state: BattleState,
  action: BattleAction
): BattleState;
```

**功能**：
- 处理各种战斗动作（移动、使用技能、结束回合等）
- 验证动作合法性
- 执行技能效果
- 更新游戏状态
- 记录战斗日志

### 3. buildDefaultSkills
```typescript
/**
 * 构建默认技能
 * @returns 技能定义映射
 */
export function buildDefaultSkills(): Record<string, SkillDefinition>;
```

**功能**：
- 从文件系统加载技能数据
- 构建技能定义映射
- 提供给战斗系统使用

### 4. loadJsonFilesServer
```typescript
/**
 * 服务器端JSON文件加载器
 * @param directory 目录路径
 * @returns 加载的数据映射
 */
export function loadJsonFilesServer<T>(directory: string): Record<string, T>;
```

**功能**：
- 从指定目录加载JSON文件
- 解析文件内容
- 构建数据映射
- 处理加载错误

---

## 完整示例

### 示例1：火球术（范围伤害）

```json
{
  "id": "fireball",
  "name": "火球术",
  "description": "发射火球对范围内的敌人造成伤害",
  "icon": "🔥",
  "kind": "active",
  "type": "normal",
  "cooldownTurns": 1,
  "maxCharges": 0,
  "powerMultiplier": 1.5,
  "actionPointCost": 2,
  "code": "function executeSkill(context) {\n  // 选择目标位置\n  const targetPosition = selectTarget({ type: 'grid', range: 3, filter: 'all' });\n  if (targetPosition.needsTargetSelection) {\n    return targetPosition;\n  }\n  \n  // 计算伤害\n  const damage = Math.floor(sourcePiece.attack * context.skill.powerMultiplier);\n  \n  // 查找范围内的敌人\n  let hitCount = 0;\n  for (const piece of battle.pieces) {\n    // 检查是否是敌人且在范围内\n    if (piece.ownerPlayerId !== sourcePiece.ownerPlayerId && piece.currentHp > 0) {\n      const distance = Math.abs(piece.x - targetPosition.x) + Math.abs(piece.y - targetPosition.y);\n      if (distance <= 1) { // 1格范围内
        // 造成伤害
        piece.currentHp = Math.max(0, piece.currentHp - damage);\n        hitCount++;
      }\n    }\n  }\n  \n  if (hitCount === 0) {\n    return { message: '范围内没有敌人', success: false };\n  }\n  \n  return { message: sourcePiece.templateId + '使用火球术对' + hitCount + '个敌人造成' + damage + '点伤害', success: true };\n}",
  "previewCode": "function calculatePreview(piece, skillDef) { const damageValue = Math.round(piece.attack * skillDef.powerMultiplier); return { description: '对目标位置1格范围内的敌人造成' + damageValue + '点伤害（相当于攻击力150%）', expectedValues: { damage: damageValue, range: 3 } }; }",
  "range": "area",
  "areaSize": 3
}
```

### 示例2：治疗术（范围治疗）

```json
{
  "id": "heal",
  "name": "治疗术",
  "description": "恢复范围内盟友的生命值",
  "icon": "💚",
  "kind": "active",
  "type": "normal",
  "cooldownTurns": 2,
  "maxCharges": 0,
  "powerMultiplier": 1.0,
  "actionPointCost": 2,
  "code": "function executeSkill(context) {\n  // 选择目标位置\n  const targetPosition = selectTarget({ type: 'grid', range: 3, filter: 'all' });\n  if (targetPosition.needsTargetSelection) {\n    return targetPosition;\n  }\n  \n  // 计算治疗量\n  const healAmount = Math.floor(sourcePiece.attack * context.skill.powerMultiplier * 0.8);\n  \n  // 查找范围内的盟友\n  let healCount = 0;\n  for (const piece of battle.pieces) {\n    // 检查是否是盟友且在范围内\n    if (piece.ownerPlayerId === sourcePiece.ownerPlayerId && piece.currentHp > 0) {\n      const distance = Math.abs(piece.x - targetPosition.x) + Math.abs(piece.y - targetPosition.y);\n      if (distance <= 2) { // 2格范围内
        // 治疗
        piece.currentHp = Math.min(piece.maxHp, piece.currentHp + healAmount);\n        healCount++;
      }\n    }\n  }\n  \n  if (healCount === 0) {\n    return { message: '范围内没有盟友', success: false };\n  }\n  \n  return { message: sourcePiece.templateId + '使用治疗术为' + healCount + '个盟友恢复' + healAmount + '点生命值', success: true };\n}",
  "previewCode": "function calculatePreview(piece, skillDef) { const healValue = Math.round(piece.attack * skillDef.powerMultiplier * 0.8); return { description: '为目标位置2格范围内的盟友恢复' + healValue + '点生命值', expectedValues: { heal: healValue, range: 3 } }; }",
  "range": "area",
  "areaSize": 3
}
```

---

## 调试技巧

### 1. 使用 console.log
```typescript
function executeSkill(context) {
  console.log('=== 技能执行开始 ===');
  console.log('源棋子:', sourcePiece);
  console.log('上下文:', context);
  
  // 目标选择
  const target = selectTarget({ type: 'piece', range: 3, filter: 'enemy' });
  console.log('目标选择结果:', target);
  
  if (target.needsTargetSelection) {
    console.log('需要目标选择');
    return target;
  }
  
  // 技能逻辑...
  
  console.log('=== 技能执行结束 ===');
  return { message: '技能执行成功', success: true };
}
```

### 2. 分步验证
```typescript
function executeSkill(context) {
  // 1. 验证前置条件
  console.log('验证前置条件');
  if (sourcePiece.currentHp < 10) {
    return { message: '生命值过低，无法使用技能', success: false };
  }
  
  // 2. 目标选择
  console.log('选择目标');
  const target = selectTarget({ type: 'piece', range: 3, filter: 'enemy' });
  if (target.needsTargetSelection) {
    return target;
  }
  
  // 3. 执行效果
  console.log('执行效果');
  const damage = Math.floor(sourcePiece.attack * context.skill.powerMultiplier);
  console.log('计算伤害:', damage);
  
  // 4. 返回结果
  console.log('返回结果');
  return { message: '造成' + damage + '点伤害', success: true };
}
```

### 3. 错误处理
```typescript
function executeSkill(context) {
  try {
    // 技能逻辑...
    
    return { message: '技能执行成功', success: true };
  } catch (error) {
    console.error('技能执行错误:', error);
    return { message: '技能执行失败: ' + error.message, success: false };
  }
}
```

---

## 最佳实践

### 1. 代码组织
- 使用清晰的函数命名
- 添加适当的注释
- 分离复杂逻辑到多个步骤
- 保持代码缩进一致

### 2. 性能优化
- 避免不必要的计算
- 使用缓存减少重复计算
- 提前返回错误情况
- 减少对battle.pieces的遍历次数

### 3. 可读性
- 使用有意义的变量名
- 保持函数简短
- 避免深层嵌套
- 按逻辑顺序组织代码

### 4. 错误处理
- 验证所有输入
- 提供清晰的错误消息
- 处理边界情况
- 使用try-catch捕获异常

### 5. 目标选择
- 明确指定选择类型（piece或grid）
- 设置合理的选择范围
- 使用适当的目标过滤
- 正确处理目标选择流程

---

## 常见问题

### Q1: 如何获取范围内的所有敌人？
A: 使用以下方法遍历battle.pieces：
```typescript
function getAllEnemiesInRange(range) {
  return battle.pieces.filter(piece => {
    if (piece.ownerPlayerId === sourcePiece.ownerPlayerId || piece.currentHp <= 0) {
      return false;
    }
    const distance = Math.abs(piece.x - sourcePiece.x) + Math.abs(piece.y - sourcePiece.y);
    return distance <= range;
  });
}
```

### Q2: 如何实现治疗多个盟友？
A: 类似获取敌人的方法，过滤出盟友并应用治疗效果：
```typescript
function healAlliesInRange(range, healAmount) {
  let healCount = 0;
  for (const piece of battle.pieces) {
    if (piece.ownerPlayerId === sourcePiece.ownerPlayerId && piece.currentHp > 0) {
      const distance = Math.abs(piece.x - sourcePiece.x) + Math.abs(piece.y - sourcePiece.y);
      if (distance <= range) {
        piece.currentHp = Math.min(piece.maxHp, piece.currentHp + healAmount);
        healCount++;
      }
    }
  }
  return healCount;
}
```

### Q3: 如何实现位移效果？
A: 直接修改sourcePiece的坐标：
```typescript
function moveToPosition(x, y) {
  const originalX = sourcePiece.x;
  const originalY = sourcePiece.y;
  sourcePiece.x = x;
  sourcePiece.y = y;
  return sourcePiece.x !== originalX || sourcePiece.y !== originalY;
}
```

### Q4: 如何处理目标选择？
A: 使用selectTarget函数并正确处理返回结果：
```typescript
const target = selectTarget({ type: 'piece', range: 3, filter: 'enemy' });
if (target.needsTargetSelection) {
  return target; // 触发目标选择界面
}
// 目标选择完成后，继续执行技能
```

### Q5: 如何调试技能？
A: 在技能函数中使用console.log输出信息，然后在浏览器控制台查看：
```typescript
function executeSkill(context) {
  console.log('技能执行开始');
  console.log('源棋子:', sourcePiece);
  // 技能逻辑...
  console.log('技能执行结束');
  return { message: '技能执行成功', success: true };
}
```

### Q6: 技能执行失败怎么办？
A: 检查技能代码是否有语法错误，确保返回正确的结果格式：
```typescript
// 正确的失败返回格式
return { message: '技能执行失败原因', success: false };

// 正确的成功返回格式
return { message: '技能执行成功', success: true };
```

### Q7: 如何计算伤害？
A: 使用攻击力和威力系数计算：
```typescript
const damage = Math.floor(sourcePiece.attack * context.skill.powerMultiplier);
```

### Q8: 如何检查目标是否在范围内？
A: 使用曼哈顿距离计算：
```typescript
function isInRange(target, range) {
  const distance = Math.abs(target.x - sourcePiece.x) + Math.abs(target.y - sourcePiece.y);
  return distance <= range;
}
```

---

## 总结

技能系统是游戏的核心玩法之一，通过本教程，你应该已经了解了：

1. ✅ 技能定义的完整结构
2. ✅ 技能执行上下文的使用方法
3. ✅ 目标选择系统的工作原理
4. ✅ 技能函数的编写规范
5. ✅ 技能效果的实现方式
6. ✅ 游戏主进程的核心函数
7. ✅ 调试和优化技巧

现在，你可以开始创建自己的独特技能了！记得遵循最佳实践，确保技能代码清晰、高效、可靠。
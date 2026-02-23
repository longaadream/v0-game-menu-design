// 状态系统核心文件

import { globalTriggerSystem } from "./triggers";

// 状态类型使用字符串类型，不再使用硬编码的枚举
export type StatusEffectType = string;

// 状态效果接口
export interface StatusEffect {
  id: string;                 // 状态唯一ID
  type: StatusEffectType;     // 状态类型
  name: string;               // 状态名称
  description: string;        // 状态描述
  remainingDuration: number;  // 剩余持续时间
  intensity: number;          // 强度（用于计算效果数值）
  isDebuff: boolean;          // 是否为减益效果
  canStack: boolean;          // 是否可以叠加
  maxStacks: number;          // 最大叠加层数
  currentStacks: number;       // 当前叠加层数
  code?: string;              // 状态效果代码（字符串形式存储）
  sourcePieceId?: string;     // 来源棋子ID
  ruleId?: string;            // 对应的规则ID
}

// 状态效果定义接口（用于JSON文件）
export interface StatusEffectDefinition {
  id: string;                 // 状态唯一ID
  type: StatusEffectType;     // 状态类型
  name: string;               // 状态名称
  description: string;        // 状态描述
  intensity: number;          // 强度（用于计算效果数值）
  isDebuff: boolean;          // 是否为减益效果
  canStack: boolean;          // 是否可以叠加
  maxStacks: number;          // 最大叠加层数
  code: string;               // 状态效果代码（字符串形式存储）
}

// 状态效果上下文
export interface StatusEffectContext {
  piece: any;  // 棋子实例
  battleState: any;  // 战斗状态
  statusEffect: StatusEffect;  // 当前状态效果
  gameContext: any;  // 游戏上下文
}

// 扩展棋子实例接口
declare global {
  interface PieceInstance {
    statusData?: any; // 保留兼容性
  }
}

// 状态系统类
export class StatusEffectSystem {
  private statusEffects: Map<string, StatusEffect[]> = new Map();  // 棋子ID -> 状态效果列表
  private statusDefinitions: Map<string, StatusEffectDefinition> = new Map();  // 状态定义缓存

  // 从JSON文件加载状态定义
  loadStatusDefinitionFromFile(filePath: string): StatusEffectDefinition | null {
    try {
      const fs = require('fs');
      const content = fs.readFileSync(filePath, 'utf8');
      const definition = JSON.parse(content) as StatusEffectDefinition;
      this.statusDefinitions.set(definition.id, definition);
      return definition;
    } catch (error) {
      console.error('Error loading status definition from file:', error);
      return null;
    }
  }

  // 从ID获取状态定义
  getStatusDefinition(id: string): StatusEffectDefinition | null {
    return this.statusDefinitions.get(id) || null;
  }

  // 添加状态效果到棋子
  addStatusEffect(pieceId: string, effect: StatusEffect, uses: number = effect.remainingDuration): StatusEffect {
    const piece = this.getPieceById(pieceId);
    if (!piece) {
      console.error(`Piece not found: ${pieceId}`);
      return effect;
    }

    // 检查是否可以叠加
    if (effect.canStack) {
      const existingEffect = this.statusEffects.get(pieceId)?.find(e => e.type === effect.type);
      if (existingEffect) {
        // 叠加效果
        existingEffect.currentStacks = Math.min(existingEffect.currentStacks + 1, existingEffect.maxStacks);
        existingEffect.remainingDuration = effect.remainingDuration;
        
        // 获取当前剩余触发次数
        const currentStatusData = this.getStatusDataFromTags(piece, existingEffect.id, existingEffect.type);
        const remainingUses = currentStatusData.remainingUses || uses;
        
        // 更新棋子的statusTags
        this.updateStatusDataTags(piece, existingEffect.id, existingEffect.type, existingEffect.remainingDuration, existingEffect.currentStacks, existingEffect.intensity, remainingUses);
        
        return existingEffect;
      }
    }

    // 创建新状态效果
    const newEffect = {
      ...effect,
      id: `${effect.type}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      currentStacks: 1
    };

    // 存储状态效果
    if (!this.statusEffects.has(pieceId)) {
      this.statusEffects.set(pieceId, []);
    }
    this.statusEffects.get(pieceId)!.push(newEffect);

    // 将状态标签添加到棋子的statusTags数组中
    if (!piece.statusTags) {
      piece.statusTags = [];
    }
    // 添加状态类型标签
    const statusTypeTag = `${effect.type}`;
    if (!piece.statusTags.includes(statusTypeTag)) {
      piece.statusTags.push(statusTypeTag);
    }
    // 添加状态结构体标签
    this.updateStatusDataTags(piece, newEffect.id, newEffect.type, newEffect.remainingDuration, newEffect.currentStacks, newEffect.intensity, uses);

    // 创建并添加规则
    const ruleId = this.createStatusRule(pieceId, newEffect);
    newEffect.ruleId = ruleId;

    console.log(`Added status effect ${newEffect.name} to piece ${piece.templateId}`);
    return newEffect;
  }

  // 添加状态效果通过ID
  addStatusEffectById(pieceId: string, statusId: string, duration: number, uses: number): StatusEffect | null {
    const definition = this.getStatusDefinition(statusId);
    if (!definition) {
      console.error(`Status effect definition not found: ${statusId}`);
      return null;
    }

    // 创建状态效果
    const effect: StatusEffect = {
      id: '',
      type: definition.type,
      name: definition.name,
      description: definition.description,
      remainingDuration: duration,
      intensity: definition.intensity,
      isDebuff: definition.isDebuff,
      canStack: definition.canStack,
      maxStacks: definition.maxStacks,
      currentStacks: 1,
      code: definition.code
    };

    return this.addStatusEffect(pieceId, effect);
  }

  // 从statusTags中获取状态数据
  private getStatusDataFromTags(piece: any, effectId: string, type: string): { remainingDuration: number; currentStacks: number; intensity: number; remainingUses: number } {
    let remainingDuration = 0;
    let currentStacks = 1;
    let intensity = 1;
    let remainingUses = 0;
    
    if (piece.statusTags) {
      // 通过effectId查找状态标签
      // 假设statusTags现在是一个对象数组，每个对象包含id和数据
      const statusTag = piece.statusTags.find((tag: any) => tag.id === effectId);
      
      if (statusTag) {
        try {
          // 直接从statusTag对象中获取数据
          remainingDuration = statusTag.remainingDuration || 0;
          currentStacks = statusTag.stacks || 1;
          intensity = statusTag.intensity || 1;
          remainingUses = statusTag.remainingUses || 0;
        } catch (error) {
          console.error('Error accessing status tag data:', error);
        }
      }
    }
    
    return { remainingDuration, currentStacks, intensity, remainingUses };
  }

  // 状态名称映射表
  private statusNameMap: Map<string, string> = new Map([
    ['anti-heal', '禁疗'],
    ['sleep', '睡眠'],
    ['freeze', '冰冻'],
    ['bleeding', '流血'],
    ['divine-shield', '圣盾'],
    ['nano-boost', '纳米强化'],
  ]);

  // 获取状态名称
  private getStatusName(type: string): string {
    return this.statusNameMap.get(type) || type;
  }

  // 更新statusTags中的状态数据
  private updateStatusDataTags(piece: any, effectId: string, type: string, remainingDuration: number, currentStacks: number, intensity: number, remainingUses: number, name?: string): void {
    if (!piece.statusTags) {
      piece.statusTags = [];
    }

    // 创建状态对象
    const statusObj = {
      id: effectId,
      type,
      remainingDuration,
      name: name || this.getStatusName(type),
      remainingUses,
      stacks: currentStacks,
      intensity
    };

    // 查找并更新或添加状态对象
    const existingIndex = piece.statusTags.findIndex((tag: any) => tag.id === effectId);
    if (existingIndex >= 0) {
      // 更新现有状态对象
      piece.statusTags[existingIndex] = statusObj;
    } else {
      // 添加新状态对象
      piece.statusTags.push(statusObj);
    }
  }

  // 创建状态效果对应的规则
  private createStatusRule(pieceId: string, effect: StatusEffect): string {
    const ruleId = `status-rule-${effect.id}`;
    
    // 创建规则
    const rule = {
      id: ruleId,
      name: `${effect.name}规则`,
      description: `${effect.description}的触发规则`,
      trigger: {
        type: "beginTurn" // 回合开始时触发
      },
      effect: (battle, context) => {
        const piece = this.getPieceById(pieceId);
        if (!piece) {
          // 从棋子的ruleTags中移除规则ID
          if (piece && piece.ruleTags) {
            piece.ruleTags = piece.ruleTags.filter((tag: string) => tag !== ruleId);
          }
          // 移除规则
          globalTriggerSystem.removeRule(ruleId);
          return { success: false };
        }

        // 从statusTags中获取状态数据
        const statusData = this.getStatusDataFromTags(piece, effect.id, effect.type);
        
        // 检查是否可以触发（持续时间和剩余触发次数都大于0或为-1表示无限）
        if ((statusData.remainingDuration > 0 || statusData.remainingDuration === -1) && (statusData.remainingUses > 0 || statusData.remainingUses === -1)) {
          // 执行状态效果代码
          if (effect.code) {
            const context = {
              piece,
              battleState: battle,
              gameContext: null
            };

            // 执行代码
            try {
              const code = `
                (function() {
                  ${effect.code}
                  return typeof EffectTrigger === 'function' ? EffectTrigger(context) : { success: false };
                })()
              `;
              
              const result = eval(code);
              console.log(`Status effect ${effect.name} executed:`, result);
            } catch (error) {
              console.error(`Error executing status effect code for ${effect.name}:`, error);
            }
          }

          // 减少持续时间和剩余触发次数（如果不是无限）
          const newDuration = statusData.remainingDuration === -1 ? -1 : statusData.remainingDuration - 1;
          const newUses = statusData.remainingUses === -1 ? -1 : statusData.remainingUses - 1;
          effect.remainingDuration = newDuration;
          
          // 更新statusTags中的状态数据
          this.updateStatusDataTags(piece, effect.id, effect.type, newDuration, statusData.currentStacks, statusData.intensity, newUses);
        }

        // 检查是否结束（持续时间和剩余触发次数都不为-1且都为0）
        if (statusData.remainingDuration !== -1 && statusData.remainingUses !== -1 && (statusData.remainingDuration <= 0 || statusData.remainingUses <= 0)) {
          // 移除状态效果
          this.removeStatusEffect(pieceId, effect.id);
          // 从棋子的ruleTags中移除规则ID
          if (piece.ruleTags) {
            piece.ruleTags = piece.ruleTags.filter((tag: string) => tag !== ruleId);
          }
          // 移除规则
          globalTriggerSystem.removeRule(ruleId);
          console.log(`Status effect ${effect.name} expired on piece ${piece.templateId}`);
        }

        return { success: true, message: `${piece.templateId}的${effect.name}效果触发` };
      }
    };

    // 添加规则到触发系统
    globalTriggerSystem.addRule(rule);
    
    // 将规则ID添加到棋子的ruleTags数组中
    const piece = this.getPieceById(pieceId);
    if (piece) {
      if (!piece.ruleTags) {
        piece.ruleTags = [];
      }
      piece.ruleTags.push(ruleId);
      
      // 添加强度标签
      if (!piece.statusTags) {
        piece.statusTags = [];
      }
      piece.statusTags.push(`${effect.type}-intensity-${effect.id}:${effect.intensity}`);
    }
    
    console.log(`Created rule ${ruleId} for status effect ${effect.name}`);
    return ruleId;
  }

  // 移除状态效果
  removeStatusEffect(pieceId: string, effectId: string): boolean {
    const effects = this.statusEffects.get(pieceId);
    if (!effects) return false;

    const index = effects.findIndex(e => e.id === effectId);
    if (index === -1) return false;

    const effect = effects[index];
    
    // 移除对应的规则
    if (effect.ruleId) {
      globalTriggerSystem.removeRule(effect.ruleId);
      // 从棋子的ruleTags中移除规则ID
      const piece = this.getPieceById(pieceId);
      if (piece && piece.ruleTags) {
        piece.ruleTags = piece.ruleTags.filter(tag => tag !== effect.ruleId);
      }
    }

    // 从棋子状态数据中移除
    const piece = this.getPieceById(pieceId);
    if (piece) {
      if (piece.statusData) {
        delete piece.statusData[effectId];
      }
      
      // 从棋子的statusTags数组中移除相应的标签
      if (piece.statusTags) {
        // 移除状态对象
        piece.statusTags = piece.statusTags.filter((tag: any) => tag.id !== effectId);
      }
    }

    // 从状态效果列表中移除
    effects.splice(index, 1);
    console.log(`Removed status effect ${effect.name} from piece ${piece?.templateId}`);
    return true;
  }

  // 移除所有状态效果
  removeAllStatusEffects(pieceId: string): void {
    const effects = this.statusEffects.get(pieceId);
    if (!effects) return;

    // 移除所有对应的规则
    const ruleIdsToRemove = effects.map(effect => effect.ruleId).filter((id): id is string => id !== undefined);
    ruleIdsToRemove.forEach(ruleId => {
      globalTriggerSystem.removeRule(ruleId);
    });

    // 清除棋子状态数据
    const piece = this.getPieceById(pieceId);
    if (piece) {
      if (piece.statusData) {
        piece.statusData = {};
      }
      // 从棋子的ruleTags中移除所有相关规则ID
      if (piece.ruleTags) {
        piece.ruleTags = piece.ruleTags.filter(tag => !ruleIdsToRemove.includes(tag));
      }
      // 从棋子的statusTags中移除所有状态相关标签
      if (piece.statusTags) {
        // 清空statusTags数组
        piece.statusTags = [];
      }
    }

    // 清空状态效果列表
    this.statusEffects.set(pieceId, []);
  }

  // 获取棋子的所有状态效果
  getStatusEffects(pieceId: string): StatusEffect[] {
    return this.statusEffects.get(pieceId) || [];
  }

  // 检查棋子是否有特定类型的状态效果
  hasStatusEffect(pieceId: string, type: string): boolean {
    const effects = this.statusEffects.get(pieceId);
    if (!effects) return false;
    return effects.some(e => e.type === type);
  }

  // 存储当前战斗状态
  private currentBattleState: any = null;

  // 更新战斗状态引用
  setBattleState(battleState: any): void {
    this.currentBattleState = battleState;
  }

  // 辅助方法 - 获取棋子实例
  private getPieceById(pieceId: string): any {
    if (!this.currentBattleState) return undefined;
    return this.currentBattleState.pieces.find((piece: any) => piece.instanceId === pieceId);
  }

  // 辅助方法 - 获取战斗状态
  private getBattleState(): any {
    return this.currentBattleState;
  }

  // 辅助方法 - 获取游戏上下文
  private getGameContext(): any {
    // 这里需要获取游戏上下文
    // 暂时返回undefined，需要在集成时实现
    return undefined;
  }

  // 更新所有状态效果
  updateStatusEffects(): void {
    // 遍历所有棋子的状态效果
    for (const [pieceId, effects] of this.statusEffects.entries()) {
      const piece = this.getPieceById(pieceId);
      if (!piece) continue;

      // 检查每个状态效果
      for (const effect of effects) {
        // 从statusTags中获取状态数据
        const statusData = this.getStatusDataFromTags(piece, effect.id, effect.type);

        // 检查持续时间和剩余触发次数（如果不是无限）
        if ((statusData.remainingDuration > 0 || statusData.remainingDuration === -1) && (statusData.remainingUses > 0 || statusData.remainingUses === -1)) {
          // 减少持续时间和剩余触发次数（如果不是无限）
          const newDuration = statusData.remainingDuration === -1 ? -1 : statusData.remainingDuration - 1;
          const newUses = statusData.remainingUses === -1 ? -1 : statusData.remainingUses - 1;
          effect.remainingDuration = newDuration;
          
          // 更新statusTags中的状态数据
          this.updateStatusDataTags(piece, effect.id, effect.type, newDuration, statusData.currentStacks, statusData.intensity, newUses);
        }

        // 检查是否结束（持续时间和剩余触发次数都不为-1且都为0）
        if (statusData.remainingDuration !== -1 && statusData.remainingUses !== -1 && (statusData.remainingDuration <= 0 || statusData.remainingUses <= 0)) {
          // 移除状态效果
          this.removeStatusEffect(pieceId, effect.id);
        }
      }
    }
  }
}

// 状态效果系统现在完全基于JSON文件配置，不再使用硬编码的预定义状态效果
// 所有状态效果的逻辑都由JSON文件中的code标签实现



// 导出默认实例
export const statusEffectSystem = new StatusEffectSystem();
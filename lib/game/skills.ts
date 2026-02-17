export type SkillId = string

export type SkillKind = "active" | "passive"

/**
 * 技能的静态定义（模板）
 * 这里只关心数值和配置，具体效果逻辑以后再实现。
 */
export interface SkillDefinition {
  id: SkillId
  name: string
  description: string
  kind: SkillKind
  /** 冷却回合数（0 表示无冷却） */
  cooldownTurns: number
  /** 最大充能次数（例如 3 次用完就没了），0 表示不限次数 */
  maxCharges: number
  /** 是否为“充能技能”（需要消耗充能点数才能释放） */
  isChargeSkill?: boolean
  /** 释放一次需要的充能点数，仅对充能技能生效 */
  chargeCost?: number
  /** 技能基础威力系数，和攻击力等组合使用 */
  powerMultiplier: number
}

/**
 * 战局中某个棋子身上的技能状态（实例）
 * 目前只做框架，具体结算逻辑以后再写。
 */
export interface SkillState {
  skillId: SkillId
  /** 当前剩余冷却回合 */
  currentCooldown: number
  /** 当前剩余充能次数 */
  currentCharges: number
  /** 是否已解锁 / 学会 */
  unlocked: boolean
}


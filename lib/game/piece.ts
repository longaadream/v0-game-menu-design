import type { SkillId, SkillState } from "./skills"

export type PieceId = string

export type Faction = "red" | "blue" | "neutral"

/**
 * 棋子基础数值
 *
 * 这里只放“静态属性”，例如最大血量、基础攻击力等。
 * 以后需要时可以随时往里加新的字段。
 */
export interface PieceStats {
  /** 最大生命值 */
  maxHp: number
  /** 普通攻击攻击力 */
  attack: number
  /** 可选：防御力、移动力等 */
  defense?: number
  moveRange?: number
}

/**
 * 某个棋子的技能配置（只保存关联关系和初始充能等）。
 * 技能的详细描述在 SkillDefinition 里，这里只引用 id。
 */
export interface PieceSkillLoadout {
  skillId: SkillId
  /** 初始充能次数 */
  initialCharges: number
}

/**
 * 棋子模板：设计阶段 / 配置文件里用的结构。
 * 不包含坐标、当前血量等“战局状态”。
 */
export interface PieceTemplate {
  id: PieceId
  name: string
  faction: Faction
  /** 文本描述，方便在 UI 中展示 */
  description?: string
  /** 是否可以被玩家选择使用 */
  selectable: boolean
  stats: PieceStats
  skills: PieceSkillLoadout[]
}

/**
 * 实际对局中的棋子实例。
 * 这里会有当前血量、坐标、技能冷却等信息。
 */
export interface PieceInstance {
  instanceId: string
  templateId: PieceId
  ownerPlayerId: string
  faction: Faction
  /** 当前生命值 */
  currentHp: number
  /** 所在坐标（可选，未上场则可能为 null） */
  x: number | null
  y: number | null
  /** 当前技能状态（冷却、充能等） */
  skills: SkillState[]
}


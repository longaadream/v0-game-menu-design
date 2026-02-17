import { getMap } from "@/config/maps"
import type { BoardMap } from "./map"
import type { PieceInstance, PieceTemplate, PieceStats } from "./piece"
import type { SkillDefinition } from "./skills"
import type { BattleState, PlayerId } from "./turn"
import { DEFAULT_PIECES, type PieceTemplate } from "./piece-repository"

export const DEFAULT_MAP_ID = "arena-8x6"

export function buildDefaultSkills(): Record<string, SkillDefinition> {
  return {
    "basic-attack": {
      id: "basic-attack",
      name: "基础攻击",
      description: "对目标造成基础伤害",
      kind: "active",
      type: "normal",
      cooldownTurns: 0,
      maxCharges: 0,
      powerMultiplier: 1.0,
      code: `function executeSkill(context) {
  const damage = context.piece.attack * context.skill.powerMultiplier
  return {
    damage: damage,
    message: "造成 " + damage + " 点伤害",
    success: true
  }
}`,
      effects: [
        {
          type: "damage",
          value: 1.0,
          target: "enemy",
          description: "造成100%攻击力的伤害"
        }
      ],
      range: "single",
      requiresTarget: true
    },
    "fireball": {
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
  const damage = context.piece.attack * context.skill.powerMultiplier
  const targets = getAllEnemiesInRange(context, context.skill.areaSize || 3)
  return {
    damage: damage,
    effects: targets.map(t => ({
      type: "damage",
      value: damage,
      target: "enemy",
      description: "对 " + t.templateId + " 造成 " + damage + " 点伤害"
    })),
    message: "火球爆炸，对范围内敌人造成伤害",
    success: true
  }
}`,
      effects: [
        {
          type: "damage",
          value: 1.5,
          target: "all-enemies",
          description: "对范围内所有敌人造成150%攻击力的伤害"
        }
      ],
      range: "area",
      areaSize: 3,
      requiresTarget: false
    },
    "heal": {
      id: "heal",
      name: "治疗术",
      description: "恢复自身或盟友的生命值",
      kind: "active",
      type: "normal",
      cooldownTurns: 3,
      maxCharges: 0,
      powerMultiplier: 1.0,
      code: `function executeSkill(context) {
  const allies = getAllAlliesInRange(context, context.skill.areaSize || 2)
  return {
    heal: 30,
    effects: allies.map(a => ({
      type: "heal",
      value: 30,
      target: "allies",
      description: "恢复30点生命值"
    })),
    message: "治疗术生效，恢复生命值",
    success: true
  }
}`,
      effects: [
        {
          type: "heal",
          value: 30,
          target: "allies",
          description: "恢复30点生命值"
        }
      ],
      range: "area",
      areaSize: 2,
      requiresTarget: false
    },
    "shield": {
      id: "shield",
      name: "护盾术",
      description: "为自身提供护盾，吸收伤害",
      kind: "active",
      type: "super",
      cooldownTurns: 4,
      maxCharges: 2,
      chargeCost: 1,
      powerMultiplier: 1.0,
      code: `function executeSkill(context) {
  return {
    effects: [{
      type: "shield",
      value: 50,
      target: "self",
      duration: 3,
      description: "获得50点护盾，持续3回合"
    }],
    message: "护盾术生效，获得护盾",
    success: true
  }
}`,
      effects: [
        {
          type: "shield",
          value: 50,
          target: "self",
          duration: 3,
          description: "获得50点护盾，持续3回合"
        }
      ],
      range: "self",
      requiresTarget: false
    },
    "teleport": {
      id: "teleport",
      name: "传送术",
      description: "瞬间移动到指定位置",
      kind: "active",
      type: "normal",
      cooldownTurns: 2,
      maxCharges: 0,
      powerMultiplier: 1.0,
      code: `function executeSkill(context) {
  return {
    effects: [{
      type: "teleport",
      value: 5,
      target: "self",
      description: "传送到5格范围内"
    }],
    message: "传送术生效，瞬间移动",
    success: true
  }
}`,
      effects: [
        {
          type: "teleport",
          value: 5,
          target: "self",
          description: "传送到5格范围内"
        }
      ],
      range: "area",
      areaSize: 5,
      requiresTarget: false
    },
    "buff-attack": {
      id: "buff-attack",
      name: "攻击强化",
      description: "提升自身攻击力",
      kind: "active",
      type: "normal",
      cooldownTurns: 4,
      maxCharges: 0,
      powerMultiplier: 1.0,
      code: `function executeSkill(context) {
  return {
    effects: [{
      type: "buff",
      value: 10,
      target: "self",
      duration: 3,
      description: "攻击力提升10点，持续3回合"
    }],
    message: "攻击强化生效，攻击力提升",
    success: true
  }
}`,
      effects: [
        {
          type: "buff",
          value: 10,
          target: "self",
          duration: 3,
          description: "攻击力提升10点，持续3回合"
        }
      ],
      range: "self",
      requiresTarget: false
    },
    "debuff-defense": {
      id: "debuff-defense",
      name: "防御削弱",
      description: "降低目标防御力",
      kind: "active",
      type: "normal",
      cooldownTurns: 3,
      maxCharges: 0,
      powerMultiplier: 1.0,
      code: `function executeSkill(context) {
  if (!context.target) {
    return {
      message: "没有目标",
      success: false
    }
  }
  return {
    effects: [{
      type: "debuff",
      value: 5,
      target: "enemy",
      duration: 2,
      description: "防御力降低5点，持续2回合"
    }],
    message: "防御削弱生效，降低目标防御力",
    success: true
  }
}`,
      effects: [
        {
          type: "debuff",
          value: 5,
          target: "enemy",
          duration: 2,
          description: "防御力降低5点，持续2回合"
        }
      ],
      range: "single",
      requiresTarget: true
    }
  }
}

export function buildDefaultPieceStats(): Record<string, PieceStats> {
  return {
    "red-warrior": {
      maxHp: 120,
      attack: 20,
      defense: 5,
      moveRange: 3,
    },
    "blue-warrior": {
      maxHp: 120,
      attack: 20,
      defense: 5,
      moveRange: 3,
    },
  }
}

export function buildInitialPiecesForPlayers(
  map: BoardMap,
  players: PlayerId[],
  selectedPieces: PieceTemplate[],
): PieceInstance[] {
  if (players.length !== 2) return []
  
  const [p1, p2] = players
  
  // 随机分配玩家到红方和蓝方
  const redPlayer = Math.random() > 0.5 ? p1 : p2
  const bluePlayer = redPlayer === p1 ? p2 : p1
  
  // 为每个玩家创建棋子
  const pieces: PieceInstance[] = []
  
  // 找到所有可走的地板方格（F方格）
  const floorTiles = map.tiles.filter(tile => 
    tile.props.walkable && tile.props.type === "floor"
  )
  
  // 如果没有地板方格，使用所有可走的方格
  const availableTiles = floorTiles.length > 0 ? floorTiles : map.tiles.filter(tile => tile.props.walkable)
  
  // 随机选择位置的函数
  const getRandomPosition = () => {
    if (availableTiles.length === 0) {
      // 如果没有可走的方格，返回默认位置
      return { x: Math.floor(map.width / 2), y: Math.floor(map.height / 2) }
    }
    const randomIndex = Math.floor(Math.random() * availableTiles.length)
    return { x: availableTiles[randomIndex].x, y: availableTiles[randomIndex].y }
  }
  
  // 为红方玩家添加棋子
  let redPieceIndex = 0
  for (const pieceTemplate of selectedPieces) {
    if (pieceTemplate.faction === "red" || pieceTemplate.faction === "neutral") {
      const position = getRandomPosition()
      pieces.push({
        instanceId: `${redPlayer}-${redPieceIndex + 1}`,
        templateId: pieceTemplate.id,
        ownerPlayerId: redPlayer,
        faction: "red",
        currentHp: pieceTemplate.stats.maxHp,
        maxHp: pieceTemplate.stats.maxHp,
        attack: pieceTemplate.stats.attack,
        defense: pieceTemplate.stats.defense,
        moveRange: pieceTemplate.stats.moveRange,
        x: position.x,
        y: position.y,
        skills: pieceTemplate.skills.map(s => ({
          skillId: s.skillId,
          currentCooldown: 0,
          currentCharges: 0,
          unlocked: true,
        })),
      })
      redPieceIndex++
    }
  }
  
  // 为蓝方玩家添加棋子
  let bluePieceIndex = 0
  for (const pieceTemplate of selectedPieces) {
    if (pieceTemplate.faction === "blue" || pieceTemplate.faction === "neutral") {
      const position = getRandomPosition()
      pieces.push({
        instanceId: `${bluePlayer}-${bluePieceIndex + 1}`,
        templateId: pieceTemplate.id,
        ownerPlayerId: bluePlayer,
        faction: "blue",
        currentHp: pieceTemplate.stats.maxHp,
        maxHp: pieceTemplate.stats.maxHp,
        attack: pieceTemplate.stats.attack,
        defense: pieceTemplate.stats.defense,
        moveRange: pieceTemplate.stats.moveRange,
        x: position.x,
        y: position.y,
        skills: pieceTemplate.skills.map(s => ({
          skillId: s.skillId,
          currentCooldown: 0,
          currentCharges: 0,
          unlocked: true,
        })),
      })
      bluePieceIndex++
    }
  }
  
  // 确保至少有一个棋子
  if (pieces.length === 0) {
    // 添加默认红方棋子
    const defaultRedPiece = DEFAULT_PIECES["red-warrior"]
    pieces.push({
      instanceId: `${redPlayer}-1`,
      templateId: defaultRedPiece.id,
      ownerPlayerId: redPlayer,
      faction: "red",
      currentHp: defaultRedPiece.stats.maxHp,
      maxHp: defaultRedPiece.stats.maxHp,
      attack: defaultRedPiece.stats.attack,
      defense: defaultRedPiece.stats.defense,
      moveRange: defaultRedPiece.stats.moveRange,
      x: getRandomPosition().x,
      y: getRandomPosition().y,
      skills: defaultRedPiece.skills.map(s => ({
        skillId: s.skillId,
        currentCooldown: 0,
        currentCharges: 0,
        unlocked: true,
      })),
    })
    
    // 添加默认蓝方棋子
    const defaultBluePiece = DEFAULT_PIECES["blue-warrior"]
    pieces.push({
      instanceId: `${bluePlayer}-1`,
      templateId: defaultBluePiece.id,
      ownerPlayerId: bluePlayer,
      faction: "blue",
      currentHp: defaultBluePiece.stats.maxHp,
      maxHp: defaultBluePiece.stats.maxHp,
      attack: defaultBluePiece.stats.attack,
      defense: defaultBluePiece.stats.defense,
      moveRange: defaultBluePiece.stats.moveRange,
      x: getRandomPosition().x,
      y: getRandomPosition().y,
      skills: defaultBluePiece.skills.map(s => ({
        skillId: s.skillId,
        currentCooldown: 0,
        currentCharges: 0,
        unlocked: true,
      })),
    })
  }
  
  return pieces
}

export function createInitialBattleForPlayers(
  playerIds: PlayerId[],
  selectedPieces: PieceTemplate[],
): BattleState | null {
  if (playerIds.length !== 2) return null

  const defaultMap: BoardMap = {
    id: "default-8x6",
    name: "默认地图",
    width: 8,
    height: 6,
    tiles: Array.from({ length: 8 * 6 }, (_, i) => {
      const x = i % 8
      const y = Math.floor(i / 8)
      return {
        id: `default-${x}-${y}`,
        x,
        y,
        props: {
          walkable: true,
          bulletPassable: true,
          type: "floor",
        },
      }
    }),
  }

  const map = getMap(DEFAULT_MAP_ID) || defaultMap

  const [p1, p2] = playerIds
  const pieces = buildInitialPiecesForPlayers(map, playerIds, selectedPieces)
  
  const redPlayer = pieces.find(piece => piece.faction === "red")?.ownerPlayerId || p1

  return {
    map,
    pieces,
    pieceStatsByTemplateId: buildDefaultPieceStats(),
    skillsById: buildDefaultSkills(),
    players: [
      { playerId: p1, chargePoints: 0 },
      { playerId: p2, chargePoints: 0 },
    ],
    turn: {
      currentPlayerId: redPlayer,
      turnNumber: 1,
      phase: "start",
      actions: {
        hasMoved: false,
        hasUsedBasicSkill: false,
        hasUsedChargeSkill: false,
      },
    },
  }
}

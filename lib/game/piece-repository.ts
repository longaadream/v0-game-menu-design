import type { PieceTemplate } from "./piece"

export const DEFAULT_PIECES: Record<string, PieceTemplate> = {
  "red-warrior": {
    id: "red-warrior",
    name: "红方战士",
    faction: "red",
    description: "高生命值，近战攻击",
    rarity: "common",
    image: "🛡️",
    stats: {
      maxHp: 120,
      attack: 20,
      defense: 8,
      moveRange: 3,
    },
    skills: [
      { skillId: "basic-attack", level: 1 },
      { skillId: "shield", level: 1 },
    ],
    isDefault: true,
  },
  "red-mage": {
    id: "red-mage",
    name: "红方法师",
    faction: "red",
    description: "高攻击力，低防御力",
    rarity: "rare",
    image: "🔥",
    stats: {
      maxHp: 80,
      attack: 30,
      defense: 3,
      moveRange: 2,
    },
    skills: [
      { skillId: "fireball", level: 1 },
      { skillId: "teleport", level: 1 },
    ],
    isDefault: true,
  },
  "red-archer": {
    id: "red-archer",
    name: "红方射手",
    faction: "red",
    description: "远程攻击，中等属性",
    rarity: "common",
    image: "🏹",
    stats: {
      maxHp: 100,
      attack: 25,
      defense: 5,
      moveRange: 4,
    },
    skills: [
      { skillId: "basic-attack", level: 1 },
      { skillId: "buff-attack", level: 1 },
    ],
    isDefault: true,
  },
  "blue-warrior": {
    id: "blue-warrior",
    name: "蓝方战士",
    faction: "blue",
    description: "高生命值，近战攻击",
    rarity: "common",
    image: "🛡️",
    stats: {
      maxHp: 120,
      attack: 20,
      defense: 8,
      moveRange: 3,
    },
    skills: [
      { skillId: "basic-attack", level: 1 },
      { skillId: "shield", level: 1 },
    ],
    isDefault: true,
  },
  "blue-mage": {
    id: "blue-mage",
    name: "蓝方法师",
    faction: "blue",
    description: "高攻击力，低防御力",
    rarity: "rare",
    image: "🔥",
    stats: {
      maxHp: 80,
      attack: 28,
      defense: 4,
      moveRange: 2,
    },
    skills: [
      { skillId: "fireball", level: 1 },
      { skillId: "teleport", level: 1 },
    ],
    isDefault: true,
  },
  "blue-archer": {
    id: "blue-archer",
    name: "蓝方射手",
    faction: "blue",
    description: "远程攻击，中等属性",
    rarity: "common",
    image: "🏹",
    stats: {
      maxHp: 100,
      attack: 22,
      defense: 6,
      moveRange: 4,
    },
    skills: [
      { skillId: "basic-attack", level: 1 },
      { skillId: "buff-attack", level: 1 },
    ],
    isDefault: true,
  },
}

export function getPieceById(id: string): PieceTemplate | undefined {
  return DEFAULT_PIECES[id]
}

export function getPiecesByFaction(faction: "red" | "blue"): PieceTemplate[] {
  return Object.values(DEFAULT_PIECES).filter(
    (piece) => piece.faction === faction
  )
}

export function getAllPieces(): PieceTemplate[] {
  return Object.values(DEFAULT_PIECES)
}

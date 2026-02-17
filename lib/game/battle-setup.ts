import { getMap } from "@/config/maps"
import type { BoardMap } from "./map"
import type { PieceInstance, PieceStats } from "./piece"
import type { SkillDefinition } from "./skills"
import type { BattleState, PlayerId } from "./turn"

export const DEFAULT_MAP_ID = "arena-8x6"

export function buildDefaultSkills(): Record<string, SkillDefinition> {
  return {
    "basic-shot": {
      id: "basic-shot",
      name: "Basic Shot",
      description: "Simple attack used as 普通技能。",
      kind: "active",
      cooldownTurns: 0,
      maxCharges: 0,
      isChargeSkill: false,
      chargeCost: 0,
      powerMultiplier: 1,
    },
    "charge-burst": {
      id: "charge-burst",
      name: "Charge Burst",
      description: "Consumes charge points to deal high damage.",
      kind: "active",
      cooldownTurns: 1,
      maxCharges: 3,
      isChargeSkill: true,
      chargeCost: 1,
      powerMultiplier: 2,
    },
  }
}

export function buildDefaultPieceStats(): Record<string, PieceStats> {
  return {
    "red-soldier": {
      maxHp: 100,
      attack: 20,
      defense: 5,
      moveRange: 3,
    },
    "blue-soldier": {
      maxHp: 100,
      attack: 18,
      defense: 6,
      moveRange: 3,
    },
  }
}

export function buildInitialPiecesForPlayers(
  map: BoardMap,
  players: PlayerId[],
): PieceInstance[] {
  const [p1, p2] = players

  return [
    {
      instanceId: `${p1}-1`,
      templateId: "red-soldier",
      ownerPlayerId: p1,
      faction: "red",
      currentHp: 100,
      x: 1,
      y: 1,
      skills: [],
    },
    {
      instanceId: `${p2}-1`,
      templateId: "blue-soldier",
      ownerPlayerId: p2,
      faction: "blue",
      currentHp: 100,
      x: map.width - 2,
      y: map.height - 2,
      skills: [],
    },
  ]
}

export function createInitialBattleForPlayers(
  playerIds: PlayerId[],
): BattleState | null {
  if (playerIds.length !== 2) return null

  const map = getMap(DEFAULT_MAP_ID)
  if (!map) return null

  const [p1, p2] = playerIds

  return {
    map,
    pieces: buildInitialPiecesForPlayers(map, [p1, p2]),
    pieceStatsByTemplateId: buildDefaultPieceStats(),
    skillsById: buildDefaultSkills(),
    players: [
      { playerId: p1, chargePoints: 0 },
      { playerId: p2, chargePoints: 0 },
    ],
    turn: {
      currentPlayerId: p1,
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


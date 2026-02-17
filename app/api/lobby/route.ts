import { NextRequest, NextResponse } from "next/server"
import type { BattleState } from "@/lib/game/turn"

type Player = {
  id: string
  name: string
  joinedAt: number
}

type RoomStatus = "waiting" | "in-progress" | "finished"

type GameAction = {
  id: string
  playerId: string
  type: string
  payload: unknown
  createdAt: number
  turn: number
}

type Room = {
  id: string
  name: string
  status: RoomStatus
  createdAt: number
  maxPlayers: number
  players: Player[]
  currentTurnIndex: number
  actions: GameAction[]
  battleState: BattleState | null
}

// In-memory "database".
// 在 dev 模式下使用 globalThis 保持热重载时的房间数据不丢失。
declare global {
  // eslint-disable-next-line no-var
  var __red_vs_blue_rooms: Map<string, Room> | undefined
}

const rooms: Map<string, Room> =
  globalThis.__red_vs_blue_rooms ?? new Map<string, Room>()

if (!globalThis.__red_vs_blue_rooms) {
  globalThis.__red_vs_blue_rooms = rooms
}

// Small helper so other route files can import the same store if needed.
export function getRoomsStore() {
  return rooms
}

export async function GET() {
  const allRooms = Array.from(rooms.values()).map((room) => ({
    id: room.id,
    name: room.name,
    status: room.status,
    createdAt: room.createdAt,
    maxPlayers: room.maxPlayers,
    playerCount: room.players.length,
  }))

  return NextResponse.json({ rooms: allRooms })
}

export async function POST(req: NextRequest) {
  let body: unknown
  try {
    body = await req.json()
  } catch {
    body = {}
  }

  const { name } = (body as { name?: string; maxPlayers?: number }) ?? {}

  const roomId = crypto.randomUUID()
  const now = Date.now()

  const room: Room = {
    id: roomId,
    name: name?.trim() || `Room ${roomId.slice(0, 6)}`,
    status: "waiting",
    createdAt: now,
    // 1v1 对战房间，固定 2 人
    maxPlayers: 2,
    players: [],
    currentTurnIndex: 0,
    actions: [],
    battleState: null,
  }

  rooms.set(roomId, room)

  return NextResponse.json(room, { status: 201 })
}


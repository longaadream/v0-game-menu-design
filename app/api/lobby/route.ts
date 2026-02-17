import { NextRequest, NextResponse } from "next/server"
import type { BattleState } from "@/lib/game/turn"
import roomStore, { type Room } from "@/lib/game/room-store"

// 导出 Room 类型供其他文件使用
export type { Room }

// 导出存储实例供其他路由使用
export function getRoomsStore() {
  return roomStore
}

export async function GET() {
  const allRooms = Array.from(roomStore.getRooms().values()).map((room) => ({
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

  // 生成5位的数字和字母组合作为房间ID
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789'
  let roomId = ''
  for (let i = 0; i < 5; i++) {
    roomId += chars.charAt(Math.floor(Math.random() * chars.length))
  }
  const now = Date.now()

  const room: Room = {
    id: roomId,
    name: name?.trim() || `Room ${roomId}`,
    status: "waiting",
    createdAt: now,
    // 1v1 对战房间，固定 2 人
    maxPlayers: 2,
    players: [],
    currentTurnIndex: 0,
    actions: [],
    battleState: null,
  }

  // 确保房间被正确保存
  console.log('Creating room with ID:', roomId)
  roomStore.setRoom(roomId, room)
  console.log('Room created successfully')

  return NextResponse.json(room, { status: 201 })
}


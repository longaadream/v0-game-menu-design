import { NextRequest, NextResponse } from "next/server"
import roomStore, { type Room } from "@/lib/game/room-store"

export async function POST(req: NextRequest, { params }: { params: Promise<{ roomId: string }> }) {
  let body: unknown
  try {
    body = await req.json()
  } catch {
    body = {}
  }

  const { roomId } = await params
  const { playerName } = (body as { 
    playerName?: string
  }) ?? {}

  if (!playerName?.trim()) {
    return NextResponse.json({ error: "playerName is required" }, { status: 400 })
  }

  const room = roomStore.getRoom(roomId)
  if (!room) {
    return NextResponse.json({ error: "Room not found" }, { status: 404 })
  }

  const existingPlayer = room.players.find(
    (p) => p.name.toLowerCase() === playerName.toLowerCase()
  )

  if (existingPlayer) {
    return NextResponse.json({ error: "Player already in room" }, { status: 400 })
  }

  const newPlayer = {
    id: crypto.randomUUID(),
    name: playerName.trim(),
    joinedAt: Date.now(),
    selectedPieces: [],
  }

  room.players.push(newPlayer)
  roomStore.setRoom(roomId, room)

  return NextResponse.json({ 
    success: true, 
    message: "Player joined room successfully",
    player: {
      id: newPlayer.id,
      name: newPlayer.name,
      faction: null
    },
    roomStatus: room.players.length === 2 ? "ready" : "waiting"
  }, { status: 201 })
}

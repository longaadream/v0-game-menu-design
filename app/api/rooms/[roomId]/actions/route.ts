import { NextRequest, NextResponse } from "next/server"
import { getRoomsStore } from "../../../lobby/route"

const rooms = getRoomsStore()

export async function GET(
  _req: NextRequest,
  { params }: { params: { roomId: string } },
) {
  const room = rooms.get(params.roomId)

  if (!room) {
    return NextResponse.json({ error: "Room not found" }, { status: 404 })
  }

  return NextResponse.json({ actions: room.actions })
}

type ActionPostBody = {
  playerName: string
  type: string
  payload?: unknown
}

export async function POST(
  req: NextRequest,
  { params }: { params: { roomId: string } },
) {
  const room = rooms.get(params.roomId)

  if (!room) {
    return NextResponse.json({ error: "Room not found" }, { status: 404 })
  }

  if (room.status !== "in-progress") {
    return NextResponse.json(
      { error: "Game is not in progress" },
      { status: 400 },
    )
  }

  let body: ActionPostBody
  try {
    body = (await req.json()) as ActionPostBody
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 })
  }

  const name = body.playerName?.trim()
  if (!name) {
    return NextResponse.json({ error: "playerName is required" }, { status: 400 })
  }

  const player = room.players.find(
    (p) => p.name.toLowerCase() === name.toLowerCase(),
  )

  if (!player) {
    return NextResponse.json(
      { error: "Player not found in this room" },
      { status: 400 },
    )
  }

  const currentPlayer = room.players[room.currentTurnIndex]
  if (currentPlayer.id !== player.id) {
    return NextResponse.json(
      {
        error: "It is not this player's turn",
        currentPlayer: currentPlayer.name,
      },
      { status: 400 },
    )
  }

  const action = {
    id: crypto.randomUUID(),
    playerId: player.id,
    type: body.type || "move",
    payload: body.payload ?? null,
    createdAt: Date.now(),
    turn: room.actions.length + 1,
  }

  room.actions.push(action)
  room.currentTurnIndex = (room.currentTurnIndex + 1) % room.players.length
  rooms.set(room.id, room)

  return NextResponse.json({ action, room })
}


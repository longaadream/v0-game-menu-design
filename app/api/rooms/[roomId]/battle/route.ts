import { NextRequest, NextResponse } from "next/server"
import { roomStore } from "@/lib/game/room-store"
import {
  type BattleAction,
  applyBattleAction,
  BattleRuleError,
} from "@/lib/game/turn"

const rooms = roomStore

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ roomId: string }> },
) {
  const { roomId } = await params
  const room = rooms.getRoom(roomId)

  if (!room) {
    return NextResponse.json({ error: "Room not found" }, { status: 404 })
  }

  if (!room.battleState) {
    return NextResponse.json(
      { error: "Battle has not started in this room" },
      { status: 400 },
    )
  }

  return NextResponse.json(room.battleState)
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ roomId: string }> },
) {
  const { roomId } = await params
  const room = rooms.getRoom(roomId)

  if (!room) {
    return NextResponse.json({ error: "Room not found" }, { status: 404 })
  }

  if (!room.battleState) {
    return NextResponse.json(
      { error: "Battle has not started in this room" },
      { status: 400 },
    )
  }

  let body: BattleAction
  try {
    body = (await req.json()) as BattleAction
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 })
  }

  try {
    const nextState = applyBattleAction(room.battleState, body)
    room.battleState = nextState
    rooms.updateBattleState(room.id, nextState)

    return NextResponse.json(nextState)
  } catch (e) {
    if (e instanceof BattleRuleError) {
      // 检查是否是需要目标选择的错误
      if ((e as any).needsTargetSelection) {
        // 返回包含目标选择信息的响应
        return NextResponse.json({
          needsTargetSelection: true,
          targetType: (e as any).targetType || 'piece',
          range: (e as any).range || 5,
          filter: (e as any).filter || 'enemy'
        }, { status: 400 })
      }
      return NextResponse.json({ error: e.message }, { status: 400 })
    }

    console.error("Unexpected battle error", e)
    return NextResponse.json(
      { error: "Unexpected error while applying battle action" },
      { status: 500 }
    )
  }
}


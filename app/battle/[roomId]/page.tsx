"use client"

import { useEffect, useMemo, useState } from "react"
import Link from "next/link"
import { useRouter, useParams, useSearchParams } from "next/navigation"
import { ArrowLeft, Loader2, Swords, Shield, Zap, Footprints } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { GameBoard } from "@/components/game-board"
import type { BattleState, BattleAction } from "@/lib/game/turn"

type Room = {
  id: string
  name: string
  status: "waiting" | "in-progress" | "finished"
  players: { id: string; name: string }[]
  currentTurnIndex: number
}

export default function BattlePage() {
  const router = useRouter()
  const params = useParams()
  const searchParams = useSearchParams()

  const [roomId, setRoomId] = useState<string | null>(null)
  const [room, setRoom] = useState<Room | null>(null)
  const [battle, setBattle] = useState<BattleState | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [currentPlayerId, setCurrentPlayerId] = useState<string | null>(null)

  useEffect(() => {
    const id = params.roomId as string
    if (id) {
      setRoomId(id)
      void fetchRoomAndBattle(id)
    } else {
      setLoading(false)
    }
  }, [params])

  // 从URL参数获取玩家昵称
  useEffect(() => {
    const name = searchParams.get("playerName")
    if (name && battle?.players) {
      // 查找对应的玩家ID
      const player = battle.players.find(p => p.playerId.toLowerCase() === name.toLowerCase())
      if (player) {
        setCurrentPlayerId(player.playerId)
      }
    }
  }, [searchParams, battle])

  async function fetchRoomAndBattle(id: string) {
    try {
      setLoading(true)
      setError(null)

      const res = await fetch(`/api/rooms/${id}`)
      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        throw new Error(data.error || "Failed to load room")
      }

      const data = (await res.json()) as Room
      setRoom(data)

      if (data.status === "in-progress") {
        await fetchBattle(id)
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error")
    } finally {
      setLoading(false)
    }
  }

  async function fetchBattle(id: string) {
    try {
      const res = await fetch(`/api/rooms/${id}/battle`)
      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        throw new Error(data.error || "Failed to load battle state")
      }
      const data = (await res.json()) as BattleState
      setBattle(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load battle state")
    }
  }

  async function sendBattleAction(action: BattleAction) {
    if (!roomId) return
    try {
      setLoading(true)
      setError(null)
      const res = await fetch(`/api/rooms/${roomId}/battle`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(action),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) {
        throw new Error(data.error || "Failed to apply battle action")
      }
      setBattle(data as BattleState)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error")
    } finally {
      setLoading(false)
    }
  }

  // 当 battle 加载时，尝试从本地存储获取上次选择的玩家 ID
  useEffect(() => {
    if (battle?.players?.length > 0 && !currentPlayerId) {
      const storedPlayerId = localStorage.getItem(`battle-player-${roomId}`)
      if (storedPlayerId) {
        // 检查存储的玩家 ID 是否存在于当前战斗中
        const playerExists = battle.players.some(p => p.playerId.toLowerCase() === storedPlayerId.toLowerCase())
        if (playerExists) {
          setCurrentPlayerId(storedPlayerId)
        }
      }
      // 不再默认选择第一个玩家，强制显示选择界面
    }
  }, [battle, roomId, currentPlayerId])

  // 保存玩家选择到本地存储
  useEffect(() => {
    if (currentPlayerId && roomId) {
      localStorage.setItem(`battle-player-${roomId}`, currentPlayerId)
    }
  }, [currentPlayerId, roomId])

  // 轮询检查战斗状态，确保所有玩家能及时获取状态更新
  useEffect(() => {
    if (!roomId || !currentPlayerId) return

    const interval = setInterval(async () => {
      try {
        const res = await fetch(`/api/rooms/${roomId}/battle`)
        if (res.ok) {
          const data = (await res.json()) as BattleState
          setBattle(data)
        }
      } catch (error) {
        // 忽略错误
      }
    }, 3000) // 每3秒检查一次

    return () => clearInterval(interval)
  }, [roomId, currentPlayerId])

  const isMyTurn = useMemo(() => {
    if (!room || !battle || !currentPlayerId) return false
    return battle.turn.currentPlayerId.toLowerCase() === currentPlayerId.toLowerCase()
  }, [room, battle, currentPlayerId])

  const myPiece = useMemo(() => {
    if (!battle || !currentPlayerId) return null
    return battle.pieces.find((p) => p.ownerPlayerId.toLowerCase() === currentPlayerId.toLowerCase())
  }, [battle, currentPlayerId])

  if (loading) {
    return (
      <main className="flex min-h-svh flex-col items-center justify-center bg-zinc-950 px-4">
        <Loader2 className="h-8 w-8 animate-spin text-zinc-400" />
        <p className="mt-4 text-zinc-400">加载中...</p>
      </main>
    )
  }

  if (error) {
    return (
      <main className="flex min-h-svh flex-col items-center justify-center bg-zinc-950 px-4">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle className="text-destructive">错误</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-muted-foreground">{error}</p>
            <div className="flex gap-2">
              <Button asChild variant="outline">
                <Link href="/play">返回大厅</Link>
              </Button>
              {roomId && (
                <Button onClick={() => void fetchRoomAndBattle(roomId)}>
                  重试
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      </main>
    )
  }

  if (!battle) {
    return (
      <main className="flex min-h-svh flex-col items-center justify-center bg-zinc-950 px-4">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle>等待游戏开始</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-muted-foreground">游戏尚未开始，请稍候...</p>
            <Button asChild variant="outline">
              <Link href="/play">返回大厅</Link>
            </Button>
          </CardContent>
        </Card>
      </main>
    )
  }

  // 玩家选择界面
  if (!currentPlayerId && battle.players.length > 1) {
    return (
      <main className="flex min-h-svh flex-col items-center justify-center bg-zinc-950 px-4">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle>选择你的身份</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-muted-foreground">请选择你在本次对战中的身份：</p>
            <div className="space-y-2">
              {battle.players.map((player) => (
                <Button
                  key={player.playerId}
                  className="w-full justify-between"
                  onClick={() => setCurrentPlayerId(player.playerId)}
                >
                  <span>{player.playerId}</span>
                  <Zap className="h-4 w-4 text-yellow-400" />
                </Button>
              ))}
            </div>
          </CardContent>
        </Card>
      </main>
    )
  }

  const phaseLabel = {
    start: "开始阶段",
    action: "行动阶段",
    end: "结束阶段",
  }[battle.turn.phase]

  return (
    <main className="flex min-h-svh flex-col bg-zinc-950 px-4 py-6">
      <div className="mx-auto w-full max-w-6xl space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button asChild variant="ghost" size="sm">
              <Link href="/play">
                <ArrowLeft className="mr-2 h-4 w-4" />
                大厅
              </Link>
            </Button>
            <h1 className="text-xl font-bold text-zinc-100">
              <Swords className="mr-2 inline h-5 w-5 text-red-500" />
              Red VS Blue
            </h1>
          </div>
          <div className="flex items-center gap-2 rounded-lg bg-zinc-900 px-4 py-2">
            <span className="text-sm text-zinc-400">回合</span>
            <span className="text-lg font-bold text-zinc-100">{battle.turn.turnNumber}</span>
          </div>
        </div>

        <div className="grid gap-6 lg:grid-cols-3">
          <div className="space-y-4 lg:col-span-2">
            <Card className="bg-zinc-900/50">
              <CardHeader className="pb-2">
                <CardTitle className="flex items-center justify-between text-sm">
                  <span>战场</span>
                  <span className="text-xs font-normal text-zinc-400">
                    {battle.map.name}
                  </span>
                </CardTitle>
              </CardHeader>
              <CardContent className="flex justify-center">
                <GameBoard map={battle.map} />
              </CardContent>
            </Card>

            {myPiece && (
              <Card className="bg-zinc-900/50">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm">我的棋子</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center gap-4">
                    <div className={`flex h-12 w-12 items-center justify-center rounded-lg ${
                      myPiece.faction === "red" ? "bg-red-600" : "bg-blue-600"
                    }`}>
                      <Swords className="h-6 w-6 text-white" />
                    </div>
                    <div className="flex-1 space-y-1">
                      <div className="flex items-center justify-between">
                        <span className="font-medium text-zinc-200">
                          {myPiece.templateId}
                        </span>
                        <span className={`text-sm ${
                          myPiece.faction === "red" ? "text-red-400" : "text-blue-400"
                        }`}>
                          {myPiece.faction === "red" ? "红方" : "蓝方"}
                        </span>
                      </div>
                      <div className="flex items-center gap-4 text-xs text-zinc-400">
                        <span className="flex items-center gap-1">
                          <Shield className="h-3 w-3" />
                          HP: {myPiece.currentHp}
                        </span>
                        <span className="flex items-center gap-1">
                          <Footprints className="h-3 w-3" />
                          位置: ({myPiece.x}, {myPiece.y})
                        </span>
                      </div>
                      <div className="text-xs text-zinc-400">
                        <span className="flex items-center gap-1">
                          <Swords className="h-3 w-3" />
                          剩余棋子: {battle.pieces.filter(p => p.ownerPlayerId === currentPlayerId && p.currentHp > 0).length}
                        </span>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>

          <div className="space-y-4">
            <Card className="bg-zinc-900/50">
              <CardHeader className="pb-2">
                <CardTitle className="flex items-center justify-between text-sm">
                  <span>当前行动</span>
                  <span className={`px-2 py-0.5 text-xs font-medium rounded ${
                    isMyTurn ? "bg-green-600 text-white" : "bg-zinc-700 text-zinc-300"
                  }`}>
                    {isMyTurn ? "你的回合" : "对手回合"}
                  </span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="rounded-md bg-zinc-800 p-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-zinc-400">阶段</span>
                    <span className="font-medium text-zinc-200">{phaseLabel}</span>
                  </div>
                  <div className="mt-2 flex gap-1">
                    {["start", "action", "end"].map((phase) => (
                      <div
                        key={phase}
                        className={`h-1 flex-1 rounded ${
                          battle.turn.phase === phase
                            ? phase === "start"
                              ? "bg-yellow-500"
                              : phase === "action"
                                ? "bg-green-500"
                                : "bg-red-500"
                            : "bg-zinc-700"
                        }`}
                      />
                    ))}
                  </div>
                </div>

                <div className="rounded-md bg-zinc-800 p-3">
                  <div className="mb-2 text-xs text-zinc-400">本回合行动</div>
                  <div className="space-y-1 text-xs">
                    <div className="flex items-center justify-between">
                      <span className="flex items-center gap-1 text-zinc-400">
                        <Footprints className="h-3 w-3" />
                        移动
                      </span>
                      <span className={battle.turn.actions.hasMoved ? "text-red-400" : "text-green-400"}>
                        {battle.turn.actions.hasMoved ? "已使用" : "可用"}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="flex items-center gap-1 text-zinc-400">
                        <Zap className="h-3 w-3" />
                        普通技能
                      </span>
                      <span className={battle.turn.actions.hasUsedBasicSkill ? "text-red-400" : "text-green-400"}>
                        {battle.turn.actions.hasUsedBasicSkill ? "已使用" : "可用"}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="flex items-center gap-1 text-zinc-400">
                        <Swords className="h-3 w-3" />
                        充能技能
                      </span>
                      <span className={battle.turn.actions.hasUsedChargeSkill ? "text-red-400" : "text-green-400"}>
                        {battle.turn.actions.hasUsedChargeSkill ? "已使用" : "可用"}
                      </span>
                    </div>
                  </div>
                </div>

                {battle.turn.phase === "action" && isMyTurn && (
                  <div className="space-y-2">
                    <Button
                      className="w-full"
                      size="sm"
                      disabled={loading || battle.turn.actions.hasMoved}
                      onClick={() => {
                        if (myPiece) {
                          sendBattleAction({
                            type: "move",
                            playerId: currentPlayerId!,
                            pieceId: myPiece.instanceId,
                            toX: Math.min(myPiece.x + 1, battle.map.width - 1),
                            toY: myPiece.y,
                          })
                        }
                      }}
                    >
                      <Footprints className="mr-2 h-4 w-4" />
                      移动
                    </Button>
                    <Button
                      className="w-full"
                      variant="outline"
                      size="sm"
                      disabled={loading || battle.turn.actions.hasUsedBasicSkill || !myPiece}
                      onClick={() => {
                        if (myPiece) {
                          sendBattleAction({
                            type: "useBasicSkill",
                            playerId: currentPlayerId!,
                            pieceId: myPiece.instanceId,
                            skillId: "basic-shot",
                          })
                        }
                      }}
                    >
                      <Zap className="mr-2 h-4 w-4" />
                      普通技能
                    </Button>
                    <Button
                      className="w-full"
                      variant="outline"
                      size="sm"
                      disabled={loading || battle.turn.actions.hasUsedChargeSkill || !myPiece}
                      onClick={() => {
                        if (myPiece) {
                          sendBattleAction({
                            type: "useChargeSkill",
                            playerId: currentPlayerId!,
                            pieceId: myPiece.instanceId,
                            skillId: "charge-burst",
                          })
                        }
                      }}
                    >
                      <Swords className="mr-2 h-4 w-4" />
                      充能技能
                    </Button>
                    <Button
                      className="w-full"
                      variant="secondary"
                      size="sm"
                      disabled={loading}
                      onClick={() => {
                        sendBattleAction({
                          type: "endTurn",
                          playerId: currentPlayerId!,
                        })
                      }}
                    >
                      结束回合
                    </Button>
                  </div>
                )}

                {battle.turn.phase !== "action" && isMyTurn && (
                  <Button
                    className="w-full"
                    size="sm"
                    disabled={loading}
                    onClick={() => {
                      sendBattleAction({
                        type: "beginPhase",
                        playerId: currentPlayerId!,
                      })
                    }}
                  >
                    继续
                  </Button>
                )}
              </CardContent>
            </Card>

            <Card className="bg-zinc-900/50">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm">玩家信息</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {battle.players.map((player) => {
                  const isCurrentPlayer = player.playerId.toLowerCase() === currentPlayerId?.toLowerCase()
                  const playerPiece = battle.pieces.find(p => p.ownerPlayerId === player.playerId)
                  return (
                    <div
                      key={player.playerId}
                      className={`flex items-center justify-between rounded-md p-2 ${
                        battle.turn.currentPlayerId === player.playerId
                          ? "bg-green-900/30"
                          : "bg-zinc-800/50"
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <div className={`h-2 w-2 rounded-full ${
                          battle.turn.currentPlayerId === player.playerId
                            ? "animate-pulse bg-green-500"
                            : "bg-zinc-500"
                        }`} />
                        <span className={`text-sm ${isCurrentPlayer ? "font-medium text-zinc-200" : "text-zinc-400"}`}>
                          {player.playerId} {isCurrentPlayer && "(你)"}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 text-xs">
                        <span className="flex items-center gap-1 text-zinc-300">
                          <Swords className="h-3 w-3" />
                          {battle.pieces.filter(p => p.ownerPlayerId === player.playerId && p.currentHp > 0).length}
                        </span>
                        <span className="flex items-center gap-1 text-yellow-400">
                          <Zap className="h-3 w-3" />
                          {player.chargePoints}
                        </span>
                      </div>
                    </div>
                  )
                })}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </main>
  )
}

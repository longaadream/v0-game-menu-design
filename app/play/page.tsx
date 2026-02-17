"use client"

import { useEffect, useMemo, useState } from "react"
import Link from "next/link"
import { useRouter, useSearchParams } from "next/navigation"
import { ArrowLeft, Loader2 } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { GameBoard } from "@/components/game-board"
import type { BattleState, BattleAction } from "@/lib/game/turn"

type Room = {
  id: string
  name: string
  status: "waiting" | "in-progress" | "finished"
  players: { id: string; name: string }[]
  currentTurnIndex: number
}

export default function PlayPage() {
  const router = useRouter()
  const searchParams = useSearchParams()

  const [playerName, setPlayerName] = useState("")
  const [roomId, setRoomId] = useState<string | null>(null)
  const [room, setRoom] = useState<Room | null>(null)
  const [battle, setBattle] = useState<BattleState | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // 如果 URL 上已经有 roomId（例如分享链接），进入页面时自动加载
  useEffect(() => {
    const id = searchParams.get("roomId")
    if (id && !roomId) {
      setRoomId(id)
      void fetchRoom(id)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams, roomId])

  async function fetchRoom(id: string) {
    try {
      setLoading(true)
      setError(null)
      const res = await fetch(`/api/rooms/${id}`)
      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        // 不再显示错误信息，而是等待用户输入昵称并加入房间
        setError(null)
        return
      }
      const data = (await res.json()) as Room
      setRoom(data)
      if (data.status === "in-progress") {
        void fetchBattle(id)
      } else {
        setBattle(null)
      }
    } catch (err) {
      // 捕获错误但不显示，避免不必要的 "Room not found" 提示
      setError(null)
    } finally {
      setLoading(false)
    }
  }

  async function handleCreateRoom() {
    if (!playerName.trim()) {
      setError("请先输入你的昵称")
      return
    }
    try {
      setLoading(true)
      setError(null)

      // 1. 创建房间
      const res = await fetch("/api/lobby", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: `${playerName} 的 1v1 房间` }),
      })

      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        throw new Error(data.error || "Failed to create room")
      }

      const created = (await res.json()) as Room
      setRoomId(created.id)
      setRoom(created)

      // 更新 URL，方便分享
      router.replace(`/play?roomId=${created.id}`)

      // 2. 让自己加入房间
      await joinRoom(created.id, playerName)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error")
    } finally {
      setLoading(false)
    }
  }

  async function joinRoom(id: string, name: string) {
    const res = await fetch(`/api/rooms/${id}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "join", playerName: name }),
    })
    if (!res.ok) {
      const data = await res.json().catch(() => ({}))
      throw new Error(data.error || "Failed to join room")
    }
    const updated = (await res.json()) as Room
    setRoom(updated)
  }

  async function handleJoinExisting() {
    if (!playerName.trim()) {
      setError("请先输入你的昵称")
      return
    }
    if (!roomId) {
      setError("请先输入或获取房间 ID")
      return
    }
    try {
      setLoading(true)
      setError(null)
      await joinRoom(roomId, playerName)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error")
    } finally {
      setLoading(false)
    }
  }

  async function handleStartGame() {
    if (!roomId) return
    try {
      setLoading(true)
      setError(null)
      const res = await fetch(`/api/rooms/${roomId}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "start" }),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) {
        throw new Error(data.error || "Failed to start game")
      }
      router.replace(`/battle/${roomId}?playerName=${encodeURIComponent(playerName.trim())}`)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error")
    } finally {
      setLoading(false)
    }
  }

  async function handleMakeMove() {
    if (!roomId || !battle || !playerName.trim()) return
    const me = currentPlayerId
    if (!me) return
    const myPiece = battle.pieces.find((p) => p.ownerPlayerId === me)
    if (!myPiece || myPiece.x == null || myPiece.y == null) return

    // 简化：尝试向右移动一格
    const action: BattleAction = {
      type: "move",
      playerId: me,
      pieceId: myPiece.instanceId,
      toX: myPiece.x + 1,
      toY: myPiece.y,
    }
    await sendBattleAction(action)
  }

  async function fetchBattle(id: string) {
    try {
      setError(null)
      const res = await fetch(`/api/rooms/${id}/battle`)
      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        throw new Error(data.error || "Failed to load battle state")
      }
      const data = (await res.json()) as BattleState
      setBattle(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error")
      setBattle(null)
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

  async function handleDeleteRoom() {
    if (!roomId) return
    try {
      setLoading(true)
      setError(null)
      const res = await fetch(`/api/rooms/${roomId}`, {
        method: "DELETE",
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) {
        throw new Error(data.error || "Failed to delete room")
      }

      // 清空状态
      setRoom(null)
      setRoomId(null)
      setBattle(null)
      // 移除 URL 上的 roomId
      router.replace("/play")
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error")
    } finally {
      setLoading(false)
    }
  }

  const currentPlayerName =
    room && room.players[room.currentTurnIndex]
      ? room.players[room.currentTurnIndex]!.name
      : null

  const isMyTurn =
    !!room &&
    !!playerName.trim() &&
    currentPlayerName?.toLowerCase() === playerName.trim().toLowerCase()

  const currentPlayerId = useMemo(
    () => (playerName.trim() ? playerName.trim() : null),
    [playerName],
  )

  // 轮询检查房间状态，确保所有玩家都能及时获取状态变化
  useEffect(() => {
    if (!roomId) return

    const interval = setInterval(async () => {
      try {
        const res = await fetch(`/api/rooms/${roomId}`)
        if (res.ok) {
          const data = (await res.json()) as Room
          if (data.status === "in-progress") {
            router.replace(`/battle/${roomId}?playerName=${encodeURIComponent(playerName.trim())}`)
          }
        }
      } catch (error) {
        // 忽略错误
      }
    }, 2000) // 每2秒检查一次

    return () => clearInterval(interval)
  }, [roomId, router])

  // 监听房间状态变化，当游戏开始时自动跳转
  useEffect(() => {
    if (room?.status === "in-progress" && roomId) {
      router.replace(`/battle/${roomId}`)
    }
  }, [room?.status, roomId, router])

  return (
    <main className="flex min-h-svh flex-col items-center justify-center px-4 py-12">
      <div className="w-full max-w-md space-y-6">
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-sm text-muted-foreground transition-colors hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Menu
        </Link>

        <Card>
          <CardHeader>
            <CardTitle className="text-2xl font-bold">
              1v1 对战大厅
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="playerName">你的昵称</Label>
              <Input
                id="playerName"
                placeholder="例如：Player_One"
                value={playerName}
                onChange={(e) => setPlayerName(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="roomId">房间 ID（可选，用于加入他人房间）</Label>
              <Input
                id="roomId"
                placeholder="创建房间后会自动生成"
                value={roomId ?? ""}
                onChange={(e) => setRoomId(e.target.value || null)}
              />
            </div>

            <div className="flex flex-col gap-2 sm:flex-row">
              <Button
                className="flex-1"
                onClick={handleCreateRoom}
                disabled={loading}
              >
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    处理中…
                  </>
                ) : (
                  "创建新房间"
                )}
              </Button>
              <Button
                className="flex-1"
                variant="outline"
                onClick={handleJoinExisting}
                disabled={loading}
              >
                加入房间
              </Button>
            </div>

            {error && (
              <p className="text-sm text-destructive" role="alert">
                {error}
              </p>
            )}
          </CardContent>
        </Card>

        {room && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span>{room.name}</span>
                <span className="text-xs uppercase text-muted-foreground">
                  {room.status === "waiting"
                    ? "等待中"
                    : room.status === "in-progress"
                      ? "对战中"
                      : "已结束"}
                </span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-1 text-sm">
                <div>
                  <span className="font-medium text-muted-foreground">
                    房间 ID：
                  </span>
                  <span className="font-mono">{room.id}</span>
                </div>
                <div>
                  <span className="font-medium text-muted-foreground">
                    玩家：
                  </span>
                  {room.players.length === 0
                    ? "暂无"
                    : room.players.map((p) => p.name).join(" vs ")}
                </div>
              </div>

              {!battle && room.status === "waiting" && room.players.length === 2 && playerName.trim() && (
                <div className="flex justify-center">
                  <Button
                    size="sm"
                    className="w-full"
                    disabled={loading}
                    onClick={handleStartGame}
                  >
                    {loading ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        开始游戏中...
                      </>
                    ) : (
                      "开始游戏"
                    )}
                  </Button>
                </div>
              )}

              {battle && (
                <>
                  <div className="space-y-2 rounded-md border border-dashed border-border p-3 text-sm">
                    <div className="font-medium text-muted-foreground">
                      战斗状态：
                    </div>
                    <p className="text-xs text-muted-foreground">
                      当前回合：第 {battle.turn.turnNumber} 回合 ·{" "}
                      {battle.turn.currentPlayerId}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      当前阶段：
                      {battle.turn.phase === "start"
                        ? "开始阶段"
                        : battle.turn.phase === "action"
                          ? "行动阶段"
                          : "结束阶段"}
                    </p>
                  </div>

                  <div className="space-y-2 rounded-md border border-border bg-card/60 p-3 text-xs">
                    <div className="font-medium text-muted-foreground">
                      棋盘（服务器同步）
                    </div>
                    <div className="flex justify-center">
                      <GameBoard map={battle.map} />
                    </div>
                  </div>

                  <div className="space-y-2 rounded-md border border-border bg-card/60 p-3 text-xs">
                    <div className="font-medium text-muted-foreground">
                      行动按钮（每回合每种最多一次）
                    </div>
                    <div className="flex flex-col gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        disabled={loading}
                        onClick={() => sendBattleAction({ type: "beginPhase" })}
                      >
                        下一阶段 / 轮到下家
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        disabled={
                          loading ||
                          !battle ||
                          battle.turn.phase !== "action" ||
                          !currentPlayerId
                        }
                        onClick={handleMakeMove}
                      >
                        我移动一次（示例）
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        disabled={
                          loading ||
                          !battle ||
                          battle.turn.phase !== "action" ||
                          !currentPlayerId
                        }
                        onClick={() =>
                          sendBattleAction({
                            type: "useBasicSkill",
                            playerId: currentPlayerId!,
                            pieceId:
                              battle.pieces.find(
                                (p) => p.ownerPlayerId === currentPlayerId,
                              )?.instanceId ?? "",
                            skillId: "basic-shot",
                          })
                        }
                      >
                        使用一次普通技能（示例）
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        disabled={
                          loading ||
                          !battle ||
                          battle.turn.phase !== "action" ||
                          !currentPlayerId
                        }
                        onClick={() =>
                          sendBattleAction({
                            type: "useChargeSkill",
                            playerId: currentPlayerId!,
                            pieceId:
                              battle.pieces.find(
                                (p) => p.ownerPlayerId === currentPlayerId,
                              )?.instanceId ?? "",
                            skillId: "charge-burst",
                          })
                        }
                      >
                        使用一次充能技能（示例）
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        disabled={
                          loading ||
                          !battle ||
                          battle.turn.phase !== "action" ||
                          !currentPlayerId
                        }
                        onClick={() =>
                          sendBattleAction({
                            type: "endTurn",
                            playerId: currentPlayerId!,
                          })
                        }
                      >
                        结束回合（进入结束阶段）
                      </Button>
                    </div>
                  </div>
                </>
              )}

              <div className="flex justify-end">
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-xs text-destructive hover:text-destructive"
                  onClick={handleDeleteRoom}
                  disabled={loading}
                >
                  删除房间
                </Button>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </main>
  )
}


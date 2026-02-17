"use client"

import { useMemo, useState } from "react"
import Link from "next/link"
import { ArrowLeft, RotateCcw } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { GameBoard } from "@/components/game-board"
import { getMap } from "@/config/maps"
import {
  type BattleAction,
  type BattleState,
  type PlayerId,
  applyBattleAction,
} from "@/lib/game/turn"
import {
  DEFAULT_MAP_ID,
  createInitialBattleForPlayers,
} from "@/lib/game/battle-setup"

const SAMPLE_MAP_ID = DEFAULT_MAP_ID

const RED_PLAYER: PlayerId = "red-player"
const BLUE_PLAYER: PlayerId = "blue-player"

export default function TurnDebugPage() {
  const baseMap = useMemo(() => getMap(SAMPLE_MAP_ID), [])
  const [state, setState] = useState<BattleState | null>(
    baseMap ? createInitialBattleForPlayers([RED_PLAYER, BLUE_PLAYER]) : null,
  )
  const [error, setError] = useState<string | null>(null)

  if (!baseMap || !state) {
    return (
      <main className="flex min-h-svh flex-col items-center justify-center px-4 py-12">
        <div className="w-full max-w-xl space-y-4 text-center">
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-sm text-muted-foreground transition-colors hover:text-foreground"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Menu
          </Link>
          <p className="text-muted-foreground">
            未找到示例地图 {SAMPLE_MAP_ID}，请检查 config/maps.ts。
          </p>
        </div>
      </main>
    )
  }

  function dispatch(action: BattleAction) {
    try {
      setError(null)
      setState((prev) => (prev ? applyBattleAction(prev, action) : prev))
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Unknown error"
      setError(msg)
    }
  }

  function reset() {
    setError(null)
    setState(createInitialBattleForPlayers([RED_PLAYER, BLUE_PLAYER]))
  }

  const currentPlayer =
    state.players.find((p) => p.playerId === state.turn.currentPlayerId) ??
    state.players[0]

  return (
    <main className="flex min-h-svh flex-col items-center justify-center px-4 py-12">
      <div className="w-full max-w-5xl space-y-6">
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-sm text-muted-foreground transition-colors hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Menu
        </Link>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between gap-4">
            <div>
              <CardTitle className="text-2xl font-bold">
                回合逻辑调试（本地模拟）
              </CardTitle>
              <p className="mt-1 text-sm text-muted-foreground">
                两个棋子在同一张地图上轮流回合，你可以点击按钮感受“开始 → 行动 →
                结束 → 下一名玩家”的流程。
              </p>
            </div>
            <Button variant="outline" size="sm" onClick={reset}>
              <RotateCcw className="mr-2 h-4 w-4" />
              重置战局
            </Button>
          </CardHeader>

          <CardContent className="grid gap-6 md:grid-cols-[minmax(0,1.7fr)_minmax(0,1.3fr)]">
            {/* 左侧：棋盘与基本信息 */}
            <div className="space-y-4">
              <GameBoard map={state.map} />

              <div className="space-y-1 rounded-md border border-border bg-card/60 p-3 text-xs">
                <div>
                  <span className="font-medium text-muted-foreground">
                    当前回合：
                  </span>{" "}
                  <span>
                    第 {state.turn.turnNumber} 回合 ·{" "}
                    {state.turn.currentPlayerId === RED_PLAYER
                      ? "红方"
                      : "蓝方"}
                  </span>
                </div>
                <div>
                  <span className="font-medium text-muted-foreground">
                    阶段：
                  </span>{" "}
                  {state.turn.phase === "start"
                    ? "开始阶段"
                    : state.turn.phase === "action"
                      ? "行动阶段"
                      : "结束阶段"}
                </div>
                <div className="flex flex-wrap gap-2 pt-1">
                  <span className="rounded bg-muted px-2 py-0.5">
                    移动：{state.turn.actions.hasMoved ? "已用" : "未用"}
                  </span>
                  <span className="rounded bg-muted px-2 py-0.5">
                    普通技能：
                    {state.turn.actions.hasUsedBasicSkill ? "已用" : "未用"}
                  </span>
                  <span className="rounded bg-muted px-2 py-0.5">
                    充能技能：
                    {state.turn.actions.hasUsedChargeSkill ? "已用" : "未用"}
                  </span>
                </div>
              </div>

              <div className="space-y-1 rounded-md border border-border bg-card/60 p-3 text-xs">
                <div className="font-medium text-muted-foreground">
                  玩家充能点
                </div>
                <div className="flex gap-4">
                  {state.players.map((p) => (
                    <div key={p.playerId}>
                      <span className="mr-1 text-[11px] uppercase text-muted-foreground">
                        {p.playerId === RED_PLAYER ? "红方" : "蓝方"}
                      </span>
                      <span className="font-mono text-sm">
                        {p.chargePoints} 点
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {error && (
                <p className="text-xs text-destructive" role="alert">
                  规则错误：{error}
                </p>
              )}
            </div>

            {/* 右侧：操作按钮与 JSON 预览 */}
            <div className="flex flex-col gap-4">
              <div className="space-y-2 rounded-md border border-border bg-card/60 p-3 text-sm">
                <Label className="text-xs text-muted-foreground">
                  阶段控制
                </Label>
                <div className="flex flex-wrap gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => dispatch({ type: "beginPhase" })}
                  >
                    下一阶段 / 轮到下家
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() =>
                      dispatch({
                        type: "grantChargePoints",
                        playerId: currentPlayer.playerId,
                        amount: 1,
                      })
                    }
                  >
                    给当前玩家 +1 充能点
                  </Button>
                </div>
              </div>

              <div className="space-y-2 rounded-md border border-border bg-card/60 p-3 text-sm">
                <Label className="text-xs text-muted-foreground">
                  行动阶段示例操作（每回合每种最多一次）
                </Label>
                <div className="flex flex-col gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    disabled={state.turn.phase !== "action"}
                    onClick={() =>
                      dispatch({
                        type: "move",
                        playerId: RED_PLAYER,
                        pieceId: "red-1",
                        toX: 2,
                        toY: 1,
                      })
                    }
                  >
                    红方棋子移动到 (2,1)
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    disabled={state.turn.phase !== "action"}
                    onClick={() =>
                      dispatch({
                        type: "useBasicSkill",
                        playerId: currentPlayer.playerId,
                        pieceId:
                          currentPlayer.playerId === RED_PLAYER
                            ? "red-1"
                            : "blue-1",
                        skillId: "basic-shot",
                      })
                    }
                  >
                    当前玩家：使用一次普通技能
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    disabled={state.turn.phase !== "action"}
                    onClick={() =>
                      dispatch({
                        type: "useChargeSkill",
                        playerId: currentPlayer.playerId,
                        pieceId:
                          currentPlayer.playerId === RED_PLAYER
                            ? "red-1"
                            : "blue-1",
                        skillId: "charge-burst",
                      })
                    }
                  >
                    当前玩家：使用一次充能技能（需充能点）
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    disabled={state.turn.phase !== "action"}
                    onClick={() =>
                      dispatch({
                        type: "endTurn",
                        playerId: currentPlayer.playerId,
                      })
                    }
                  >
                    当前玩家结束回合（进入结束阶段）
                  </Button>
                </div>
              </div>

              <div className="space-y-2 rounded-md border border-dashed border-border bg-card/40 p-3 text-xs text-muted-foreground">
                <div className="font-medium text-foreground">状态 JSON</div>
                <pre className="max-h-80 overflow-auto rounded bg-muted p-2 text-[11px]">
{JSON.stringify(state, null, 2)}
                </pre>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </main>
  )
}


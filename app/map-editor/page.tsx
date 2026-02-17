"use client"

import { useMemo, useState } from "react"
import Link from "next/link"
import { ArrowLeft } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import type { BoardMap, TileType, TileProperties } from "@/lib/game/map"

type TileCell = {
  type: TileType
  walkable: boolean
  bulletPassable: boolean
}

const TILE_PRESETS: Record<TileType, TileCell> = {
  floor: { type: "floor", walkable: true, bulletPassable: true },
  wall: { type: "wall", walkable: false, bulletPassable: false },
  spawn: { type: "spawn", walkable: true, bulletPassable: true },
  cover: { type: "cover", walkable: true, bulletPassable: false },
  hole: { type: "hole", walkable: false, bulletPassable: true },
}

function buildInitialGrid(width: number, height: number): TileCell[][] {
  const row: TileCell[] = Array.from({ length: width }, () => ({
    ...TILE_PRESETS.floor,
  }))
  return Array.from({ length: height }, () => row.map((c) => ({ ...c })))
}

export default function MapEditorPage() {
  const [name, setName] = useState("新地图")
  const [width, setWidth] = useState(8)
  const [height, setHeight] = useState(6)
  const [activeType, setActiveType] = useState<TileType>("floor")
  const [grid, setGrid] = useState<TileCell[][]>(
    () => buildInitialGrid(8, 6),
  )

  // 当宽高变动时，重建网格（简单做法：清空为默认地板）
  function handleResize(nextWidth: number, nextHeight: number) {
    const w = Math.min(Math.max(nextWidth, 2), 32)
    const h = Math.min(Math.max(nextHeight, 2), 32)
    setWidth(w)
    setHeight(h)
    setGrid(buildInitialGrid(w, h))
  }

  function handleTileClick(x: number, y: number) {
    setGrid((prev) =>
      prev.map((row, yy) =>
        row.map((cell, xx) => {
          if (xx === x && yy === y) {
            const preset = TILE_PRESETS[activeType]
            return { ...preset }
          }
          return cell
        }),
      ),
    )
  }

  const boardMap: BoardMap = useMemo(() => {
    const tiles: BoardMap["tiles"] = []

    grid.forEach((row, y) => {
      row.forEach((cell, x) => {
        const props: TileProperties = {
          type: cell.type,
          walkable: cell.walkable,
          bulletPassable: cell.bulletPassable,
        }
        tiles.push({
          id: `t-${x}-${y}`,
          x,
          y,
          props,
        })
      })
    })

    return {
      id: name.trim().toLowerCase().replace(/\s+/g, "-") || "custom-map",
      name: name.trim() || "自定义地图",
      width,
      height,
      tiles,
    }
  }, [grid, height, name, width])

  function handleExportJson() {
    const json = JSON.stringify(boardMap, null, 2)
    const blob = new Blob([json], { type: "application/json" })
    const url = URL.createObjectURL(blob)

    const a = document.createElement("a")
    a.href = url
    a.download = `${boardMap.id}.json`
    document.body.appendChild(a)
    a.click()
    a.remove()

    URL.revokeObjectURL(url)
  }

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
          <CardHeader>
            <CardTitle className="text-2xl font-bold">
              地图编辑器（JSON 导出）
            </CardTitle>
          </CardHeader>
          <CardContent className="grid gap-6 md:grid-cols-[minmax(0,2fr)_minmax(0,1.3fr)]">
            {/* 左侧：网格编辑 */}
            <div className="space-y-4">
              <div className="flex flex-wrap items-end gap-4">
                <div className="space-y-1">
                  <Label htmlFor="map-name">地图名称</Label>
                  <Input
                    id="map-name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-48"
                  />
                </div>

                <div className="flex items-end gap-2">
                  <div className="space-y-1">
                    <Label htmlFor="map-width">宽度</Label>
                    <Input
                      id="map-width"
                      type="number"
                      min={2}
                      max={32}
                      value={width}
                      onChange={(e) =>
                        handleResize(Number(e.target.value) || width, height)
                      }
                      className="w-20"
                    />
                  </div>
                  <span className="pb-2 text-muted-foreground">×</span>
                  <div className="space-y-1">
                    <Label htmlFor="map-height">高度</Label>
                    <Input
                      id="map-height"
                      type="number"
                      min={2}
                      max={32}
                      value={height}
                      onChange={(e) =>
                        handleResize(width, Number(e.target.value) || height)
                      }
                      className="w-20"
                    />
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <Label>当前刷子（点击格子涂抹）</Label>
                <div className="flex flex-wrap gap-2">
                  {(Object.keys(TILE_PRESETS) as TileType[]).map((type) => {
                    const preset = TILE_PRESETS[type]
                    const isActive = activeType === type
                    return (
                      <button
                        key={type}
                        type="button"
                        onClick={() => setActiveType(type)}
                        className={`rounded-md border px-3 py-1 text-xs font-medium transition-colors ${
                          isActive
                            ? "border-primary bg-primary/10 text-primary"
                            : "border-border bg-muted/40 text-muted-foreground hover:bg-muted"
                        }`}
                      >
                        {type}{" "}
                        <span className="text-[10px]">
                          ({preset.walkable ? "走" : "堵"}/
                          {preset.bulletPassable ? "穿" : "挡"})
                        </span>
                      </button>
                    )
                  })}
                </div>
              </div>

              <div className="mt-2 inline-flex flex-col gap-1 rounded-lg border border-border bg-card p-3">
                <div className="mb-2 text-xs font-medium text-muted-foreground">
                  点击格子以应用当前刷子
                </div>
                <div
                  className="grid gap-0.5"
                  style={{
                    gridTemplateColumns: `repeat(${width}, minmax(0, 1fr))`,
                    maxWidth: "100%",
                  }}
                >
                  {grid.map((row, y) =>
                    row.map((cell, x) => (
                      <button
                        key={`${x}-${y}`}
                        type="button"
                        onClick={() => handleTileClick(x, y)}
                        className={`relative aspect-square text-[10px] text-white/70 ${
                          cell.type === "wall"
                            ? "bg-zinc-800"
                            : cell.type === "spawn"
                              ? "bg-emerald-500"
                              : cell.type === "cover"
                                ? "bg-amber-500"
                                : cell.type === "hole"
                                  ? "bg-sky-900"
                                  : "bg-zinc-600"
                        }`}
                        title={`(${x}, ${y}) ${cell.type} walkable=${
                          cell.walkable
                        } bullet=${cell.bulletPassable}`}
                      >
                        <span className="pointer-events-none flex h-full w-full select-none items-center justify-center uppercase">
                          {cell.type[0]}
                        </span>
                      </button>
                    )),
                  )}
                </div>
              </div>
            </div>

            {/* 右侧：导出信息 */}
            <div className="flex flex-col justify-between gap-4">
              <div className="space-y-2 text-sm text-muted-foreground">
                <p>
                  这个编辑器会生成一个{" "}
                  <code className="rounded bg-muted px-1 py-0.5 text-xs">
                    BoardMap
                  </code>{" "}
                  结构的 JSON。
                </p>
                <p>
                  你可以把导出的 JSON 文件放进项目里（例如{" "}
                  <code className="rounded bg-muted px-1 py-0.5 text-xs">
                    config/custom-maps
                  </code>
                  目录），然后在代码中读取并注册成可用地图。
                </p>
                <p>
                  之后可以在对战逻辑中给每个房间指定一个{" "}
                  <code className="rounded bg-muted px-1 py-0.5 text-xs">
                    mapId
                  </code>
                  ，用于加载对应的棋盘。
                </p>
              </div>

              <div className="space-y-2 rounded-md border border-dashed border-border p-3 text-xs text-muted-foreground">
                <div className="font-medium text-foreground">导出预览：</div>
                <pre className="max-h-64 overflow-auto rounded bg-muted p-2 text-[11px]">
                  {JSON.stringify(boardMap, null, 2)}
                </pre>
              </div>

              <Button onClick={handleExportJson}>导出为 JSON 文件</Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </main>
  )
}


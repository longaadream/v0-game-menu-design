"use client"

import type { BoardMap, Tile } from "@/lib/game/map"

type GameBoardProps = {
  map: BoardMap
}

function tileColor(tile: Tile): string {
  switch (tile.props.type) {
    case "wall":
      return "bg-zinc-800"
    case "spawn":
      return "bg-emerald-500"
    case "cover":
      return "bg-amber-500"
    case "hole":
      return "bg-sky-900"
    case "floor":
    default:
      return "bg-zinc-600"
  }
}

export function GameBoard({ map }: GameBoardProps) {
  const size = Math.max(map.width, map.height)

  return (
    <div className="inline-flex flex-col gap-1 rounded-lg border border-border bg-card p-3">
      <div className="mb-2 text-xs font-medium text-muted-foreground">
        地图：{map.name} ({map.width} × {map.height})
      </div>

      <div
        className="grid gap-0.5"
        style={{
          gridTemplateColumns: `repeat(${map.width}, minmax(0, 1fr))`,
          width: `${size * 20}px`,
        }}
      >
        {map.tiles.map((tile) => (
          <div
            key={tile.id}
            className={`relative aspect-square ${tileColor(
              tile,
            )} flex items-center justify-center text-[10px] text-white/70`}
            title={`(${tile.x}, ${tile.y}) ${tile.props.type}  walkable=${
              tile.props.walkable
            }  bullet=${tile.props.bulletPassable}`}
          >
            {/* 调试用：显示字符 / 类型首字母 */}
            <span className="pointer-events-none select-none uppercase">
              {tile.props.type[0]}
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}


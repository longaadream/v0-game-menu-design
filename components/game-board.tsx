"use client"

import type { BoardMap, Tile } from "@/lib/game/map"
import type { PieceInstance } from "@/lib/game/piece"

type GameBoardProps = {
  map: BoardMap
  pieces?: PieceInstance[]
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

export function GameBoard({ map, pieces = [] }: GameBoardProps) {
  const size = Math.max(map.width, map.height)
  
  // 方块类型图例
  const tileTypes = [
    { type: "floor", name: "地板", color: "bg-zinc-600" },
    { type: "wall", name: "墙壁", color: "bg-zinc-800" },
    { type: "spawn", name: "出生点", color: "bg-emerald-500" },
    { type: "cover", name: "掩体", color: "bg-amber-500" },
    { type: "hole", name: "陷阱", color: "bg-sky-900" },
  ]

  return (
    <div className="inline-flex flex-col gap-2 rounded-lg border border-border bg-card p-4">
      <div className="mb-2 text-sm font-medium text-muted-foreground">
        地图：{map.name} ({map.width} × {map.height})
      </div>

      {/* 地图图例 */}
      <div className="mb-3 grid gap-1 sm:grid-cols-3 md:grid-cols-5">
        {tileTypes.map((item) => (
          <div key={item.type} className="flex items-center gap-2 text-xs">
            <div className={`h-4 w-4 ${item.color} rounded-sm flex items-center justify-center text-[8px] text-white/70`}>
              {item.type[0]}
            </div>
            <span className="text-muted-foreground">{item.name}</span>
          </div>
        ))}
      </div>

      <div
        className="grid gap-0.5"
        style={{
          gridTemplateColumns: `repeat(${map.width}, minmax(0, 1fr))`,
          width: `${size * 36}px`,
        }}
      >
        {map.tiles.map((tile) => (
          <div
            key={tile.id}
            className={`relative aspect-square ${tileColor(
              tile,
            )} flex items-center justify-center text-[14px] text-white/70`}
            title={`(${tile.x}, ${tile.y}) ${tile.props.type}  walkable=${
              tile.props.walkable
            }  bullet=${tile.props.bulletPassable}`}
          >
            {/* 棋子显示 */}
            {pieces && pieces.some(p => p.x === tile.x && p.y === tile.y) && (
              <div className="absolute inset-0 flex items-center justify-center">
                {(() => {
                  const piece = pieces.find(p => p.x === tile.x && p.y === tile.y)
                  if (!piece) return null
                  
                  if (piece.image && piece.image.startsWith("http")) {
                    return (
                      <img
                        src={piece.image}
                        alt={piece.name}
                        className="w-8 h-8 object-contain"
                      />
                    )
                  } else if (piece.image) {
                    return (
                      <div className={`text-2xl font-bold ${
                        piece.faction === "red" ? "text-red-500" : "text-blue-500"
                      }`}>
                        {piece.image}
                      </div>
                    )
                  } else {
                    return (
                      <div className={`text-2xl font-bold ${
                        piece.faction === "red" ? "text-red-500" : "text-blue-500"
                      }`}>
                        {piece.faction === "red" ? "⚔" : "🛡"}
                      </div>
                    )
                  }
                })()}
              </div>
            )}

            {/* 显示类型首字母 */}
            <span className="pointer-events-none select-none uppercase">
              {tile.props.type[0]}
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}

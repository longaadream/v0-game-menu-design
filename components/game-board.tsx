"use client"

import { useEffect } from "react"
import type { BoardMap, Tile } from "@/lib/game/map"
import type { PieceInstance, PieceTemplate } from "@/lib/game/piece"
import { getPieceById, loadPieces } from "@/lib/game/piece-repository"


type GameBoardProps = {
  map: BoardMap
  pieces?: PieceInstance[]
  onTileClick?: (x: number, y: number) => void
  onPieceClick?: (pieceId: string) => void
  selectedPieceId?: string
  isSelectingMoveTarget?: boolean
  isSelectingTeleportTarget?: boolean
  isSelectingSkillTarget?: boolean
  isPlacingPiece?: boolean
  selectedSkillId?: string
  teleportRange?: number
}

// 暴风雪状态类型
interface BlizzardStatus {
  type: 'blizzard'
  value: number  // 中心X坐标
  extraValue: number  // 中心Y坐标
}

// 检查棋子是否有暴风雪状态
function getBlizzardCenter(piece: PieceInstance): { x: number, y: number } | null {
  if (!piece.statusTags) return null
  const blizzardStatus = piece.statusTags.find((tag: any) => tag.type === 'blizzard') as BlizzardStatus | undefined
  if (blizzardStatus && blizzardStatus.value !== undefined && blizzardStatus.extraValue !== undefined) {
    return { x: blizzardStatus.value, y: blizzardStatus.extraValue }
  }
  return null
}

function tileColor(tile: Tile): string {
  // 检查是否是暗影步目标格子
  if (tile.props.shadowStepTarget) {
    return "bg-purple-600"
  }
  switch (tile.props.type) {
    case "wall":
      return "bg-zinc-800"
    case "spawn":
      return "bg-emerald-500"
    case "cover":
      return "bg-amber-500"
    case "hole":
      return "bg-sky-900"
    case "lava":
      return "bg-orange-700"
    case "spring":
      return "bg-teal-700"
    case "chargepad":
      return "bg-violet-700"
    case "floor":
    default:
      return "bg-zinc-600"
  }
}

export function GameBoard({ map, pieces = [], onTileClick, onPieceClick, selectedPieceId, isSelectingMoveTarget, isSelectingTeleportTarget, isSelectingSkillTarget, isPlacingPiece, selectedSkillId, teleportRange = 5 }: GameBoardProps) {
  const maxSize = Math.max(map.width, map.height)
  // 根据地图大小动态计算格子大小，确保棋盘在容器中合理显示
  // 最小格子大小为 24px，最大为 48px
  const tileSize = Math.max(24, Math.min(48, Math.floor(600 / maxSize)))
  
  // 组件加载时自动加载棋子数据
  useEffect(() => {
    void loadPieces()
  }, [])
  
  // 方块类型图例
  const tileTypes = [
    { type: "floor", name: "地板", color: "bg-zinc-600" },
    { type: "wall", name: "墙壁", color: "bg-zinc-800" },
    { type: "spawn", name: "出生点", color: "bg-emerald-500" },
    { type: "cover", name: "掩体", color: "bg-amber-500" },
    { type: "hole", name: "陷阱", color: "bg-sky-900" },
    { type: "lava", name: "熔岩(-HP)", color: "bg-orange-700" },
    { type: "spring", name: "治愈泉(+HP)", color: "bg-teal-700" },
    { type: "chargepad", name: "充能台(+CP)", color: "bg-violet-700" },
    { type: "shadow-step", name: "暗影步", color: "bg-purple-600" },
    { type: "blizzard", name: "暴风雪", color: "bg-blue-400/50" },
  ]

  // 获取选中的棋子
  const selectedPiece = pieces.find(p => p.instanceId === selectedPieceId)

  // 计算可移动的格子
  const getValidMoveTargets = (): { x: number, y: number }[] => {
    if (!selectedPiece || !isSelectingMoveTarget) return []
    
    const targets: { x: number, y: number }[] = []
    const { x: startX, y: startY } = selectedPiece
    
    // 检查同一行（左右）
    for (let x = 0; x < map.width; x++) {
      if (x === startX) continue
      if (isValidMoveTarget(startX, startY, x, startY)) {
        targets.push({ x, y: startY })
      }
    }
    
    // 检查同一列（上下）
    for (let y = 0; y < map.height; y++) {
      if (y === startY) continue
      if (isValidMoveTarget(startX, startY, startX, y)) {
        targets.push({ x: startX, y })
      }
    }
    
    return targets
  }

  // 计算可传送的格子
  const getValidTeleportTargets = (): { x: number, y: number }[] => {
    if (!selectedPiece || !isSelectingTeleportTarget) return []
    
    const targets: { x: number, y: number }[] = []
    const { x: startX, y: startY } = selectedPiece
    
    // 检查范围内的所有格子
    for (let x = 0; x < map.width; x++) {
      for (let y = 0; y < map.height; y++) {
        if (x === startX && y === startY) continue
        
        // 计算曼哈顿距离
        const distance = Math.abs(x - startX) + Math.abs(y - startY)
        if (distance <= teleportRange) {
          // 检查目标格子是否存在且可走
          const targetTile = map.tiles.find(t => t.x === x && t.y === y)
          if (targetTile && targetTile.props.walkable) {
            // 检查目标格子是否被占用
            if (!pieces.some(p => p.x === x && p.y === y && p.currentHp > 0)) {
              targets.push({ x, y })
            }
          }
        }
      }
    }
    
    return targets
  }

  // 检查移动目标是否有效
  const isValidMoveTarget = (startX: number, startY: number, targetX: number, targetY: number): boolean => {
    // 检查是否在同一行或同一列
    if (startX !== targetX && startY !== targetY) return false
    
    // 检查目标格子是否存在且可走
    const targetTile = map.tiles.find(t => t.x === targetX && t.y === targetY)
    if (!targetTile || !targetTile.props.walkable) return false
    
    // 检查目标格子是否被占用
    if (pieces.some(p => p.x === targetX && p.y === targetY && p.currentHp > 0)) return false
    
    // 检查路径是否被阻挡
    return !isPathBlocked(startX, startY, targetX, targetY)
  }

  // 检查路径是否被阻挡
  const isPathBlocked = (startX: number, startY: number, targetX: number, targetY: number): boolean => {
    // 水平移动
    if (startY === targetY) {
      const minX = Math.min(startX, targetX)
      const maxX = Math.max(startX, targetX)
      for (let x = minX + 1; x < maxX; x++) {
        // 检查中间格子是否有棋子
        if (pieces.some(p => p.x === x && p.y === startY && p.currentHp > 0)) {
          return true
        }
        // 检查中间格子是否可走
        const tile = map.tiles.find(t => t.x === x && t.y === startY)
        if (!tile || !tile.props.walkable) {
          return true
        }
      }
    }
    // 垂直移动
    else if (startX === targetX) {
      const minY = Math.min(startY, targetY)
      const maxY = Math.max(startY, targetY)
      for (let y = minY + 1; y < maxY; y++) {
        // 检查中间格子是否有棋子
        if (pieces.some(p => p.x === startX && p.y === y && p.currentHp > 0)) {
          return true
        }
        // 检查中间格子是否可走
        const tile = map.tiles.find(t => t.x === startX && t.y === y)
        if (!tile || !tile.props.walkable) {
          return true
        }
      }
    }
    return false
  }

  // 获取所有暴风雪区域
  const getBlizzardAreas = (): { x: number, y: number }[] => {
    const areas: { x: number, y: number }[] = []
    pieces.forEach(piece => {
      const center = getBlizzardCenter(piece)
      if (center) {
        // 3x3 区域
        for (let dx = -1; dx <= 1; dx++) {
          for (let dy = -1; dy <= 1; dy++) {
            const x = center.x + dx
            const y = center.y + dy
            if (x >= 0 && x < map.width && y >= 0 && y < map.height) {
              areas.push({ x, y })
            }
          }
        }
      }
    })
    return areas
  }

  // 获取格子的额外类名
  const getTileClassName = (tile: typeof map.tiles[0]) => {
    const baseClass = tileColor(tile)

    // 检查是否是暴风雪区域
    const blizzardAreas = getBlizzardAreas()
    const isBlizzardTile = blizzardAreas.some(t => t.x === tile.x && t.y === tile.y)

    // 检查是否是可移动目标
    if (isSelectingMoveTarget) {
      const validTargets = getValidMoveTargets()
      if (validTargets.some(t => t.x === tile.x && t.y === tile.y)) {
        return `${baseClass} cursor-pointer hover:bg-green-500/30`
      }
    }

    // 检查是否是可传送目标
    if (isSelectingTeleportTarget) {
      const validTargets = getValidTeleportTargets()
      if (validTargets.some(t => t.x === tile.x && t.y === tile.y)) {
        return `${baseClass} cursor-pointer hover:bg-purple-500/30`
      }
    }

    // 检查是否是技能目标选择模式
    if (isSelectingSkillTarget) {
      return `${baseClass} cursor-pointer hover:bg-blue-500/30`
    }

    // 放置棋子模式
    if (isPlacingPiece) {
      return `${baseClass} cursor-crosshair hover:bg-yellow-500/30`
    }

    // 如果是暴风雪区域，添加半透明蓝色背景
    if (isBlizzardTile) {
      return `${baseClass} bg-blue-400/50 border border-blue-300/50`
    }

    return baseClass
  }

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
          gridTemplateColumns: `repeat(${map.width}, ${tileSize}px)`,
          width: `${map.width * tileSize + (map.width - 1) * 2}px`,
        }}
      >
        {map.tiles.map((tile) => (
          <div
            key={tile.id}
            className={`relative aspect-square ${getTileClassName(
              tile,
            )} flex items-center justify-center text-[14px] text-white/70`}
            title={`(${tile.x}, ${tile.y}) ${tile.props.type}  walkable=${
              tile.props.walkable
            }  bullet=${tile.props.bulletPassable}`}
            onClick={() => {
              if ((isSelectingMoveTarget || isSelectingTeleportTarget || isSelectingSkillTarget || isPlacingPiece) && onTileClick) {
                onTileClick(tile.x, tile.y)
              }
            }}
          >
            {/* 棋子显示 - 只显示存活的棋子 */}
            {pieces && pieces.some(p => p.x === tile.x && p.y === tile.y && p.currentHp > 0) && (
              (() => {
                const piece = pieces.find(p => p.x === tile.x && p.y === tile.y && p.currentHp > 0)
                if (!piece) return null
                
                // 通过templateId获取棋子模板
                const pieceTemplate = getPieceById(piece.templateId)
                const image = pieceTemplate?.image
                
                // 检查棋子是否被选中
                const isSelected = selectedPieceId === piece.instanceId
                
                // 确定棋子的阵营
                const getFaction = () => {
                  // 1. 从piece对象获取
                  if (piece.faction) {
                    return piece.faction === "red" ? "red" : "blue"
                  }
                  // 2. 从模板获取
                  if (pieceTemplate?.faction) {
                    return pieceTemplate.faction === "red" ? "red" : "blue"
                  }
                  // 3. 从模板ID判断
                  if (piece.templateId) {
                    if (piece.templateId.toLowerCase().includes("red")) {
                      return "red"
                    } else if (piece.templateId.toLowerCase().includes("blue")) {
                      return "blue"
                    }
                  }
                  // 默认阵营
                  return "blue"
                }
                
                const faction = getFaction()
                console.log('Final faction:', faction)
                console.log('Piece object:', piece)
                console.log('Piece template:', pieceTemplate)
                const borderColor = faction === "red" ? "border-red-500" : "border-blue-500"
                console.log('Border color class:', borderColor)
                const hoverBorderClass = `hover:border-2 ${borderColor} hover:border-4`
                console.log('Hover border class:', hoverBorderClass)
                
                // 检查棋子是否死亡
                const isDead = piece.currentHp <= 0;
                
                // 为死亡的棋子添加灰色效果
                const deadClass = isDead ? "opacity-50 grayscale" : "";
                
                return (
                  <div 
                    className={`absolute inset-0 flex items-center justify-center transition-all duration-200 cursor-pointer ${isSelected ? "border-4 border-green-500" : hoverBorderClass} ${deadClass}`}
                    onClick={(e) => {
                      e.stopPropagation();
                      if (onPieceClick) {
                        onPieceClick(piece.instanceId);
                      }
                    }}
                  >
                    {image && image.startsWith("http") ? (
                      <img
                        src={image}
                        alt={pieceTemplate?.name || "Piece"}
                        className="w-full h-full object-contain"
                      />
                    ) : image && (image.length <= 3 || image.includes("️")) ? (
                      <span 
                        className={`font-bold ${faction === "red" ? "text-red-500" : "text-blue-500"} ${isDead ? "opacity-50" : ""}`}
                        style={{ fontSize: `${Math.max(16, tileSize * 0.7)}px` }}
                      >
                        {image}
                      </span>
                    ) : image ? (
                      <img
                        src={`/${image}`}
                        alt={pieceTemplate?.name || "Piece"}
                        className="w-full h-full object-contain"
                      />
                    ) : (
                      <span 
                        className={`font-bold ${faction === "red" ? "text-red-500" : "text-blue-500"} ${isDead ? "opacity-50" : ""}`}
                        style={{ fontSize: `${Math.max(14, tileSize * 0.6)}px` }}
                      >
                        {faction === "red" ? "⚔" : "🛡"}
                      </span>
                    )}
                    
                    {/* 为死亡的棋子添加阵亡标记 */}
                    {isDead && (
                      <div className="absolute inset-0 flex items-center justify-center bg-red-900/30">
                        <span 
                          className="font-bold text-red-500"
                          style={{ fontSize: `${Math.max(12, tileSize * 0.5)}px` }}
                        >
                          ✖️
                        </span>
                      </div>
                    )}
                  </div>
                )
              })()
            )}

            {/* 显示类型首字母 */}
            <span className="pointer-events-none select-none uppercase">
              {/* 注释掉类型首字母显示，避免用户混淆 */}
              {/* {tile.props.type[0]} */}
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}

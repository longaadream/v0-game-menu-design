import { AsciiMapConfig, BoardMap, createMapFromAscii } from "@/lib/game/map"

// 通用图例：你可以在这里统一定义“# . S C H”等字符的含义
const BASE_LEGEND: AsciiMapConfig["legend"] = [
  {
    char: "#",
    type: "wall",
    walkable: false,
    bulletPassable: false,
  },
  {
    char: ".",
    type: "floor",
    walkable: true,
    bulletPassable: true,
  },
  {
    char: "S",
    type: "spawn",
    walkable: true,
    bulletPassable: true,
  },
  {
    char: "C",
    type: "cover",
    walkable: true,
    bulletPassable: false,
  },
  {
    char: "H",
    type: "hole",
    walkable: false,
    bulletPassable: true,
  },
]

// 一个示例地图：8x6 的小竞技场
const ARENA_ASCII: AsciiMapConfig = {
  id: "arena-8x6",
  name: "小型竞技场",
  layout: [
    "########",
    "#..C..S#",
    "#..##..#",
    "#S.C..H#",
    "#......#",
    "########",
  ],
  legend: BASE_LEGEND,
}

export const MAPS: Record<string, BoardMap> = {
  [ARENA_ASCII.id]: createMapFromAscii(ARENA_ASCII),
}

export function getMap(id: string): BoardMap | undefined {
  return MAPS[id]
}

export function listMaps(): BoardMap[] {
  return Object.values(MAPS)
}


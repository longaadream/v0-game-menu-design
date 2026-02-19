import type { BattleState } from './turn'

// 玩家类型
export interface Player {
  id: string
  name: string
  joinedAt?: number
  faction?: "red" | "blue"
  selectedPieces?: Array<{ templateId: string; faction: string }>
  hasSelectedPieces?: boolean
}

// 房间状态类型
export type RoomStatus = 'waiting' | 'ready' | 'in-progress' | 'finished'

// 游戏动作类型
export interface GameAction {
  type: string
  playerId: string
  payload?: any
}

// 房间类型
export interface Room {
  id: string
  name: string
  status: RoomStatus
  players: Player[]
  currentTurnIndex: number
  battleState?: BattleState
  actions: GameAction[]
  maxPlayers?: number
  hostId?: string
  mapId?: string
  createdAt?: number
  visibility?: "private" | "public"
}

// 房间存储类
export class RoomStore {
  private rooms: Map<string, Room> = new Map()

  // 创建新房间
  createRoom(roomId: string, roomName: string): Room {
    const newRoom: Room = {
      id: roomId,
      name: roomName,
      status: 'waiting',
      players: [],
      currentTurnIndex: 0,
      actions: []
    }
    this.rooms.set(roomId, newRoom)
    return newRoom
  }

  // 获取房间
  getRoom(roomId: string): Room | undefined {
    return this.rooms.get(roomId)
  }

  // 获取所有房间
  getAllRooms(): Room[] {
    return Array.from(this.rooms.values())
  }

  // 获取所有房间（返回 Map 实例）
  getRooms(): Map<string, Room> {
    return this.rooms
  }

  // 添加玩家到房间
  addPlayer(roomId: string, player: Player): boolean {
    const room = this.rooms.get(roomId)
    if (!room || room.status !== 'waiting') {
      return false
    }
    if (room.players.some(p => p.id === player.id)) {
      return false
    }
    room.players.push(player)
    return true
  }

  // 更新房间状态
  updateRoomStatus(roomId: string, status: RoomStatus): boolean {
    const room = this.rooms.get(roomId)
    if (!room) {
      return false
    }
    room.status = status
    return true
  }

  // 更新房间的战斗状态
  updateBattleState(roomId: string, battleState: BattleState): boolean {
    const room = this.rooms.get(roomId)
    if (!room) {
      return false
    }
    room.battleState = battleState
    return true
  }

  // 添加游戏动作到房间
  addAction(roomId: string, action: GameAction): boolean {
    const room = this.rooms.get(roomId)
    if (!room) {
      return false
    }
    room.actions.push(action)
    return true
  }

  // 移除房间
  removeRoom(roomId: string): boolean {
    return this.rooms.delete(roomId)
  }

  // 设置房间
  setRoom(roomId: string, room: Room): void {
    this.rooms.set(roomId, room)
  }

  // 删除房间
  deleteRoom(roomId: string): boolean {
    return this.rooms.delete(roomId)
  }
}

// 导出单例实例
export const roomStore = new RoomStore()
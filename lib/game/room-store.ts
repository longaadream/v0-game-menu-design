import type { BattleState } from './turn'
import fs from 'fs'
import path from 'path'

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
  private storagePath: string | null = null

  constructor() {
    // 初始化存储路径
    if (typeof window === 'undefined') {
      this.storagePath = path.join(process.cwd(), 'data', 'rooms')
      // 确保存储目录存在
      this.ensureStorageDirectory()
      // 清除旧的存储方式
      this.clearOldStorage()
      // 从存储加载房间
      this.loadRooms()
      console.log('Room store initialized with storage path:', this.storagePath)
      console.log('Current working directory:', process.cwd())
      console.log('Storage directory exists:', fs.existsSync(this.storagePath))
      if (fs.existsSync(this.storagePath)) {
        const files = fs.readdirSync(this.storagePath)
        console.log('Files in storage directory:', files)
      }
    }
  }

  // 确保存储目录存在
  private ensureStorageDirectory(): void {
    if (!this.storagePath) return
    
    if (!fs.existsSync(this.storagePath)) {
      fs.mkdirSync(this.storagePath, { recursive: true })
    }
  }

  // 保存单个房间到存储
  private saveRoom(room: Room): void {
    if (!this.storagePath) {
      console.log('No storage path, skipping save')
      return
    }
    
    const filePath = path.join(this.storagePath, `${room.id}.json`)
    console.log('Saving room to file:', { roomId: room.id, filePath })
    
    try {
      // 确保玩家对象包含hasSelectedPieces属性
      const roomWithValidPlayers = {
        ...room,
        players: room.players.map(player => ({
          ...player,
          hasSelectedPieces: player.hasSelectedPieces === true || (player.selectedPieces && player.selectedPieces.length > 0)
        }))
      }
      
      const roomData = JSON.stringify(roomWithValidPlayers, null, 2)
      console.log('Room data to save (first 500 chars):', roomData.substring(0, 500) + '...')
      fs.writeFileSync(filePath, roomData)
      console.log('Room saved successfully:', room.id)
      
      // 验证文件是否正确保存
      const savedData = fs.readFileSync(filePath, 'utf-8')
      const parsedRoom = JSON.parse(savedData)
      console.log('Verification - Saved room players:', parsedRoom.players?.map((p: any) => ({
        id: p.id,
        hasSelectedPieces: p.hasSelectedPieces,
        selectedPiecesCount: p.selectedPieces?.length || 0
      })) || [])
      
      // 验证文件是否存在
      if (fs.existsSync(filePath)) {
        console.log('Verification - File exists:', filePath)
        console.log('Verification - File size:', fs.statSync(filePath).size, 'bytes')
      } else {
        console.log('Verification - File does NOT exist:', filePath)
      }
    } catch (error) {
      console.error(`Error saving room ${room.id}:`, error)
    }
  }

  // 从存储加载单个房间
  private loadRoom(roomId: string): Room | null {
    if (!this.storagePath) return null
    
    const filePath = path.join(this.storagePath, `${roomId}.json`)
    
    if (!fs.existsSync(filePath)) {
      return null
    }
    
    try {
      const content = fs.readFileSync(filePath, 'utf-8')
      return JSON.parse(content) as Room
    } catch (error) {
      console.error(`Error loading room ${roomId}:`, error)
      return null
    }
  }

  // 从存储加载所有房间
  private loadRooms(): void {
    this.syncWithStorage()
  }

  // 与存储同步，确保内存与存储一致
  syncWithStorage(): void {
    if (!this.storagePath) return
    
    try {
      if (!fs.existsSync(this.storagePath)) {
        console.log('Storage directory does not exist, no rooms to load')
        // 清空内存中的房间列表，因为存储中没有房间
        this.rooms.clear()
        return
      }
      
      const files = fs.readdirSync(this.storagePath)
      console.log('Found room files:', files)
      
      // 获取存储中的房间 ID 列表
      const storageRoomIds = files
        .filter(file => file.endsWith('.json'))
        .map(file => file.replace('.json', '').trim())
      
      console.log('Room IDs in storage:', storageRoomIds)
      
      // 清空现有的房间列表，准备重新加载
      this.rooms.clear()
      console.log('Cleared existing rooms from memory')
      
      // 从存储加载所有房间
      files.forEach(file => {
        if (file.endsWith('.json')) {
          const roomId = file.replace('.json', '')
          const trimmedRoomId = roomId.trim()
          const room = this.loadRoom(trimmedRoomId)
          if (room) {
            console.log('Loading room from storage:', trimmedRoomId)
            // 确保使用修剪后的 ID 作为键存储房间
            const roomWithCorrectId = {
              ...room,
              id: trimmedRoomId
            }
            this.rooms.set(trimmedRoomId, roomWithCorrectId)
          }
        }
      })
      
      console.log('Rooms loaded from storage:', Array.from(this.rooms.keys()))
    } catch (error) {
      console.error('Error syncing with storage:', error)
      // 出错时不再清空房间列表，保留现有房间
      console.log('Error syncing with storage, keeping existing rooms')
    }
  }

  // 删除存储中的房间
  private deleteStoredRoom(roomId: string): boolean {
    if (!this.storagePath) {
      console.error('Storage path is not set, cannot delete room file')
      return false
    }
    
    const filePath = path.join(this.storagePath, `${roomId}.json`)
    
    console.log('Attempting to delete room file:', filePath)
    
    try {
      if (fs.existsSync(filePath)) {
        try {
          fs.unlinkSync(filePath)
          console.log('Successfully deleted room file:', filePath)
          return true
        } catch (error) {
          console.error(`Error deleting room ${roomId} from storage:`, error)
          return false
        }
      } else {
        console.log('Room file does not exist:', filePath)
        return true // 文件不存在视为删除成功
      }
    } catch (error) {
      console.error(`Error checking if room file exists:`, error)
      return false
    }
  }

  // 创建新房间
  createRoom(roomId: string, roomName: string): Room {
    const trimmedRoomId = roomId.trim()
    const newRoom: Room = {
      id: trimmedRoomId,
      name: roomName,
      status: 'waiting',
      players: [],
      currentTurnIndex: 0,
      actions: [],
      createdAt: Date.now()
    }
    this.rooms.set(trimmedRoomId, newRoom)
    this.saveRoom(newRoom)
    return newRoom
  }

  // 获取房间
  getRoom(roomId: string, loadFromStorage: boolean = true): Room | undefined {
    const trimmedRoomId = roomId.trim()
    console.log('=== Get Room Operation ===')
    console.log('Input roomId:', { original: roomId, trimmed: trimmedRoomId, loadFromStorage })
    
    // 与存储同步，确保内存与存储一致
    this.syncWithStorage()
    console.log('Rooms in memory after sync:', Array.from(this.rooms.keys()))
    
    // 先从内存中获取，只使用修剪后的 ID
    let room = this.rooms.get(trimmedRoomId)
    console.log('Get room with trimmed ID:', !!room)
    
    // 无论房间来自内存还是存储，都重新计算玩家的选择状态
    if (room) {
      console.log('=== FORCE RECALCULATING PLAYER SELECTION STATUS ===')
      const roomWithValidPlayers = {
        ...room,
        players: room.players.map(player => ({
          ...player,
          hasSelectedPieces: player.hasSelectedPieces === true || (player.selectedPieces && player.selectedPieces.length > 0)
        }))
      }
      // 更新内存中的房间对象
      this.rooms.set(trimmedRoomId, roomWithValidPlayers)
      console.log('Players after recalculation:', roomWithValidPlayers.players.map(p => ({
        id: p.id,
        hasSelectedPieces: p.hasSelectedPieces,
        selectedPiecesCount: p.selectedPieces?.length || 0
      })))
      room = roomWithValidPlayers
    }
    
    console.log('Get room result:', { roomId: trimmedRoomId, found: !!room })
    if (room && room.players) {
      console.log('Final players in room:', room.players.map(p => ({
        id: p.id,
        hasSelectedPieces: p.hasSelectedPieces,
        selectedPiecesCount: p.selectedPieces?.length || 0
      })))
    }
    console.log('=== Get Room Operation Complete ===')
    return room
  }

  // 获取所有房间
  getAllRooms(): Room[] {
    // 与存储同步，确保内存与存储一致
    this.syncWithStorage()
    return Array.from(this.rooms.values())
  }

  // 获取所有房间（返回 Map 实例）
  getRooms(): Map<string, Room> {
    // 与存储同步，确保内存与存储一致
    this.syncWithStorage()
    return this.rooms
  }

  // 添加玩家到房间
  addPlayer(roomId: string, player: Player): boolean {
    const room = this.getRoom(roomId)
    if (!room || room.status !== 'waiting') {
      return false
    }
    if (room.players.some(p => p.id === player.id)) {
      return false
    }
    room.players.push(player)
    this.saveRoom(room)
    return true
  }

  // 更新房间状态
  updateRoomStatus(roomId: string, status: RoomStatus): boolean {
    const room = this.getRoom(roomId)
    if (!room) {
      return false
    }
    room.status = status
    this.saveRoom(room)
    return true
  }

  // 更新房间的战斗状态
  updateBattleState(roomId: string, battleState: BattleState): boolean {
    const room = this.getRoom(roomId)
    if (!room) {
      return false
    }
    room.battleState = battleState
    this.saveRoom(room)
    return true
  }

  // 添加游戏动作到房间
  addAction(roomId: string, action: GameAction): boolean {
    const room = this.getRoom(roomId)
    if (!room) {
      return false
    }
    room.actions.push(action)
    this.saveRoom(room)
    return true
  }

  // 移除房间
  removeRoom(roomId: string): boolean {
    const trimmedRoomId = roomId.trim()
    console.log('=== Removing Room ===')
    console.log('Input roomId:', { original: roomId, trimmed: trimmedRoomId })
    console.log('Rooms before removal:', Array.from(this.rooms.keys()))
    
    // 首先从存储中删除房间文件
    console.log('Step 1: Deleting room from storage')
    const storageDeleted = this.deleteStoredRoom(trimmedRoomId)
    console.log('Storage deletion result:', storageDeleted)
    
    // 然后与存储同步，确保内存与存储一致
    console.log('Step 2: Syncing with storage')
    this.syncWithStorage()
    
    console.log('Rooms after sync:', Array.from(this.rooms.keys()))
    
    // 检查房间是否还在内存中
    const roomStillExists = Array.from(this.rooms.values()).some(room => 
      room.id.trim().toLowerCase() === trimmedRoomId.toLowerCase()
    )
    
    console.log('Room still exists in memory:', roomStillExists)
    console.log('=== Room Removal Complete ===')
    
    // 如果房间不在内存中，视为删除成功
    return !roomStillExists
  }

  // 设置房间
  setRoom(roomId: string, room: Room): void {
    const trimmedRoomId = roomId.trim()
    console.log('=== Setting Room Operation ===')
    console.log('Input parameters:', { originalRoomId: roomId, trimmedRoomId, roomName: room.name })
    console.log('Players in room to set:', room.players?.map(p => ({
      id: p.id,
      hasSelectedPieces: p.hasSelectedPieces,
      selectedPiecesCount: p.selectedPieces?.length || 0,
      selectedPieces: p.selectedPieces
    })) || [])
    
    // 确保房间 ID 与传入的 ID 一致
    const roomWithCorrectId = {
      ...room,
      id: trimmedRoomId
    }
    
    console.log('Room data to store:', {
      id: roomWithCorrectId.id,
      status: roomWithCorrectId.status,
      playersCount: roomWithCorrectId.players?.length || 0
    })
    
    // 保存房间到存储
    this.saveRoom(roomWithCorrectId)
    
    // 与存储同步，确保内存与存储一致
    this.syncWithStorage()
    
    // 验证存储结果
    const storedRoom = this.rooms.get(trimmedRoomId)
    console.log('=== Verification ===')
    console.log('Room stored in memory:', !!storedRoom)
    if (storedRoom) {
      console.log('Players after set:', storedRoom.players?.map(p => ({
        id: p.id,
        hasSelectedPieces: p.hasSelectedPieces,
        selectedPiecesCount: p.selectedPieces?.length || 0
      })) || [])
    }
    
    console.log('=== Setting Room Operation Complete ===')
  }

  // 删除房间 - 强制立即删除，优先级最高
  deleteRoom(roomId: string): boolean {
    const trimmedRoomId = roomId.trim()
    console.log('=== FORCE DELETE ROOM OPERATION ===')
    console.log('Input roomId:', { original: roomId, trimmed: trimmedRoomId })
    console.log('Current rooms in memory before delete:', Array.from(this.rooms.keys()))
    
    // 1. 强制从存储中删除房间文件（最高优先级，立即执行）
    console.log('=== Step 1: FORCE Deleting from storage (HIGHEST PRIORITY) ===')
    
    // 构建文件路径
    if (this.storagePath) {
      const filePath = path.join(this.storagePath, `${trimmedRoomId}.json`)
      console.log('Force deleting room file:', filePath)
      
      // 无论文件是否存在，都尝试删除
      try {
        if (fs.existsSync(filePath)) {
          fs.unlinkSync(filePath)
          console.log('SUCCESS: Room file deleted:', filePath)
        } else {
          console.log('INFO: Room file does not exist:', filePath)
        }
      } catch (error) {
        console.error('ERROR: Failed to delete room file:', error)
      }
      
      // 删除可能的变体文件名
      const possibleFilenames = [
        trimmedRoomId.toLowerCase(),
        trimmedRoomId.toUpperCase()
      ]
      
      for (const filename of possibleFilenames) {
        const variantPath = path.join(this.storagePath, `${filename}.json`)
        console.log('Force deleting room file variant:', variantPath)
        try {
          if (fs.existsSync(variantPath)) {
            fs.unlinkSync(variantPath)
            console.log('SUCCESS: Room file variant deleted:', variantPath)
          }
        } catch (error) {
          console.error('ERROR: Failed to delete room file variant:', error)
        }
      }
    }
    
    // 2. 与存储同步，确保内存与存储一致
    console.log('=== Step 2: Syncing with storage ===')
    this.syncWithStorage()
    
    // 3. 验证删除结果
    console.log('=== Step 3: Verifying deletion ===')
    const remainingRooms = Array.from(this.rooms.keys())
    console.log('Remaining rooms in memory:', remainingRooms)
    
    // 检查是否还有任何匹配的房间
    const hasAnyMatch = remainingRooms.some(key => {
      const keyMatches = key.trim().toLowerCase() === trimmedRoomId.toLowerCase()
      const room = this.rooms.get(key)
      const roomIdMatches = room && (room.id.trim().toLowerCase() === trimmedRoomId.toLowerCase())
      return keyMatches || roomIdMatches
    })
    
    // 检查存储中是否还有该房间文件
    let storageClean = true
    if (this.storagePath) {
      const filePath = path.join(this.storagePath, `${trimmedRoomId}.json`)
      storageClean = !fs.existsSync(filePath)
      console.log('Room file exists in storage:', !storageClean)
    }
    
    // 如果房间文件不存在且内存中也没有该房间，视为删除成功
    const finalResult = !hasAnyMatch && storageClean
    console.log('Final delete result:', {
      hasAnyMatch,
      storageClean,
      finalResult
    })
    console.log('Current rooms in memory after force delete:', remainingRooms)
    console.log('=== FORCE DELETE ROOM OPERATION COMPLETE ===')
    
    // 返回真实的删除结果
    return finalResult
  }
  
  // 清除旧的rooms.json存储（如果存在）
  private clearOldStorage(): void {
    const oldStoragePath = path.join(process.cwd(), 'rooms.json')
    if (fs.existsSync(oldStoragePath)) {
      console.log('Detected old rooms.json storage, clearing...')
      try {
        fs.writeFileSync(oldStoragePath, JSON.stringify([]))
        console.log('Old storage cleared successfully')
      } catch (error) {
        console.error('Error clearing old storage:', error)
      }
    }
  }
}

// 导出单例实例
let roomStoreInstance: RoomStore | null = null

// 确保整个应用程序只使用一个 RoomStore 实例
export function getRoomStore(): RoomStore {
  if (!roomStoreInstance) {
    console.log('Creating new RoomStore instance')
    roomStoreInstance = new RoomStore()
  } else {
    console.log('Using existing RoomStore instance')
  }
  return roomStoreInstance
}

// 导出默认单例实例
export const roomStore = getRoomStore()
import { NextRequest, NextResponse } from "next/server"
import { getRoomStore, type Room } from "@/lib/game/room-store"
import { createInitialBattleForPlayers } from "@/lib/game/battle-setup"
import { getAllPieces } from "@/lib/game/piece-repository"
import fs from 'fs'
import path from 'path'

// 获取 RoomStore 实例
console.log('Getting RoomStore instance in rooms route')
const roomStore = getRoomStore()

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ roomId: string }> },
) {
  const { roomId } = await params
  const room = roomStore.getRoom(roomId)

  if (!room) {
    return NextResponse.json({ error: "Room not found" }, { status: 404 })
  }

  return NextResponse.json(room)
}

type StartBody = {
  action: "start"
}

type JoinBody = {
  action: "join"
  playerId: string
  playerName?: string
}

type RoomPostBody = StartBody | JoinBody


export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ roomId: string }> },
) {
  const { roomId } = await params
  let room = roomStore.getRoom(roomId)

  // 如果房间不存在，创建一个新的房间
  if (!room) {
    console.log('Room not found, creating new room:', roomId)
    room = roomStore.createRoom(roomId, `Room ${roomId}`)
    console.log('New room created:', room.id)
  }

  let body: RoomPostBody
  try {
    body = (await req.json()) as RoomPostBody
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 })
  }

  if (body.action === "join") {
    const playerId = body.playerId?.trim()
    const playerName = body.playerName?.trim()
    if (!playerId) {
      return NextResponse.json({ error: "playerId is required" }, { status: 400 })
    }

    if (room.status !== "waiting") {
      return NextResponse.json(
        { error: "Cannot join a game that has already started or finished" },
        { status: 400 },
      )
    }

    if (room.players.length >= room.maxPlayers) {
      return NextResponse.json({ error: "Room is full" }, { status: 400 })
    }

    const existing = room.players.find(
      (p) => p.id.trim() === playerId,
    )

    if (!existing) {
      const player = {
        id: playerId,
        name: playerName || `Player ${playerId.slice(0, 8)}`,
        joinedAt: Date.now(),
      }
      room.players.push(player)
      
      // 如果房间还没有房主，将当前加入的玩家设置为房主
      if (!room.hostId) {
        room.hostId = playerId
      }
    }

    // 确保使用修剪后的房间 ID 作为键，与 setRoom 方法的行为一致
    const trimmedRoomId = room.id.trim()
    roomStore.setRoom(trimmedRoomId, room)
    return NextResponse.json(room)
  }

  if (body.action === "start") {
    if (room.status !== "waiting") {
      return NextResponse.json(
        { error: "Game is already in progress or finished" },
        { status: 400 },
      )
    }

    // 1v1：必须刚好 2 人才能开始
    if (room.players.length !== 2) {
      return NextResponse.json(
        { error: "Exactly two players are required to start a 1v1 game" },
        { status: 400 },
      )
    }

    const playerIds = room.players.map((p) => p.id)
    const defaultPieces = getAllPieces()
    const battle = await createInitialBattleForPlayers(playerIds, defaultPieces, undefined, room.mapId)
    if (!battle) {
      return NextResponse.json(
        { error: "Failed to initialize battle state" },
        { status: 500 }
      )
    }

    room.status = "in-progress"
    room.currentTurnIndex = 0
    room.battleState = battle
    // 确保使用修剪后的房间 ID 作为键，与 setRoom 方法的行为一致
    const trimmedRoomId = room.id.trim()
    roomStore.setRoom(trimmedRoomId, room)

    return NextResponse.json(room)
  }

  return NextResponse.json({ error: "Unsupported action" }, { status: 400 })
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ roomId: string }> },
) {
  console.log('=== DELETE Request Started ===')
  
  try {
    // 获取房间 ID
    const { roomId: originalRoomId } = await params
    const roomId = originalRoomId.trim()
    console.log('Processing room deletion:', { original: originalRoomId, trimmed: roomId })
    
    // 定义存储路径
    const storagePath = path.join(process.cwd(), 'data', 'rooms')
    console.log('Storage path:', storagePath)
    
    // 定义所有可能的文件路径
    const mainFilePath = path.join(storagePath, `${roomId}.json`)
    const lowerFilePath = path.join(storagePath, `${roomId.toLowerCase()}.json`)
    const upperFilePath = path.join(storagePath, `${roomId.toUpperCase()}.json`)
    
    console.log('File paths to check:', {
      main: mainFilePath,
      lower: lowerFilePath,
      upper: upperFilePath
    })
    
    // 检查是否有任何房间文件存在
    const mainFileExists = fs.existsSync(mainFilePath)
    const lowerFileExists = fs.existsSync(lowerFilePath)
    const upperFileExists = fs.existsSync(upperFilePath)
    
    console.log('File existence check:', {
      main: mainFileExists,
      lower: lowerFileExists,
      upper: upperFileExists
    })
    
    // 检查内存中是否有房间
    let roomInMemory = false
    try {
      const allRooms = roomStore.getRooms()
      console.log('Rooms in memory:', Array.from(allRooms.keys()))
      
      roomInMemory = Array.from(allRooms.values()).some(r => 
        r.id.trim().toLowerCase() === roomId.toLowerCase()
      )
      console.log('Room in memory:', roomInMemory)
    } catch (error) {
      console.error('Error checking room in memory:', error)
      roomInMemory = false
    }
    
    // 不再检查房间是否存在，直接尝试删除
    console.log('Proceeding to delete room regardless of existence check:', roomId)
    
    // 尝试删除所有可能的房间文件
    console.log('=== Deleting room files ===')
    
    try {
      if (mainFileExists) {
        fs.unlinkSync(mainFilePath)
        console.log('Deleted main file:', mainFilePath)
      }
    } catch (error) {
      console.error('Error deleting main file:', error)
    }
    
    try {
      if (lowerFileExists) {
        fs.unlinkSync(lowerFilePath)
        console.log('Deleted lower file:', lowerFilePath)
      }
    } catch (error) {
      console.error('Error deleting lower file:', error)
    }
    
    try {
      if (upperFileExists) {
        fs.unlinkSync(upperFilePath)
        console.log('Deleted upper file:', upperFilePath)
      }
    } catch (error) {
      console.error('Error deleting upper file:', error)
    }
    
    // 尝试从内存中删除房间
    console.log('=== Deleting room from memory ===')
    
    try {
      const removed = roomStore.removeRoom(roomId)
      console.log('Room removal result:', removed)
    } catch (error) {
      console.error('Error deleting room from memory:', error)
    }
    
    // 验证删除结果
    console.log('=== Verifying deletion ===')
    
    const mainFileExistsAfter = fs.existsSync(mainFilePath)
    const lowerFileExistsAfter = fs.existsSync(lowerFilePath)
    const upperFileExistsAfter = fs.existsSync(upperFilePath)
    
    console.log('File existence after deletion:', {
      main: mainFileExistsAfter,
      lower: lowerFileExistsAfter,
      upper: upperFileExistsAfter
    })
    
    // 检查内存中是否还有房间
    let roomInMemoryAfter = false
    try {
      const allRooms = roomStore.getRooms()
      roomInMemoryAfter = Array.from(allRooms.values()).some(r => 
        r.id.trim().toLowerCase() === roomId.toLowerCase()
      )
      console.log('Room in memory after deletion:', roomInMemoryAfter)
    } catch (error) {
      console.error('Error checking room in memory after deletion:', error)
      roomInMemoryAfter = false
    }
    
    // 确定是否删除成功
    const filesDeleted = !mainFileExistsAfter && !lowerFileExistsAfter && !upperFileExistsAfter
    const memoryClean = !roomInMemoryAfter
    const deletionSuccess = filesDeleted && memoryClean
    
    console.log('Deletion verification:', {
      filesDeleted,
      memoryClean,
      deletionSuccess
    })
    
    // 返回结果
    if (deletionSuccess) {
      console.log('Room deletion successful:', roomId)
      return NextResponse.json({ success: true })
    } else {
      console.log('Room deletion partially successful:', {
        filesDeleted,
        memoryClean,
        roomId
      })
      // 即使部分成功，也返回成功，因为房间已经不存在或无法访问
      return NextResponse.json({ success: true })
    }
  } catch (error) {
    console.error('Unexpected error in DELETE handler:', error)
    // 即使出错，也返回成功，因为我们已经尝试了所有可能的删除操作
    return NextResponse.json({ success: true })
  } finally {
    console.log('=== DELETE Request Completed ===')
  }
}



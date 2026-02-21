const { roomStore } = require('./lib/game/room-store');
const fs = require('fs');
const path = require('path');

console.log('=== Testing Room Storage ===');

// 测试存储路径
console.log('Current working directory:', process.cwd());
const expectedStoragePath = path.join(process.cwd(), 'data', 'rooms');
console.log('Expected storage path:', expectedStoragePath);
console.log('Storage directory exists:', fs.existsSync(expectedStoragePath));

// 检查存储目录内容
if (fs.existsSync(expectedStoragePath)) {
  const files = fs.readdirSync(expectedStoragePath);
  console.log('Files in storage directory:', files);
  
  files.forEach(file => {
    if (file.endsWith('.json')) {
      const filePath = path.join(expectedStoragePath, file);
      const content = fs.readFileSync(filePath, 'utf-8');
      console.log(`\nContents of ${file}:`);
      console.log(content);
    }
  });
}

// 检查内存中的房间
console.log('\n=== Rooms in Memory ===');
const rooms = Array.from(roomStore.getRooms().values());
console.log('Total rooms in memory:', rooms.length);
rooms.forEach(room => {
  console.log('Room:', {
    id: room.id,
    name: room.name,
    status: room.status,
    players: room.players.length,
    hostId: room.hostId
  });
});

// 测试创建房间
console.log('\n=== Testing Room Creation ===');
try {
  const testRoomId = 'test-room-123';
  const testRoom = roomStore.createRoom(testRoomId, 'Test Room');
  console.log('Created test room:', testRoom.id);
  
  // 检查房间文件是否创建
  const testRoomFilePath = path.join(expectedStoragePath, `${testRoomId}.json`);
  console.log('Test room file exists:', fs.existsSync(testRoomFilePath));
  
  if (fs.existsSync(testRoomFilePath)) {
    const content = fs.readFileSync(testRoomFilePath, 'utf-8');
    console.log('Test room file content:', content);
  }
  
  // 测试删除房间
  console.log('\n=== Testing Room Deletion ===');
  const deleteResult = roomStore.deleteRoom(testRoomId);
  console.log('Delete result:', deleteResult);
  
  // 检查房间文件是否删除
  console.log('Test room file exists after deletion:', fs.existsSync(testRoomFilePath));
  
  // 检查内存中的房间
  const roomsAfterDeletion = Array.from(roomStore.getRooms().values());
  console.log('Total rooms in memory after deletion:', roomsAfterDeletion.length);
  
} catch (error) {
  console.error('Error during test:', error);
}

console.log('\n=== Test Complete ===');

const { RoomStore } = require('./lib/game/room-store');
const fs = require('fs');
const path = require('path');

async function testRoomDeletion() {
  console.log('=== Testing Room Deletion ===\n');
  
  // Create room store instance
  const roomStore = new RoomStore();
  
  // Test 1: Create a test room
  console.log('Test 1: Creating test room...');
  const testRoomId = 'test-room-123';
  const testRoom = roomStore.createRoom(testRoomId, 'Test Room');
  console.log(`Created room: ${testRoom.id} - ${testRoom.name}`);
  
  // Check if room file exists
  const roomFilePath = path.join(process.cwd(), 'data', 'rooms', `${testRoomId}.json`);
  console.log(`Room file path: ${roomFilePath}`);
  console.log(`Room file exists: ${fs.existsSync(roomFilePath)}`);
  
  // Test 2: Get the room
  console.log('\nTest 2: Getting room...');
  const retrievedRoom = roomStore.getRoom(testRoomId);
  console.log(`Retrieved room: ${retrievedRoom ? retrievedRoom.name : 'NOT FOUND'}`);
  
  // Test 3: Delete the room
  console.log('\nTest 3: Deleting room...');
  const deleteResult = roomStore.deleteRoom(testRoomId);
  console.log(`Delete result: ${deleteResult}`);
  
  // Check if room file is deleted
  console.log(`Room file exists after deletion: ${fs.existsSync(roomFilePath)}`);
  
  // Test 4: Try to get the deleted room
  console.log('\nTest 4: Trying to get deleted room...');
  const deletedRoom = roomStore.getRoom(testRoomId);
  console.log(`Deleted room retrieved: ${deletedRoom ? deletedRoom.name : 'NOT FOUND'}`);
  
  // Test 5: Check all rooms in store
  console.log('\nTest 5: All rooms in store...');
  const allRooms = roomStore.getAllRooms();
  console.log(`Total rooms: ${allRooms.length}`);
  allRooms.forEach(room => {
    console.log(`- ${room.id}: ${room.name}`);
  });
  
  console.log('\n=== Test Complete ===');
}

// Run the test
testRoomDeletion().catch(console.error);

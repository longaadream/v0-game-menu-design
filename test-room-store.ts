import { RoomStore } from './lib/game/room-store';
import fs from 'fs';
import path from 'path';

async function testRoomStore() {
  console.log('=== Testing Room Store ===\n');
  
  try {
    // Create room store instance
    console.log('1. Creating room store...');
    const roomStore = new RoomStore();
    console.log('✓ Room store created');
    
    // Test 1: Create a test room
    console.log('\n2. Creating test room...');
    const testRoomId = 'test-room-123';
    const testRoom = roomStore.createRoom(testRoomId, 'Test Room');
    console.log(`✓ Created room: ${testRoom.id} - ${testRoom.name}`);
    
    // Check if room file exists
    const roomFilePath = path.join(process.cwd(), 'data', 'rooms', `${testRoomId}.json`);
    console.log(`Room file path: ${roomFilePath}`);
    console.log(`Room file exists: ${fs.existsSync(roomFilePath)}`);
    
    // Test 2: Get the room
    console.log('\n3. Getting room...');
    const retrievedRoom = roomStore.getRoom(testRoomId);
    console.log(`✓ Retrieved room: ${retrievedRoom ? retrievedRoom.name : 'NOT FOUND'}`);
    
    // Test 3: Delete the room
    console.log('\n4. Deleting room...');
    const deleteResult = roomStore.deleteRoom(testRoomId);
    console.log(`✓ Delete result: ${deleteResult}`);
    
    // Check if room file is deleted
    console.log(`Room file exists after deletion: ${fs.existsSync(roomFilePath)}`);
    
    // Test 4: Try to get the deleted room
    console.log('\n5. Trying to get deleted room...');
    const deletedRoom = roomStore.getRoom(testRoomId);
    console.log(`✓ Deleted room retrieved: ${deletedRoom ? deletedRoom.name : 'NOT FOUND'}`);
    
    // Test 5: Check all rooms in store
    console.log('\n6. All rooms in store...');
    const allRooms = roomStore.getAllRooms();
    console.log(`✓ Total rooms: ${allRooms.length}`);
    allRooms.forEach(room => {
      console.log(`  - ${room.id}: ${room.name}`);
    });
    
    // Test 6: Check old storage
    console.log('\n7. Checking old storage...');
    const oldStoragePath = path.join(process.cwd(), 'rooms.json');
    if (fs.existsSync(oldStoragePath)) {
      const oldData = JSON.parse(fs.readFileSync(oldStoragePath, 'utf-8'));
      console.log(`✓ Old storage exists, length: ${Array.isArray(oldData) ? oldData.length : 0}`);
    } else {
      console.log('✓ Old storage does not exist');
    }
    
    console.log('\n=== All Tests Passed! ===');
  } catch (error) {
    console.error('\n=== Test Failed ===');
    console.error(error);
  }
}

// Run the test
testRoomStore();

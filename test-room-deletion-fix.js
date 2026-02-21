const { roomStore } = require('./lib/game/room-store');

async function testRoomDeletion() {
  console.log('=== Testing Room Deletion Fix ===\n');
  
  // 创建一个测试房间
  const testRoomId = 'test-room-' + Date.now();
  const testRoomName = 'Test Room';
  
  console.log('1. Creating test room...');
  console.log('   Room ID:', testRoomId);
  console.log('   Room Name:', testRoomName);
  
  const createdRoom = roomStore.createRoom(testRoomId, testRoomName);
  console.log('   Created:', !!createdRoom);
  
  // 验证房间存在
  console.log('\n2. Verifying room exists...');
  const retrievedRoom = roomStore.getRoom(testRoomId);
  console.log('   Room retrieved:', !!retrievedRoom);
  if (retrievedRoom) {
    console.log('   Room name:', retrievedRoom.name);
    console.log('   Room status:', retrievedRoom.status);
  }
  
  // 测试删除房间
  console.log('\n3. Testing room deletion...');
  const deleteResult = roomStore.deleteRoom(testRoomId);
  console.log('   Delete result:', deleteResult);
  
  // 验证房间被删除
  console.log('\n4. Verifying room is deleted...');
  const deletedRoom = roomStore.getRoom(testRoomId);
  const isActuallyDeleted = !deletedRoom;
  console.log('   Room exists after deletion:', !!deletedRoom);
  console.log('   Is actually deleted:', isActuallyDeleted);
  
  // 总结测试结果
  console.log('\n=== Test Summary ===');
  if (isActuallyDeleted) {
    console.log('✅ Room deletion test PASSED!');
    console.log('   The room was successfully created and deleted.');
  } else {
    console.log('❌ Room deletion test FAILED!');
    console.log('   The room was not properly deleted.');
  }
  
  // 清理：确保测试房间被删除
  if (deletedRoom) {
    console.log('\n5. Cleaning up...');
    const cleanupResult = roomStore.deleteRoom(testRoomId);
    console.log('   Cleanup result:', cleanupResult);
  }
  
  console.log('\n=== Test Complete ===');
}

// 运行测试
testRoomDeletion().catch(console.error);

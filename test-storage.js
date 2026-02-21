const fs = require('fs');
const path = require('path');

console.log('=== Testing Storage Functionality ===');

// 测试当前工作目录
console.log('Current working directory:', process.cwd());

// 测试存储目录
const storagePath = path.join(process.cwd(), 'data', 'rooms');
console.log('Storage path:', storagePath);

// 测试目录创建
console.log('\n=== Testing Directory Operations ===');
try {
  if (!fs.existsSync(storagePath)) {
    console.log('Creating storage directory...');
    fs.mkdirSync(storagePath, { recursive: true });
    console.log('Storage directory created successfully');
  } else {
    console.log('Storage directory already exists');
  }
  
  // 测试文件创建
  console.log('\n=== Testing File Operations ===');
  const testFile = path.join(storagePath, 'test-room.json');
  const testData = {
    id: 'test-room',
    name: 'Test Room',
    status: 'waiting',
    players: [],
    actions: []
  };
  
  console.log('Writing test file...');
  fs.writeFileSync(testFile, JSON.stringify(testData, null, 2));
  console.log('Test file written successfully');
  
  // 测试文件读取
  console.log('\nReading test file...');
  const content = fs.readFileSync(testFile, 'utf-8');
  console.log('Test file content:', content);
  
  // 测试文件删除
  console.log('\nDeleting test file...');
  fs.unlinkSync(testFile);
  console.log('Test file deleted successfully');
  
  // 验证文件删除
  console.log('Test file exists after deletion:', fs.existsSync(testFile));
  
} catch (error) {
  console.error('Error during storage test:', error);
}

// 测试权限
console.log('\n=== Testing Permissions ===');
try {
  const tempFile = path.join(storagePath, 'temp-permission-test.txt');
  fs.writeFileSync(tempFile, 'permission test');
  console.log('Write permission: OK');
  
  const content = fs.readFileSync(tempFile, 'utf-8');
  console.log('Read permission: OK');
  
  fs.unlinkSync(tempFile);
  console.log('Delete permission: OK');
} catch (error) {
  console.error('Permission error:', error);
}

console.log('\n=== Test Complete ===');

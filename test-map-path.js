// 测试地图路径是否正确
const { readdirSync, existsSync } = require('fs');
const { resolve, dirname } = require('path');

// 模拟获取当前模块的绝对路径
const __filename = __filename || process.argv[1];
const __dirname = dirname(__filename);

// 测试地图目录路径
const mapDirPath = resolve(__dirname, 'data/maps');
console.log('地图目录路径:', mapDirPath);
console.log('地图目录是否存在:', existsSync(mapDirPath));

if (existsSync(mapDirPath)) {
  const files = readdirSync(mapDirPath);
  console.log('地图文件:', files);
  
  // 检查arena-8x6.json是否存在
  const arenaMapPath = resolve(mapDirPath, 'arena-8x6.json');
  console.log('arena-8x6.json是否存在:', existsSync(arenaMapPath));
} else {
  console.error('地图目录不存在');
}

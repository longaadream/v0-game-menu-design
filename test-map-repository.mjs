// 测试地图仓库的加载功能
import { loadMaps, getMapById, getAllMaps } from './lib/game/map-repository.ts';

async function testMapLoading() {
  console.log('开始测试地图加载...');
  
  try {
    // 加载地图
    await loadMaps();
    
    // 获取所有地图
    const allMaps = getAllMaps();
    console.log('加载的地图数量:', allMaps.length);
    console.log('加载的地图ID:', allMaps.map(map => map.id));
    
    // 测试获取指定地图
    const arenaMap = getMapById('arena-8x6');
    if (arenaMap) {
      console.log('成功加载arena-8x6地图:', arenaMap.name);
      console.log('地图尺寸:', arenaMap.width, 'x', arenaMap.height);
      console.log('地图格子数量:', arenaMap.tiles.length);
    } else {
      console.error('无法加载arena-8x6地图');
    }
    
  } catch (error) {
    console.error('测试过程中出错:', error);
  }
}

testMapLoading();

import { loadJsonFilesServer } from './file-loader'
import { createMapFromAscii, type AsciiMapConfig, type BoardMap } from './map'
import { readdirSync, readFileSync, existsSync } from 'fs'
import { join } from 'path'

let mapsCache: Record<string, BoardMap> = {}
let isLoading = false

// 加载地图数据
export async function loadMaps() {
  if (isLoading) return
  
  isLoading = true
  try {
    // 直接从文件系统加载地图数据
    const dirPath = join(process.cwd(), 'data/maps')
    console.log('Current working directory:', process.cwd())
    console.log('Loading maps from directory:', dirPath)
    console.log('Directory exists:', existsSync(dirPath))
    
    const maps: Record<string, BoardMap> = {}
    
    if (existsSync(dirPath)) {
      const files = readdirSync(dirPath, { withFileTypes: true })
      console.log('Found map files:', files.map(f => f.name))
      
      files.forEach((file) => {
        if (file.isFile() && file.name.endsWith('.json')) {
          const filePath = join(dirPath, file.name)
          console.log('Loading map file:', filePath)
          
          try {
            const content = readFileSync(filePath, 'utf-8')
            console.log('File content length:', content.length)
            
            try {
              const config = JSON.parse(content) as AsciiMapConfig
              console.log('Parsed map config for', file.name, ':', config)
              
              if (config && typeof config === 'object' && 'id' in config) {
                try {
                  const map = createMapFromAscii(config)
                  maps[map.id] = map
                  console.log('Created map:', map)
                  // 检查第一个格子的类型
                  if (map.tiles.length > 0) {
                    console.log('First tile type:', map.tiles[0].props.type)
                  }
                } catch (mapError) {
                  console.error(`Error creating map from config ${config.id}:`, mapError)
                }
              } else {
                console.warn('File', file.name, 'does not have an id field')
              }
            } catch (parseError) {
              console.error(`Error parsing JSON file ${file.name}:`, parseError)
              console.error('File content:', content)
            }
          } catch (readError) {
            console.error(`Error reading file ${file.name}:`, readError)
          }
        }
      })
    } else {
      console.error('Directory', dirPath, 'does not exist')
    }
    
    console.log('Final maps:', maps)
    mapsCache = maps
  } catch (error) {
    console.error('Error loading maps:', error)
  } finally {
    isLoading = false
  }
}

// 获取所有地图
export function getAllMaps(): BoardMap[] {
  return Object.values(mapsCache)
}

// 根据ID获取地图
export function getMapById(id: string): BoardMap | undefined {
  return mapsCache[id]
}

// 检查地图是否存在
export function mapExists(id: string): boolean {
  return id in mapsCache
}

// 清空地图缓存（用于测试或重新加载）
export function clearMapsCache() {
  mapsCache = {}
}

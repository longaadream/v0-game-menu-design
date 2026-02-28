import { createMapFromAscii, type AsciiMapConfig, type BoardMap } from './map'
import { readdirSync, readFileSync, existsSync } from 'fs'
import { join } from 'path'
import fs from 'fs'
import path from 'path'

function writeLog(message: string) {
  const logDir = path.join(process.cwd(), 'logs')
  if (!fs.existsSync(logDir)) {
    fs.mkdirSync(logDir, { recursive: true })
  }
  const logFile = path.join(logDir, 'game.log')
  const timestamp = new Date().toISOString()
  fs.appendFileSync(logFile, `[${timestamp}] ${message}\n`)
}

let mapsCache: Record<string, BoardMap> = {}
let isLoading = false

// 加载地图数据
export async function loadMaps() {
  if (isLoading) return

  isLoading = true
  try {
    // 使用process.cwd()来获取项目根目录
    const dirPath = join(process.cwd(), 'data/maps')
    writeLog('[loadMaps] dirPath: ' + dirPath)
    writeLog('[loadMaps] cwd: ' + process.cwd())
    writeLog('[loadMaps] Directory exists: ' + existsSync(dirPath))

    const maps: Record<string, BoardMap> = {}

    if (existsSync(dirPath)) {
      const files = readdirSync(dirPath, { withFileTypes: true })
      writeLog('[loadMaps] Found files: ' + files.map(f => f.name).join(', '))

      files.forEach((file) => {
        if (file.isFile() && file.name.endsWith('.json')) {
          const filePath = join(dirPath, file.name)
          // console.log('Loading map file:', filePath)

          try {
            const content = readFileSync(filePath, 'utf-8')
            // console.log('File content length:', content.length)

            try {
              const config = JSON.parse(content) as AsciiMapConfig
              // console.log('Parsed map config for', file.name, ':', config)

              if (config && typeof config === 'object' && 'id' in config) {
                try {
                  const map = createMapFromAscii(config)
                  maps[map.id] = map
                  writeLog('[loadMaps] Created map: ' + map.id + ', name: ' + map.name)
                } catch (mapError) {
                  writeLog('[loadMaps] Error creating map from config ' + config.id + ': ' + mapError)
                }
              } else {
                // console.warn('File', file.name, 'does not have an id field')
              }
            } catch (parseError) {
              // console.error(`Error parsing JSON file ${file.name}:`, parseError)
            }
          } catch (readError) {
            // console.error(`Error reading file ${file.name}:`, readError)
          }
        }
      })
    } else {
      // console.error('Directory', dirPath, 'does not exist')
    }

    // console.log('Final maps:', maps)
    mapsCache = maps
  } catch (error) {
    // console.error('Error loading maps:', error)
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

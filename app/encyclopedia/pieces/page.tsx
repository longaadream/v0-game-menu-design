'use client'

import { useState, useEffect } from 'react'
import { ChevronLeft, ChevronRight } from 'lucide-react'

export default function CharacterEncyclopediaPage() {
  const [pieces, setPieces] = useState<any[]>([])
  const [skills, setSkills] = useState<Record<string, any>>({})
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [factionFilter, setFactionFilter] = useState<string>('all')
  const [hoveredSkill, setHoveredSkill] = useState<string | null>(null)

  // Fetch pieces and skills data
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true)
        
        // Fetch pieces data
        const piecesResponse = await fetch('/api/pieces')
        if (!piecesResponse.ok) {
          throw new Error('Failed to fetch pieces')
        }
        const piecesData = await piecesResponse.json()
        setPieces(piecesData.pieces || [])
        
        // Fetch skills data
        const skillsResponse = await fetch('/api/skills')
        if (skillsResponse.ok) {
          const skillsData = await skillsResponse.json()
          setSkills(skillsData.skills || {})
        }
        
        setError(null)
      } catch (err) {
        setError('Failed to load character data')
        console.error(err)
        // Fallback to mock data if API fails
        setPieces([
          {
            id: "red-mage",
            name: "红方法师",
            faction: "red",
            description: "高攻击力，低防御力",
            rarity: "rare",
            image: "🔥",
            stats: {
              maxHp: 3,
              attack: 2,
              defense: 0,
              moveRange: 2
            },
            skills: [
              { skillId: "teleport", level: 1 },
              { skillId: "fireball", level: 1 }
            ],
            isDefault: true
          },
          {
            id: "red-warrior",
            name: "红方战士",
            faction: "red",
            description: "高防御力，中等攻击力",
            rarity: "common",
            image: "⚔️",
            stats: {
              maxHp: 4,
              attack: 1,
              defense: 2,
              moveRange: 1
            },
            skills: [
              { skillId: "basic-attack", level: 1 },
              { skillId: "shield", level: 1 }
            ],
            isDefault: true
          },
          {
            id: "red-archer",
            name: "红方射手",
            faction: "red",
            description: "高攻击力，低防御力，远射程",
            rarity: "uncommon",
            image: "🏹",
            stats: {
              maxHp: 2,
              attack: 3,
              defense: 0,
              moveRange: 3
            },
            skills: [
              { skillId: "basic-attack", level: 1 },
              { skillId: "buff-attack", level: 1 }
            ],
            isDefault: true
          },
          {
            id: "blue-mage",
            name: "蓝方法师",
            faction: "blue",
            description: "高攻击力，低防御力",
            rarity: "rare",
            image: "🧙‍♂️",
            stats: {
              maxHp: 3,
              attack: 2,
              defense: 0,
              moveRange: 2
            },
            skills: [
              { skillId: "teleport", level: 1 },
              { skillId: "fireball", level: 1 }
            ],
            isDefault: true
          },
          {
            id: "blue-warrior",
            name: "蓝方战士",
            faction: "blue",
            description: "高防御力，中等攻击力",
            rarity: "common",
            image: "🛡️",
            stats: {
              maxHp: 4,
              attack: 1,
              defense: 2,
              moveRange: 1
            },
            skills: [
              { skillId: "basic-attack", level: 1 },
              { skillId: "shield", level: 1 }
            ],
            isDefault: true
          },
          {
            id: "blue-archer",
            name: "蓝方射手",
            faction: "blue",
            description: "高攻击力，低防御力，远射程",
            rarity: "uncommon",
            image: "🎯",
            stats: {
              maxHp: 2,
              attack: 3,
              defense: 0,
              moveRange: 3
            },
            skills: [
              { skillId: "basic-attack", level: 1 },
              { skillId: "buff-attack", level: 1 }
            ],
            isDefault: true
          }
        ])
        
        // Mock skills data
        setSkills({
          "basic-attack": {
            id: "basic-attack",
            name: "普通攻击",
            description: "对单个敌人造成相当于攻击力100%的伤害",
            icon: "⚔️",
            kind: "active",
            type: "normal",
            cooldownTurns: 0,
            maxCharges: 0,
            powerMultiplier: 1.0
          },
          "fireball": {
            id: "fireball",
            name: "火球术",
            description: "对3格范围内的所有敌人造成相当于攻击力150%的伤害",
            icon: "🔥",
            kind: "active",
            type: "super",
            cooldownTurns: 2,
            maxCharges: 3,
            chargeCost: 1,
            powerMultiplier: 1.5
          },
          "teleport": {
            id: "teleport",
            name: "传送",
            description: "将自己传送到地图上的任意位置",
            icon: "✨",
            kind: "active",
            type: "normal",
            cooldownTurns: 3,
            maxCharges: 0,
            powerMultiplier: 0
          },
          "shield": {
            id: "shield",
            name: "护盾",
            description: "为自己提供一个吸收相当于防御力200%伤害的护盾",
            icon: "🛡️",
            kind: "active",
            type: "normal",
            cooldownTurns: 2,
            maxCharges: 0,
            powerMultiplier: 2.0
          },
          "buff-attack": {
            id: "buff-attack",
            name: "攻击增益",
            description: "提升自身攻击力10点，持续2回合",
            icon: "💪",
            kind: "active",
            type: "normal",
            cooldownTurns: 2,
            maxCharges: 0,
            powerMultiplier: 0
          }
        })
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [])

  // Filter pieces by faction
  const filteredPieces = factionFilter === 'all' 
    ? pieces 
    : pieces.filter(piece => piece.faction === factionFilter)

  // Get rarity color
  const getRarityColor = (rarity: string) => {
    switch (rarity) {
      case 'common': return 'text-gray-400'
      case 'uncommon': return 'text-green-400'
      case 'rare': return 'text-blue-400'
      case 'epic': return 'text-purple-400'
      case 'legendary': return 'text-yellow-400'
      default: return 'text-gray-400'
    }
  }

  // Get faction color
  const getFactionColor = (faction: string) => {
    switch (faction) {
      case 'red': return 'text-red-500'
      case 'blue': return 'text-blue-500'
      case 'neutral': return 'text-gray-400'
      default: return 'text-gray-400'
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-gray-900 to-gray-800 text-white flex items-center justify-center">
        <div className="text-center">
          <p className="text-xl">Loading character data...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-gray-900 to-gray-800 text-white flex items-center justify-center">
        <div className="text-center">
          <p className="text-xl text-red-500 mb-4">{error}</p>
          <button 
            className="px-4 py-2 bg-primary hover:bg-primary/80 rounded-md transition-colors duration-300"
            onClick={() => window.location.reload()}
          >
            Try Again
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-900 to-gray-800 text-white">
      {/* Header */}
      <header className="py-8 px-4">
        <div className="container mx-auto">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-4">
            <div>
              <h1 className="text-4xl font-bold mb-2">Character Encyclopedia</h1>
              <p className="text-gray-400">Browse all available game pieces</p>
            </div>
            <div className="flex gap-3">
              <a 
                href="/encyclopedia" 
                className="flex items-center text-gray-400 hover:text-white transition-colors duration-300 px-4 py-2 bg-gray-700 hover:bg-gray-600 rounded-md"
              >
                <ChevronLeft className="mr-1" size={20} />
                Back to Encyclopedia
              </a>
              <a 
                href="/" 
                className="flex items-center text-gray-400 hover:text-white transition-colors duration-300 px-4 py-2 bg-gray-700 hover:bg-gray-600 rounded-md"
              >
                ← 返回主菜单
              </a>
            </div>
          </div>
        </div>
      </header>

      {/* Filter */}
      <div className="container mx-auto px-4 mb-8">
        <div className="flex flex-wrap gap-3">
          <button
            className={`px-4 py-2 rounded-full transition-all duration-300 ${factionFilter === 'all' ? 'bg-primary text-white' : 'bg-gray-800 text-gray-400 hover:bg-gray-700'}`}
            onClick={() => setFactionFilter('all')}
          >
            All Factions
          </button>
          <button
            className={`px-4 py-2 rounded-full transition-all duration-300 ${factionFilter === 'red' ? 'bg-red-500 text-white' : 'bg-gray-800 text-gray-400 hover:bg-gray-700'}`}
            onClick={() => setFactionFilter('red')}
          >
            Red Faction
          </button>
          <button
            className={`px-4 py-2 rounded-full transition-all duration-300 ${factionFilter === 'blue' ? 'bg-blue-500 text-white' : 'bg-gray-800 text-gray-400 hover:bg-gray-700'}`}
            onClick={() => setFactionFilter('blue')}
          >
            Blue Faction
          </button>
        </div>
      </div>

      {/* Character Grid */}
      <main className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredPieces.map((piece) => (
            <div key={piece.id} className="bg-gray-800 rounded-lg overflow-hidden border border-gray-700 hover:border-primary transition-all duration-300">
              {/* Character Header */}
              <div className="p-6">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h3 className="text-2xl font-bold mb-1">{piece.name}</h3>
                    <div className="flex items-center gap-3">
                      <span className={`text-sm font-medium ${getFactionColor(piece.faction)}`}>
                        {piece.faction === 'red' ? 'Red Faction' : piece.faction === 'blue' ? 'Blue Faction' : 'Neutral'}
                      </span>
                      <span className={`text-sm font-medium ${getRarityColor(piece.rarity)}`}>
                        {piece.rarity.charAt(0).toUpperCase() + piece.rarity.slice(1)}
                      </span>
                    </div>
                  </div>
                  <div className="h-24 w-24 flex items-center justify-center">
                    {piece.image && piece.image.startsWith("http") ? (
                      <img 
                        src={piece.image} 
                        alt={piece.name} 
                        className="h-20 w-20 object-contain"
                      />
                    ) : piece.image && (piece.image.length <= 3 || piece.image.includes("️")) ? (
                      <span className="text-6xl">{piece.image}</span>
                    ) : piece.image ? (
                      <img 
                        src={`/${piece.image}`} 
                        alt={piece.name} 
                        className="h-20 w-20 object-contain"
                      />
                    ) : (
                      <span className="text-6xl">❓</span>
                    )}
                  </div>
                </div>
                
                <p className="text-gray-400 mb-6">{piece.description}</p>

                {/* Stats */}
                <div className="mb-6">
                  <h4 className="text-lg font-semibold mb-3">Stats</h4>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="bg-gray-700 rounded p-3">
                      <div className="text-sm text-gray-400">HP</div>
                      <div className="text-xl font-bold">{piece.stats.maxHp}</div>
                    </div>
                    <div className="bg-gray-700 rounded p-3">
                      <div className="text-sm text-gray-400">Attack</div>
                      <div className="text-xl font-bold">{piece.stats.attack}</div>
                    </div>
                    <div className="bg-gray-700 rounded p-3">
                      <div className="text-sm text-gray-400">Defense</div>
                      <div className="text-xl font-bold">{piece.stats.defense}</div>
                    </div>
                    <div className="bg-gray-700 rounded p-3">
                      <div className="text-sm text-gray-400">Move Range</div>
                      <div className="text-xl font-bold">{piece.stats.moveRange}</div>
                    </div>
                  </div>
                </div>

                {/* Skills */}
                <div>
                  <h4 className="text-lg font-semibold mb-3">Skills</h4>
                  <div className="space-y-2">
                    {piece.skills.map((skill: any, index: number) => {
                      const skillData = skills[skill.skillId] || {
                        name: skill.skillId.charAt(0).toUpperCase() + skill.skillId.slice(1).replace('-', ' '),
                        description: "技能描述未找到",
                        icon: "❓",
                        type: "normal",
                        kind: "active",
                        cooldownTurns: 0,
                        chargeCost: 0,
                        actionPointCost: 1
                      };
                      
                      return (
                        <div 
                          key={index} 
                          className="bg-gray-700 rounded p-3 relative group"
                          onMouseEnter={() => setHoveredSkill(skill.skillId)}
                          onMouseLeave={() => setHoveredSkill(null)}
                        >
                          <div className="flex justify-between items-center">
                            <div className="flex items-center">
                              <span className="mr-2">{skillData.icon}</span>
                              <span>{skillData.name}</span>
                            </div>
                            <span className="text-sm text-gray-400">Level {skill.level}</span>
                          </div>
                          
                          {/* Skill tooltip */}
                          {hoveredSkill === skill.skillId && (
                            <div className="absolute bottom-full left-0 right-0 mb-2 z-10">
                              <div className="bg-gray-900 border border-gray-700 rounded p-4 shadow-lg">
                                <h5 className="font-semibold mb-1">{skillData.name}</h5>
                                <p className="text-sm text-gray-400 mb-2">{skillData.description}</p>
                                <div className="text-xs text-gray-500">
                                  <div>类型: {skillData.type === 'super' ? '充能技能' : skillData.type === 'ultimate' ? '终极技能' : '普通技能'}</div>
                                  {skillData.kind === 'active' && (
                                    <div>行动点消耗: {skillData.actionPointCost || 0}</div>
                                  )}
                                  {skillData.chargeCost > 0 && (
                                    <div>充能点消耗: {skillData.chargeCost}</div>
                                  )}
                                  {skillData.cooldownTurns > 0 && (
                                    <div>冷却: {skillData.cooldownTurns} 回合</div>
                                  )}
                                  {skillData.usesRemaining === 1 && (
                                    <div className="text-red-400">限定技</div>
                                  )}
                                </div>
                              </div>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </main>

      {/* Footer */}
      <footer className="py-6 px-4 text-center text-gray-500 text-sm">
        <p>Red vs Blue - Character Encyclopedia</p>
      </footer>
    </div>
  )
}
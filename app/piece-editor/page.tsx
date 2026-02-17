"use client"

import { useMemo, useState } from "react"
import Link from "next/link"
import { ArrowLeft, Trash2 } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import type { Faction, PieceStats, PieceTemplate } from "@/lib/game/piece"
import type { SkillDefinition, SkillKind } from "@/lib/game/skills"

type EditablePiece = {
  id: string
  name: string
  faction: Faction
  description: string
  selectable: boolean
  stats: PieceStats
  skills: SkillDefinition[]
}

const DEFAULT_PIECE: EditablePiece = {
  id: "red-soldier",
  name: "Red Soldier",
  faction: "red",
  description: "Standard frontline unit.",
  selectable: true,
  stats: {
    maxHp: 100,
    attack: 20,
    defense: 5,
    moveRange: 3,
  },
  skills: [
    {
      id: "power-shot",
      name: "Power Shot",
      description: "A charged long‑range attack.",
      kind: "active",
      cooldownTurns: 2,
      maxCharges: 3,
      isChargeSkill: true,
      chargeCost: 1,
      powerMultiplier: 1.5,
    },
  ],
}

export default function PieceEditorPage() {
  const [piece, setPiece] = useState<EditablePiece>(DEFAULT_PIECE)

  function handleStatChange<K extends keyof PieceStats>(key: K, value: number) {
    setPiece((prev) => ({
      ...prev,
      stats: {
        ...prev.stats,
        [key]: value,
      },
    }))
  }

  function updateSkill(index: number, partial: Partial<SkillDefinition>) {
    setPiece((prev) => ({
      ...prev,
      skills: prev.skills.map((s, i) =>
        i === index
          ? {
              ...s,
              ...partial,
            }
          : s,
      ),
    }))
  }

  function addSkill() {
    setPiece((prev) => ({
      ...prev,
      skills: [
        ...prev.skills,
        {
          id: `skill-${prev.skills.length + 1}`,
          name: "New Skill",
          description: "",
          kind: "active",
          cooldownTurns: 0,
          maxCharges: 0,
          powerMultiplier: 1,
        },
      ],
    }))
  }

  function removeSkill(index: number) {
    setPiece((prev) => ({
      ...prev,
      skills: prev.skills.filter((_, i) => i !== index),
    }))
  }

  const pieceTemplate: PieceTemplate = useMemo(() => {
    return {
      id: piece.id.trim() || "piece-id",
      name: piece.name.trim() || "Unnamed Piece",
      faction: piece.faction,
      description: piece.description.trim() || undefined,
      selectable: piece.selectable,
      stats: piece.stats,
      skills: piece.skills.map((s) => ({
        skillId: s.id,
        initialCharges: s.maxCharges,
      })),
    }
  }, [piece])

  const skillDefinitions: SkillDefinition[] = piece.skills

  function handleExportJson() {
    const payload = {
      piece: pieceTemplate,
      skills: skillDefinitions,
    }
    const json = JSON.stringify(payload, null, 2)
    const blob = new Blob([json], { type: "application/json" })
    const url = URL.createObjectURL(blob)

    const a = document.createElement("a")
    a.href = url
    a.download = `${pieceTemplate.id}.json`
    document.body.appendChild(a)
    a.click()
    a.remove()

    URL.revokeObjectURL(url)
  }

  return (
    <main className="flex min-h-svh flex-col items-center justify-center px-4 py-12">
      <div className="w-full max-w-5xl space-y-6">
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-sm text-muted-foreground transition-colors hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Menu
        </Link>

        <Card>
          <CardHeader>
            <CardTitle className="text-2xl font-bold">
              棋子编辑器（属性与技能）
            </CardTitle>
          </CardHeader>
          <CardContent className="grid gap-6 md:grid-cols-[minmax(0,1.6fr)_minmax(0,1.4fr)]">
            {/* 左侧：基础属性与技能配置 */}
            <div className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-1">
                  <Label htmlFor="piece-id">棋子 ID</Label>
                  <Input
                    id="piece-id"
                    value={piece.id}
                    onChange={(e) =>
                      setPiece((prev) => ({ ...prev, id: e.target.value }))
                    }
                    placeholder="red-soldier"
                  />
                </div>
                <div className="space-y-1">
                  <Label htmlFor="piece-name">名称</Label>
                  <Input
                    id="piece-name"
                    value={piece.name}
                    onChange={(e) =>
                      setPiece((prev) => ({ ...prev, name: e.target.value }))
                    }
                    placeholder="Red Soldier"
                  />
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-1">
                  <Label htmlFor="faction">阵营</Label>
                  <select
                    id="faction"
                    className="h-9 w-full rounded-md border border-input bg-background px-3 text-sm text-foreground shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                    value={piece.faction}
                    onChange={(e) =>
                      setPiece((prev) => ({
                        ...prev,
                        faction: e.target.value as Faction,
                      }))
                    }
                  >
                    <option value="red">Red</option>
                    <option value="blue">Blue</option>
                    <option value="neutral">Neutral</option>
                  </select>
                </div>
                <div className="space-y-1 text-sm text-muted-foreground">
                  <Label className="mb-1 inline-block">可选用</Label>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() =>
                        setPiece((prev) => ({ ...prev, selectable: true }))
                      }
                      className={`h-8 rounded-md border px-3 text-xs font-medium ${
                        piece.selectable
                          ? "border-primary bg-primary/10 text-primary"
                          : "border-border bg-muted/40 text-muted-foreground"
                      }`}
                    >
                      是
                    </button>
                    <button
                      type="button"
                      onClick={() =>
                        setPiece((prev) => ({ ...prev, selectable: false }))
                      }
                      className={`h-8 rounded-md border px-3 text-xs font-medium ${
                        !piece.selectable
                          ? "border-primary bg-primary/10 text-primary"
                          : "border-border bg-muted/40 text-muted-foreground"
                      }`}
                    >
                      否（仅 AI 或特殊单位）
                    </button>
                  </div>
                </div>
              </div>

              <div className="space-y-1">
                <Label htmlFor="description">描述</Label>
                <Input
                  id="description"
                  value={piece.description}
                  onChange={(e) =>
                    setPiece((prev) => ({
                      ...prev,
                      description: e.target.value,
                    }))
                  }
                  placeholder="用于说明这个棋子的大致定位"
                />
              </div>

              <div className="space-y-2">
                <Label>基础属性</Label>
                <div className="grid gap-3 sm:grid-cols-4">
                  <div className="space-y-1">
                    <span className="text-xs text-muted-foreground">最大生命</span>
                    <Input
                      type="number"
                      min={1}
                      value={piece.stats.maxHp}
                      onChange={(e) =>
                        handleStatChange("maxHp", Number(e.target.value) || 1)
                      }
                    />
                  </div>
                  <div className="space-y-1">
                    <span className="text-xs text-muted-foreground">
                      普通攻击力
                    </span>
                    <Input
                      type="number"
                      min={0}
                      value={piece.stats.attack}
                      onChange={(e) =>
                        handleStatChange("attack", Number(e.target.value) || 0)
                      }
                    />
                  </div>
                  <div className="space-y-1">
                    <span className="text-xs text-muted-foreground">防御</span>
                    <Input
                      type="number"
                      min={0}
                      value={piece.stats.defense ?? 0}
                      onChange={(e) =>
                        handleStatChange(
                          "defense",
                          Number(e.target.value) || 0,
                        )
                      }
                    />
                  </div>
                  <div className="space-y-1">
                    <span className="text-xs text-muted-foreground">
                      移动力（格）
                    </span>
                    <Input
                      type="number"
                      min={0}
                      value={piece.stats.moveRange ?? 0}
                      onChange={(e) =>
                        handleStatChange(
                          "moveRange",
                          Number(e.target.value) || 0,
                        )
                      }
                    />
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label>技能列表（充能 / 冷却）</Label>
                  <Button size="sm" variant="outline" onClick={addSkill}>
                    新增技能
                  </Button>
                </div>

                <div className="space-y-3">
                  {piece.skills.map((skill, index) => (
                    <div
                      key={index}
                      className="rounded-md border border-border bg-card/40 p-3 text-xs"
                    >
                      <div className="mb-2 flex items-center justify-between gap-2">
                        <div className="flex-1 space-y-1">
                          <Input
                            value={skill.name}
                            onChange={(e) =>
                              updateSkill(index, { name: e.target.value })
                            }
                            placeholder="技能名称"
                          />
                          <Input
                            value={skill.id}
                            onChange={(e) =>
                              updateSkill(index, { id: e.target.value })
                            }
                            placeholder="skill-id"
                          />
                        </div>
                        <button
                          type="button"
                          onClick={() => removeSkill(index)}
                          className="ml-2 inline-flex h-8 w-8 items-center justify-center rounded-md border border-border text-destructive hover:bg-destructive/10"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>

                      <div className="mb-2 space-y-1">
                        <Input
                          value={skill.description}
                          onChange={(e) =>
                            updateSkill(index, {
                              description: e.target.value,
                            })
                          }
                          placeholder="技能描述（效果逻辑以后再实现）"
                        />
                      </div>

                      <div className="grid gap-2 sm:grid-cols-3">
                        <div className="space-y-1">
                          <span className="text-[11px] text-muted-foreground">
                            类型
                          </span>
                          <select
                            className="h-8 w-full rounded-md border border-input bg-background px-2 text-xs text-foreground shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                            value={skill.kind}
                            onChange={(e) =>
                              updateSkill(index, {
                                kind: e.target.value as SkillKind,
                              })
                            }
                          >
                            <option value="active">主动</option>
                            <option value="passive">被动</option>
                          </select>
                        </div>
                        <div className="space-y-1">
                          <span className="text-[11px] text-muted-foreground">
                            冷却回合
                          </span>
                          <Input
                            type="number"
                            min={0}
                            value={skill.cooldownTurns}
                            onChange={(e) =>
                              updateSkill(index, {
                                cooldownTurns: Number(e.target.value) || 0,
                              })
                            }
                          />
                        </div>
                        <div className="space-y-1">
                          <span className="text-[11px] text-muted-foreground">
                            最大充能次数（0 = 不限）
                          </span>
                          <Input
                            type="number"
                            min={0}
                            value={skill.maxCharges}
                            onChange={(e) =>
                              updateSkill(index, {
                                maxCharges: Number(e.target.value) || 0,
                              })
                            }
                          />
                        </div>
                      </div>

                      <div className="mt-2 grid gap-2 sm:grid-cols-2">
                        <div className="space-y-1">
                          <span className="text-[11px] text-muted-foreground">
                            是否为充能技能
                          </span>
                          <div className="flex gap-2">
                            <button
                              type="button"
                              onClick={() =>
                                updateSkill(index, { isChargeSkill: true })
                              }
                              className={`h-8 flex-1 rounded-md border px-2 text-xs font-medium ${
                                skill.isChargeSkill
                                  ? "border-primary bg-primary/10 text-primary"
                                  : "border-border bg-muted/40 text-muted-foreground"
                              }`}
                            >
                              是
                            </button>
                            <button
                              type="button"
                              onClick={() =>
                                updateSkill(index, {
                                  isChargeSkill: false,
                                  chargeCost: 0,
                                })
                              }
                              className={`h-8 flex-1 rounded-md border px-2 text-xs font-medium ${
                                !skill.isChargeSkill
                                  ? "border-primary bg-primary/10 text-primary"
                                  : "border-border bg-muted/40 text-muted-foreground"
                              }`}
                            >
                              否
                            </button>
                          </div>
                        </div>
                        <div className="space-y-1">
                          <span className="text-[11px] text-muted-foreground">
                            充能点消耗（仅充能技能）
                          </span>
                          <Input
                            type="number"
                            min={0}
                            value={skill.chargeCost ?? 0}
                            onChange={(e) =>
                              updateSkill(index, {
                                chargeCost: Number(e.target.value) || 0,
                              })
                            }
                          />
                        </div>
                      </div>

                      <div className="mt-2 space-y-1">
                        <span className="text-[11px] text-muted-foreground">
                          威力系数（与攻击力相乘）
                        </span>
                        <Input
                          type="number"
                          min={0}
                          step="0.1"
                          value={skill.powerMultiplier}
                          onChange={(e) =>
                            updateSkill(index, {
                              powerMultiplier: Number(e.target.value) || 0,
                            })
                          }
                        />
                      </div>
                    </div>
                  ))}
                  {piece.skills.length === 0 && (
                    <p className="text-xs text-muted-foreground">
                      还没有技能，点击“新增技能”开始配置。
                    </p>
                  )}
                </div>
              </div>
            </div>

            {/* 右侧：导出 JSON 预览 */}
            <div className="flex flex-col justify-between gap-4">
              <div className="space-y-2 text-sm text-muted-foreground">
                <p>
                  这里会生成一个棋子模板{" "}
                  <code className="rounded bg-muted px-1 py-0.5 text-xs">
                    PieceTemplate
                  </code>{" "}
                  和一组技能定义{" "}
                  <code className="rounded bg-muted px-1 py-0.5 text-xs">
                    SkillDefinition
                  </code>
                  。
                </p>
                <p>
                  你可以把导出的 JSON 文件放到配置目录，例如{" "}
                  <code className="rounded bg-muted px-1 py-0.5 text-xs">
                    config/pieces
                  </code>
                  ，在服务器或前端加载后用于构建实际对局。
                </p>
              </div>

              <div className="space-y-2 rounded-md border border-dashed border-border p-3 text-xs text-muted-foreground">
                <div className="font-medium text-foreground">导出预览：</div>
                <pre className="max-h-72 overflow-auto rounded bg-muted p-2 text-[11px]">
{JSON.stringify(
  {
    piece: pieceTemplate,
    skills: skillDefinitions,
  },
  null,
  2,
)}
                </pre>
              </div>

              <Button onClick={handleExportJson}>导出为 JSON 文件</Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </main>
  )
}


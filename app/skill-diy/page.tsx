"use client"

import { useState } from "react"
import Link from "next/link"
import { ArrowLeft, Code, Download, Upload, Play, Trash2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Separator } from "@/components/ui/separator"

export default function SkillDIYPage() {
  const [skillCode, setSkillCode] = useState("")
  const [pieceCode, setPieceCode] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [skillName, setSkillName] = useState("")
  const [pieceName, setPieceName] = useState("")

  function validateSkillCode() {
    setError(null)
    setSuccess(null)
    
    if (!skillCode.trim()) {
      setError("请输入技能代码")
      return false
    }
    
    setSuccess("技能代码验证成功")
    return true
  }

  function validatePieceCode() {
    setError(null)
    setSuccess(null)
    
    if (!pieceCode.trim()) {
      setError("请输入棋子代码")
      return false
    }
    
    setSuccess("棋子代码验证成功")
    return true
  }

  function exportSkillCode() {
    const code = `// 技能执行函数
function executeSkill(context): Result {
  const damage = context.piece.attack * context.skill.power
  return { damage, message: "造成 " + damage + " 点伤害" }
}

// 导出技能定义
export const skill = {
  id: "${skillName || "custom-skill"}",
  name: "${skillName || "自定义技能"}",
  description: "玩家自定义技能",
  power: 1.5,
  cooldown: 1
}`

    const blob = new Blob([code], { type: "text/plain" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = "skill.ts"
    a.click()
    URL.revokeObjectURL(url)
  }

  function exportPieceCode() {
    const code = `// 棋子模板定义
export const piece = {
  id: "${pieceName || "custom-piece"}",
  name: "${pieceName || "自定义棋子"}",
  hp: 100,
  attack: 20,
  defense: 5,
  skills: ["basic-attack"]
}`

    const blob = new Blob([code], { type: "text/plain" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = "piece.ts"
    a.click()
    URL.revokeObjectURL(url)
  }

  function handleFileImport(event: React.ChangeEvent<HTMLInputElement>, type: "skill" | "piece") {
    const file = event.target.files?.[0]
    if (!file) return

    const reader = new FileReader()
    reader.onload = (e) => {
      const content = e.target?.result as string
      if (type === "skill") {
        setSkillCode(content)
      } else {
        setPieceCode(content)
      }
      setSuccess("文件导入成功")
    }
    reader.readAsText(file)
  }

  function resetCode() {
    setSkillCode("")
    setPieceCode("")
    setSkillName("")
    setPieceName("")
    setError(null)
    setSuccess(null)
  }

  return (
    <main className="min-h-svh bg-zinc-950 px-4 py-6">
      <div className="mx-auto w-full max-w-6xl space-y-6">
        <div className="flex items-center justify-between">
          <Button asChild variant="ghost" size="sm">
            <Link href="/">
              <ArrowLeft className="mr-2 h-4 w-4" />
              返回主页
            </Link>
          </Button>
          <h1 className="text-xl font-bold text-zinc-100">
            <Code className="mr-2 inline h-5 w-5 text-blue-400" />
            技能和棋子 DIY
          </h1>
          <Button variant="outline" size="sm" onClick={resetCode}>
            <Trash2 className="mr-2 h-4 w-4" />
            重置
          </Button>
        </div>

        <Alert>
          <Code className="h-4 w-4" />
          <AlertTitle>DIY 说明</AlertTitle>
          <AlertDescription>
            1. 输入技能和棋子代码<br />
            2. 点击验证按钮检查代码<br />
            3. 导出代码文件
          </AlertDescription>
        </Alert>

        <Tabs defaultValue="skill">
          <TabsList className="w-full max-w-md">
            <TabsTrigger value="skill" className="flex-1">技能编辑器</TabsTrigger>
            <TabsTrigger value="piece" className="flex-1">棋子编辑器</TabsTrigger>
          </TabsList>

          <TabsContent value="skill" className="mt-6 space-y-4">
            <Card className="bg-zinc-900/50">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm flex items-center justify-between">
                  <span>技能代码</span>
                  <div className="flex items-center gap-2">
                    <Button size="sm" variant="outline" onClick={validateSkillCode}>
                      <Play className="mr-2 h-4 w-4" />
                      验证
                    </Button>
                    <Button size="sm" variant="outline" onClick={exportSkillCode}>
                      <Download className="mr-2 h-4 w-4" />
                      导出
                    </Button>
                    <label className="relative inline-block">
                      <Input type="file" accept=".ts,.txt" className="sr-only" onChange={(e) => handleFileImport(e, "skill")} />
                      <Button size="sm" variant="outline">
                        <Upload className="mr-2 h-4 w-4" />
                        导入
                      </Button>
                    </label>
                  </div>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="skill-name">技能名称</Label>
                  <Input id="skill-name" value={skillName} onChange={(e) => setSkillName(e.target.value)} placeholder="输入技能名称" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="skill-code">TypeScript 代码</Label>
                  <Textarea id="skill-code" value={skillCode} onChange={(e) => setSkillCode(e.target.value)} placeholder="编写技能代码..." className="min-h-[300px] font-mono text-sm" />
                </div>
                {error && <Alert variant="destructive"><AlertTitle>错误</AlertTitle><AlertDescription>{error}</AlertDescription></Alert>}
                {success && <Alert variant="default"><AlertTitle>成功</AlertTitle><AlertDescription>{success}</AlertDescription></Alert>}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="piece" className="mt-6 space-y-4">
            <Card className="bg-zinc-900/50">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm flex items-center justify-between">
                  <span>棋子代码</span>
                  <div className="flex items-center gap-2">
                    <Button size="sm" variant="outline" onClick={validatePieceCode}>
                      <Play className="mr-2 h-4 w-4" />
                      验证
                    </Button>
                    <Button size="sm" variant="outline" onClick={exportPieceCode}>
                      <Download className="mr-2 h-4 w-4" />
                      导出
                    </Button>
                    <label className="relative inline-block">
                      <Input type="file" accept=".ts,.txt" className="sr-only" onChange={(e) => handleFileImport(e, "piece")} />
                      <Button size="sm" variant="outline">
                        <Upload className="mr-2 h-4 w-4" />
                        导入
                      </Button>
                    </label>
                  </div>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="piece-name">棋子名称</Label>
                  <Input id="piece-name" value={pieceName} onChange={(e) => setPieceName(e.target.value)} placeholder="输入棋子名称" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="piece-code">TypeScript 代码</Label>
                  <Textarea id="piece-code" value={pieceCode} onChange={(e) => setPieceCode(e.target.value)} placeholder="编写棋子代码..." className="min-h-[300px] font-mono text-sm" />
                </div>
                {error && <Alert variant="destructive"><AlertTitle>错误</AlertTitle><AlertDescription>{error}</AlertDescription></Alert>}
                {success && <Alert variant="default"><AlertTitle>成功</AlertTitle><AlertDescription>{success}</AlertDescription></Alert>}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        <Card className="bg-zinc-900/50">
          <CardHeader>
            <CardTitle className="text-sm">代码模板参考</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <h4 className="text-sm font-medium text-zinc-300">技能模板</h4>
                <pre className="text-xs text-muted-foreground overflow-auto p-2 bg-zinc-800 rounded">{`// 技能函数
function executeSkill(context) {
  const damage = context.piece.attack * context.skill.power
  return { damage, message: "造成 " + damage + " 点伤害" }
}

// 技能定义
export const skill = {
  id: "my-skill",
  name: "我的技能",
  type: "normal",  // 或 "super"
  power: 1.5,
  cooldown: 0
}

// 充能技能示例
export const chargeSkill = {
  id: "my-charge-skill",
  name: "充能技能",
  type: "super",
  power: 2.0,
  cooldown: 1,
  maxCharges: 3,
  chargeCost: 1
}`}</pre>
              </div>
              <div className="space-y-2">
                <h4 className="text-sm font-medium text-zinc-300">棋子模板</h4>
                <pre className="text-xs text-muted-foreground overflow-auto p-2 bg-zinc-800 rounded">{`// 棋子定义
export const piece = {
  id: "my-piece",
  name: "我的棋子",
  hp: 100,
  attack: 20,
  defense: 5,
  skills: ["skill-id"]
}`}</pre>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </main>
  )
}

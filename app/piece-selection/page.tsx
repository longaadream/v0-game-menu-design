"use client"

import { useState } from "react"
import Link from "next/link"
import { ArrowLeft, Swords, Shield, Zap, Star } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { getPiecesByFaction, type PieceTemplate } from "@/lib/game/piece-repository"

export default function PieceSelectionPage() {
  const [redPlayerPiece, setRedPlayerPiece] = useState<PieceTemplate | null>(null)
  const [bluePlayerPieces, setBluePlayerPieces] = useState<PieceTemplate[]>([])
  const [redSelectedPiece, setRedSelectedPiece] = useState<PieceTemplate | null>(null)
  const [blueSelectedPiece, setBlueSelectedPiece] = useState<PieceTemplate | null>(null)
  const [playerName, setPlayerName] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const redPieces = getPiecesByFaction("red")
  const bluePieces = getPiecesByFaction("blue")

  function handleRedPieceSelect(piece: PieceTemplate) {
    setRedSelectedPiece(piece)
    if (bluePieces.length > 0) {
      setBluePlayerPieces(bluePieces.filter(p => p.id !== piece.id))
    }
  }

  function handleBluePieceSelect(piece: PieceTemplate) {
    setBlueSelectedPiece(piece)
    if (redPieces.length > 0) {
      setRedPlayerPieces(redPieces.filter(p => p.id !== piece.id))
    }
  }

  function handleStartGame() {
    if (!redSelectedPiece || !blueSelectedPiece) {
      setError("请选择棋子")
      return
    }
    if (!playerName.trim()) {
      setError("请输入昵称")
      return
    }
    setLoading(true)
    setError(null)

    const selectedPieces = [redSelectedPiece, blueSelectedPiece].filter(Boolean) as PieceTemplate[]
    
    fetch("/api/lobby", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        action: "start-game",
        playerName: playerName.trim(),
        pieces: selectedPieces.map(p => ({
          templateId: p.id,
          faction: p.faction,
        })),
      }),
    })
      .then((res) => res.json())
      .then((data) => {
        if (data.roomId) {
          window.location.href = `/battle/${data.roomId}?playerName=${encodeURIComponent(playerName.trim())}`
        } else {
          setError("创建房间失败")
        }
      })
      .catch((err) => {
        setError(err instanceof Error ? err.message : "创建房间失败")
      })
      .finally(() => {
        setLoading(false)
      })
  }

  function getRarityColor(rarity: string): string {
    switch (rarity) {
      case "common":
        return "bg-zinc-600 text-zinc-100"
      case "rare":
        return "bg-purple-600 text-purple-100"
      case "epic":
        return "bg-yellow-600 text-yellow-100"
      case "legendary":
        return "bg-orange-600 text-orange-100"
      default:
        return "bg-zinc-600 text-zinc-100"
    }
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
            <Swords className="mr-2 inline h-5 w-5 text-red-500" />
            棋子选择
          </h1>
        </div>

        <div className="mb-4">
          <Card className="bg-zinc-900/50">
            <CardHeader>
              <CardTitle>玩家信息</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium text-zinc-300 mb-2">
                    你的昵称
                  </label>
                  <input
                    type="text"
                    value={playerName}
                    onChange={(e) => setPlayerName(e.target.value)}
                    placeholder="输入你的昵称"
                    className="w-full rounded-md border border-zinc-700 bg-zinc-800 px-4 py-2 text-zinc-100 placeholder:text-zinc-500 focus:border-zinc-600 focus:outline-none"
                  />
                </div>
                {error && (
                  <div className="rounded-md bg-red-900/50 border border-red-800 p-3 text-sm text-red-100">
                    {error}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="grid gap-6 lg:grid-cols-2">
          <Card className="bg-zinc-900/50">
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span className="flex items-center gap-2">
                  <div className="h-4 w-4 bg-red-500 rounded" />
                  红方选择
                </span>
                <Badge className="ml-2">选择 1 个</Badge>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {redPieces.map((piece) => (
                <div
                  key={piece.id}
                  onClick={() => handleRedPieceSelect(piece)}
                  className={`relative p-4 rounded-lg border-2 cursor-pointer transition-all ${
                    redSelectedPiece?.id === piece.id
                      ? "border-red-500 bg-red-900/20"
                      : "border-zinc-700 bg-zinc-800/50 hover:border-zinc-600"
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <div className={`text-4xl ${piece.image}`}>
                      {piece.image}
                    </div>
                    <div className="flex-1">
                      <div className="font-bold text-zinc-100">{piece.name}</div>
                      <Badge className={getRarityColor(piece.rarity)}>
                        {piece.rarity}
                      </Badge>
                      <p className="text-sm text-zinc-400 mt-1">{piece.description}</p>
                    </div>
                  </div>
                  {redSelectedPiece?.id === piece.id && (
                    <div className="absolute top-2 right-2 h-6 w-6 bg-red-500 rounded-full flex items-center justify-center">
                      <Star className="h-4 w-4 text-white" />
                    </div>
                  )}
                </div>
              ))}
            </CardContent>
          </Card>

          <Card className="bg-zinc-900/50">
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span className="flex items-center gap-2">
                  <div className="h-4 w-4 bg-blue-500 rounded" />
                  蓝方选择
                </span>
                <Badge className="ml-2">选择 1 个</Badge>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {bluePieces.map((piece) => (
                <div
                  key={piece.id}
                  onClick={() => handleBluePieceSelect(piece)}
                  className={`relative p-4 rounded-lg border-2 cursor-pointer transition-all ${
                    blueSelectedPiece?.id === piece.id
                      ? "border-blue-500 bg-blue-900/20"
                      : "border-zinc-700 bg-zinc-800/50 hover:border-zinc-600"
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <div className={`text-4xl ${piece.image}`}>
                      {piece.image}
                    </div>
                    <div className="flex-1">
                      <div className="font-bold text-zinc-100">{piece.name}</div>
                      <Badge className={getRarityColor(piece.rarity)}>
                        {piece.rarity}
                      </Badge>
                      <p className="text-sm text-zinc-400 mt-1">{piece.description}</p>
                    </div>
                  </div>
                  {blueSelectedPiece?.id === piece.id && (
                    <div className="absolute top-2 right-2 h-6 w-6 bg-blue-500 rounded-full flex items-center justify-center">
                      <Star className="h-4 w-4 text-white" />
                    </div>
                  )}
                </div>
              ))}
            </CardContent>
          </Card>
        </div>

        <Card className="bg-zinc-900/50">
          <CardHeader>
            <CardTitle>已选棋子</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 sm:grid-cols-2">
              {redSelectedPiece && (
                <div className="p-4 rounded-lg bg-red-900/20 border border-red-800">
                  <div className="flex items-center gap-3">
                    <div className={`text-4xl ${redSelectedPiece.image}`}>
                      {redSelectedPiece.image}
                    </div>
                    <div>
                      <div className="font-bold text-zinc-100">{redSelectedPiece.name}</div>
                      <Badge className={getRarityColor(redSelectedPiece.rarity)}>
                        {redSelectedPiece.rarity}
                      </Badge>
                    </div>
                  </div>
                </div>
              )}
              {blueSelectedPiece && (
                <div className="p-4 rounded-lg bg-blue-900/20 border border-blue-800">
                  <div className="flex items-center gap-3">
                    <div className={`text-4xl ${blueSelectedPiece.image}`}>
                      {blueSelectedPiece.image}
                    </div>
                    <div>
                      <div className="font-bold text-zinc-100">{blueSelectedPiece.name}</div>
                      <Badge className={getRarityColor(blueSelectedPiece.rarity)}>
                        {blueSelectedPiece.rarity}
                      </Badge>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        <Button
          className="w-full"
          size="lg"
          onClick={handleStartGame}
          disabled={loading || !redSelectedPiece || !blueSelectedPiece}
        >
          {loading ? (
            <>
              <div className="h-4 w-4 animate-spin" />
              <span className="ml-2">创建房间中...</span>
            </>
          ) : (
            <>
              <Swords className="mr-2 h-5 w-5" />
              开始游戏
            </>
          )}
        </Button>
      </div>
    </main>
  )
}

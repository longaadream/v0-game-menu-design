"use client"

import { useMemo, useState } from "react"
import Link from "next/link"
import { ArrowLeft } from "lucide-react"
import { listMaps } from "@/config/maps"
import { GameBoard } from "@/components/game-board"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

const maps = listMaps()

export default function BoardDemoPage() {
  const [selectedId, setSelectedId] = useState<string | undefined>(
    maps[0]?.id,
  )

  const selectedMap = useMemo(
    () => maps.find((m) => m.id === selectedId),
    [selectedId],
  )

  return (
    <main className="flex min-h-svh flex-col items-center justify-center px-4 py-12">
      <div className="w-full max-w-3xl space-y-6">
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
              棋盘 / 地图预览
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2 max-w-xs">
              <Label htmlFor="map-select">选择地图</Label>
              <Select
                value={selectedId}
                onValueChange={(value) => setSelectedId(value)}
              >
                <SelectTrigger id="map-select">
                  <SelectValue placeholder="选择一张地图" />
                </SelectTrigger>
                <SelectContent>
                  {maps.map((m) => (
                    <SelectItem key={m.id} value={m.id}>
                      {m.name} ({m.width}×{m.height})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {selectedMap ? (
              <div className="mt-4 flex justify-center">
                <GameBoard map={selectedMap} />
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">
                暂时没有可用的地图配置。
              </p>
            )}
          </CardContent>
        </Card>
      </div>
    </main>
  )
}


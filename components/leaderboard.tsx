"use client"

import { useState, useEffect, useMemo } from "react"
import { createClient } from "@/lib/supabase/client"

interface LeaderboardEntry {
  username: string
  codes_found: number
}

interface LeaderboardProps {
  totalCodes: number
  currentUsername: string
}

export function Leaderboard({ totalCodes, currentUsername }: LeaderboardProps) {
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([])
  const [loading, setLoading] = useState(true)
  const supabase = useMemo(() => createClient(), [])

  const fetchLeaderboard = async () => {
    console.log("[v0] Fetching leaderboard...")
    const { data, error } = await supabase.from("users").select("username, user_codes(id)")

    if (!error && data) {
      const entries = data
        .map((user: any) => ({
          username: user.username,
          codes_found: user.user_codes?.length || 0,
        }))
        .sort((a, b) => b.codes_found - a.codes_found)

      console.log("[v0] Leaderboard entries:", entries)
      setLeaderboard(entries)
    }
    setLoading(false)
  }

  useEffect(() => {
    fetchLeaderboard()

    const channel = supabase
      .channel("leaderboard_updates")
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "user_codes" }, async (payload) => {
        console.log("[v0] INSERT user_codes, updating leaderboard:", payload)
        await fetchLeaderboard()
      })
      .on("postgres_changes", { event: "DELETE", schema: "public", table: "user_codes" }, async (payload) => {
        console.log("[v0] DELETE user_codes, updating leaderboard:", payload)
        await fetchLeaderboard()
      })
      .subscribe((status) => {
        console.log("[v0] Leaderboard subscription status:", status)
      })

    return () => {
      supabase.removeChannel(channel)
    }
  }, [supabase])

  if (loading) {
    return <div className="text-center text-gray-500">Loading leaderboard...</div>
  }

  return (
    <div>
      <h2 className="text-2xl font-bold mb-4">Your Ranking</h2>
      <div className="space-y-2">
        {leaderboard.length === 0 ? (
          <p className="text-gray-500">No participants yet</p>
        ) : (
          leaderboard.map((entry, index) => (
            <div
              key={entry.username}
              className={`flex items-center justify-between p-3 rounded ${
                entry.username === currentUsername ? "bg-blue-100 border-2 border-blue-500" : "bg-gray-50"
              }`}
            >
              <div className="flex items-center gap-3">
                <span className="text-lg font-bold text-gray-500 w-6">#{index + 1}</span>
                <span className="font-semibold text-gray-900">{entry.username}</span>
              </div>
              <div className="text-right">
                <span className="text-lg font-bold text-blue-600">{entry.codes_found}</span>
                <span className="text-gray-600 text-sm ml-1">/ {totalCodes}</span>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  )
}

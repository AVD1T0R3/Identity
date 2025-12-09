"use client"

import type React from "react"

import { useState, useEffect, useCallback } from "react"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card } from "@/components/ui/card"
import { Leaderboard } from "@/components/leaderboard"
import { WinnerModal } from "@/components/winner-modal"

interface GameInterfaceProps {
  username: string
}

export function GameInterface({ username }: GameInterfaceProps) {
  const [codeInput, setCodeInput] = useState("")
  const [foundCodes, setFoundCodes] = useState<string[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [winner, setWinner] = useState<string | null>(null)
  const [totalCodes, setTotalCodes] = useState(0)
  const [userId, setUserId] = useState<string | null>(null)
  const [refreshing, setRefreshing] = useState(false)

  const supabase = createClient()

  // Fetch total codes count on mount
  useEffect(() => {
    const fetchTotalCodes = async () => {
      const { data, error } = await supabase.from("codes").select("id", { count: "exact" })

      if (!error && data) {
        setTotalCodes(data.length)
      }
    }

    fetchTotalCodes()
  }, [supabase])

  // Get user ID and fetch found codes on mount
  useEffect(() => {
    // Only fetch initial found codes for this user
    const fetchUserAndCodes = async () => {
      const { data: users, error: userError } = await supabase.from("users").select("id").eq("username", username)

      if (userError || !users || !users.length) {
        console.error("User not found")
        return
      }

      const currentUserId = users[0].id
      setUserId(currentUserId)

      const { data: userCodesData } = await supabase.from("user_codes").select("code_id").eq("user_id", currentUserId)

      if (userCodesData && userCodesData.length > 0) {
        const codeIds = userCodesData.map((uc: any) => uc.code_id)
        const { data: codeDetails } = await supabase.from("codes").select("code").in("id", codeIds)

        if (codeDetails) {
          setFoundCodes(codeDetails.map((c: any) => c.code.toLowerCase()))
        }
      }
    }

    fetchUserAndCodes()
  }, [username, supabase])

  useEffect(() => {
    if (!userId) return

    const channel = supabase
      .channel(`user_codes_${userId}`)
      .on("postgres_changes", { event: "*", schema: "public", table: "user_codes" }, async (payload) => {
        console.log("[v0] user_codes changed, refetching for user:", userId)

        const { data: userCodesData } = await supabase.from("user_codes").select("code_id").eq("user_id", userId)

        if (userCodesData && userCodesData.length > 0) {
          const codeIds = userCodesData.map((uc: any) => uc.code_id)
          const { data: codeDetails } = await supabase.from("codes").select("code").in("id", codeIds)

          if (codeDetails) {
            const newFoundCodes = codeDetails.map((c: any) => c.code.toLowerCase())
            setFoundCodes(newFoundCodes)
            console.log("[v0] Updated found codes:", newFoundCodes)
          }
        } else {
          setFoundCodes([])
        }
      })
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [userId, supabase])

  useEffect(() => {
    if (totalCodes > 0 && foundCodes.length === totalCodes && foundCodes.length > 0) {
      console.log("[v0] Winner found:", username, "with", foundCodes.length, "codes")
      setWinner(username)
    }
  }, [foundCodes, totalCodes, username])

  const handleCodeSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault()
      setError(null)
      setLoading(true)

      try {
        if (!userId) {
          setError("User not found")
          setLoading(false)
          return
        }

        const inputCode = codeInput.trim().toLowerCase()
        console.log("[v0] Searching for code:", inputCode)

        const { data: codes, error: codeError } = await supabase.from("codes").select("id, code").eq("code", inputCode)

        console.log("[v0] Code lookup result:", { codes, error: codeError })

        if (codeError) {
          console.log("[v0] Code lookup error:", codeError)
          setError("Database error")
          setLoading(false)
          return
        }

        if (!codes || codes.length === 0) {
          console.log("[v0] No codes found matching:", inputCode)
          setError("Invalid code")
          setLoading(false)
          return
        }

        const codeId = codes[0].id

        // Check if already found
        const { data: existing } = await supabase
          .from("user_codes")
          .select("id")
          .eq("user_id", userId)
          .eq("code_id", codeId)

        if (existing && existing.length > 0) {
          setError("Code already found!")
          setLoading(false)
          return
        }

        // Insert the found code
        const { error: insertError } = await supabase.from("user_codes").insert({
          user_id: userId,
          code_id: codeId,
        })

        if (insertError) {
          console.log("[v0] Insert error:", insertError)
          setError("Failed to record code")
          setLoading(false)
          return
        }

        setCodeInput("")
      } catch (err) {
        console.log("[v0] Unexpected error:", err)
        setError("An error occurred")
      } finally {
        setLoading(false)
      }
    },
    [userId, codeInput, supabase],
  )

  const handleRefresh = async () => {
    if (!userId) return

    setRefreshing(true)
    try {
      const { data: userCodesData } = await supabase.from("user_codes").select("code_id").eq("user_id", userId)

      if (userCodesData && userCodesData.length > 0) {
        const codeIds = userCodesData.map((uc: any) => uc.code_id)
        const { data: codeDetails } = await supabase.from("codes").select("code").in("id", codeIds)

        if (codeDetails) {
          setFoundCodes(codeDetails.map((c: any) => c.code.toLowerCase()))
        }
      } else {
        setFoundCodes([])
      }
    } finally {
      setRefreshing(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <div className="max-w-4xl mx-auto">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">Easter Egg Hunt</h1>
          <p className="text-gray-600">Welcome, {username}!</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Code Input Section */}
          <Card className="lg:col-span-1 p-6">
            <h2 className="text-xl font-bold mb-4">Enter Code</h2>
            <form onSubmit={handleCodeSubmit} className="space-y-4">
              <Input
                type="text"
                placeholder="Enter code..."
                value={codeInput}
                onChange={(e) => setCodeInput(e.target.value.toLowerCase())}
                disabled={loading}
                className="text-lg font-mono"
              />

              {error && <p className="text-red-600 text-sm">{error}</p>}

              <div className="bg-blue-50 p-3 rounded text-sm text-gray-700">
                Found: {foundCodes.length} / {totalCodes} codes
              </div>

              <Button type="submit" disabled={loading || codeInput.length === 0} className="w-full">
                {loading ? "Checking..." : "Submit Code"}
              </Button>
            </form>

            {foundCodes.length > 0 && (
              <div className="mt-6 p-4 bg-green-50 rounded">
                <h3 className="font-semibold text-green-900 mb-2">Your Codes:</h3>
                <div className="space-y-1">
                  {foundCodes.map((code) => (
                    <div key={code} className="text-sm text-green-700">
                      ✓ {code}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </Card>

          {/* Leaderboard Section */}
          <Card className="lg:col-span-2 p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold">Leaderboard</h2>
              <Button size="sm" variant="outline" onClick={handleRefresh} disabled={refreshing}>
                {refreshing ? "Refreshing..." : "Refresh"}
              </Button>
            </div>
            <Leaderboard totalCodes={totalCodes} currentUsername={username} />
          </Card>
        </div>
      </div>

      {/* Winner Modal */}
      {winner && <WinnerModal winner={winner} onClose={() => setWinner(null)} />}
    </div>
  )
}

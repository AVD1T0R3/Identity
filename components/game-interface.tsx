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
    const fetchUserAndCodes = async () => {
      const { data: users, error: userError } = await supabase.from("users").select("id").eq("username", username)

      if (userError || !users || users.length === 0) {
        console.error("User not found")
        return
      }

      const currentUserId = users[0].id
      setUserId(currentUserId)

      // Now fetch codes for this specific user
      const { data: userCodesData, error: codesError } = await supabase
        .from("user_codes")
        .select("code_id")
        .eq("user_id", currentUserId)

      if (codesError) {
        console.error("Error fetching codes:", codesError)
        return
      }

      // Get the actual code values
      if (userCodesData && userCodesData.length > 0) {
        const codeIds = userCodesData.map((uc: any) => uc.code_id)
        const { data: codeDetails } = await supabase.from("codes").select("code").in("id", codeIds)

        if (codeDetails) {
          setFoundCodes(codeDetails.map((c: any) => c.code))
        }
      }
    }

    fetchUserAndCodes()
  }, [username, supabase])

  // Subscribe to real-time updates for leaderboard and winners
  useEffect(() => {
    const channel = supabase
      .channel("user_codes_updates")
      .on("postgres_changes", { event: "*", schema: "public", table: "user_codes" }, async () => {
        if (!userId) return

        const { data: userCodesData } = await supabase.from("user_codes").select("code_id").eq("user_id", userId)

        if (userCodesData && userCodesData.length > 0) {
          const codeIds = userCodesData.map((uc: any) => uc.code_id)
          const { data: codeDetails } = await supabase.from("codes").select("code").in("id", codeIds)

          if (codeDetails) {
            setFoundCodes(codeDetails.map((c: any) => c.code))
          }
        } else {
          setFoundCodes([])
        }

        // Check if anyone has found all codes
        if (totalCodes > 0) {
          const { data: allUsers } = await supabase.from("users").select("username, user_codes(id)")

          if (allUsers) {
            for (const user of allUsers) {
              if (user.user_codes && user.user_codes.length === totalCodes) {
                setWinner(user.username)
                break
              }
            }
          }
        }
      })
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [userId, totalCodes, supabase])

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

        const inputCode = codeInput.trim().toUpperCase()
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
    [userId, supabase],
  )

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
                onChange={(e) => setCodeInput(e.target.value.toUpperCase())}
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
            <Leaderboard totalCodes={totalCodes} currentUsername={username} />
          </Card>
        </div>
      </div>

      {/* Winner Modal */}
      {winner && <WinnerModal winner={winner} onClose={() => setWinner(null)} />}
    </div>
  )
}

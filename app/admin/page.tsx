"use client"

import { useState, useEffect } from "react"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card } from "@/components/ui/card"
import Link from "next/link"
import { ArrowLeft } from "lucide-react"

interface CodeEntry {
  id: string
  code: string
  created_at: string
}

interface UserProgress {
  username: string
  codes_found: number
  total_codes: number
}

export default function AdminDashboard() {
  const [codes, setCodes] = useState<CodeEntry[]>([])
  const [userProgress, setUserProgress] = useState<UserProgress[]>([])
  const [loading, setLoading] = useState(true)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editValue, setEditValue] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  const supabase = createClient()

  const fetchData = async () => {
    try {
      // Fetch codes
      const { data: codesData, error: codesError } = await supabase
        .from("codes")
        .select("*")
        .order("created_at", { ascending: true })

      if (codesError) throw codesError
      setCodes(codesData || [])

      // Fetch user progress
      const { data: usersData, error: usersError } = await supabase.from("users").select("username, user_codes(id)")

      if (usersError) throw usersError

      const totalCodesCount = codesData?.length || 0
      const progress = (usersData || []).map((user: any) => ({
        username: user.username,
        codes_found: user.user_codes?.length || 0,
        total_codes: totalCodesCount,
      }))

      setUserProgress(progress.sort((a, b) => b.codes_found - a.codes_found))
    } catch (err) {
      setError("Failed to fetch data")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchData()

    const codesChannel = supabase
      .channel("admin_codes_updates")
      .on("postgres_changes", { event: "*", schema: "public", table: "codes" }, () => {
        fetchData()
      })
      .subscribe()

    const userCodesChannel = supabase
      .channel("admin_usercodes_updates")
      .on("postgres_changes", { event: "*", schema: "public", table: "user_codes" }, () => {
        fetchData()
      })
      .subscribe()

    return () => {
      supabase.removeChannel(codesChannel)
      supabase.removeChannel(userCodesChannel)
    }
  }, [supabase])

  const handleEditCode = async (id: string, newCode: string) => {
    if (!newCode.trim()) {
      setError("Code cannot be empty")
      return
    }

    try {
      setError(null)
      const { error: updateError } = await supabase.from("codes").update({ code: newCode.toUpperCase() }).eq("id", id)

      if (updateError) throw updateError

      setEditingId(null)
      setSuccess("Code updated successfully")
      setTimeout(() => setSuccess(null), 2000)
    } catch (err) {
      setError("Failed to update code")
    }
  }

  const handleResetGame = async () => {
    if (!confirm("Are you sure? This will delete all user codes found. Users will remain.")) {
      return
    }

    try {
      setError(null)
      const { error: deleteError } = await supabase
        .from("user_codes")
        .delete()
        .neq("id", "00000000-0000-0000-0000-000000000000")

      if (deleteError) throw deleteError

      setSuccess("Game reset successfully")
      setTimeout(() => setSuccess(null), 2000)
    } catch (err) {
      setError("Failed to reset game")
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 p-4">
        <div className="max-w-4xl mx-auto">
          <p className="text-gray-500">Loading...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Admin Dashboard</h1>
            <p className="text-gray-600">Manage codes and view game progress</p>
          </div>
          <Link href="/">
            <Button variant="outline" size="sm">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Game
            </Button>
          </Link>
        </div>

        {/* Alerts */}
        {error && <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded text-red-700">{error}</div>}
        {success && (
          <div className="mb-4 p-4 bg-green-50 border border-green-200 rounded text-green-700">{success}</div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Codes Management */}
          <Card className="p-6">
            <h2 className="text-xl font-bold mb-4">Secret Codes ({codes.length})</h2>
            <div className="space-y-3">
              {codes.map((code) => (
                <div
                  key={code.id}
                  className="flex items-center justify-between p-3 bg-gray-50 rounded border border-gray-200"
                >
                  {editingId === code.id ? (
                    <div className="flex items-center gap-2 flex-1">
                      <Input
                        type="text"
                        value={editValue}
                        onChange={(e) => setEditValue(e.target.value.toUpperCase())}
                        className="font-mono"
                        autoFocus
                      />
                      <Button size="sm" onClick={() => handleEditCode(code.id, editValue)}>
                        Save
                      </Button>
                      <Button size="sm" variant="outline" onClick={() => setEditingId(null)}>
                        Cancel
                      </Button>
                    </div>
                  ) : (
                    <>
                      <code className="font-mono font-bold text-blue-600">{code.code}</code>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          setEditingId(code.id)
                          setEditValue(code.code)
                        }}
                      >
                        Edit
                      </Button>
                    </>
                  )}
                </div>
              ))}
            </div>

            <div className="mt-6 pt-6 border-t">
              <Button onClick={handleResetGame} variant="destructive" className="w-full">
                Reset Game Progress
              </Button>
              <p className="text-xs text-gray-500 mt-2">Clears all found codes while keeping users</p>
            </div>
          </Card>

          {/* User Progress */}
          <Card className="p-6">
            <h2 className="text-xl font-bold mb-4">User Progress ({userProgress.length})</h2>
            <div className="space-y-2">
              {userProgress.length === 0 ? (
                <p className="text-gray-500">No users yet</p>
              ) : (
                userProgress.map((user, index) => (
                  <div
                    key={user.username}
                    className="flex items-center justify-between p-3 bg-blue-50 rounded border border-blue-200"
                  >
                    <div className="flex items-center gap-3">
                      <span className="text-lg font-bold text-gray-500 w-6">#{index + 1}</span>
                      <div>
                        <p className="font-semibold text-gray-900">{user.username}</p>
                        <div className="w-32 bg-gray-200 rounded-full h-2">
                          <div
                            className="bg-blue-600 h-2 rounded-full transition-all"
                            style={{
                              width: `${user.total_codes > 0 ? (user.codes_found / user.total_codes) * 100 : 0}%`,
                            }}
                          ></div>
                        </div>
                      </div>
                    </div>
                    <div className="text-right font-semibold">
                      <span className="text-blue-600">{user.codes_found}</span>
                      <span className="text-gray-500">/{user.total_codes}</span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </Card>
        </div>
      </div>
    </div>
  )
}

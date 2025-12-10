import { createServerClient } from "@supabase/ssr"
import { cookies } from "next/headers"
import { NextResponse } from "next/server"

export async function POST() {
  try {
    const cookieStore = cookies()

    const supabase = createServerClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!, {
      cookies: {
        getAll() {
          return cookieStore.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => {
            cookieStore.set(name, value, options)
          })
        },
      },
    })

    // Delete all user_codes to reset game
    const { error } = await supabase.from("user_codes").delete().neq("id", "00000000-0000-0000-0000-000000000000")

    if (error) {
      console.error("[v0] Reset game error:", error)
      return NextResponse.json({ error: error.message }, { status: 400 })
    }

    console.log("[v0] Game reset successfully")
    return NextResponse.json({ success: true, message: "Game reset successfully" })
  } catch (err) {
    console.error("[v0] Reset game exception:", err)
    return NextResponse.json({ error: "Failed to reset game" }, { status: 500 })
  }
}

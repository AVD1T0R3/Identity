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

    // Delete all user_codes first (foreign key constraint)
    const { error: userCodesError } = await supabase
      .from("user_codes")
      .delete()
      .neq("id", "00000000-0000-0000-0000-000000000000")

    if (userCodesError) throw userCodesError

    // Delete all users
    const { error: usersError } = await supabase
      .from("users")
      .delete()
      .neq("id", "00000000-0000-0000-0000-000000000000")

    if (usersError) throw usersError

    console.log("[v0] All users and progress reset successfully")
    return NextResponse.json({ success: true, message: "All users and progress reset successfully" })
  } catch (err) {
    console.error("[v0] Reset all exception:", err)
    return NextResponse.json({ error: "Failed to reset all data" }, { status: 500 })
  }
}

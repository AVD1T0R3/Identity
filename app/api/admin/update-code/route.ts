import { createServerClient } from "@supabase/ssr"
import { cookies } from "next/headers"
import { NextResponse } from "next/server"

export async function POST(req: Request) {
  try {
    const { id, code } = await req.json()

    if (!id || !code) {
      return NextResponse.json({ error: "Missing id or code" }, { status: 400 })
    }

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

    const { error } = await supabase.from("codes").update({ code: code.toLowerCase() }).eq("id", id)

    if (error) {
      console.error("[v0] Update code error:", error)
      return NextResponse.json({ error: error.message }, { status: 400 })
    }

    console.log("[v0] Code updated successfully:", code)
    return NextResponse.json({ success: true, message: "Code updated successfully" })
  } catch (err) {
    console.error("[v0] Update code exception:", err)
    return NextResponse.json({ error: "Failed to update code" }, { status: 500 })
  }
}

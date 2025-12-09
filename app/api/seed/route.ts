import { createServerClient } from "@supabase/ssr"
import { cookies } from "next/headers"

export async function GET() {
  try {
    const cookieStore = await cookies()
    const supabase = createServerClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!, {
      cookies: {
        getAll() {
          return cookieStore.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => cookieStore.set(name, value, options))
        },
      },
    })

    const { error: deleteError } = await supabase
      .from("codes")
      .delete()
      .neq("id", "00000000-0000-0000-0000-000000000000")

    if (deleteError) {
      console.error("[v0] Delete error:", deleteError)
      return Response.json({ error: `Delete error: ${deleteError.message}` }, { status: 400 })
    }

    // Insert 10 codes
    const { data, error } = await supabase
      .from("codes")
      .insert([
        { code: "BLACK" },
        { code: "NEW" },
        { code: "OPEN" },
        { code: "YELOOW" },
        { code: "CODE5" },
        { code: "CODE6" },
        { code: "CODE7" },
        { code: "CODE8" },
        { code: "CODE9" },
        { code: "CODE10" },
      ])
      .select()

    if (error) {
      console.error("[v0] Seed insert error:", error)
      return Response.json(
        {
          success: false,
          error: error.message,
          details: error.details,
        },
        { status: 400 },
      )
    }

    const { data: verify, error: verifyError } = await supabase.from("codes").select("*")

    return Response.json({
      success: true,
      message: "Database seeded successfully",
      insertedCodes: data,
      totalCodesNow: verify?.length || 0,
      allCodes: verify,
    })
  } catch (error) {
    console.error("[v0] Seed error:", error)
    return Response.json({ error: "Failed to seed database", details: String(error) }, { status: 500 })
  }
}

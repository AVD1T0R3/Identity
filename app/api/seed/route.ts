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

    // Insert 10 codes
    const { data, error } = await supabase
      .from("codes")
      .insert([
        { code: "CODE1" },
        { code: "CODE2" },
        { code: "CODE3" },
        { code: "CODE4" },
        { code: "CODE5" },
        { code: "CODE6" },
        { code: "CODE7" },
        { code: "CODE8" },
        { code: "CODE9" },
        { code: "CODE10" },
      ])
      .select()

    if (error) {
      console.error("Seed error:", error)
      return Response.json({ error: error.message }, { status: 400 })
    }

    return Response.json({
      success: true,
      message: "Database seeded successfully",
      codes: data,
    })
  } catch (error) {
    console.error("Seed error:", error)
    return Response.json({ error: "Failed to seed database" }, { status: 500 })
  }
}

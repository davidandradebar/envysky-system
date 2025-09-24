import { type NextRequest, NextResponse } from "next/server"
import { getPilots, savePilot } from "@/lib/db"

export async function GET() {
  try {
    console.log("🔍 GET /api/pilots - Fetching pilots...")
    const pilots = await getPilots()
    console.log(`✅ Found ${pilots.length} pilots`)
    return NextResponse.json(pilots)
  } catch (error) {
    console.error("❌ Error fetching pilots:", error)
    return NextResponse.json({ error: "Failed to fetch pilots" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    console.log("📝 POST /api/pilots - Creating pilot...")
    const body = await request.json()
    console.log("📋 Request body:", body)

    const { fullName, email, phone, country, birthDate, licenseType } = body

    if (!fullName || !email) {
      console.log("❌ Missing required fields")
      return NextResponse.json({ error: "Full name and email are required" }, { status: 400 })
    }

    const pilot = await savePilot({
      fullName,
      email,
      phone,
      country,
      birthDate,
      licenseType,
    })

    console.log("✅ Pilot created:", pilot)
    return NextResponse.json(pilot)
  } catch (error) {
    console.error("❌ Error creating pilot:", error)
    return NextResponse.json({ error: "Failed to create pilot" }, { status: 500 })
  }
}

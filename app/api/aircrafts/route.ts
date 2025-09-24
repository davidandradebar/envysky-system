import { type NextRequest, NextResponse } from "next/server"
import { getAircrafts, createAircraft } from "@/lib/db"

export async function GET() {
  try {
    console.log("🔍 API /api/aircrafts - Fetching aircrafts...")
    const aircrafts = await getAircrafts()
    console.log("✅ API /api/aircrafts - Success:", aircrafts.length, "aircrafts found")
    return NextResponse.json(aircrafts)
  } catch (error) {
    console.error("❌ API /api/aircrafts - Error:", error)
    return NextResponse.json({ error: "Failed to fetch aircrafts" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    console.log("📝 POST /api/aircrafts - Creating aircraft...")

    const body = await request.json()
    console.log("📋 Request body:", body)

    const { tailNumber, model, initialHours, maintenanceIntervalHours, status } = body

    if (!tailNumber || !model) {
      console.log("❌ Missing required fields")
      return NextResponse.json({ error: "Tail number and model are required" }, { status: 400 })
    }

    const aircraft = await createAircraft(tailNumber, model, initialHours, maintenanceIntervalHours, status)
    console.log("✅ Aircraft created:", aircraft[0])
    return NextResponse.json(aircraft[0])
  } catch (error) {
    console.error("❌ Error creating aircraft:", error)
    return NextResponse.json({ error: "Failed to create aircraft" }, { status: 500 })
  }
}

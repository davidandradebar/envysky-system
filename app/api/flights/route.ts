import { type NextRequest, NextResponse } from "next/server"
import { neon } from "@neondatabase/serverless"

const sql = neon(process.env.DATABASE_URL!)

export async function GET() {
  try {
    console.log("🔍 GET /api/flights - Fetching flights...")

    const flights = await sql`
      SELECT 
        flight_id as id,
        pilot_id as "pilotId",
        copilot_id as "pilotId2",
        aircraft_id as "aircraftId",
        flight_time as date,
        '00:00' as time,
        duration,
        status,
        notes,
        tachometer_start as "tachometerStart",
        tachometer_end as "tachometerEnd",
        created_at as "createdAt"
      FROM flights 
      ORDER BY created_at DESC
    `

    console.log("✅ Flights fetched:", flights.length)
    return NextResponse.json(flights)
  } catch (error) {
    console.error("❌ Error fetching flights:", error)
    return NextResponse.json({ error: "Failed to fetch flights" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    console.log("📝 POST /api/flights - Creating flight...")

    const body = await request.json()
    console.log("📦 Request body:", body)

    const { pilotId, pilotId2, aircraftId, date, time, tachometerStart, tachometerEnd, notes } = body

    if (!pilotId || !aircraftId || !date) {
      return NextResponse.json({ error: "Pilot, aircraft and date are required" }, { status: 400 })
    }

    const duration = tachometerEnd && tachometerStart ? Number(tachometerEnd) - Number(tachometerStart) : 0

    const flight = await sql`
      INSERT INTO flights (pilot_id, copilot_id, aircraft_id, flight_time, duration, status, notes, tachometer_start, tachometer_end)
      VALUES (${pilotId}, ${pilotId2 || null}, ${aircraftId}, ${date}, ${duration}, 'completed', ${notes || ""}, ${Number(tachometerStart) || null}, ${Number(tachometerEnd) || null})
      RETURNING 
        flight_id as id,
        pilot_id as "pilotId",
        copilot_id as "pilotId2",
        aircraft_id as "aircraftId",
        flight_time as date,
        duration,
        status,
        notes,
        tachometer_start as "tachometerStart",
        tachometer_end as "tachometerEnd",
        created_at as "createdAt"
    `

    console.log("✅ Flight created:", flight[0])
    return NextResponse.json(flight[0])
  } catch (error) {
    console.error("❌ Error creating flight:", error)
    return NextResponse.json({ error: "Failed to create flight" }, { status: 500 })
  }
}

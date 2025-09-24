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
        flight_time as time,
        duration,
        status,
        notes,
        tachometer_start as "tachometerStart",
        tachometer_end as "tachometerEnd",
        created_at as "createdAt"
      FROM flights 
      ORDER BY created_at DESC
    `

    console.log(`✅ Found ${flights.length} flights`)
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
    console.log("📋 Request body:", body)

    const { pilotId, pilotId2, aircraftId, date, time, duration, status, notes, tachometerStart, tachometerEnd } = body

    if (!pilotId || !aircraftId || !date) {
      console.log("❌ Missing required fields")
      return NextResponse.json({ error: "Pilot ID, aircraft ID, and date are required" }, { status: 400 })
    }

    const flight = await sql`
      INSERT INTO flights (pilot_id, copilot_id, aircraft_id, flight_time, duration, status, notes, tachometer_start, tachometer_end)
      VALUES (
        ${pilotId}, 
        ${pilotId2 || null}, 
        ${aircraftId}, 
        ${date + " " + (time || "00:00")}, 
        ${duration || 0}, 
        ${status || "scheduled"}, 
        ${notes || null},
        ${tachometerStart || null},
        ${tachometerEnd || null}
      )
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

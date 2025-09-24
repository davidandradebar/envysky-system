import { NextResponse } from "next/server"
import { neon } from "@neondatabase/serverless"

// Helper function to generate flight_id if needed
function generateFlightId(): string {
  return `flight_${Math.random().toString(36).substr(2, 9)}`
}

// Helper function to convert decimal hours to duration format (HH:MM:SS)
function formatHoursToDuration(hours: number): string {
  const totalSeconds = Math.round(hours * 3600)
  const h = Math.floor(totalSeconds / 3600)
  const m = Math.floor((totalSeconds % 3600) / 60)
  const s = totalSeconds % 60

  return `${h.toString().padStart(2, "0")}:${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`
}

export async function GET() {
  if (!process.env.DATABASE_URL) {
    return NextResponse.json({ error: "DATABASE_URL not configured" }, { status: 400 })
  }

  try {
    const sql = neon(process.env.DATABASE_URL!)
    const rows = await sql`
      SELECT 
        flight_id,
        pilot_id,
        copilot_id,
        aircraft_id,
        flight_time,
        duration,
        status,
        notes,
        tachometer_start,
        tachometer_end,
        created_at
      FROM flights
      ORDER BY flight_time DESC
    `

    console.log(`Fetched ${rows.length} flights from database`)

    const flights = rows.map((row: any) => {
      // Parse flight_time to get date and time
      let date = ""
      let time = ""
      if (row.flight_time) {
        try {
          const dateObj = new Date(row.flight_time)
          date = dateObj.toISOString().split("T")[0]
          time = dateObj.toISOString().split("T")[1].substring(0, 5)
        } catch (e) {
          // Fallback parsing
          const parts = String(row.flight_time).split(" ")
          if (parts.length >= 2) {
            date = parts[0]
            time = parts[1].substring(0, 5)
          }
        }
      }

      return {
        id: row.flight_id || generateFlightId(),
        pilotId: row.pilot_id || "",
        pilotId2: row.copilot_id || undefined,
        aircraftId: row.aircraft_id || "",
        date,
        time,
        duration: 0, // Will be calculated from tachometer if available
        status: (row.status || "completed") as "scheduled" | "completed" | "cancelled",
        notes: row.notes || undefined,
        tachometerStart: row.tachometer_start ? Number.parseFloat(row.tachometer_start) : undefined,
        tachometerEnd: row.tachometer_end ? Number.parseFloat(row.tachometer_end) : undefined,
        createdAt: row.created_at || new Date().toISOString(),
      }
    })

    return NextResponse.json(flights)
  } catch (error) {
    console.error("Error fetching flights:", error)
    return NextResponse.json({ error: "Failed to fetch flights", details: error.message }, { status: 500 })
  }
}

export async function POST(req: Request) {
  if (!process.env.DATABASE_URL) {
    return NextResponse.json({ error: "DATABASE_URL not configured" }, { status: 400 })
  }

  try {
    const body = await req.json()
    console.log("Creating flight with data:", body)

    const sql = neon(process.env.DATABASE_URL!)
    const flightId = generateFlightId()

    // Combine date and time for flight_time
    const flightTime = `${body.date} ${body.time}`

    // Calculate duration from tachometer if provided
    let calculatedDuration = body.duration || 0
    if (body.tachometerStart && body.tachometerEnd) {
      calculatedDuration = body.tachometerEnd - body.tachometerStart
    }

    const durationFormatted = formatHoursToDuration(calculatedDuration)

    await sql`
      INSERT INTO flights (
        flight_id,
        pilot_id,
        copilot_id,
        aircraft_id,
        flight_time,
        duration,
        status,
        notes,
        tachometer_start,
        tachometer_end,
        created_at
      )
      VALUES (
        ${flightId},
        ${body.pilotId},
        ${body.pilotId2 || null},
        ${body.aircraftId},
        ${flightTime},
        ${durationFormatted},
        ${body.status || "completed"},
        ${body.notes || null},
        ${body.tachometerStart || null},
        ${body.tachometerEnd || null},
        NOW()
      )
    `

    console.log("Flight created successfully:", flightId)

    const flight = {
      id: flightId,
      pilotId: body.pilotId,
      pilotId2: body.pilotId2 || undefined,
      aircraftId: body.aircraftId,
      date: body.date,
      time: body.time,
      duration: calculatedDuration,
      status: body.status || "completed",
      notes: body.notes || undefined,
      tachometerStart: body.tachometerStart || undefined,
      tachometerEnd: body.tachometerEnd || undefined,
      createdAt: new Date().toISOString(),
    }

    return NextResponse.json(flight)
  } catch (error) {
    console.error("Error creating flight:", error)
    return NextResponse.json({ error: "Failed to create flight", details: error.message }, { status: 500 })
  }
}

export async function PUT(req: Request) {
  if (!process.env.DATABASE_URL) {
    return NextResponse.json({ error: "DATABASE_URL not configured" }, { status: 400 })
  }

  try {
    const body = await req.json()
    console.log("Updating flight:", body.id)

    const sql = neon(process.env.DATABASE_URL!)

    // Calculate duration if both tachometer values are provided
    let calculatedDuration = body.duration || 0
    if (body.tachometerStart && body.tachometerEnd) {
      calculatedDuration = body.tachometerEnd - body.tachometerStart
    }

    const durationFormatted = formatHoursToDuration(calculatedDuration)

    await sql`
      UPDATE flights 
      SET 
        status = ${body.status || "completed"},
        tachometer_start = ${body.tachometerStart || null},
        tachometer_end = ${body.tachometerEnd || null},
        duration = ${durationFormatted},
        notes = ${body.notes || null}
      WHERE flight_id = ${body.id}
    `

    console.log("Flight updated successfully:", body.id)

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error updating flight:", error)
    return NextResponse.json({ error: "Failed to update flight", details: error.message }, { status: 500 })
  }
}

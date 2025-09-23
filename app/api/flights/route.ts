import { NextResponse } from "next/server"
import { neon } from "@neondatabase/serverless"

// Helper function to generate flight IDs
function generateFlightId(): string {
  return `flight_${Math.random().toString(36).substr(2, 9)}`
}

// Helper function to convert duration format (06:54:00) to decimal hours
function parseDurationToHours(duration: string): number {
  if (!duration) return 0

  try {
    const parts = duration.split(":")
    const hours = Number.parseInt(parts[0]) || 0
    const minutes = Number.parseInt(parts[1]) || 0
    const seconds = Number.parseInt(parts[2]) || 0

    return hours + minutes / 60 + seconds / 3600
  } catch (error) {
    console.error("Error parsing duration:", duration, error)
    return 0
  }
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
      SELECT flight_id, pilot_id, copilot_id, aircraft_id, flight_time, duration, 
             status, notes, tachometer_start, tachometer_end, created_at
      FROM flights 
      ORDER BY flight_time DESC
    `

    console.log(`Fetched ${rows.length} flights from database`)

    const flights = rows.map((row: any) => {
      // Convertir duración de formato HH:MM:SS a horas decimales
      const durationHours = parseDurationToHours(row.duration)

      // Convertir tacómetro a números si existen
      const tachometerStart = row.tachometer_start !== null ? Number(row.tachometer_start) : undefined
      const tachometerEnd = row.tachometer_end !== null ? Number(row.tachometer_end) : undefined

      // Calcular horas basadas en tacómetro si ambos valores existen
      let calculatedHours = durationHours
      if (tachometerStart !== undefined && tachometerEnd !== undefined) {
        calculatedHours = tachometerEnd - tachometerStart
      }

      return {
        id: row.flight_id || generateFlightId(),
        pilotId: row.pilot_id,
        pilotId2: row.copilot_id || undefined,
        aircraftId: row.aircraft_id || "unknown",
        // Split flight_time into date and time
        date: row.flight_time ? row.flight_time.split(" ")[0] : new Date().toISOString().split("T")[0],
        time: row.flight_time ? row.flight_time.split(" ")[1] : "00:00",
        // Use calculated hours (either from duration or tachometer)
        duration: calculatedHours,
        status: (row.status || "completed") as "scheduled" | "completed" | "cancelled",
        notes: row.notes || "",
        tachometerStart,
        tachometerEnd,
        createdAt: row.created_at || new Date().toISOString(),
      }
    })

    return NextResponse.json(flights)
  } catch (error) {
    console.error("Error fetching flights:", error)
    return NextResponse.json({ error: "Failed to fetch flights" }, { status: 500 })
  }
}

export async function POST(req: Request) {
  if (!process.env.DATABASE_URL) {
    return NextResponse.json({ error: "DATABASE_URL not configured" }, { status: 400 })
  }

  try {
    const body = await req.json()
    const sql = neon(process.env.DATABASE_URL!)

    const flightId = generateFlightId()
    // Combine date and time into flight_time
    const flightTime = `${body.date} ${body.time}`
    // Convert duration from decimal hours to HH:MM:SS
    const durationFormatted = formatHoursToDuration(body.duration || 0)

    const rows = await sql`
      INSERT INTO flights (flight_id, pilot_id, copilot_id, aircraft_id, flight_time, duration, 
                          status, notes, tachometer_start, tachometer_end, created_at)
      VALUES (${flightId}, ${body.pilotId}, ${body.pilotId2 || null}, ${body.aircraftId || "unknown"}, 
              ${flightTime}, ${durationFormatted}, ${body.status || "scheduled"},
              ${body.notes || ""}, ${body.tachometerStart || null}, 
              ${body.tachometerEnd || null}, NOW())
      RETURNING flight_id, pilot_id, copilot_id, aircraft_id, flight_time, duration, 
                status, notes, tachometer_start, tachometer_end, created_at
    `

    const row = rows[0]
    const newFlight = {
      id: row.flight_id,
      pilotId: row.pilot_id,
      pilotId2: row.copilot_id || undefined,
      aircraftId: row.aircraft_id || "unknown",
      date: row.flight_time ? row.flight_time.split(" ")[0] : body.date,
      time: row.flight_time ? row.flight_time.split(" ")[1] : body.time,
      duration: parseDurationToHours(row.duration),
      status: row.status as "scheduled" | "completed" | "cancelled",
      notes: row.notes || "",
      tachometerStart: row.tachometer_start ? Number(row.tachometer_start) : undefined,
      tachometerEnd: row.tachometer_end ? Number(row.tachometer_end) : undefined,
      createdAt: row.created_at,
    }

    return NextResponse.json(newFlight)
  } catch (error) {
    console.error("Error creating flight:", error)
    return NextResponse.json({ error: "Failed to create flight" }, { status: 500 })
  }
}

export async function PUT(req: Request) {
  if (!process.env.DATABASE_URL) {
    return NextResponse.json({ error: "DATABASE_URL not configured" }, { status: 400 })
  }

  try {
    const body = await req.json()
    const sql = neon(process.env.DATABASE_URL!)

    console.log("PUT request body:", body)

    // Calculate duration if both tachometer values are provided
    let calculatedDuration = null
    if (body.tachometerEnd !== undefined && body.tachometerStart !== undefined) {
      calculatedDuration = Number(body.tachometerEnd) - Number(body.tachometerStart)
      console.log("Calculated duration:", calculatedDuration)
    }

    let updateQuery
    if (calculatedDuration !== null) {
      // Update with calculated duration (convert to HH:MM:SS format)
      const durationFormatted = formatHoursToDuration(calculatedDuration)
      updateQuery = await sql`
        UPDATE flights
        SET status = ${body.status},
            copilot_id = ${body.pilotId2 !== undefined ? body.pilotId2 : sql`copilot_id`},
            tachometer_start = ${body.tachometerStart !== undefined ? Number(body.tachometerStart) : sql`tachometer_start`},
            tachometer_end = ${body.tachometerEnd !== undefined ? Number(body.tachometerEnd) : sql`tachometer_end`},
            duration = ${durationFormatted}
        WHERE flight_id = ${body.id}
        RETURNING flight_id, pilot_id, copilot_id, aircraft_id, flight_time, duration, 
                  status, notes, tachometer_start, tachometer_end, created_at
      `
    } else {
      // Update without duration calculation
      updateQuery = await sql`
        UPDATE flights
        SET status = ${body.status},
            copilot_id = ${body.pilotId2 !== undefined ? body.pilotId2 : sql`copilot_id`},
            tachometer_start = ${body.tachometerStart !== undefined ? Number(body.tachometerStart) : sql`tachometer_start`},
            tachometer_end = ${body.tachometerEnd !== undefined ? Number(body.tachometerEnd) : sql`tachometer_end`}
        WHERE flight_id = ${body.id}
        RETURNING flight_id, pilot_id, copilot_id, aircraft_id, flight_time, duration, 
                  status, notes, tachometer_start, tachometer_end, created_at
      `
    }

    if (updateQuery.length === 0) {
      return NextResponse.json({ error: "Flight not found" }, { status: 404 })
    }

    const row = updateQuery[0]
    const updatedFlight = {
      id: row.flight_id,
      pilotId: row.pilot_id,
      pilotId2: row.copilot_id || undefined,
      aircraftId: row.aircraft_id || "unknown",
      date: row.flight_time ? row.flight_time.split(" ")[0] : new Date().toISOString().split("T")[0],
      time: row.flight_time ? row.flight_time.split(" ")[1] : "00:00",
      duration: parseDurationToHours(row.duration),
      status: row.status as "scheduled" | "completed" | "cancelled",
      notes: row.notes || "",
      tachometerStart: row.tachometer_start ? Number(row.tachometer_start) : undefined,
      tachometerEnd: row.tachometer_end ? Number(row.tachometer_end) : undefined,
      createdAt: row.created_at,
    }

    console.log("Update result:", updatedFlight)
    return NextResponse.json(updatedFlight)
  } catch (error) {
    console.error("Error updating flight:", error)
    return NextResponse.json({ error: "Failed to update flight", details: error.message }, { status: 500 })
  }
}

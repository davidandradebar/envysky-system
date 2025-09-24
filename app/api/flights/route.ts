import { NextResponse } from "next/server"
import { neon } from "@neondatabase/serverless"

function generateFlightId(): string {
  return `flight_${Math.random().toString(36).substr(2, 9)}`
}

export async function GET() {
  try {
    const sql = neon(process.env.DATABASE_URL!)
    const rows = await sql`SELECT * FROM flights ORDER BY created_at DESC`

    const flights = rows.map((row: any) => {
      let date = ""
      let time = ""
      if (row.flight_time) {
        const parts = String(row.flight_time).split(" ")
        date = parts[0] || ""
        time = parts[1] ? parts[1].substring(0, 5) : ""
      }

      return {
        id: row.flight_id || generateFlightId(),
        pilotId: row.pilot_id || "",
        pilotId2: row.copilot_id || undefined,
        aircraftId: row.aircraft_id || "",
        date,
        time,
        duration: 0,
        status: row.status || "completed",
        notes: row.notes || "",
        tachometerStart: row.tachometer_start ? Number(row.tachometer_start) : undefined,
        tachometerEnd: row.tachometer_end ? Number(row.tachometer_end) : undefined,
        createdAt: row.created_at || new Date().toISOString(),
      }
    })

    return NextResponse.json(flights)
  } catch (error) {
    console.error("Error:", error)
    return NextResponse.json({ error: "Failed to fetch flights" }, { status: 500 })
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const sql = neon(process.env.DATABASE_URL!)
    const flightId = generateFlightId()

    await sql`
      INSERT INTO flights (flight_id, pilot_id, copilot_id, aircraft_id, flight_time, duration, status, notes, tachometer_start, tachometer_end, created_at)
      VALUES (${flightId}, ${body.pilotId || ""}, ${body.pilotId2 || null}, ${body.aircraftId || ""}, 
              ${body.date + " " + body.time}, '00:00:00', ${body.status || "completed"}, ${body.notes || ""}, 
              ${body.tachometerStart || null}, ${body.tachometerEnd || null}, NOW())
    `

    const flight = {
      id: flightId,
      pilotId: body.pilotId || "",
      pilotId2: body.pilotId2 || undefined,
      aircraftId: body.aircraftId || "",
      date: body.date || "",
      time: body.time || "",
      duration: 0,
      status: body.status || "completed",
      notes: body.notes || "",
      tachometerStart: body.tachometerStart || undefined,
      tachometerEnd: body.tachometerEnd || undefined,
      createdAt: new Date().toISOString(),
    }

    return NextResponse.json(flight)
  } catch (error) {
    console.error("Error:", error)
    return NextResponse.json({ error: "Failed to create flight" }, { status: 500 })
  }
}

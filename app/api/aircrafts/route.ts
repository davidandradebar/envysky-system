import { type NextRequest, NextResponse } from "next/server"
import { neon } from "@neondatabase/serverless"

// Generate unique aircraft ID based on tail number
function generateAircraftId(): string {
  return `aircraft_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
}

export async function GET(request: NextRequest) {
  if (!process.env.DATABASE_URL) {
    return NextResponse.json({ error: "DATABASE_URL not configured" }, { status: 400 })
  }

  try {
    const sql = neon(process.env.DATABASE_URL!)
    const result = await sql`
      SELECT tail_number, model, initial_hours, maintenance_intervals, status
      FROM aircrafts 
      ORDER BY tail_number
    `

    const aircrafts = result.map((row: any) => ({
      id: row.tail_number, // Usando tail_number como ID único
      tailNumber: row.tail_number,
      model: row.model || row.tail_number, // Si model está vacío, usar tail_number
      initialHours: Number.parseFloat(row.initial_hours) || 0,
      maintenanceIntervalHours: Number.parseFloat(row.maintenance_intervals) || 100,
      status: (row.status || "active") as "active" | "maintenance",
      createdAt: new Date().toISOString(), // No hay created_at en tu tabla
    }))

    return NextResponse.json(aircrafts)
  } catch (error) {
    console.error("Error fetching aircrafts:", error)
    return NextResponse.json({ error: "Failed to fetch aircrafts" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  if (!process.env.DATABASE_URL) {
    return NextResponse.json({ error: "DATABASE_URL not configured" }, { status: 400 })
  }

  try {
    const aircraft = await request.json()
    const sql = neon(process.env.DATABASE_URL!)

    await sql`
      INSERT INTO aircrafts (tail_number, model, initial_hours, maintenance_intervals, status)
      VALUES (${aircraft.tailNumber}, ${aircraft.model}, ${aircraft.initialHours}, 
              ${aircraft.maintenanceIntervalHours}, ${aircraft.status})
      ON CONFLICT (tail_number) DO UPDATE SET
        model = EXCLUDED.model,
        initial_hours = EXCLUDED.initial_hours,
        maintenance_intervals = EXCLUDED.maintenance_intervals,
        status = EXCLUDED.status
    `

    const newAircraft = {
      ...aircraft,
      id: aircraft.tailNumber,
      createdAt: new Date().toISOString(),
    }

    return NextResponse.json(newAircraft)
  } catch (error) {
    console.error("Error saving aircraft:", error)
    return NextResponse.json({ error: "Failed to save aircraft" }, { status: 500 })
  }
}

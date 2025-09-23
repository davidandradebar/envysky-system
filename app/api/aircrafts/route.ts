import { type NextRequest, NextResponse } from "next/server"
import { neon } from "@neondatabase/serverless"

export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  if (!process.env.DATABASE_URL) {
    return NextResponse.json({ error: "DATABASE_URL not configured" }, { status: 400 })
  }

  try {
    const aircraft = await request.json()
    const sql = neon(process.env.DATABASE_URL!)
    const { id } = params

    await sql`
      UPDATE aircrafts 
      SET model = ${aircraft.model},
          initial_hours = ${aircraft.initialHours},
          maintenance_intervals = ${aircraft.maintenanceIntervalHours},
          status = ${aircraft.status}
      WHERE tail_number = ${id}
    `

    const updatedAircraft = {
      ...aircraft,
      id: id,
      createdAt: aircraft.createdAt || new Date().toISOString(),
    }

    return NextResponse.json(updatedAircraft)
  } catch (error) {
    console.error("Error updating aircraft:", error)
    return NextResponse.json({ error: "Failed to update aircraft" }, { status: 500 })
  }
}

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  if (!process.env.DATABASE_URL) {
    return NextResponse.json({ error: "DATABASE_URL not configured" }, { status: 400 })
  }

  try {
    const sql = neon(process.env.DATABASE_URL!)
    const { id } = params

    const result = await sql`
      SELECT tail_number, model, initial_hours, maintenance_intervals, status
      FROM aircrafts 
      WHERE tail_number = ${id}
    `

    if (result.length === 0) {
      return NextResponse.json({ error: "Aircraft not found" }, { status: 404 })
    }

    const row = result[0]
    const aircraft = {
      id: row.tail_number,
      tailNumber: row.tail_number,
      model: row.model || row.tail_number,
      initialHours: Number.parseFloat(row.initial_hours) || 0,
      maintenanceIntervalHours: Number.parseFloat(row.maintenance_intervals) || 100,
      status: (row.status || "active") as "active" | "maintenance",
      createdAt: new Date().toISOString(),
    }

    return NextResponse.json(aircraft)
  } catch (error) {
    console.error("Error fetching aircraft:", error)
    return NextResponse.json({ error: "Failed to fetch aircraft" }, { status: 500 })
  }
}

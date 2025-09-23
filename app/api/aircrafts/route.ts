import { NextResponse } from "next/server"
import { neon } from "@neondatabase/serverless"

export async function GET() {
  if (!process.env.DATABASE_URL) {
    return NextResponse.json({ error: "DATABASE_URL not configured" }, { status: 400 })
  }

  try {
    const sql = neon(process.env.DATABASE_URL!)
    const rows = await sql`
      SELECT 
        tail_number, 
        model, 
        initial_hours, 
        maintenance_intervals, 
        status
      FROM aircrafts 
      ORDER BY tail_number
    `

    // Map to expected format
    const aircrafts = rows.map((row: any) => ({
      id: row.tail_number, // Using tail_number as ID
      tailNumber: row.tail_number,
      model: row.model || row.tail_number, // If model is empty, use tail_number
      initialHours: Number.parseFloat(row.initial_hours) || 0,
      maintenanceIntervalHours: Number.parseFloat(row.maintenance_intervals) || 100,
      status: (row.status || "active") as "active" | "maintenance",
      createdAt: new Date().toISOString(), // Generate since it doesn't exist
    }))

    return NextResponse.json(aircrafts)
  } catch (error) {
    console.error("Error fetching aircrafts:", error)
    return NextResponse.json({ error: "Failed to fetch aircrafts" }, { status: 500 })
  }
}

export async function POST(req: Request) {
  if (!process.env.DATABASE_URL) {
    return NextResponse.json({ error: "DATABASE_URL not configured" }, { status: 400 })
  }

  try {
    const body = await req.json()
    const sql = neon(process.env.DATABASE_URL!)

    const rows = await sql`
      INSERT INTO aircrafts (
        tail_number, 
        model, 
        initial_hours, 
        maintenance_intervals, 
        status
      )
      VALUES (
        ${body.tailNumber}, 
        ${body.model || body.tailNumber}, 
        ${Number(body.initialHours) || 0}, 
        ${Number(body.maintenanceIntervalHours) || 100}, 
        ${body.status || "active"}
      )
      ON CONFLICT (tail_number) DO UPDATE SET
        model = EXCLUDED.model,
        initial_hours = EXCLUDED.initial_hours,
        maintenance_intervals = EXCLUDED.maintenance_intervals,
        status = EXCLUDED.status
      RETURNING 
        tail_number, 
        model, 
        initial_hours, 
        maintenance_intervals, 
        status
    `

    // Map to expected format
    const aircraft = {
      id: rows[0].tail_number,
      tailNumber: rows[0].tail_number,
      model: rows[0].model || rows[0].tail_number,
      initialHours: Number.parseFloat(rows[0].initial_hours) || 0,
      maintenanceIntervalHours: Number.parseFloat(rows[0].maintenance_intervals) || 100,
      status: (rows[0].status || "active") as "active" | "maintenance",
      createdAt: new Date().toISOString(),
    }

    return NextResponse.json(aircraft)
  } catch (error) {
    console.error("Error creating aircraft:", error)
    return NextResponse.json({ error: "Failed to create aircraft" }, { status: 500 })
  }
}

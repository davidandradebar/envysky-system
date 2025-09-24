import { NextResponse } from "next/server"
import { neon } from "@neondatabase/serverless"

export async function GET() {
  try {
    const sql = neon(process.env.DATABASE_URL!)
    const rows = await sql`SELECT * FROM aircrafts ORDER BY tail_number`

    const aircrafts = rows.map((row: any) => ({
      id: row.tail_number,
      tailNumber: row.tail_number,
      model: row.model || row.tail_number,
      initialHours: Number(row.initial_hours) || 0,
      maintenanceIntervalHours: Number(row.maintenace_interval) || 100,
      status: row.status || "active",
      createdAt: row.created_at || new Date().toISOString(),
    }))

    return NextResponse.json(aircrafts)
  } catch (error) {
    console.error("Error:", error)
    return NextResponse.json({ error: "Failed to fetch aircrafts" }, { status: 500 })
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const sql = neon(process.env.DATABASE_URL!)

    await sql`
      INSERT INTO aircrafts (tail_number, model, initial_hours, maintenace_interval, status, created_at)
      VALUES (${body.tailNumber}, ${body.model}, ${body.initialHours || 0}, 
              ${body.maintenanceIntervalHours || 100}, ${body.status || "active"}, NOW())
    `

    const aircraft = {
      id: body.tailNumber,
      tailNumber: body.tailNumber,
      model: body.model,
      initialHours: body.initialHours || 0,
      maintenanceIntervalHours: body.maintenanceIntervalHours || 100,
      status: body.status || "active",
      createdAt: new Date().toISOString(),
    }

    return NextResponse.json(aircraft)
  } catch (error) {
    console.error("Error:", error)
    return NextResponse.json({ error: "Failed to create aircraft" }, { status: 500 })
  }
}

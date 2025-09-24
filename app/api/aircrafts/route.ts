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
        maintenace_interval,
        status,
        created_at
      FROM aircrafts
      ORDER BY tail_number
    `

    console.log(`Fetched ${rows.length} aircrafts from database`)

    const aircrafts = rows.map((row: any) => ({
      id: row.tail_number, // Using tail_number as ID
      tailNumber: row.tail_number,
      model: row.model || row.tail_number,
      initialHours: Number.parseFloat(row.initial_hours) || 0,
      maintenanceIntervalHours: Number.parseFloat(row.maintenace_interval) || 100, // Note: typo in DB
      status: (row.status || "active") as "active" | "maintenance",
      createdAt: row.created_at || new Date().toISOString(),
    }))

    return NextResponse.json(aircrafts)
  } catch (error) {
    console.error("Error fetching aircrafts:", error)
    return NextResponse.json({ error: "Failed to fetch aircrafts", details: error.message }, { status: 500 })
  }
}

export async function POST(req: Request) {
  if (!process.env.DATABASE_URL) {
    return NextResponse.json({ error: "DATABASE_URL not configured" }, { status: 400 })
  }

  try {
    const body = await req.json()
    console.log("Creating aircraft with data:", body)

    const sql = neon(process.env.DATABASE_URL!)

    await sql`
      INSERT INTO aircrafts (
        tail_number,
        model,
        initial_hours,
        maintenace_interval,
        status,
        created_at
      )
      VALUES (
        ${body.tailNumber},
        ${body.model},
        ${body.initialHours || 0},
        ${body.maintenanceIntervalHours || 100},
        ${body.status || "active"},
        NOW()
      )
    `

    console.log("Aircraft created successfully:", body.tailNumber)

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
    console.error("Error creating aircraft:", error)
    return NextResponse.json({ error: "Failed to create aircraft", details: error.message }, { status: 500 })
  }
}

export async function PUT(req: Request) {
  if (!process.env.DATABASE_URL) {
    return NextResponse.json({ error: "DATABASE_URL not configured" }, { status: 400 })
  }

  try {
    const body = await req.json()
    console.log("Updating aircraft:", body.tailNumber)

    const sql = neon(process.env.DATABASE_URL!)

    await sql`
      UPDATE aircrafts 
      SET 
        model = ${body.model},
        initial_hours = ${body.initialHours},
        maintenace_interval = ${body.maintenanceIntervalHours},
        status = ${body.status}
      WHERE tail_number = ${body.tailNumber}
    `

    console.log("Aircraft updated successfully:", body.tailNumber)

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error updating aircraft:", error)
    return NextResponse.json({ error: "Failed to update aircraft", details: error.message }, { status: 500 })
  }
}

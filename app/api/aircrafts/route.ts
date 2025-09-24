import { type NextRequest, NextResponse } from "next/server"
import { neon } from "@neondatabase/serverless"

const sql = neon(process.env.DATABASE_URL!)

export async function GET() {
  try {
    console.log("🔍 GET /api/aircrafts - Fetching aircrafts...")

    const aircrafts = await sql`
      SELECT 
        id_flights as id,
        tail_number as "tailNumber",
        model,
        initial_hours as "initialHours",
        maintenace_interval as "maintenanceIntervalHours",
        status,
        created_at as "createdAt"
      FROM aircrafts 
      ORDER BY created_at DESC
    `

    console.log(`✅ Found ${aircrafts.length} aircrafts`)
    return NextResponse.json(aircrafts)
  } catch (error) {
    console.error("❌ Error fetching aircrafts:", error)
    return NextResponse.json({ error: "Failed to fetch aircrafts" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    console.log("📝 POST /api/aircrafts - Creating aircraft...")

    const body = await request.json()
    console.log("📋 Request body:", body)

    const { tailNumber, model, initialHours, maintenanceIntervalHours, status } = body

    if (!tailNumber || !model) {
      console.log("❌ Missing required fields")
      return NextResponse.json({ error: "Tail number and model are required" }, { status: 400 })
    }

    const aircraft = await sql`
      INSERT INTO aircrafts (tail_number, model, initial_hours, maintenace_interval, status)
      VALUES (
        ${tailNumber}, 
        ${model}, 
        ${Number(initialHours) || 0}, 
        ${Number(maintenanceIntervalHours) || 100}, 
        ${status || "active"}
      )
      RETURNING 
        id_flights as id,
        tail_number as "tailNumber",
        model,
        initial_hours as "initialHours",
        maintenace_interval as "maintenanceIntervalHours",
        status,
        created_at as "createdAt"
    `

    console.log("✅ Aircraft created:", aircraft[0])
    return NextResponse.json(aircraft[0])
  } catch (error) {
    console.error("❌ Error creating aircraft:", error)
    return NextResponse.json({ error: "Failed to create aircraft" }, { status: 500 })
  }
}

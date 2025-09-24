import { NextResponse } from "next/server"
import { neon } from "@neondatabase/serverless"

// Helper function to generate pilot_id if needed
function generatePilotId(): string {
  return `pilot_${Math.random().toString(36).substr(2, 9)}`
}

export async function GET() {
  if (!process.env.DATABASE_URL) {
    return NextResponse.json({ error: "DATABASE_URL not configured" }, { status: 400 })
  }

  try {
    const sql = neon(process.env.DATABASE_URL!)
    const rows = await sql`
      SELECT 
        pilot_id,
        full_name, 
        email, 
        phone, 
        country, 
        birth_date, 
        license_type, 
        created_at,
        COALESCE(purchases, 0) as purchases
      FROM pilots
      ORDER BY created_at DESC
    `

    console.log(`Fetched ${rows.length} pilots from database`)

    const pilots = rows.map((row: any) => ({
      id: row.pilot_id || generatePilotId(),
      fullName: row.full_name || "",
      email: row.email || "",
      phone: row.phone || "",
      country: row.country || "",
      birthDate: row.birth_date || "",
      licenseType: row.license_type || "",
      createdAt: row.created_at || new Date().toISOString(),
    }))

    return NextResponse.json(pilots)
  } catch (error) {
    console.error("Error fetching pilots:", error)
    return NextResponse.json({ error: "Failed to fetch pilots", details: error.message }, { status: 500 })
  }
}

export async function POST(req: Request) {
  if (!process.env.DATABASE_URL) {
    return NextResponse.json({ error: "DATABASE_URL not configured" }, { status: 400 })
  }

  try {
    const body = await req.json()
    console.log("Creating pilot with data:", body)

    const sql = neon(process.env.DATABASE_URL!)
    const pilotId = body.id || generatePilotId()

    // Insert pilot with correct column names
    const rows = await sql`
      INSERT INTO pilots (
        pilot_id, 
        full_name, 
        email, 
        phone, 
        country, 
        birth_date, 
        license_type,
        created_at,
        purchases
      )
      VALUES (
        ${pilotId}, 
        ${body.fullName || "Sin nombre"}, 
        ${body.email || "sin-email@example.com"}, 
        ${body.phone || null}, 
        ${body.country || null}, 
        ${body.birthDate || null}, 
        ${body.licenseType || null},
        NOW(),
        0
      )
      RETURNING 
        pilot_id,
        full_name, 
        email, 
        phone, 
        country, 
        birth_date, 
        license_type, 
        created_at,
        purchases
    `

    console.log("Pilot created successfully:", rows[0])

    const pilot = {
      id: rows[0].pilot_id,
      fullName: rows[0].full_name || "",
      email: rows[0].email || "",
      phone: rows[0].phone || "",
      country: rows[0].country || "",
      birthDate: rows[0].birth_date || "",
      licenseType: rows[0].license_type || "",
      createdAt: rows[0].created_at,
    }

    return NextResponse.json(pilot)
  } catch (error) {
    console.error("Error creating pilot:", error)
    return NextResponse.json({ error: "Failed to create pilot", details: error.message }, { status: 500 })
  }
}

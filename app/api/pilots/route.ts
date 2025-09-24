import { NextResponse } from "next/server"
import { neon } from "@neondatabase/serverless"

// NOTE: These API endpoints are optional for production use with Neon (PostgreSQL).
// They require process.env.DATABASE_URL to be set in Vercel.
// In preview (Next.js) without env, use the local mode already implemented.

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
        pilot_id as "id",
        full_name as "fullName", 
        email, 
        phone, 
        country, 
        birth_date as "birthDate", 
        license_type as "licenseType", 
        created_at as "createdAt",
        purchases
      FROM pilots
      ORDER BY created_at DESC
    `

    // Ensure all fields have default values
    const pilots = rows.map((row: any) => ({
      id: row.id || generatePilotId(),
      fullName: row.fullName || "",
      email: row.email || "",
      phone: row.phone || "",
      country: row.country || "",
      birthDate: row.birthDate || "",
      licenseType: row.licenseType || "",
      createdAt: row.createdAt || new Date().toISOString(),
      purchases: Number(row.purchases) || 0,
    }))

    return NextResponse.json(pilots)
  } catch (error) {
    console.error("Error fetching pilots:", error)
    return NextResponse.json({ error: "Failed to fetch pilots" }, { status: 500 })
  }
}

export async function POST(req: Request) {
  if (!process.env.DATABASE_URL) {
    return NextResponse.json({ error: "DATABASE_URL not configured" }, { status: 400 })
  }

  try {
    const body = await req.json()
    const sql = neon(process.env.DATABASE_URL!)

    // Generate pilot_id if not provided
    const pilotId = body.id || generatePilotId()

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
        ${body.fullName || ""}, 
        ${body.email || ""}, 
        ${body.phone || ""}, 
        ${body.country || ""}, 
        ${body.birthDate || ""}, 
        ${body.licenseType || ""}, 
        NOW(),
        ${Number(body.purchases) || 0}
      )
      RETURNING 
        pilot_id as "id",
        full_name as "fullName", 
        email, 
        phone, 
        country, 
        birth_date as "birthDate", 
        license_type as "licenseType", 
        created_at as "createdAt",
        purchases
    `

    const pilot = {
      id: rows[0].id,
      fullName: rows[0].fullName || "",
      email: rows[0].email || "",
      phone: rows[0].phone || "",
      country: rows[0].country || "",
      birthDate: rows[0].birthDate || "",
      licenseType: rows[0].licenseType || "",
      createdAt: rows[0].createdAt,
      purchases: Number(rows[0].purchases) || 0,
    }

    return NextResponse.json(pilot)
  } catch (error) {
    console.error("Error saving pilot:", error)
    return NextResponse.json({ error: "Failed to save pilot" }, { status: 500 })
  }
}

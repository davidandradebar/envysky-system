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

    // Primero asegurar que la tabla existe
    await sql`
      CREATE TABLE IF NOT EXISTS pilots (
        pilot_id VARCHAR(255) PRIMARY KEY,
        full_name VARCHAR(255) NOT NULL,
        email VARCHAR(255) NOT NULL,
        phone VARCHAR(255),
        country VARCHAR(255),
        birth_date VARCHAR(255),
        license_type VARCHAR(255),
        created_at TIMESTAMP DEFAULT NOW(),
        purchases DECIMAL(10,2) DEFAULT 0
      )
    `

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
    console.log("🚀 Creating pilot:", body.fullName, body.email)

    const sql = neon(process.env.DATABASE_URL!)

    // Asegurar que la tabla existe antes de insertar
    await sql`
      CREATE TABLE IF NOT EXISTS pilots (
        pilot_id VARCHAR(255) PRIMARY KEY,
        full_name VARCHAR(255) NOT NULL,
        email VARCHAR(255) NOT NULL,
        phone VARCHAR(255),
        country VARCHAR(255),
        birth_date VARCHAR(255),
        license_type VARCHAR(255),
        created_at TIMESTAMP DEFAULT NOW(),
        purchases DECIMAL(10,2) DEFAULT 0
      )
    `

    const pilotId = body.id || generatePilotId()
    console.log("🆔 Using pilot ID:", pilotId)

    // Inserción simple sin complicaciones
    const rows = await sql`
      INSERT INTO pilots (
        pilot_id, 
        full_name, 
        email, 
        phone, 
        country, 
        birth_date, 
        license_type, 
        purchases
      )
      VALUES (
        ${pilotId}, 
        ${body.fullName || "Sin nombre"}, 
        ${body.email || "sin-email@example.com"}, 
        ${body.phone || ""}, 
        ${body.country || ""}, 
        ${body.birthDate || ""}, 
        ${body.licenseType || ""}, 
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

    console.log("✅ Pilot created successfully:", rows[0].fullName)

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
    console.error("❌ Error creating pilot:", error)
    console.error("❌ Error message:", error.message)
    return NextResponse.json(
      {
        error: "Failed to create pilot",
        details: error.message,
        received_data: req.body,
      },
      { status: 500 },
    )
  }
}

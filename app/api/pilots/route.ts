import { NextResponse } from "next/server"
import { neon } from "@neondatabase/serverless"

function generatePilotId(): string {
  return `pilot_${Math.random().toString(36).substr(2, 9)}`
}

export async function GET() {
  try {
    const sql = neon(process.env.DATABASE_URL!)
    const rows = await sql`SELECT * FROM pilots ORDER BY created_at DESC`

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
    console.error("Error:", error)
    return NextResponse.json({ error: "Failed to fetch pilots" }, { status: 500 })
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const sql = neon(process.env.DATABASE_URL!)
    const pilotId = generatePilotId()

    await sql`
      INSERT INTO pilots (pilot_id, full_name, email, phone, country, birth_date, license_type, created_at, purchases)
      VALUES (${pilotId}, ${body.fullName || ""}, ${body.email || ""}, ${body.phone || null}, 
              ${body.country || null}, ${body.birthDate || null}, ${body.licenseType || null}, NOW(), 0)
    `

    const pilot = {
      id: pilotId,
      fullName: body.fullName || "",
      email: body.email || "",
      phone: body.phone || "",
      country: body.country || "",
      birthDate: body.birthDate || "",
      licenseType: body.licenseType || "",
      createdAt: new Date().toISOString(),
    }

    return NextResponse.json(pilot)
  } catch (error) {
    console.error("Error:", error)
    return NextResponse.json({ error: "Failed to create pilot" }, { status: 500 })
  }
}

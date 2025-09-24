import { type NextRequest, NextResponse } from "next/server"
import { neon } from "@neondatabase/serverless"

const sql = neon(process.env.DATABASE_URL!)

export async function GET() {
  try {
    console.log("🔍 GET /api/pilots - Fetching pilots...")

    const pilots = await sql`
      SELECT 
        pilot_id as id,
        full_name as "fullName",
        email,
        phone,
        country,
        birth_date as "birthDate", 
        license_type as "licenseType",
        created_at as "createdAt"
      FROM pilots 
      ORDER BY created_at DESC
    `

    console.log(`✅ Found ${pilots.length} pilots`)
    return NextResponse.json(pilots)
  } catch (error) {
    console.error("❌ Error fetching pilots:", error)
    return NextResponse.json({ error: "Failed to fetch pilots" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    console.log("📝 POST /api/pilots - Creating pilot...")

    const body = await request.json()
    console.log("📋 Request body:", body)

    const { pilotEmail, fullName, phone, country, birthDate, licenseType, hours, date } = body

    if (!pilotEmail || !fullName) {
      console.log("❌ Missing required fields")
      return NextResponse.json({ error: "Email and full name are required" }, { status: 400 })
    }

    // Check if pilot exists
    console.log("🔍 Checking if pilot exists...")
    const existingPilot = await sql`
      SELECT pilot_id as id FROM pilots WHERE email = ${pilotEmail}
    `

    let pilotId: string

    if (existingPilot.length > 0) {
      pilotId = existingPilot[0].id
      console.log(`✅ Pilot exists with ID: ${pilotId}`)
    } else {
      // Create new pilot
      console.log("👤 Creating new pilot...")
      const newPilot = await sql`
        INSERT INTO pilots (full_name, email, phone, country, birth_date, license_type)
        VALUES (${fullName}, ${pilotEmail}, ${phone || null}, ${country || null}, ${birthDate || null}, ${licenseType || null})
        RETURNING pilot_id as id
      `
      pilotId = newPilot[0].id
      console.log(`✅ Created new pilot with ID: ${pilotId}`)
    }

    // Create purchase if hours provided
    if (hours && Number(hours) > 0) {
      console.log(`💰 Creating purchase: ${hours} hours`)
      await sql`
        INSERT INTO purchases (pilot_id, hours, date)
        VALUES (${pilotId}, ${Number(hours)}, ${date || new Date().toISOString().split("T")[0]})
      `
      console.log("✅ Purchase created")
    }

    return NextResponse.json({ success: true, pilotId })
  } catch (error) {
    console.error("❌ Error creating pilot:", error)
    return NextResponse.json({ error: "Failed to create pilot" }, { status: 500 })
  }
}

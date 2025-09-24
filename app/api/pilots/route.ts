import { type NextRequest, NextResponse } from "next/server"
import { neon } from "@neondatabase/serverless"

const sql = neon(process.env.DATABASE_URL!)

function generatePilotId(): string {
  return `pilot_${Math.random().toString(36).substr(2, 9)}`
}

export async function GET() {
  try {
    console.log("🔍 GET /api/pilots - Fetching pilots...")

    const pilots = await sql`
      SELECT pilot_id as id, full_name as "fullName", email, phone, country, birth_date as "birthDate", license_type as "licenseType", created_at as "createdAt"
      FROM pilots 
      ORDER BY created_at DESC
    `

    console.log("✅ Pilots fetched:", pilots.length)
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
    console.log("📦 Request body:", body)

    const { fullName, email, phone, country, birthDate, licenseType, hours } = body

    if (!fullName || !email) {
      console.log("❌ Missing required fields")
      return NextResponse.json({ error: "Name and email are required" }, { status: 400 })
    }

    // Check if pilot exists
    const existingPilot = await sql`
      SELECT pilot_id FROM pilots WHERE email = ${email}
    `

    let pilotId: string

    if (existingPilot.length > 0) {
      pilotId = existingPilot[0].pilot_id
      console.log("👤 Pilot exists with ID:", pilotId)
    } else {
      // Create new pilot
      const newPilot = await sql`
        INSERT INTO pilots (full_name, email, phone, country, birth_date, license_type, purchases)
        VALUES (${fullName}, ${email}, ${phone || ""}, ${country || ""}, ${birthDate || null}, ${licenseType || ""}, ${Number(hours) || 0})
        RETURNING pilot_id
      `
      pilotId = newPilot[0].pilot_id
      console.log("✅ New pilot created with ID:", pilotId)
    }

    // Add purchase if hours provided
    if (hours && Number(hours) > 0) {
      await sql`
        INSERT INTO purchases (pilot_id, hours, date)
        VALUES (${pilotId}, ${Number(hours)}, ${new Date().toISOString().split("T")[0]})
      `
      console.log("💰 Purchase added:", Number(hours), "hours")
    }

    return NextResponse.json({ success: true, pilotId })
  } catch (error) {
    console.error("❌ Error creating pilot:", error)
    return NextResponse.json({ error: "Failed to create pilot" }, { status: 500 })
  }
}

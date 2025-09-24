import { type NextRequest, NextResponse } from "next/server"
import { neon } from "@neondatabase/serverless"

const sql = neon(process.env.DATABASE_URL!)

export async function GET() {
  try {
    console.log("🔍 GET /api/purchases - Fetching purchases...")

    const purchases = await sql`
      SELECT purchase_id as id, pilot_id as "pilotId", hours, date, created_at as "createdAt"
      FROM purchases 
      ORDER BY created_at DESC
    `

    console.log("✅ Purchases fetched:", purchases.length)
    return NextResponse.json(purchases)
  } catch (error) {
    console.error("❌ Error fetching purchases:", error)
    return NextResponse.json({ error: "Failed to fetch purchases" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    console.log("📝 POST /api/purchases - Creating purchase...")

    const body = await request.json()
    console.log("📦 Request body:", body)

    const { pilotEmail, hours, fullName, phone, country, birthDate, licenseType } = body

    if (!pilotEmail || !hours) {
      return NextResponse.json({ error: "Pilot email and hours are required" }, { status: 400 })
    }

    // Find or create pilot
    const pilot = await sql`
      SELECT pilot_id FROM pilots WHERE email = ${pilotEmail}
    `

    let pilotId: string

    if (pilot.length === 0) {
      // Create new pilot
      const newPilot = await sql`
        INSERT INTO pilots (full_name, email, phone, country, birth_date, license_type, purchases)
        VALUES (${fullName || "Unknown"}, ${pilotEmail}, ${phone || ""}, ${country || ""}, ${birthDate || null}, ${licenseType || ""}, ${Number(hours)})
        RETURNING pilot_id
      `
      pilotId = newPilot[0].pilot_id
      console.log("✅ New pilot created:", pilotId)
    } else {
      pilotId = pilot[0].pilot_id
      console.log("👤 Using existing pilot:", pilotId)
    }

    // Create purchase
    const purchase = await sql`
      INSERT INTO purchases (pilot_id, hours, date)
      VALUES (${pilotId}, ${Number(hours)}, ${new Date().toISOString().split("T")[0]})
      RETURNING purchase_id as id, pilot_id as "pilotId", hours, date, created_at as "createdAt"
    `

    console.log("✅ Purchase created:", purchase[0])
    return NextResponse.json(purchase[0])
  } catch (error) {
    console.error("❌ Error creating purchase:", error)
    return NextResponse.json({ error: "Failed to create purchase" }, { status: 500 })
  }
}

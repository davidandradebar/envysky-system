import { type NextRequest, NextResponse } from "next/server"
import { neon } from "@neondatabase/serverless"

const sql = neon(process.env.DATABASE_URL!)

export async function GET() {
  try {
    console.log("🔍 GET /api/purchases - Fetching purchases...")

    const purchases = await sql`
      SELECT 
        purchase_id as id,
        pilot_id as "pilotId",
        hours,
        date,
        created_at as "createdAt"
      FROM purchases 
      ORDER BY created_at DESC
    `

    console.log(`✅ Found ${purchases.length} purchases`)
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
    console.log("📋 Request body:", body)

    const { pilotId, hours, date } = body

    if (!pilotId || !hours) {
      console.log("❌ Missing required fields")
      return NextResponse.json({ error: "Pilot ID and hours are required" }, { status: 400 })
    }

    const purchase = await sql`
      INSERT INTO purchases (pilot_id, hours, date)
      VALUES (${pilotId}, ${Number(hours)}, ${date || new Date().toISOString().split("T")[0]})
      RETURNING purchase_id as id, pilot_id as "pilotId", hours, date, created_at as "createdAt"
    `

    console.log("✅ Purchase created:", purchase[0])
    return NextResponse.json(purchase[0])
  } catch (error) {
    console.error("❌ Error creating purchase:", error)
    return NextResponse.json({ error: "Failed to create purchase" }, { status: 500 })
  }
}

import { NextResponse } from "next/server"
import { neon } from "@neondatabase/serverless"

function generatePurchaseId(): string {
  return `purchase_${Math.random().toString(36).substr(2, 9)}`
}

export async function GET() {
  try {
    const sql = neon(process.env.DATABASE_URL!)
    const rows = await sql`SELECT * FROM purchases ORDER BY created_at DESC`

    const purchases = rows.map((row: any) => ({
      id: row.purchase_id || generatePurchaseId(),
      pilotId: row.pilot_id || "",
      hours: Number(row.hours) || 0,
      date: row.date || "",
      createdAt: row.created_at || new Date().toISOString(),
    }))

    return NextResponse.json(purchases)
  } catch (error) {
    console.error("Error:", error)
    return NextResponse.json({ error: "Failed to fetch purchases" }, { status: 500 })
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const sql = neon(process.env.DATABASE_URL!)
    const purchaseId = generatePurchaseId()

    await sql`
      INSERT INTO purchases (purchase_id, pilot_id, hours, date, created_at, pilot)
      VALUES (${purchaseId}, ${body.pilotId || ""}, ${body.hours || 0}, 
              ${body.date || new Date().toISOString().split("T")[0]}, NOW(), ${body.pilotName || ""})
    `

    const purchase = {
      id: purchaseId,
      pilotId: body.pilotId || "",
      hours: Number(body.hours) || 0,
      date: body.date || "",
      createdAt: new Date().toISOString(),
    }

    return NextResponse.json(purchase)
  } catch (error) {
    console.error("Error:", error)
    return NextResponse.json({ error: "Failed to create purchase" }, { status: 500 })
  }
}

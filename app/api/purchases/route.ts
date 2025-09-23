import { NextResponse } from "next/server"
import { neon } from "@neondatabase/serverless"

// Helper function to generate purchase IDs
function generatePurchaseId(): string {
  return `purchase_${Math.random().toString(36).substr(2, 9)}`
}

export async function GET() {
  if (!process.env.DATABASE_URL) {
    return NextResponse.json({ error: "DATABASE_URL not configured" }, { status: 400 })
  }

  try {
    const sql = neon(process.env.DATABASE_URL!)

    const rows = await sql`
      SELECT 
        purchase_id as "id",
        pilot_id as "pilotId", 
        hours, 
        date, 
        created_at as "createdAt",
        pilot,
        id as "originalId"
      FROM purchases
      ORDER BY created_at DESC
    `

    // Map the results to handle your specific structure
    const purchases = rows.map((row: any) => ({
      id: row.id || row.originalId || generatePurchaseId(),
      pilotId: row.pilotId,
      hours: Number.parseFloat(row.hours) || 0,
      date: row.date || row.createdAt,
      createdAt: row.createdAt || new Date().toISOString(),
      pilot: row.pilot || "", // Additional field from your structure
    }))

    return NextResponse.json(purchases)
  } catch (error) {
    console.error("Error fetching purchases:", error)
    return NextResponse.json({ error: "Failed to fetch purchases" }, { status: 500 })
  }
}

export async function POST(req: Request) {
  if (!process.env.DATABASE_URL) {
    return NextResponse.json({ error: "DATABASE_URL not configured" }, { status: 400 })
  }

  try {
    const sql = neon(process.env.DATABASE_URL!)
    const body = await req.json()

    // Ensure pilot exists (by email) - adapted for your structure
    let pilotId = body.pilotId as string | null
    let pilotName = body.fullName || "Sin nombre"

    if (!pilotId && body.pilotEmail) {
      // Check if pilot exists using pilot_id field
      const pilots = await sql`
        SELECT pilot_id, full_name 
        FROM pilots 
        WHERE email = ${body.pilotEmail} 
        LIMIT 1
      `

      if (pilots.length === 0) {
        // Create new pilot with your structure
        const newPilotId = `pilot_${Math.random().toString(36).substr(2, 9)}`
        const inserted = await sql`
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
            ${newPilotId}, 
            ${body.fullName || "Sin nombre"}, 
            ${body.pilotEmail}, 
            ${body.phone || ""}, 
            ${body.country || ""}, 
            ${body.birthDate || null}, 
            ${body.licenseType || ""}, 
            NOW(),
            0
          )
          RETURNING pilot_id, full_name
        `
        pilotId = inserted[0].pilot_id as string
        pilotName = inserted[0].full_name
      } else {
        pilotId = pilots[0].pilot_id as string
        pilotName = pilots[0].full_name
      }
    }

    // Create purchase with your structure
    const purchaseId = generatePurchaseId()
    const rows = await sql`
      INSERT INTO purchases (
        purchase_id,
        pilot_id, 
        hours, 
        date, 
        created_at,
        pilot,
        id
      )
      VALUES (
        ${purchaseId},
        ${pilotId || body.pilotId}, 
        ${body.hours}, 
        ${body.date},
        NOW(),
        ${pilotName},
        ${purchaseId}
      )
      RETURNING 
        purchase_id as "id",
        pilot_id as "pilotId", 
        hours, 
        date, 
        created_at as "createdAt",
        pilot
    `

    // Update pilot's total purchased hours
    await sql`
      UPDATE pilots 
      SET purchases = COALESCE(purchases, 0) + ${body.hours}
      WHERE pilot_id = ${pilotId || body.pilotId}
    `

    return NextResponse.json(rows[0])
  } catch (error) {
    console.error("Error creating purchase:", error)
    return NextResponse.json({ error: "Failed to create purchase" }, { status: 500 })
  }
}

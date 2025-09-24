import { NextResponse } from "next/server"
import { neon } from "@neondatabase/serverless"

// Helper function to generate purchase_id
function generatePurchaseId(): string {
  return `purchase_${Math.random().toString(36).substr(2, 9)}`
}

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
        purchase_id,
        pilot_id,
        hours,
        date,
        created_at,
        pilot
      FROM purchases
      ORDER BY date DESC
    `

    console.log(`Fetched ${rows.length} purchases from database`)

    const purchases = rows.map((row: any) => ({
      id: row.purchase_id || row.id || generatePurchaseId(),
      pilotId: row.pilot_id,
      hours: Number.parseFloat(row.hours) || 0,
      date: row.date,
      createdAt: row.created_at || new Date().toISOString(),
    }))

    return NextResponse.json(purchases)
  } catch (error) {
    console.error("Error fetching purchases:", error)
    return NextResponse.json({ error: "Failed to fetch purchases", details: error.message }, { status: 500 })
  }
}

export async function POST(req: Request) {
  if (!process.env.DATABASE_URL) {
    return NextResponse.json({ error: "DATABASE_URL not configured" }, { status: 400 })
  }

  try {
    const body = await req.json()
    console.log("Creating purchase with data:", body)

    const sql = neon(process.env.DATABASE_URL!)

    // Check if pilot exists by email
    const pilotRows = await sql`
      SELECT pilot_id, full_name FROM pilots WHERE email = ${body.pilotEmail}
    `

    let pilotId: string
    let pilotName: string

    if (pilotRows.length === 0) {
      // Create new pilot
      console.log("Pilot doesn't exist, creating new pilot")
      pilotId = generatePilotId()
      pilotName = body.fullName || "Sin nombre"

      await sql`
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
          ${pilotName}, 
          ${body.pilotEmail}, 
          ${body.phone || null}, 
          ${body.country || null}, 
          ${body.birthDate || null}, 
          ${body.licenseType || null},
          NOW(),
          ${body.hours}
        )
      `
    } else {
      // Use existing pilot
      pilotId = pilotRows[0].pilot_id
      pilotName = pilotRows[0].full_name

      // Update pilot's total purchases
      await sql`
        UPDATE pilots 
        SET purchases = COALESCE(purchases, 0) + ${body.hours}
        WHERE pilot_id = ${pilotId}
      `
    }

    // Create purchase record
    const purchaseId = generatePurchaseId()

    const purchaseRows = await sql`
      INSERT INTO purchases (
        purchase_id,
        pilot_id,
        hours,
        date,
        created_at,
        pilot
      )
      VALUES (
        ${purchaseId},
        ${pilotId},
        ${body.hours},
        ${body.date},
        NOW(),
        ${pilotName}
      )
      RETURNING 
        purchase_id,
        pilot_id,
        hours,
        date,
        created_at
    `

    console.log("Purchase created successfully:", purchaseRows[0])

    const purchase = {
      id: purchaseRows[0].purchase_id,
      pilotId: purchaseRows[0].pilot_id,
      hours: Number.parseFloat(purchaseRows[0].hours),
      date: purchaseRows[0].date,
      createdAt: purchaseRows[0].created_at,
    }

    return NextResponse.json(purchase)
  } catch (error) {
    console.error("Error creating purchase:", error)
    return NextResponse.json({ error: "Failed to create purchase", details: error.message }, { status: 500 })
  }
}

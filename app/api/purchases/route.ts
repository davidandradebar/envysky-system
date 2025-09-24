import { NextResponse } from "next/server"
import { neon } from "@neondatabase/serverless"

// Helper function to generate purchase_id if needed
function generatePurchaseId(): string {
  return `purchase_${Math.random().toString(36).substr(2, 9)}`
}

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
      ORDER BY created_at DESC
    `

    console.log(`Fetched ${rows.length} purchases from database`)

    const purchases = rows.map((row: any) => ({
      id: row.purchase_id || generatePurchaseId(),
      pilotId: row.pilot_id || "",
      hours: Number.parseFloat(row.hours) || 0,
      date: row.date || "",
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
    let pilot = null
    if (body.pilotEmail) {
      const pilotRows = await sql`
        SELECT pilot_id, full_name, email FROM pilots WHERE email = ${body.pilotEmail}
      `
      pilot = pilotRows[0] || null
    }

    // If pilot doesn't exist, create one
    if (!pilot && body.pilotEmail) {
      const newPilotId = generatePilotId()
      console.log("Creating new pilot:", body.fullName, body.pilotEmail)

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
          ${newPilotId}, 
          ${body.fullName || "Sin nombre"}, 
          ${body.pilotEmail}, 
          ${body.phone || null}, 
          ${body.country || null}, 
          ${body.birthDate || null}, 
          ${body.licenseType || null},
          NOW(),
          0
        )
      `

      pilot = {
        pilot_id: newPilotId,
        full_name: body.fullName || "Sin nombre",
        email: body.pilotEmail,
      }
    }

    if (!pilot) {
      return NextResponse.json({ error: "Could not find or create pilot" }, { status: 400 })
    }

    // Create the purchase
    const purchaseId = generatePurchaseId()
    const hours = Number.parseFloat(body.hours) || 0
    const date = body.date || new Date().toISOString().split("T")[0]

    await sql`
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
        ${pilot.pilot_id},
        ${hours},
        ${date},
        NOW(),
        ${pilot.full_name}
      )
    `

    // Update pilot's total purchases
    await sql`
      UPDATE pilots 
      SET purchases = COALESCE(purchases, 0) + ${hours}
      WHERE pilot_id = ${pilot.pilot_id}
    `

    console.log("Purchase created successfully:", purchaseId)

    const purchase = {
      id: purchaseId,
      pilotId: pilot.pilot_id,
      hours: hours,
      date: date,
      createdAt: new Date().toISOString(),
    }

    return NextResponse.json(purchase)
  } catch (error) {
    console.error("Error creating purchase:", error)
    return NextResponse.json({ error: "Failed to create purchase", details: error.message }, { status: 500 })
  }
}

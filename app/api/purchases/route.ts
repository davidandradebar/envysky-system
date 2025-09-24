import { NextResponse } from "next/server"
import { neon } from "@neondatabase/serverless"

export async function GET() {
  if (!process.env.DATABASE_URL) return NextResponse.json({ error: "DATABASE_URL not configured" }, { status: 400 })
  const sql = neon(process.env.DATABASE_URL!)
  const rows = await sql`
    SELECT id, pilot_id as "pilotId", hours, date, created_at as "createdAt"
    FROM purchases
    ORDER BY created_at DESC
  `
  return NextResponse.json(rows)
}

export async function POST(req: Request) {
  if (!process.env.DATABASE_URL) return NextResponse.json({ error: "DATABASE_URL not configured" }, { status: 400 })
  const sql = neon(process.env.DATABASE_URL!)
  const body = await req.json()

  console.log("💾 [API] Creating purchase with data:", body)

  // ensure pilot exists (by email)
  let pilotId = body.pilotId as string | null
  if (!pilotId && body.pilotEmail) {
    console.log("🔍 [API] Looking for pilot with email:", body.pilotEmail)
    const pilots = await sql`SELECT id FROM pilots WHERE email = ${body.pilotEmail} LIMIT 1`
    if (pilots.length === 0) {
      console.log("👤 [API] Creating new pilot")
      const inserted = await sql`
        INSERT INTO pilots (full_name, email, phone, country, birth_date, license_type)
        VALUES (${body.fullName || "Sin nombre"}, ${body.pilotEmail}, ${body.phone || ""}, ${body.country || ""}, ${body.birthDate || null}, ${body.licenseType || ""})
        RETURNING id
      `
      pilotId = inserted[0].id as string
      console.log("✅ [API] New pilot created with ID:", pilotId)
    } else {
      pilotId = pilots[0].id as string
      console.log("✅ [API] Using existing pilot with ID:", pilotId)
    }
  }

  console.log("💰 [API] Creating purchase for pilot:", pilotId, "hours:", body.hours)

  const rows = await sql`
    INSERT INTO purchases (pilot_id, hours, date)
    VALUES (${pilotId || body.pilotId}, ${body.hours}, ${body.date})
    RETURNING id, pilot_id as "pilotId", hours, date, created_at as "createdAt"
  `

  console.log("✅ [API] Purchase created successfully:", rows[0])
  return NextResponse.json(rows[0])
}

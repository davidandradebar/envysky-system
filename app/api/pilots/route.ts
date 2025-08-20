import { NextResponse } from "next/server"
import { neon } from "@neondatabase/serverless"

export async function GET() {
  if (!process.env.DATABASE_URL) {
    return NextResponse.json({ error: "DATABASE_URL not configured" }, { status: 400 })
  }
  const sql = neon(process.env.DATABASE_URL!)
  const rows = await sql`
    SELECT id, full_name as "fullName", email, phone, country, birth_date as "birthDate", license_type as "licenseType", created_at as "createdAt"
    FROM pilots
    ORDER BY created_at DESC
  `
  return NextResponse.json(rows)
}

export async function POST(req: Request) {
  if (!process.env.DATABASE_URL) {
    return NextResponse.json({ error: "DATABASE_URL not configured" }, { status: 400 })
  }
  const body = await req.json()
  const sql = neon(process.env.DATABASE_URL!)
  const rows = await sql`
    INSERT INTO pilots (full_name, email, phone, country, birth_date, license_type)
    VALUES (, , , , , )
    ON CONFLICT (email) DO UPDATE SET
      full_name = EXCLUDED.full_name,
      phone = EXCLUDED.phone,
      country = EXCLUDED.country,
      birth_date = EXCLUDED.birth_date,
      license_type = EXCLUDED.license_type
    RETURNING id, full_name as "fullName", email, phone, country, birth_date as "birthDate", license_type as "licenseType", created_at as "createdAt"
  `
  return NextResponse.json(rows[0])
}

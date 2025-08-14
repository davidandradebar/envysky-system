import { NextResponse } from "next/server"
import { neon } from "@neondatabase/serverless"

export async function GET() {
  if (!process.env.DATABASE_URL) return NextResponse.json({ error: "DATABASE_URL not configured" }, { status: 400 })
  const sql = neon(process.env.DATABASE_URL!)
  const rows = await sql`
    SELECT id, tail_number as "tailNumber", model, initial_hours as "initialHours",
           maintenance_interval_hours as "maintenanceIntervalHours", status, created_at as "createdAt"
    FROM aircrafts
    ORDER BY created_at DESC
  `
  return NextResponse.json(rows)
}

export async function POST(req: Request) {
  if (!process.env.DATABASE_URL) return NextResponse.json({ error: "DATABASE_URL not configured" }, { status: 400 })
  const body = await req.json()
  const sql = neon(process.env.DATABASE_URL!)
  const rows = await sql`
    INSERT INTO aircrafts (tail_number, model, initial_hours, maintenance_interval_hours, status)
    VALUES (${body.tailNumber}, ${body.model}, ${body.initialHours}, ${body.maintenanceIntervalHours}, ${body.status})
    RETURNING id, tail_number as "tailNumber", model, initial_hours as "initialHours",
              maintenance_interval_hours as "maintenanceIntervalHours", status, created_at as "createdAt"
  `
  return NextResponse.json(rows[0])
}

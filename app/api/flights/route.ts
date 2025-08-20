import { NextResponse } from "next/server"
import { neon } from "@neondatabase/serverless"

export async function GET() {
  if (!process.env.DATABASE_URL) return NextResponse.json({ error: "DATABASE_URL not configured" }, { status: 400 })
  const sql = neon(process.env.DATABASE_URL!)
  const rows = await sql
    SELECT id, pilot_id as "pilotId", aircraft_id as "aircraftId", date, time, duration, status, notes, created_at as "createdAt"
    FROM flights
    ORDER BY date DESC, time DESC
  
  return NextResponse.json(rows)
}

export async function POST(req: Request) {
  if (!process.env.DATABASE_URL) return NextResponse.json({ error: "DATABASE_URL not configured" }, { status: 400 })
  const body = await req.json()
  const sql = neon(process.env.DATABASE_URL!)
  const rows = await sql
    INSERT INTO flights (pilot_id, aircraft_id, date, time, duration, status, notes)
    VALUES (, , , , , , )
    RETURNING id, pilot_id as "pilotId", aircraft_id as "aircraftId", date, time, duration, status, notes, created_at as "createdAt"
  
  return NextResponse.json(rows[0])
}

export async function PUT(req: Request) {
  if (!process.env.DATABASE_URL) return NextResponse.json({ error: "DATABASE_URL not configured" }, { status: 400 })
  const body = await req.json()
  const sql = neon(process.env.DATABASE_URL!)
  const rows = await sql
    UPDATE flights
    SET status = 
    WHERE id = 
    RETURNING id, pilot_id as "pilotId", aircraft_id as "aircraftId", date, time, duration, status, notes, created_at as "createdAt"
  
  return NextResponse.json(rows[0])
}

import { NextResponse } from "next/server"
import { neon } from "@neondatabase/serverless"

export async function GET() {
  if (!process.env.DATABASE_URL) return NextResponse.json({ error: "DATABASE_URL not configured" }, { status: 400 })

  try {
    const sql = neon(process.env.DATABASE_URL!)

    // Check if pilot_id_2 and tachometer columns exist
    const columnCheck = await sql`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'flights' AND column_name IN ('pilot_id_2', 'tachometer_start', 'tachometer_end')
    `

    const hasPilotId2 = columnCheck.some((col) => col.column_name === "pilot_id_2")
    const hasTachometer =
      columnCheck.filter((col) => col.column_name === "tachometer_start" || col.column_name === "tachometer_end")
        .length === 2

    let rows
    if (hasPilotId2 && hasTachometer) {
      // New query with pilot_id_2 and tachometer fields
      rows = await sql`
        SELECT id, pilot_id as "pilotId", pilot_id_2 as "pilotId2", aircraft_id as "aircraftId", 
               date, time, duration, tachometer_start as "tachometerStart", tachometer_end as "tachometerEnd",
               status, notes, created_at as "createdAt"
        FROM flights
        ORDER BY date DESC, time DESC
      `
    } else if (hasPilotId2 && !hasTachometer) {
      // Query with pilot_id_2 but without tachometer
      rows = await sql`
        SELECT id, pilot_id as "pilotId", pilot_id_2 as "pilotId2", aircraft_id as "aircraftId", 
               date, time, duration, status, notes, created_at as "createdAt"
        FROM flights
        ORDER BY date DESC, time DESC
      `
      // Add tachometer fields as undefined for compatibility
      rows = rows.map((row) => ({
        ...row,
        tachometerStart: undefined,
        tachometerEnd: undefined,
      }))
    } else if (!hasPilotId2 && hasTachometer) {
      // Query without pilot_id_2 but with tachometer
      rows = await sql`
        SELECT id, pilot_id as "pilotId", aircraft_id as "aircraftId", 
               date, time, duration, tachometer_start as "tachometerStart", tachometer_end as "tachometerEnd",
               status, notes, created_at as "createdAt"
        FROM flights
        ORDER BY date DESC, time DESC
      `
      // Add pilotId2 as null for compatibility
      rows = rows.map((row) => ({ ...row, pilotId2: null }))
    } else {
      // Legacy query without pilot_id_2 and tachometer
      rows = await sql`
        SELECT id, pilot_id as "pilotId", aircraft_id as "aircraftId", 
               date, time, duration, status, notes, created_at as "createdAt"
        FROM flights
        ORDER BY date DESC, time DESC
      `
      // Add pilotId2 and tachometer fields as null/undefined for compatibility
      rows = rows.map((row) => ({
        ...row,
        pilotId2: null,
        tachometerStart: undefined,
        tachometerEnd: undefined,
      }))
    }

    return NextResponse.json(rows)
  } catch (error) {
    console.error("Error fetching flights:", error)
    return NextResponse.json({ error: "Failed to fetch flights" }, { status: 500 })
  }
}

export async function POST(req: Request) {
  if (!process.env.DATABASE_URL) return NextResponse.json({ error: "DATABASE_URL not configured" }, { status: 400 })

  try {
    const body = await req.json()
    const sql = neon(process.env.DATABASE_URL!)

    // Check if pilot_id_2 and tachometer columns exist
    const columnCheck = await sql`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'flights' AND column_name IN ('pilot_id_2', 'tachometer_start', 'tachometer_end')
    `

    const hasPilotId2 = columnCheck.some((col) => col.column_name === "pilot_id_2")
    const hasTachometer =
      columnCheck.filter((col) => col.column_name === "tachometer_start" || col.column_name === "tachometer_end")
        .length === 2

    let rows
    if (hasPilotId2 && hasTachometer) {
      // Insert with pilot_id_2 and tachometer fields
      rows = await sql`
        INSERT INTO flights (pilot_id, pilot_id_2, aircraft_id, date, time, duration, tachometer_start, tachometer_end, status, notes)
        VALUES (${body.pilotId}, ${body.pilotId2 || null}, ${body.aircraftId}, ${body.date}, ${body.time}, 
                ${body.duration || 0}, ${body.tachometerStart || null}, ${body.tachometerEnd || null}, 
                ${body.status}, ${body.notes || ""})
        RETURNING id, pilot_id as "pilotId", pilot_id_2 as "pilotId2", aircraft_id as "aircraftId", 
                  date, time, duration, tachometer_start as "tachometerStart", tachometer_end as "tachometerEnd",
                  status, notes, created_at as "createdAt"
      `
    } else if (hasPilotId2 && !hasTachometer) {
      // Insert with pilot_id_2 but without tachometer
      rows = await sql`
        INSERT INTO flights (pilot_id, pilot_id_2, aircraft_id, date, time, duration, status, notes)
        VALUES (${body.pilotId}, ${body.pilotId2 || null}, ${body.aircraftId}, ${body.date}, ${body.time}, 
                ${body.duration || 0}, ${body.status}, ${body.notes || ""})
        RETURNING id, pilot_id as "pilotId", pilot_id_2 as "pilotId2", aircraft_id as "aircraftId", 
                  date, time, duration, status, notes, created_at as "createdAt"
      `
      // Add tachometer fields as undefined for compatibility
      rows = rows.map((row) => ({
        ...row,
        tachometerStart: undefined,
        tachometerEnd: undefined,
      }))
    } else if (!hasPilotId2 && hasTachometer) {
      // Insert without pilot_id_2 but with tachometer
      rows = await sql`
        INSERT INTO flights (pilot_id, aircraft_id, date, time, duration, tachometer_start, tachometer_end, status, notes)
        VALUES (${body.pilotId}, ${body.aircraftId}, ${body.date}, ${body.time}, 
                ${body.duration || 0}, ${body.tachometerStart || null}, ${body.tachometerEnd || null}, 
                ${body.status}, ${body.notes || ""})
        RETURNING id, pilot_id as "pilotId", aircraft_id as "aircraftId", 
                  date, time, duration, tachometer_start as "tachometerStart", tachometer_end as "tachometerEnd",
                  status, notes, created_at as "createdAt"
      `
      // Add pilotId2 as null for compatibility
      rows = rows.map((row) => ({ ...row, pilotId2: null }))
    } else {
      // Legacy insert without pilot_id_2 and tachometer
      rows = await sql`
        INSERT INTO flights (pilot_id, aircraft_id, date, time, duration, status, notes)
        VALUES (${body.pilotId}, ${body.aircraftId}, ${body.date}, ${body.time}, 
                ${body.duration || 0}, ${body.status}, ${body.notes || ""})
        RETURNING id, pilot_id as "pilotId", aircraft_id as "aircraftId", 
                  date, time, duration, status, notes, created_at as "createdAt"
      `
      // Add pilotId2 and tachometer fields as null/undefined for compatibility
      rows = rows.map((row) => ({
        ...row,
        pilotId2: null,
        tachometerStart: undefined,
        tachometerEnd: undefined,
      }))
    }

    return NextResponse.json(rows[0])
  } catch (error) {
    console.error("Error creating flight:", error)
    return NextResponse.json({ error: "Failed to create flight" }, { status: 500 })
  }
}

export async function PUT(req: Request) {
  if (!process.env.DATABASE_URL) return NextResponse.json({ error: "DATABASE_URL not configured" }, { status: 400 })

  try {
    const body = await req.json()
    const sql = neon(process.env.DATABASE_URL!)

    console.log("PUT request body:", body)

    // Check if pilot_id_2 and tachometer columns exist
    const columnCheck = await sql`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'flights' AND column_name IN ('pilot_id_2', 'tachometer_start', 'tachometer_end')
    `

    const hasPilotId2 = columnCheck.some((col) => col.column_name === "pilot_id_2")
    const hasTachometer =
      columnCheck.filter((col) => col.column_name === "tachometer_start" || col.column_name === "tachometer_end")
        .length === 2

    console.log("Column availability:", { hasPilotId2, hasTachometer })

    // Calculate duration if both tachometer values are provided
    let calculatedDuration = null
    if (body.tachometerEnd !== undefined && body.tachometerStart !== undefined) {
      calculatedDuration = Number(body.tachometerEnd) - Number(body.tachometerStart)
      console.log("Calculated duration:", calculatedDuration)
    }

    let rows
    if (hasPilotId2 && hasTachometer) {
      // Update with pilot_id_2 and tachometer fields - USING TAGGED TEMPLATE
      if (calculatedDuration !== null) {
        // Update with calculated duration
        rows = await sql`
          UPDATE flights
          SET status = ${body.status},
              pilot_id_2 = ${body.pilotId2 !== undefined ? body.pilotId2 : sql`pilot_id_2`},
              tachometer_start = ${body.tachometerStart !== undefined ? Number(body.tachometerStart) : sql`tachometer_start`},
              tachometer_end = ${body.tachometerEnd !== undefined ? Number(body.tachometerEnd) : sql`tachometer_end`},
              duration = ${calculatedDuration}
          WHERE id = ${body.id}
          RETURNING id, pilot_id as "pilotId", pilot_id_2 as "pilotId2", aircraft_id as "aircraftId", 
                    date, time, duration, tachometer_start as "tachometerStart", tachometer_end as "tachometerEnd",
                    status, notes, created_at as "createdAt"
        `
      } else {
        // Update without duration calculation
        rows = await sql`
          UPDATE flights
          SET status = ${body.status},
              pilot_id_2 = ${body.pilotId2 !== undefined ? body.pilotId2 : sql`pilot_id_2`},
              tachometer_start = ${body.tachometerStart !== undefined ? Number(body.tachometerStart) : sql`tachometer_start`},
              tachometer_end = ${body.tachometerEnd !== undefined ? Number(body.tachometerEnd) : sql`tachometer_end`}
          WHERE id = ${body.id}
          RETURNING id, pilot_id as "pilotId", pilot_id_2 as "pilotId2", aircraft_id as "aircraftId", 
                    date, time, duration, tachometer_start as "tachometerStart", tachometer_end as "tachometerEnd",
                    status, notes, created_at as "createdAt"
        `
      }
    } else if (hasPilotId2 && !hasTachometer) {
      // Update with pilot_id_2 but without tachometer
      rows = await sql`
        UPDATE flights
        SET status = ${body.status},
            pilot_id_2 = ${body.pilotId2 !== undefined ? body.pilotId2 : sql`pilot_id_2`}
        WHERE id = ${body.id}
        RETURNING id, pilot_id as "pilotId", pilot_id_2 as "pilotId2", aircraft_id as "aircraftId", 
                  date, time, duration, status, notes, created_at as "createdAt"
      `
      // Add tachometer fields as undefined for compatibility
      rows = rows.map((row) => ({
        ...row,
        tachometerStart: undefined,
        tachometerEnd: undefined,
      }))
    } else if (!hasPilotId2 && hasTachometer) {
      // Update without pilot_id_2 but with tachometer
      if (calculatedDuration !== null) {
        // Update with calculated duration
        rows = await sql`
          UPDATE flights
          SET status = ${body.status},
              tachometer_start = ${body.tachometerStart !== undefined ? Number(body.tachometerStart) : sql`tachometer_start`},
              tachometer_end = ${body.tachometerEnd !== undefined ? Number(body.tachometerEnd) : sql`tachometer_end`},
              duration = ${calculatedDuration}
          WHERE id = ${body.id}
          RETURNING id, pilot_id as "pilotId", aircraft_id as "aircraftId", 
                    date, time, duration, tachometer_start as "tachometerStart", tachometer_end as "tachometerEnd",
                    status, notes, created_at as "createdAt"
        `
      } else {
        // Update without duration calculation
        rows = await sql`
          UPDATE flights
          SET status = ${body.status},
              tachometer_start = ${body.tachometerStart !== undefined ? Number(body.tachometerStart) : sql`tachometer_start`},
              tachometer_end = ${body.tachometerEnd !== undefined ? Number(body.tachometerEnd) : sql`tachometer_end`}
          WHERE id = ${body.id}
          RETURNING id, pilot_id as "pilotId", aircraft_id as "aircraftId", 
                    date, time, duration, tachometer_start as "tachometerStart", tachometer_end as "tachometerEnd",
                    status, notes, created_at as "createdAt"
        `
      }
      // Add pilotId2 as null for compatibility
      rows = rows.map((row) => ({ ...row, pilotId2: null }))
    } else {
      // Legacy update without pilot_id_2 and tachometer
      rows = await sql`
        UPDATE flights
        SET status = ${body.status}
        WHERE id = ${body.id}
        RETURNING id, pilot_id as "pilotId", aircraft_id as "aircraftId", 
                  date, time, duration, status, notes, created_at as "createdAt"
      `
      // Add pilotId2 and tachometer fields as null/undefined for compatibility
      rows = rows.map((row) => ({
        ...row,
        pilotId2: null,
        tachometerStart: undefined,
        tachometerEnd: undefined,
      }))
    }

    console.log("Update result:", rows[0])
    return NextResponse.json(rows[0])
  } catch (error) {
    console.error("Error updating flight:", error)
    return NextResponse.json({ error: "Failed to update flight", details: error.message }, { status: 500 })
  }
}

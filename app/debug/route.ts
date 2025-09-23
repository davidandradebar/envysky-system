import { NextResponse } from "next/server"
import { neon } from "@neondatabase/serverless"

export async function GET() {
  if (!process.env.DATABASE_URL) {
    return NextResponse.json({ error: "DATABASE_URL not configured" }, { status: 400 })
  }

  try {
    const sql = neon(process.env.DATABASE_URL)

    // 1. Obtener todos los pilotos
    const pilots = await sql`
      SELECT pilot_id, full_name, email
      FROM pilots
      ORDER BY full_name
    `

    // 2. Obtener todos los vuelos completados
    const flights = await sql`
      SELECT 
        flight_id, 
        pilot_id, 
        copilot_id, 
        aircraft_id, 
        flight_time, 
        duration, 
        status, 
        tachometer_start, 
        tachometer_end
      FROM flights
      WHERE status = 'completed'
    `

    // 3. Calcular horas para cada piloto
    const pilotDetails = pilots.map((pilot) => {
      // Encontrar vuelos donde este piloto fue piloto principal
      const pilotFlights = flights.filter((f) => f.pilot_id === pilot.pilot_id)

      // Calcular horas voladas
      let totalHours = 0
      const flightDetails = pilotFlights.map((flight) => {
        let hours = 0
        let method = "unknown"

        // Intentar calcular horas con tacómetro
        if (flight.tachometer_start !== null && flight.tachometer_end !== null) {
          const start = Number(flight.tachometer_start)
          const end = Number(flight.tachometer_end)

          if (!isNaN(start) && !isNaN(end) && end >= start) {
            hours = end - start
            method = "tachometer"
          }
        }

        // Si no hay tacómetro o hay un problema, usar duration
        if (hours === 0 && flight.duration) {
          try {
            const parts = flight.duration.split(":")
            const h = Number(parts[0]) || 0
            const m = Number(parts[1]) || 0
            const s = Number(parts[2]) || 0
            hours = h + m / 60 + s / 3600
            method = "duration"
          } catch (e) {
            console.error("Error parsing duration:", flight.duration)
          }
        }

        totalHours += hours

        return {
          id: flight.flight_id,
          hours,
          method,
          raw: flight,
        }
      })

      return {
        id: pilot.pilot_id,
        name: pilot.full_name,
        email: pilot.email,
        flightsCount: pilotFlights.length,
        totalHours,
        flights: flightDetails,
      }
    })

    // 4. Preparar resumen
    const summary = {
      totalPilots: pilots.length,
      totalFlights: flights.length,
      pilotsWithFlights: pilotDetails.filter((p) => p.flightsCount > 0).length,
      pilotsWithoutFlights: pilotDetails.filter((p) => p.flightsCount === 0).length,
    }

    return NextResponse.json({
      summary,
      pilots: pilotDetails,
    })
  } catch (error) {
    console.error("Error in debug endpoint:", error)
    return NextResponse.json({ error: "Failed to fetch debug data" }, { status: 500 })
  }
}

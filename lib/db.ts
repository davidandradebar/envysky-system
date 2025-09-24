// 🗄️ FUNCIONES DE BASE DE DATOS CORREGIDAS PARA LA ESTRUCTURA REAL
import { neon } from "@neondatabase/serverless"
import type { Pilot, Aircraft, Flight, Purchase } from "./types"

// Conectar a Neon
const sql = neon(process.env.DATABASE_URL!)

// Helper function to generate IDs
function generateId(): string {
  return Math.random().toString(36).substr(2, 9)
}

// ===== PILOT FUNCTIONS =====
export async function getPilots(): Promise<Pilot[]> {
  try {
    const result = await sql`
      SELECT pilot_id, full_name, email, phone, country, birth_date, license_type, created_at, purchases
      FROM pilots 
      ORDER BY full_name
    `

    return result.map((row: any) => ({
      id: row.pilot_id,
      fullName: row.full_name,
      email: row.email,
      phone: row.phone || undefined,
      country: row.country || undefined,
      birthDate: row.birth_date || undefined,
      licenseType: row.license_type || undefined,
      createdAt: row.created_at,
    }))
  } catch (error) {
    console.error("Error fetching pilots:", error)
    return []
  }
}

export async function getPilotById(id: string): Promise<Pilot | null> {
  try {
    const result = await sql`
      SELECT pilot_id, full_name, email, phone, country, birth_date, license_type, created_at, purchases
      FROM pilots 
      WHERE pilot_id = ${id}
    `

    if (result.length === 0) return null

    const row = result[0]
    return {
      id: row.pilot_id,
      fullName: row.full_name,
      email: row.email,
      phone: row.phone || undefined,
      country: row.country || undefined,
      birthDate: row.birth_date || undefined,
      licenseType: row.license_type || undefined,
      createdAt: row.created_at,
    }
  } catch (error) {
    console.error("Error fetching pilot:", error)
    return null
  }
}

export async function getPilotByEmail(email: string): Promise<Pilot | null> {
  try {
    const result = await sql`
      SELECT pilot_id, full_name, email, phone, country, birth_date, license_type, created_at, purchases
      FROM pilots 
      WHERE email = ${email}
    `

    if (result.length === 0) return null

    const row = result[0]
    return {
      id: row.pilot_id,
      fullName: row.full_name,
      email: row.email,
      phone: row.phone || undefined,
      country: row.country || undefined,
      birthDate: row.birth_date || undefined,
      licenseType: row.license_type || undefined,
      createdAt: row.created_at,
    }
  } catch (error) {
    console.error("Error fetching pilot by email:", error)
    return null
  }
}

export async function savePilot(pilot: Omit<Pilot, "id" | "createdAt">): Promise<Pilot> {
  const id = `pilot_${generateId()}`

  try {
    console.log("Saving pilot:", pilot)

    await sql`
      INSERT INTO pilots (pilot_id, full_name, email, phone, country, birth_date, license_type, created_at, purchases)
      VALUES (${id}, ${pilot.fullName}, ${pilot.email}, ${pilot.phone || null}, 
              ${pilot.country || null}, ${pilot.birthDate || null}, 
              ${pilot.licenseType || null}, NOW(), 0)
    `

    console.log("Pilot saved successfully with ID:", id)

    return {
      ...pilot,
      id,
      createdAt: new Date().toISOString(),
    }
  } catch (error) {
    console.error("Error saving pilot:", error)
    throw error
  }
}

// ===== AIRCRAFT FUNCTIONS =====
export async function getAircrafts(): Promise<Aircraft[]> {
  try {
    const result = await sql`
      SELECT tail_number, model, initial_hours, maintenace_interval, status, created_at
      FROM aircrafts 
      ORDER BY tail_number
    `

    return result.map((row: any) => ({
      id: row.tail_number, // Usando tail_number como ID único
      tailNumber: row.tail_number,
      model: row.model || row.tail_number,
      initialHours: Number.parseFloat(row.initial_hours) || 0,
      maintenanceIntervalHours: Number.parseFloat(row.maintenace_interval) || 100, // Note: typo in DB
      status: (row.status || "active") as "active" | "maintenance",
      createdAt: row.created_at || new Date().toISOString(),
    }))
  } catch (error) {
    console.error("Error fetching aircrafts:", error)
    return []
  }
}

export async function getAircraftById(id: string): Promise<Aircraft | null> {
  try {
    const result = await sql`
      SELECT tail_number, model, initial_hours, maintenace_interval, status, created_at
      FROM aircrafts 
      WHERE tail_number = ${id}
    `

    if (result.length === 0) return null

    const row = result[0]
    return {
      id: row.tail_number,
      tailNumber: row.tail_number,
      model: row.model || row.tail_number,
      initialHours: Number.parseFloat(row.initial_hours) || 0,
      maintenanceIntervalHours: Number.parseFloat(row.maintenace_interval) || 100,
      status: (row.status || "active") as "active" | "maintenance",
      createdAt: row.created_at || new Date().toISOString(),
    }
  } catch (error) {
    console.error("Error fetching aircraft:", error)
    return null
  }
}

export async function saveAircraft(aircraft: Omit<Aircraft, "id" | "createdAt">): Promise<Aircraft> {
  try {
    console.log("Saving aircraft:", aircraft)

    await sql`
      INSERT INTO aircrafts (tail_number, model, initial_hours, maintenace_interval, status, created_at)
      VALUES (${aircraft.tailNumber}, ${aircraft.model}, ${aircraft.initialHours}, 
              ${aircraft.maintenanceIntervalHours}, ${aircraft.status}, NOW())
    `

    console.log("Aircraft saved successfully")

    return {
      ...aircraft,
      id: aircraft.tailNumber,
      createdAt: new Date().toISOString(),
    }
  } catch (error) {
    console.error("Error saving aircraft:", error)
    throw error
  }
}

export async function updateAircraft(aircraft: Aircraft): Promise<Aircraft> {
  try {
    await sql`
      UPDATE aircrafts 
      SET model = ${aircraft.model},
          initial_hours = ${aircraft.initialHours},
          maintenace_interval = ${aircraft.maintenanceIntervalHours},
          status = ${aircraft.status}
      WHERE tail_number = ${aircraft.tailNumber}
    `

    return aircraft
  } catch (error) {
    console.error("Error updating aircraft:", error)
    throw error
  }
}

// ===== FLIGHT FUNCTIONS =====
export async function getFlights(): Promise<Flight[]> {
  try {
    const result = await sql`
      SELECT flight_id, pilot_id, copilot_id, aircraft_id, flight_time, duration, 
             status, notes, tachometer_start, tachometer_end, created_at
      FROM flights 
      ORDER BY flight_time DESC
    `

    return result.map((row: any) => {
      // Parse flight_time to get date and time
      let date = ""
      let time = ""
      if (row.flight_time) {
        try {
          const dateObj = new Date(row.flight_time)
          date = dateObj.toISOString().split("T")[0]
          time = dateObj.toISOString().split("T")[1].substring(0, 5)
        } catch (e) {
          // Fallback parsing
          const parts = String(row.flight_time).split(" ")
          if (parts.length >= 2) {
            date = parts[0]
            time = parts[1].substring(0, 5)
          }
        }
      }

      return {
        id: row.flight_id || `flight_${generateId()}`,
        pilotId: row.pilot_id,
        pilotId2: row.copilot_id || undefined,
        aircraftId: row.aircraft_id || "unknown",
        date,
        time,
        duration: parseDurationToHours(row.duration),
        status: (row.status || "completed") as "scheduled" | "completed" | "cancelled",
        notes: row.notes || undefined,
        tachometerStart: row.tachometer_start ? Number.parseFloat(row.tachometer_start) : undefined,
        tachometerEnd: row.tachometer_end ? Number.parseFloat(row.tachometer_end) : undefined,
        createdAt: row.created_at || new Date().toISOString(),
      }
    })
  } catch (error) {
    console.error("Error fetching flights:", error)
    return []
  }
}

// Helper function to convert duration format (06:54:00) to decimal hours
function parseDurationToHours(duration: string): number {
  if (!duration) return 0

  try {
    const parts = duration.split(":")
    const hours = Number.parseInt(parts[0]) || 0
    const minutes = Number.parseInt(parts[1]) || 0
    const seconds = Number.parseInt(parts[2]) || 0

    return hours + minutes / 60 + seconds / 3600
  } catch (error) {
    console.error("Error parsing duration:", duration, error)
    return 0
  }
}

export async function getFlightById(id: string): Promise<Flight | null> {
  try {
    const result = await sql`
      SELECT flight_id, pilot_id, copilot_id, aircraft_id, flight_time, duration, 
             status, notes, tachometer_start, tachometer_end, created_at
      FROM flights 
      WHERE flight_id = ${id}
    `

    if (result.length === 0) return null

    const row = result[0]

    let date = ""
    let time = ""
    if (row.flight_time) {
      try {
        const dateObj = new Date(row.flight_time)
        date = dateObj.toISOString().split("T")[0]
        time = dateObj.toISOString().split("T")[1].substring(0, 5)
      } catch (e) {
        const parts = String(row.flight_time).split(" ")
        if (parts.length >= 2) {
          date = parts[0]
          time = parts[1].substring(0, 5)
        }
      }
    }

    return {
      id: row.flight_id,
      pilotId: row.pilot_id,
      pilotId2: row.copilot_id || undefined,
      aircraftId: row.aircraft_id || "unknown",
      date,
      time,
      duration: parseDurationToHours(row.duration),
      status: (row.status || "completed") as "scheduled" | "completed" | "cancelled",
      notes: row.notes || undefined,
      tachometerStart: row.tachometer_start ? Number.parseFloat(row.tachometer_start) : undefined,
      tachometerEnd: row.tachometer_end ? Number.parseFloat(row.tachometer_end) : undefined,
      createdAt: row.created_at || new Date().toISOString(),
    }
  } catch (error) {
    console.error("Error fetching flight:", error)
    return null
  }
}

export async function saveFlight(flight: Omit<Flight, "id" | "createdAt">): Promise<Flight> {
  const id = `flight_${generateId()}`
  const flightTime = `${flight.date} ${flight.time}`
  const durationFormatted = formatHoursToDuration(flight.duration)

  try {
    console.log("Saving flight:", flight)

    await sql`
      INSERT INTO flights (flight_id, pilot_id, copilot_id, aircraft_id, flight_time, duration, status, 
                          notes, tachometer_start, tachometer_end, created_at)
      VALUES (${id}, ${flight.pilotId}, ${flight.pilotId2 || null}, ${flight.aircraftId}, 
              ${flightTime}, ${durationFormatted}, ${flight.status},
              ${flight.notes || null}, ${flight.tachometerStart || null}, 
              ${flight.tachometerEnd || null}, NOW())
    `

    console.log("Flight saved successfully with ID:", id)

    return {
      ...flight,
      id,
      createdAt: new Date().toISOString(),
    }
  } catch (error) {
    console.error("Error saving flight:", error)
    throw error
  }
}

// Helper function to convert decimal hours to duration format (HH:MM:SS)
function formatHoursToDuration(hours: number): string {
  const totalSeconds = Math.round(hours * 3600)
  const h = Math.floor(totalSeconds / 3600)
  const m = Math.floor((totalSeconds % 3600) / 60)
  const s = totalSeconds % 60

  return `${h.toString().padStart(2, "0")}:${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`
}

export async function updateFlightStatus(
  flightId: string,
  status: Flight["status"],
  tachometerData?: { tachometerStart?: number; tachometerEnd?: number },
): Promise<Flight | null> {
  try {
    // Calculate duration if both tachometer values are provided
    let calculatedDuration = null
    if (tachometerData?.tachometerEnd && tachometerData?.tachometerStart) {
      calculatedDuration = tachometerData.tachometerEnd - tachometerData.tachometerStart
    }

    if (calculatedDuration !== null) {
      const durationFormatted = formatHoursToDuration(calculatedDuration)
      await sql`
        UPDATE flights 
        SET status = ${status},
            tachometer_start = ${tachometerData?.tachometerStart || null},
            tachometer_end = ${tachometerData?.tachometerEnd || null},
            duration = ${durationFormatted}
        WHERE flight_id = ${flightId}
      `
    } else {
      await sql`
        UPDATE flights 
        SET status = ${status},
            tachometer_start = ${tachometerData?.tachometerStart || null},
            tachometer_end = ${tachometerData?.tachometerEnd || null}
        WHERE flight_id = ${flightId}
      `
    }

    return await getFlightById(flightId)
  } catch (error) {
    console.error("Error updating flight status:", error)
    return null
  }
}

// ===== PURCHASE FUNCTIONS =====
export async function getPurchases(): Promise<Purchase[]> {
  try {
    const result = await sql`
      SELECT purchase_id, pilot_id, hours, date, created_at, pilot
      FROM purchases 
      ORDER BY date DESC
    `

    return result.map((row: any) => ({
      id: row.purchase_id || `purchase_${generateId()}`,
      pilotId: row.pilot_id,
      hours: Number.parseFloat(row.hours) || 0,
      date: row.date,
      createdAt: row.created_at || new Date().toISOString(),
    }))
  } catch (error) {
    console.error("Error fetching purchases:", error)
    return []
  }
}

export async function savePurchase(purchaseData: {
  pilotEmail: string
  hours: number
  date: string
  fullName?: string
  phone?: string
  country?: string
  birthDate?: string
  licenseType?: string
}): Promise<Purchase> {
  try {
    console.log("Saving purchase:", purchaseData)

    // Check if pilot exists
    let pilot = await getPilotByEmail(purchaseData.pilotEmail)

    // If pilot doesn't exist, create one
    if (!pilot) {
      console.log("Pilot doesn't exist, creating new pilot")
      pilot = await savePilot({
        fullName: purchaseData.fullName || "Sin nombre",
        email: purchaseData.pilotEmail,
        phone: purchaseData.phone,
        country: purchaseData.country,
        birthDate: purchaseData.birthDate,
        licenseType: purchaseData.licenseType,
      })
    }

    const id = `purchase_${generateId()}`

    await sql`
      INSERT INTO purchases (purchase_id, pilot_id, hours, date, created_at, pilot)
      VALUES (${id}, ${pilot.id}, ${purchaseData.hours}, ${purchaseData.date}, NOW(), ${pilot.fullName})
    `

    // Update pilot's total purchases
    await sql`
      UPDATE pilots 
      SET purchases = COALESCE(purchases, 0) + ${purchaseData.hours}
      WHERE pilot_id = ${pilot.id}
    `

    console.log("Purchase saved successfully with ID:", id)

    return {
      id,
      pilotId: pilot.id,
      hours: purchaseData.hours,
      date: purchaseData.date,
      createdAt: new Date().toISOString(),
    }
  } catch (error) {
    console.error("Error saving purchase:", error)
    throw error
  }
}

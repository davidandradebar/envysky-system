import { neon } from "@neondatabase/serverless"
import type { Pilot, Aircraft, Flight, Purchase } from "./types"

const sql = neon(process.env.DATABASE_URL!)

// Helper function to generate IDs
function generateId(): string {
  return Math.random().toString(36).substr(2, 9)
}

// ===== PILOT FUNCTIONS =====
export async function getPilots(): Promise<Pilot[]> {
  try {
    const result = await sql`
      SELECT pilot_id as id, full_name as "fullName", email, phone, country, birth_date as "birthDate", license_type as "licenseType", created_at as "createdAt"
      FROM pilots 
      ORDER BY created_at DESC
    `

    return result.map((row: any) => ({
      id: row.id || `pilot_${generateId()}`,
      fullName: row.fullName || "",
      email: row.email || "",
      phone: row.phone || undefined,
      country: row.country || undefined,
      birthDate: row.birthDate || undefined,
      licenseType: row.licenseType || undefined,
      createdAt: row.createdAt || new Date().toISOString(),
    }))
  } catch (error) {
    console.error("Error fetching pilots:", error)
    return []
  }
}

export async function getPilotById(id: string): Promise<Pilot | null> {
  try {
    const result = await sql`
      SELECT pilot_id as id, full_name as "fullName", email, phone, country, birth_date as "birthDate", license_type as "licenseType", created_at as "createdAt"
      FROM pilots 
      WHERE pilot_id = ${id}
    `

    if (result.length === 0) return null

    const row = result[0]
    return {
      id: row.id,
      fullName: row.fullName || "",
      email: row.email || "",
      phone: row.phone || undefined,
      country: row.country || undefined,
      birthDate: row.birthDate || undefined,
      licenseType: row.licenseType || undefined,
      createdAt: row.createdAt || new Date().toISOString(),
    }
  } catch (error) {
    console.error("Error fetching pilot:", error)
    return null
  }
}

export async function savePilot(pilot: Omit<Pilot, "id" | "createdAt">): Promise<Pilot> {
  const id = `pilot_${generateId()}`

  try {
    await sql`
      INSERT INTO pilots (pilot_id, full_name, email, phone, country, birth_date, license_type)
      VALUES (${id}, ${pilot.fullName}, ${pilot.email}, ${pilot.phone || null}, 
              ${pilot.country || null}, ${pilot.birthDate || null}, ${pilot.licenseType || null})
    `

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
      SELECT id_flights as id, tail_number as "tailNumber", model, initial_hours as "initialHours", maintenace_interval as "maintenanceIntervalHours", status, created_at as "createdAt"
      FROM aircrafts 
      ORDER BY created_at DESC
    `

    return result.map((row: any) => ({
      id: row.id || row.tailNumber || `aircraft_${generateId()}`,
      tailNumber: row.tailNumber || "",
      model: row.model || "",
      initialHours: Number(row.initialHours) || 0,
      maintenanceIntervalHours: Number(row.maintenanceIntervalHours) || 100,
      status: (row.status || "active") as "active" | "maintenance",
      createdAt: row.createdAt || new Date().toISOString(),
    }))
  } catch (error) {
    console.error("Error fetching aircrafts:", error)
    return []
  }
}

export async function getAircraftById(id: string): Promise<Aircraft | null> {
  try {
    const result = await sql`
      SELECT id_flights as id, tail_number as "tailNumber", model, initial_hours as "initialHours", maintenace_interval as "maintenanceIntervalHours", status, created_at as "createdAt"
      FROM aircrafts 
      WHERE id_flights = ${id} OR tail_number = ${id}
    `

    if (result.length === 0) return null

    const row = result[0]
    return {
      id: row.id || row.tailNumber,
      tailNumber: row.tailNumber || "",
      model: row.model || "",
      initialHours: Number(row.initialHours) || 0,
      maintenanceIntervalHours: Number(row.maintenanceIntervalHours) || 100,
      status: (row.status || "active") as "active" | "maintenance",
      createdAt: row.createdAt || new Date().toISOString(),
    }
  } catch (error) {
    console.error("Error fetching aircraft:", error)
    return null
  }
}

export async function saveAircraft(aircraft: Omit<Aircraft, "id" | "createdAt">): Promise<Aircraft> {
  try {
    await sql`
      INSERT INTO aircrafts (tail_number, model, initial_hours, maintenace_interval, status)
      VALUES (${aircraft.tailNumber}, ${aircraft.model}, ${aircraft.initialHours}, 
              ${aircraft.maintenanceIntervalHours}, ${aircraft.status})
    `

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
      WHERE tail_number = ${aircraft.tailNumber} OR id_flights = ${aircraft.id}
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
      SELECT 
        flight_id as id,
        pilot_id as "pilotId",
        copilot_id as "pilotId2",
        aircraft_id as "aircraftId",
        flight_time,
        duration,
        status,
        notes,
        tachometer_start as "tachometerStart",
        tachometer_end as "tachometerEnd",
        created_at as "createdAt"
      FROM flights 
      ORDER BY created_at DESC
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
          const parts = String(row.flight_time).split(" ")
          if (parts.length >= 2) {
            date = parts[0]
            time = parts[1].substring(0, 5)
          }
        }
      }

      return {
        id: row.id || `flight_${generateId()}`,
        pilotId: row.pilotId || "",
        pilotId2: row.pilotId2 || undefined,
        aircraftId: row.aircraftId || "",
        date,
        time,
        duration: Number(row.duration) || 0,
        status: (row.status || "completed") as "scheduled" | "completed" | "cancelled",
        notes: row.notes || undefined,
        tachometerStart: row.tachometerStart ? Number(row.tachometerStart) : undefined,
        tachometerEnd: row.tachometerEnd ? Number(row.tachometerEnd) : undefined,
        createdAt: row.createdAt || new Date().toISOString(),
      }
    })
  } catch (error) {
    console.error("Error fetching flights:", error)
    return []
  }
}

export async function saveFlight(flight: Omit<Flight, "id" | "createdAt">): Promise<Flight> {
  const id = `flight_${generateId()}`
  const flightTime = `${flight.date} ${flight.time}`

  try {
    await sql`
      INSERT INTO flights (flight_id, pilot_id, copilot_id, aircraft_id, flight_time, duration, status, 
                          notes, tachometer_start, tachometer_end)
      VALUES (${id}, ${flight.pilotId}, ${flight.pilotId2 || null}, ${flight.aircraftId}, 
              ${flightTime}, ${flight.duration}, ${flight.status},
              ${flight.notes || null}, ${flight.tachometerStart || null}, 
              ${flight.tachometerEnd || null})
    `

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

export async function updateFlightStatus(
  flightId: string,
  status: Flight["status"],
  tachometerData?: { tachometerStart?: number; tachometerEnd?: number },
): Promise<Flight | null> {
  try {
    await sql`
      UPDATE flights 
      SET status = ${status},
          tachometer_start = ${tachometerData?.tachometerStart || null},
          tachometer_end = ${tachometerData?.tachometerEnd || null}
      WHERE flight_id = ${flightId}
    `

    // Return updated flight
    const result = await sql`
      SELECT 
        flight_id as id,
        pilot_id as "pilotId",
        copilot_id as "pilotId2",
        aircraft_id as "aircraftId",
        flight_time,
        duration,
        status,
        notes,
        tachometer_start as "tachometerStart",
        tachometer_end as "tachometerEnd",
        created_at as "createdAt"
      FROM flights 
      WHERE flight_id = ${flightId}
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
      id: row.id,
      pilotId: row.pilotId,
      pilotId2: row.pilotId2 || undefined,
      aircraftId: row.aircraftId,
      date,
      time,
      duration: Number(row.duration) || 0,
      status: row.status as "scheduled" | "completed" | "cancelled",
      notes: row.notes || undefined,
      tachometerStart: row.tachometerStart ? Number(row.tachometerStart) : undefined,
      tachometerEnd: row.tachometerEnd ? Number(row.tachometerEnd) : undefined,
      createdAt: row.createdAt,
    }
  } catch (error) {
    console.error("Error updating flight status:", error)
    return null
  }
}

// ===== PURCHASE FUNCTIONS =====
export async function getPurchases(): Promise<Purchase[]> {
  try {
    const result = await sql`
      SELECT purchase_id as id, pilot_id as "pilotId", hours, date, created_at as "createdAt"
      FROM purchases 
      ORDER BY created_at DESC
    `

    return result.map((row: any) => ({
      id: row.id || `purchase_${generateId()}`,
      pilotId: row.pilotId || "",
      hours: Number(row.hours) || 0,
      date: row.date || "",
      createdAt: row.createdAt || new Date().toISOString(),
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
    // Check if pilot exists
    const existingPilot = await sql`
      SELECT pilot_id as id FROM pilots WHERE email = ${purchaseData.pilotEmail}
    `

    let pilotId: string

    if (existingPilot.length === 0) {
      // Create new pilot
      const newPilot = await sql`
        INSERT INTO pilots (full_name, email, phone, country, birth_date, license_type)
        VALUES (${purchaseData.fullName || "Unknown"}, ${purchaseData.pilotEmail}, 
                ${purchaseData.phone || null}, ${purchaseData.country || null}, 
                ${purchaseData.birthDate || null}, ${purchaseData.licenseType || null})
        RETURNING pilot_id as id
      `
      pilotId = newPilot[0].id
    } else {
      pilotId = existingPilot[0].id
    }

    const id = `purchase_${generateId()}`

    await sql`
      INSERT INTO purchases (purchase_id, pilot_id, hours, date)
      VALUES (${id}, ${pilotId}, ${purchaseData.hours}, ${purchaseData.date})
    `

    return {
      id,
      pilotId,
      hours: purchaseData.hours,
      date: purchaseData.date,
      createdAt: new Date().toISOString(),
    }
  } catch (error) {
    console.error("Error saving purchase:", error)
    throw error
  }
}

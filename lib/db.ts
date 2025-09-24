// Database functions that work with both localStorage (fallback) and Neon (production)
import type { Aircraft, Flight, Pilot, Purchase } from "./types"
import { newId } from "./id"

const API_BASE = "/api"

// Check if we're in production with database
const hasDatabase = () => {
  // Always try to use the database if we're in a browser environment
  // The API calls will handle fallback to localStorage if database is unavailable
  return typeof window !== "undefined"
}

// Generic API call function
async function apiCall<T>(endpoint: string, options?: RequestInit): Promise<T> {
  console.log(`[v0] API call starting: ${endpoint}`, { options })

  try {
    const response = await fetch(`${API_BASE}${endpoint}`, {
      headers: {
        "Content-Type": "application/json",
        ...options?.headers,
      },
      ...options,
    })

    console.log(`[v0] API response received: ${endpoint}`, {
      status: response.status,
      ok: response.ok,
      statusText: response.statusText,
    })

    if (!response.ok) {
      const errorText = await response.text()
      console.error(`[v0] API call to ${endpoint} failed:`, response.status, errorText)
      throw new Error(`API call failed: ${response.status} ${response.statusText}`)
    }

    const data = await response.json()
    console.log(`[v0] API call successful: ${endpoint}`, {
      dataLength: Array.isArray(data) ? data.length : "not array",
      data,
    })
    return data
  } catch (error) {
    console.error(`[v0] API call to ${endpoint} failed:`, error)
    throw error
  }
}

// Local storage fallback functions
function readLocal<T>(key: string, fallback: T): T {
  if (typeof window === "undefined") return fallback
  try {
    const raw = localStorage.getItem(key)
    return raw ? (JSON.parse(raw) as T) : fallback
  } catch {
    return fallback
  }
}

function writeLocal<T>(key: string, value: T) {
  if (typeof window === "undefined") return
  localStorage.setItem(key, JSON.stringify(value))
}

// PILOTS
export async function getPilots(): Promise<Pilot[]> {
  console.log(`[v0] getPilots called, hasDatabase: ${hasDatabase()}`)

  if (hasDatabase()) {
    try {
      const pilots = await apiCall<Pilot[]>("/pilots")
      console.log(`[v0] getPilots from API successful:`, pilots)
      return pilots
    } catch (error) {
      console.warn("[v0] Database unavailable for getPilots, using localStorage:", error)
      const localPilots = readLocal<Pilot[]>("envysky:pilots", [])
      console.log(`[v0] getPilots from localStorage:`, localPilots)
      return localPilots
    }
  }
  const localPilots = readLocal<Pilot[]>("envysky:pilots", [])
  console.log(`[v0] getPilots from localStorage (no database):`, localPilots)
  return localPilots
}

export async function savePilot(pilot: Omit<Pilot, "id" | "createdAt">): Promise<Pilot> {
  if (hasDatabase()) {
    try {
      return await apiCall<Pilot>("/pilots", {
        method: "POST",
        body: JSON.stringify(pilot),
      })
    } catch (error) {
      console.warn("Database unavailable, using localStorage:", error)
      // Fallback to localStorage
      const newPilot: Pilot = {
        ...pilot,
        id: newId(),
        createdAt: new Date().toISOString(),
      }
      const pilots = readLocal<Pilot[]>("envysky:pilots", [])
      const updated = [...pilots.filter((p) => p.email !== pilot.email), newPilot]
      writeLocal("envysky:pilots", updated)
      return newPilot
    }
  }

  // localStorage only
  const newPilot: Pilot = {
    ...pilot,
    id: newId(),
    createdAt: new Date().toISOString(),
  }
  const pilots = readLocal<Pilot[]>("envysky:pilots", [])
  const updated = [...pilots.filter((p) => p.email !== pilot.email), newPilot]
  writeLocal("envysky:pilots", updated)
  return newPilot
}

// AIRCRAFTS
export async function getAircrafts(): Promise<Aircraft[]> {
  console.log(`[v0] getAircrafts called, hasDatabase: ${hasDatabase()}`)

  if (hasDatabase()) {
    try {
      const aircrafts = await apiCall<Aircraft[]>("/aircrafts")
      console.log(`[v0] getAircrafts from API successful:`, aircrafts)
      return aircrafts
    } catch (error) {
      console.warn("[v0] Database unavailable for getAircrafts, using localStorage:", error)
      const localAircrafts = readLocal<Aircraft[]>("envysky:aircrafts", [])
      console.log(`[v0] getAircrafts from localStorage:`, localAircrafts)
      return localAircrafts
    }
  }
  const localAircrafts = readLocal<Aircraft[]>("envysky:aircrafts", [])
  console.log(`[v0] getAircrafts from localStorage (no database):`, localAircrafts)
  return localAircrafts
}

export async function saveAircraft(aircraft: Omit<Aircraft, "id" | "createdAt">): Promise<Aircraft> {
  if (hasDatabase()) {
    try {
      return await apiCall<Aircraft>("/aircrafts", {
        method: "POST",
        body: JSON.stringify(aircraft),
      })
    } catch (error) {
      console.warn("Database unavailable, using localStorage:", error)
      const newAircraft: Aircraft = {
        ...aircraft,
        id: newId(),
        createdAt: new Date().toISOString(),
      }
      const aircrafts = readLocal<Aircraft[]>("envysky:aircrafts", [])
      const updated = [...aircrafts, newAircraft]
      writeLocal("envysky:aircrafts", updated)
      return newAircraft
    }
  }

  const newAircraft: Aircraft = {
    ...aircraft,
    id: newId(),
    createdAt: new Date().toISOString(),
  }
  const aircrafts = readLocal<Aircraft[]>("envysky:aircrafts", [])
  const updated = [...aircrafts, newAircraft]
  writeLocal("envysky:aircrafts", updated)
  return newAircraft
}

// ✅ NUEVA FUNCIÓN PARA ACTUALIZAR AIRCRAFTS
export async function updateAircraft(aircraft: Aircraft): Promise<Aircraft> {
  if (hasDatabase()) {
    try {
      return await apiCall<Aircraft>(`/aircrafts/${aircraft.id}`, {
        method: "PUT",
        body: JSON.stringify(aircraft),
      })
    } catch (error) {
      console.warn("Database unavailable, using localStorage:", error)
    }
  }

  // Fallback to localStorage
  const aircrafts = readLocal<Aircraft[]>("envysky:aircrafts", [])
  const index = aircrafts.findIndex((a) => a.id === aircraft.id)

  if (index !== -1) {
    aircrafts[index] = aircraft
    writeLocal("envysky:aircrafts", aircrafts)
  }

  return aircraft
}

// PURCHASES
export async function getPurchases(): Promise<Purchase[]> {
  console.log(`[v0] getPurchases called, hasDatabase: ${hasDatabase()}`)

  if (hasDatabase()) {
    try {
      const purchases = await apiCall<Purchase[]>("/purchases")
      console.log(`[v0] getPurchases from API successful:`, purchases)
      return purchases
    } catch (error) {
      console.warn("[v0] Database unavailable for getPurchases, using localStorage:", error)
      const localPurchases = readLocal<Purchase[]>("envysky:purchases", [])
      console.log(`[v0] getPurchases from localStorage:`, localPurchases)
      return localPurchases
    }
  }
  const localPurchases = readLocal<Purchase[]>("envysky:purchases", [])
  console.log(`[v0] getPurchases from localStorage (no database):`, localPurchases)
  return localPurchases
}

export async function savePurchase(purchase: {
  pilotEmail: string
  hours: number
  date: string
  fullName?: string
  phone?: string
  country?: string
  birthDate?: string
  licenseType?: string
}): Promise<Purchase> {
  if (hasDatabase()) {
    try {
      return await apiCall<Purchase>("/purchases", {
        method: "POST",
        body: JSON.stringify(purchase),
      })
    } catch (error) {
      console.warn("Database unavailable, using localStorage:", error)
      // Fallback logic for localStorage
      const pilots = readLocal<Pilot[]>("envysky:pilots", [])
      let pilot = pilots.find((p) => p.email.toLowerCase() === purchase.pilotEmail.toLowerCase())

      if (!pilot) {
        pilot = {
          id: newId(),
          fullName: purchase.fullName || "Sin nombre",
          email: purchase.pilotEmail,
          phone: purchase.phone || "",
          country: purchase.country || "",
          birthDate: purchase.birthDate || "",
          licenseType: purchase.licenseType || "",
          createdAt: new Date().toISOString(),
        }
        writeLocal("envysky:pilots", [...pilots, pilot])
      }

      const newPurchase: Purchase = {
        id: newId(),
        pilotId: pilot.id,
        hours: purchase.hours,
        date: purchase.date,
        createdAt: new Date().toISOString(),
      }

      const purchases = readLocal<Purchase[]>("envysky:purchases", [])
      const updated = [...purchases, newPurchase]
      writeLocal("envysky:purchases", updated)
      return newPurchase
    }
  }

  // localStorage fallback
  const pilots = readLocal<Pilot[]>("envysky:pilots", [])
  let pilot = pilots.find((p) => p.email.toLowerCase() === purchase.pilotEmail.toLowerCase())

  if (!pilot) {
    pilot = {
      id: newId(),
      fullName: purchase.fullName || "Sin nombre",
      email: purchase.pilotEmail,
      phone: purchase.phone || "",
      country: purchase.country || "",
      birthDate: purchase.birthDate || "",
      licenseType: purchase.licenseType || "",
      createdAt: new Date().toISOString(),
    }
    writeLocal("envysky:pilots", [...pilots, pilot])
  }

  const newPurchase: Purchase = {
    id: newId(),
    pilotId: pilot.id,
    hours: purchase.hours,
    date: purchase.date,
    createdAt: new Date().toISOString(),
  }

  const purchases = readLocal<Purchase[]>("envysky:purchases", [])
  const updated = [...purchases, newPurchase]
  writeLocal("envysky:purchases", updated)
  return newPurchase
}

// FLIGHTS
export async function getFlights(): Promise<Flight[]> {
  console.log(`[v0] getFlights called, hasDatabase: ${hasDatabase()}`)

  if (hasDatabase()) {
    try {
      const flights = await apiCall<Flight[]>("/flights")
      console.log(`[v0] getFlights from API successful:`, flights)
      return flights
    } catch (error) {
      console.warn("[v0] Database unavailable for getFlights, using localStorage:", error)
      const localFlights = readLocal<Flight[]>("envysky:flights", [])
      console.log(`[v0] getFlights from localStorage:`, localFlights)
      return localFlights
    }
  }
  const localFlights = readLocal<Flight[]>("envysky:flights", [])
  console.log(`[v0] getFlights from localStorage (no database):`, localFlights)
  return localFlights
}

export async function saveFlight(flight: Omit<Flight, "id" | "createdAt">): Promise<Flight> {
  if (hasDatabase()) {
    try {
      return await apiCall<Flight>("/flights", {
        method: "POST",
        body: JSON.stringify(flight),
      })
    } catch (error) {
      console.warn("Database unavailable, using localStorage:", error)
      const newFlight: Flight = {
        ...flight,
        id: newId(),
        createdAt: new Date().toISOString(),
      }
      const flights = readLocal<Flight[]>("envysky:flights", [])
      const updated = [...flights, newFlight]
      writeLocal("envysky:flights", updated)
      return newFlight
    }
  }

  const newFlight: Flight = {
    ...flight,
    id: newId(),
    createdAt: new Date().toISOString(),
  }
  const flights = readLocal<Flight[]>("envysky:flights", [])
  const updated = [...flights, newFlight]
  writeLocal("envysky:flights", updated)
  return newFlight
}

export async function updateFlightStatus(
  flightId: string,
  status: "scheduled" | "completed",
  tachometerData?: {
    tachometerStart?: number
    tachometerEnd?: number
  },
): Promise<Flight> {
  if (hasDatabase()) {
    try {
      return await apiCall<Flight>("/flights", {
        method: "PUT",
        body: JSON.stringify({
          id: flightId,
          status,
          ...tachometerData,
        }),
      })
    } catch (error) {
      console.warn("Database unavailable, using localStorage:", error)
      const flights = readLocal<Flight[]>("envysky:flights", [])
      const updated = flights.map((f) =>
        f.id === flightId
          ? {
              ...f,
              status,
              ...(tachometerData?.tachometerStart !== undefined && {
                tachometerStart: tachometerData.tachometerStart,
              }),
              ...(tachometerData?.tachometerEnd !== undefined && { tachometerEnd: tachometerData.tachometerEnd }),
              // Update duration based on tachometer if both values are available
              ...(tachometerData?.tachometerStart !== undefined &&
                tachometerData?.tachometerEnd !== undefined && {
                  duration: tachometerData.tachometerEnd - tachometerData.tachometerStart,
                }),
            }
          : f,
      )
      writeLocal("envysky:flights", updated)
      return updated.find((f) => f.id === flightId)!
    }
  }

  const flights = readLocal<Flight[]>("envysky:flights", [])
  const updated = flights.map((f) =>
    f.id === flightId
      ? {
          ...f,
          status,
          ...(tachometerData?.tachometerStart !== undefined && { tachometerStart: tachometerData.tachometerStart }),
          ...(tachometerData?.tachometerEnd !== undefined && { tachometerEnd: tachometerData.tachometerEnd }),
          // Update duration based on tachometer if both values are available
          ...(tachometerData?.tachometerStart !== undefined &&
            tachometerData?.tachometerEnd !== undefined && {
              duration: tachometerData.tachometerEnd - tachometerData.tachometerStart,
            }),
        }
      : f,
  )
  writeLocal("envysky:flights", updated)
  return updated.find((f) => f.id === flightId)!
}

// Database functions that work with both localStorage (fallback) and Neon (production)
import type { Aircraft, Flight, Pilot, Purchase } from "./types"
import { newId } from "./id"

const API_BASE = "/api"

// Check if we're in production with database
const hasDatabase = () => typeof window !== "undefined" && window.location.hostname !== "localhost"

// Generic API call function
async function apiCall<T>(endpoint: string, options?: RequestInit): Promise<T> {
  try {
    const response = await fetch(`${API_BASE}${endpoint}`, {
      headers: {
        "Content-Type": "application/json",
        ...options?.headers,
      },
      ...options,
    })

    if (!response.ok) {
      const errorText = await response.text()
      console.error(`API call to ${endpoint} failed:`, response.status, errorText)
      throw new Error(`API call failed: ${response.status} ${response.statusText}`)
    }

    return await response.json()
  } catch (error) {
    console.error(`API call to ${endpoint} failed:`, error)
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
  if (hasDatabase()) {
    try {
      return await apiCall<Pilot[]>("/pilots")
    } catch (error) {
      console.warn("Database unavailable, using localStorage:", error)
      return readLocal<Pilot[]>("envysky:pilots", [])
    }
  }
  return readLocal<Pilot[]>("envysky:pilots", [])
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
  if (hasDatabase()) {
    try {
      return await apiCall<Aircraft[]>("/aircrafts")
    } catch (error) {
      console.warn("Database unavailable, using localStorage:", error)
      return readLocal<Aircraft[]>("envysky:aircrafts", [])
    }
  }
  return readLocal<Aircraft[]>("envysky:aircrafts", [])
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

// PURCHASES
export async function getPurchases(): Promise<Purchase[]> {
  if (hasDatabase()) {
    try {
      return await apiCall<Purchase[]>("/purchases")
    } catch (error) {
      console.warn("Database unavailable, using localStorage:", error)
      return readLocal<Purchase[]>("envysky:purchases", [])
    }
  }
  return readLocal<Purchase[]>("envysky:purchases", [])
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
  if (hasDatabase()) {
    try {
      return await apiCall<Flight[]>("/flights")
    } catch (error) {
      console.warn("Database unavailable, using localStorage:", error)
      return readLocal<Flight[]>("envysky:flights", [])
    }
  }
  return readLocal<Flight[]>("envysky:flights", [])
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

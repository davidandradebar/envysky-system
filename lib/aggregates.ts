import type { Aircraft, Flight, Purchase } from "./types"
import { calculateFlightHours } from "./types"

// Pilot aggregates: purchased, flown, remaining
export function calcPilotHours(pilotId: string, purchases: Purchase[], flights: Flight[]) {
  // Ensure we have valid arrays
  const validPurchases = Array.isArray(purchases) ? purchases : []
  const validFlights = Array.isArray(flights) ? flights : []

  // DEBUG: Log para ver qué vuelos estamos procesando
  console.log(`🔍 Calculando horas para piloto ${pilotId}`)
  console.log(`📊 Total vuelos disponibles: ${validFlights.length}`)

  // Filtrar vuelos donde este piloto participó (como principal o copiloto)
  const pilotFlights = validFlights.filter(
    (f) => f && (f.pilotId === pilotId || f.pilotId2 === pilotId) && f.status === "completed",
  )

  console.log(
    `✈️ Vuelos donde participó este piloto:`,
    pilotFlights.map((f) => ({
      id: f.id,
      date: f.date,
      pilotId: f.pilotId,
      pilotId2: f.pilotId2,
      isPilot1: f.pilotId === pilotId,
      isPilot2: f.pilotId2 === pilotId,
      duration: calculateFlightHours(f),
    })),
  )

  const purchased = validPurchases
    .filter((p) => p && p.pilotId === pilotId)
    .reduce((sum, p) => {
      const hours = typeof p.hours === "number" ? p.hours : Number.parseFloat(p.hours) || 0
      return sum + hours
    }, 0)

  const flown = pilotFlights.reduce((sum, f) => {
    // Use new tachometer calculation
    const duration = calculateFlightHours(f)
    console.log(`🕐 Vuelo ${f.id}: ${duration} horas`)
    return sum + duration
  }, 0)

  const remaining = purchased - flown

  console.log(`📈 Resumen piloto ${pilotId}: Compradas: ${purchased}, Voladas: ${flown}, Restantes: ${remaining}`)

  return {
    purchased: Number(purchased) || 0,
    flown: Number(flown) || 0,
    remaining: Number(remaining) || 0,
  }
}

// Calculate aircraft accumulated hours
export function calcAircraftAccumulatedHours(aircraft: Aircraft, flights: Flight[]) {
  const flownHours = flights
    .filter((f) => f.aircraftId === aircraft.id && f.status === "completed")
    .reduce((sum, f) => sum + calculateFlightHours(f), 0)

  const accumulated = aircraft.initialHours + flownHours

  return {
    initial: aircraft.initialHours,
    flown: flownHours,
    accumulated,
  }
}

// Calculate aircraft maintenance status
export function calcAircraftMaintenance(aircraft: Aircraft, accumulatedHours: number) {
  // Use lastMaintenanceAt if available, otherwise use initialHours
  const lastMaintenance = aircraft.lastMaintenanceAt || aircraft.initialHours
  
  // Calculate hours since last maintenance
  const hoursSinceLastMaintenance = accumulatedHours - lastMaintenance
  
  // Next maintenance should be at: last maintenance + interval
  const nextMaintenanceAt = lastMaintenance + aircraft.maintenanceIntervalHours
  const dueInHours = nextMaintenanceAt - accumulatedHours
  const dueNow = dueInHours <= 0

  return {
    nextMaintenanceAt,
    dueInHours,
    dueNow,
    hoursSinceLastMaintenance
  }
}

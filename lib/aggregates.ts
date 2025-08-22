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

// Aircraft accumulated hours and maintenance
export function calcAircraftAccumulatedHours(aircraft: Aircraft, flights: Flight[]) {
  // Ensure we have valid data
  if (!aircraft || !Array.isArray(flights)) {
    return { accumulated: 0 }
  }

  const flown = flights
    .filter((f) => f && f.aircraftId === aircraft.id && f.status === "completed")
    .reduce((sum, f) => {
      // Use new tachometer calculation
      const duration = calculateFlightHours(f)
      return sum + duration
    }, 0)

  const initialHours =
    typeof aircraft.initialHours === "number" ? aircraft.initialHours : Number.parseFloat(aircraft.initialHours) || 0
  const accumulated = initialHours + flown

  return { accumulated: Number(accumulated) || 0 }
}

export function calcAircraftMaintenance(aircraft: Aircraft, accumulated: number) {
  // Ensure we have valid data
  if (!aircraft) {
    return { dueNow: false, dueInHours: 0 }
  }

  const interval =
    typeof aircraft.maintenanceIntervalHours === "number"
      ? aircraft.maintenanceIntervalHours
      : Number.parseFloat(aircraft.maintenanceIntervalHours) || 100

  const validAccumulated = typeof accumulated === "number" ? accumulated : Number.parseFloat(accumulated) || 0

  if (interval <= 0) return { dueNow: false, dueInHours: Number.POSITIVE_INFINITY }

  const remainder = validAccumulated % interval
  const dueInHours = interval - remainder
  const dueNow = dueInHours === interval || dueInHours <= 0.01 // numeric quirks

  return {
    dueNow,
    dueInHours: dueNow ? 0 : Number(dueInHours) || 0,
  }
}

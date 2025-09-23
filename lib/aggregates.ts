// Aggregate functions for calculating pilot hours, aircraft hours, etc.
import type { Aircraft, Flight, Purchase } from "./types"
import { calculateFlightHours } from "./types"

// Calculate pilot hours (purchased, flown, remaining)
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

  console.log(`✈️ Vuelos donde participó este piloto: ${pilotFlights.length}`)

  // Log detallado de cada vuelo
  pilotFlights.forEach((f) => {
    console.log(`   🛫 Vuelo ${f.id}: ${f.date} - Piloto: ${f.pilotId}, Copiloto: ${f.pilotId2 || "ninguno"}`)
    console.log(`      Duración: ${calculateFlightHours(f)} horas`)
    if (f.tachometerStart !== undefined && f.tachometerEnd !== undefined) {
      console.log(`      Tacómetro: ${f.tachometerStart} → ${f.tachometerEnd}`)
    }
  })

  // Calcular horas compradas
  const purchased = validPurchases
    .filter((p) => p && p.pilotId === pilotId)
    .reduce((sum, p) => {
      const hours = typeof p.hours === "number" ? p.hours : Number.parseFloat(String(p.hours)) || 0
      return sum + hours
    }, 0)

  // Calcular horas voladas
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
  // Ensure we have valid arrays
  const validFlights = Array.isArray(flights) ? flights : []

  const flownHours = validFlights
    .filter((f) => f && f.aircraftId === aircraft.id && f.status === "completed")
    .reduce((sum, f) => sum + calculateFlightHours(f), 0)

  const accumulated = aircraft.initialHours + flownHours

  return {
    initial: aircraft.initialHours,
    flown: flownHours,
    accumulated,
  }
}

export function calcAircraftMaintenance(aircraft: Aircraft, accumulatedHours: number) {
  // Calculate how many maintenance intervals have passed since the initial hours
  const hoursSinceInitial = accumulatedHours - aircraft.initialHours
  const intervalsCompleted = Math.floor(hoursSinceInitial / aircraft.maintenanceIntervalHours)

  // Next maintenance should be at: initial hours + (completed intervals + 1) * interval
  const nextMaintenanceAt = aircraft.initialHours + (intervalsCompleted + 1) * aircraft.maintenanceIntervalHours
  const dueInHours = nextMaintenanceAt - accumulatedHours
  const dueNow = dueInHours <= 0

  return {
    nextMaintenanceAt,
    dueInHours,
    dueNow,
  }
}

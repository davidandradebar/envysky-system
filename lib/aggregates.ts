// Aggregate functions for calculating pilot hours, aircraft hours, etc.
import type { Aircraft, Flight, Purchase } from "./types"
import { calculateFlightHours } from "./types"

// Calculate pilot hours (purchased, flown, remaining)
export function calcPilotHours(pilotId: string, purchases: Purchase[], flights: Flight[]) {
  // Ensure we have valid arrays
  const validPurchases = Array.isArray(purchases) ? purchases : []
  const validFlights = Array.isArray(flights) ? flights : []

  console.log(`🔍 Calculando horas para piloto ${pilotId}`)
  console.log(`📊 Total vuelos disponibles: ${validFlights.length}`)
  console.log(`💰 Total compras disponibles: ${validPurchases.length}`)

  // Filtrar vuelos donde este piloto participó (como principal o copiloto)
  const pilotFlights = validFlights.filter(
    (f) => f && (f.pilotId === pilotId || f.pilotId2 === pilotId) && f.status === "completed",
  )

  console.log(`✈️ Vuelos donde participó este piloto: ${pilotFlights.length}`)

  // Calcular horas compradas
  const purchased = validPurchases
    .filter((p) => p && p.pilotId === pilotId)
    .reduce((sum, p) => {
      const hours = typeof p.hours === "number" ? p.hours : Number.parseFloat(String(p.hours)) || 0
      console.log(`💰 Compra: ${hours} horas`)
      return sum + hours
    }, 0)

  // Calcular horas voladas usando tachómetro
  const flown = pilotFlights.reduce((sum, f) => {
    const duration = calculateFlightHours(f)
    console.log(`🕐 Vuelo ${f.id}: ${duration} horas (tacómetro: ${f.tachometerStart} → ${f.tachometerEnd})`)
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

  console.log(`🛩️ Calculando horas para avión ${aircraft.tailNumber}`)
  console.log(`📊 Horas iniciales: ${aircraft.initialHours}`)

  const aircraftFlights = validFlights.filter((f) => f && f.aircraftId === aircraft.id && f.status === "completed")

  console.log(`✈️ Vuelos de este avión: ${aircraftFlights.length}`)

  const flownHours = aircraftFlights.reduce((sum, f) => {
    const duration = calculateFlightHours(f)
    console.log(`🕐 Vuelo ${f.id}: ${duration} horas`)
    return sum + duration
  }, 0)

  const accumulated = aircraft.initialHours + flownHours

  console.log(
    `📈 Avión ${aircraft.tailNumber}: Inicial: ${aircraft.initialHours}, Voladas: ${flownHours}, Total: ${accumulated}`,
  )

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

  console.log(
    `🔧 Mantenimiento ${aircraft.tailNumber}: Próximo en ${nextMaintenanceAt}, Faltan ${dueInHours}, ¿Ahora? ${dueNow}`,
  )

  return {
    nextMaintenanceAt,
    dueInHours,
    dueNow,
  }
}

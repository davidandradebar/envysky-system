import type { Aircraft, Flight, Purchase } from "./types"
import { calculateFlightHours } from "./types"

export function calcPilotHours(pilotId: string, purchases: Purchase[], flights: Flight[]) {
  const validPurchases = Array.isArray(purchases) ? purchases : []
  const validFlights = Array.isArray(flights) ? flights : []

  const pilotFlights = validFlights.filter(
    (f) => f && (f.pilotId === pilotId || f.pilotId2 === pilotId) && f.status === "completed",
  )

  const purchased = validPurchases
    .filter((p) => p && p.pilotId === pilotId)
    .reduce((sum, p) => sum + (Number(p.hours) || 0), 0)

  const flown = pilotFlights.reduce((sum, f) => sum + calculateFlightHours(f), 0)

  return {
    purchased: Number(purchased) || 0,
    flown: Number(flown) || 0,
    remaining: Number(purchased - flown) || 0,
  }
}

export function calcAircraftAccumulatedHours(aircraft: Aircraft, flights: Flight[]) {
  const validFlights = Array.isArray(flights) ? flights : []
  const aircraftFlights = validFlights.filter((f) => f && f.aircraftId === aircraft.id && f.status === "completed")
  const flownHours = aircraftFlights.reduce((sum, f) => sum + calculateFlightHours(f), 0)

  return {
    initial: aircraft.initialHours,
    flown: flownHours,
    accumulated: aircraft.initialHours + flownHours,
  }
}

export function calcAircraftMaintenance(aircraft: Aircraft, accumulatedHours: number) {
  const hoursSinceInitial = accumulatedHours - aircraft.initialHours
  const intervalsCompleted = Math.floor(hoursSinceInitial / aircraft.maintenanceIntervalHours)
  const nextMaintenanceAt = aircraft.initialHours + (intervalsCompleted + 1) * aircraft.maintenanceIntervalHours
  const dueInHours = nextMaintenanceAt - accumulatedHours

  return {
    nextMaintenanceAt,
    dueInHours,
    dueNow: dueInHours <= 0,
  }
}

import type { Aircraft, Flight, Purchase } from "./types"

// Pilot aggregates: purchased, flown, remaining
export function calcPilotHours(pilotId: string, purchases: Purchase[], flights: Flight[]) {
  const purchased = purchases.filter((p) => p.pilotId === pilotId).reduce((sum, p) => sum + (p.hours || 0), 0)
  const flown = flights
    .filter((f) => f.pilotId === pilotId && f.status === "completed")
    .reduce((sum, f) => sum + (f.duration || 0), 0)
  const remaining = purchased - flown
  return { purchased, flown, remaining }
}

// Aircraft accumulated hours and maintenance
export function calcAircraftAccumulatedHours(aircraft: Aircraft, flights: Flight[]) {
  const flown = flights
    .filter((f) => f.aircraftId === aircraft.id && f.status === "completed")
    .reduce((sum, f) => sum + (f.duration || 0), 0)
  const accumulated = (aircraft.initialHours || 0) + flown
  return { accumulated }
}

export function calcAircraftMaintenance(aircraft: Aircraft, accumulated: number) {
  const interval = aircraft.maintenanceIntervalHours || 100
  if (interval <= 0) return { dueNow: false, dueInHours: Number.POSITIVE_INFINITY }
  const remainder = accumulated % interval
  const dueInHours = interval - remainder
  const dueNow = dueInHours === interval || dueInHours <= 0.01 // numeric quirks
  return { dueNow, dueInHours: dueNow ? 0 : dueInHours }
}

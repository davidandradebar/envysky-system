import type { Aircraft, Flight, Purchase } from "./types"

export function calcPilotHours(pilotId: string, purchases: Purchase[], flights: Flight[]) {
  const purchased = purchases.filter((p) => p.pilotId === pilotId).reduce((sum, p) => sum + (p.hours || 0), 0)

  const flown = flights
    .filter((f) => f.pilotId === pilotId || f.pilotId2 === pilotId)
    .filter((f) => f.status === "completed")
    .reduce((sum, f) => {
      if (f.tachometerStart !== undefined && f.tachometerEnd !== undefined) {
        return sum + (f.tachometerEnd - f.tachometerStart)
      }
      return sum + (f.duration || 0)
    }, 0)

  return {
    purchased,
    flown,
    remaining: purchased - flown,
  }
}

export function calcAircraftAccumulatedHours(aircraft: Aircraft, flights: Flight[]) {
  const flownHours = flights
    .filter((f) => f.aircraftId === aircraft.id)
    .filter((f) => f.status === "completed")
    .reduce((sum, f) => {
      if (f.tachometerStart !== undefined && f.tachometerEnd !== undefined) {
        return sum + (f.tachometerEnd - f.tachometerStart)
      }
      return sum + (f.duration || 0)
    }, 0)

  const accumulated = aircraft.initialHours + flownHours

  return {
    initial: aircraft.initialHours,
    flown: flownHours,
    accumulated,
  }
}

export function calcAircraftMaintenance(aircraft: Aircraft, accumulatedHours: number) {
  const hoursSinceInitial = accumulatedHours - aircraft.initialHours
  const intervalsCompleted = Math.floor(hoursSinceInitial / aircraft.maintenanceIntervalHours)
  const nextMaintenanceAt = aircraft.initialHours + (intervalsCompleted + 1) * aircraft.maintenanceIntervalHours
  const dueInHours = nextMaintenanceAt - accumulatedHours
  const dueNow = dueInHours <= 0

  return {
    nextMaintenanceAt,
    dueInHours,
    dueNow,
  }
}

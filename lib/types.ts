// Types for the application
export interface Pilot {
  id: string
  fullName: string
  email: string
  phone?: string
  country?: string
  birthDate?: string
  licenseType?: string
  createdAt: string
}

export interface Aircraft {
  id: string
  tailNumber: string
  model: string
  initialHours: number
  maintenanceIntervalHours: number
  status: "active" | "maintenance"
  createdAt: string
}

export interface Flight {
  id: string
  pilotId: string
  pilotId2?: string
  aircraftId: string
  date: string
  time: string
  duration: number
  status: "scheduled" | "completed" | "cancelled"
  notes?: string
  tachometerStart?: number
  tachometerEnd?: number
  createdAt: string
}

export interface Purchase {
  id: string
  pilotId: string
  hours: number
  date: string
  createdAt: string
}

// Helper function to calculate flight hours based on tachometer or duration
export function calculateFlightHours(flight: Flight): number {
  // If tachometer values are available, use them
  if (flight.tachometerStart !== undefined && flight.tachometerEnd !== undefined) {
    return flight.tachometerEnd - flight.tachometerStart
  }

  // Otherwise use duration
  return flight.duration
}

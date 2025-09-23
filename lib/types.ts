// Base types for the flight management system
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
  pilotId2?: string // Second pilot (optional)
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

// Helper function to calculate flight hours
export function calculateFlightHours(flight: Flight): number {
  // Si no hay vuelo, retornar 0
  if (!flight) return 0

  // Si tenemos datos del tacómetro, usarlos
  if (
    flight.tachometerStart !== undefined &&
    flight.tachometerEnd !== undefined &&
    flight.tachometerStart !== null &&
    flight.tachometerEnd !== null
  ) {
    const start = Number(flight.tachometerStart)
    const end = Number(flight.tachometerEnd)

    // Verificar que los valores son números válidos
    if (!isNaN(start) && !isNaN(end) && end >= start) {
      return end - start
    }
  }

  // Si no hay tacómetro o hay un problema, usar duration
  return typeof flight.duration === "number" ? flight.duration : 0
}

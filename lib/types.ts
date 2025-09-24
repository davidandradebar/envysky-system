export type Pilot = {
  id: string
  fullName: string
  email: string
  phone?: string
  country?: string
  birthDate?: string // YYYY-MM-DD
  licenseType?: string
  createdAt: string
}

export type Aircraft = {
  id: string
  tailNumber: string
  model: string
  initialHours: number
  maintenanceIntervalHours: number
  status: "active" | "maintenance"
  createdAt: string
}

export type Purchase = {
  id: string
  pilotId: string
  hours: number
  date: string // YYYY-MM-DD
  createdAt: string
}

export type Flight = {
  id: string
  pilotId: string
  pilotId2?: string // Copiloto opcional
  aircraftId: string
  date: string // YYYY-MM-DD
  time: string // HH:mm
  duration: number // hours (decimal) - DEPRECATED: usar tacómetro
  tachometerStart?: number // Tacómetro inicial
  tachometerEnd?: number // Tacómetro final
  status: "scheduled" | "completed"
  notes?: string
  createdAt: string
}

// Helper function para calcular horas desde tacómetro
export function calculateFlightHours(flight: Flight): number {
  // Si tiene tacómetros, usar esos
  if (flight.tachometerEnd !== undefined && flight.tachometerStart !== undefined) {
    return flight.tachometerEnd - flight.tachometerStart
  }
  // Fallback a duration para compatibilidad con vuelos antiguos
  return flight.duration || 0
}

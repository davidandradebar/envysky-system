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
  // Verificar que el vuelo existe
  if (!flight) {
    console.warn("⚠️ Intento de calcular horas en un vuelo nulo o indefinido")
    return 0
  }

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
    if (!isNaN(start) && !isNaN(end)) {
      const hours = end - start
      // Verificar que el resultado es positivo
      if (hours >= 0) {
        return hours
      } else {
        console.warn(`⚠️ Cálculo de tacómetro negativo en vuelo ${flight.id}: ${start} → ${end}`)
      }
    } else {
      console.warn(
        `⚠️ Valores de tacómetro no numéricos en vuelo ${flight.id}: ${flight.tachometerStart} → ${flight.tachometerEnd}`,
      )
    }
  }

  // Si no hay tacómetro o hay un problema, usar duration
  // Asegurarse de que duration es un número
  const duration = typeof flight.duration === "number" ? flight.duration : Number(flight.duration)

  if (!isNaN(duration)) {
    return duration
  }

  // Si todo falla, retornar 0
  console.warn(`⚠️ No se pudo calcular horas para vuelo ${flight.id}`)
  return 0
}

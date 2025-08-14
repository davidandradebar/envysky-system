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
  aircraftId: string
  date: string // YYYY-MM-DD
  time: string // HH:mm
  duration: number // hours (decimal)
  status: "scheduled" | "completed"
  notes?: string
  createdAt: string
}

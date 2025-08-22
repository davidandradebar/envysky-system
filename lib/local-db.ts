"use client"

import type { Aircraft, Flight, Pilot, Purchase } from "./types"
import { newId } from "./id"

const K_PILOTS = "envysky:pilots"
const K_AIRCRAFTS = "envysky:aircrafts"
const K_PURCHASES = "envysky:purchases"
const K_FLIGHTS = "envysky:flights"

function read<T>(key: string, fallback: T): T {
  if (typeof window === "undefined") return fallback
  try {
    const raw = localStorage.getItem(key)
    return raw ? (JSON.parse(raw) as T) : fallback
  } catch {
    return fallback
  }
}
function write<T>(key: string, value: T) {
  if (typeof window === "undefined") return
  localStorage.setItem(key, JSON.stringify(value))
}

// Pilots
export function getPilots(): Pilot[] {
  return read<Pilot[]>(K_PILOTS, [])
}
export function savePilots(p: Pilot[]) {
  write(K_PILOTS, p)
}
export function getPilotByEmail(email: string): Pilot | undefined {
  return getPilots().find((p) => p.email.toLowerCase() === email.toLowerCase())
}
export function getPilotById(id: string): Pilot | undefined {
  return getPilots().find((p) => p.id === id)
}
export function upsertPilotByEmail(data: {
  fullName: string
  email: string
  phone?: string
  country?: string
  birthDate?: string
  licenseType?: string
}): Pilot {
  const existing = getPilotByEmail(data.email)
  if (existing) {
    const updated: Pilot = { ...existing, ...data }
    const all = getPilots().map((p) => (p.id === updated.id ? updated : p))
    savePilots(all)
    return updated
  }
  const created: Pilot = {
    id: newId(),
    fullName: data.fullName,
    email: data.email,
    phone: data.phone,
    country: data.country,
    birthDate: data.birthDate,
    licenseType: data.licenseType,
    createdAt: new Date().toISOString(),
  }
  const all = [...getPilots(), created]
  savePilots(all)
  return created
}

// Aircrafts
export function getAircrafts(): Aircraft[] {
  return read<Aircraft[]>(K_AIRCRAFTS, [])
}
export function saveAircrafts(a: Aircraft[]) {
  write(K_AIRCRAFTS, a)
}
export function getAircraftById(id: string): Aircraft | undefined {
  return getAircrafts().find((a) => a.id === id)
}
export function addAircraft(data: {
  tailNumber: string
  model: string
  initialHours: number
  maintenanceIntervalHours: number
  status: "active" | "maintenance"
}): Aircraft {
  const created: Aircraft = {
    id: newId(),
    tailNumber: data.tailNumber,
    model: data.model,
    initialHours: data.initialHours || 0,
    maintenanceIntervalHours: data.maintenanceIntervalHours || 100,
    status: data.status,
    createdAt: new Date().toISOString(),
  }
  return created
}
export function setAircraftStatus(id: string, status: "active" | "maintenance"): Aircraft[] {
  const all = getAircrafts().map((a) => (a.id === id ? { ...a, status } : a))
  saveAircrafts(all)
  return all
}

// Purchases
export function getPurchases(): Purchase[] {
  return read<Purchase[]>(K_PURCHASES, [])
}
export function savePurchases(p: Purchase[]) {
  write(K_PURCHASES, p)
}
export function addPurchase(data: { pilotId: string; hours: number; date: string }): Purchase {
  const created: Purchase = {
    id: newId(),
    pilotId: data.pilotId,
    hours: data.hours,
    date: data.date,
    createdAt: new Date().toISOString(),
  }
  return created
}

// Flights
export function getFlights(): Flight[] {
  return read<Flight[]>(K_FLIGHTS, [])
}
export function saveFlights(fs: Flight[]) {
  write(K_FLIGHTS, fs)
}
export function addFlight(data: {
  pilotId: string
  aircraftId: string
  date: string
  time: string
  duration: number
  status: "scheduled" | "completed"
  notes?: string
}): Flight {
  const created: Flight = {
    id: newId(),
    pilotId: data.pilotId,
    aircraftId: data.aircraftId,
    date: data.date,
    time: data.time,
    duration: data.duration,
    status: data.status,
    notes: data.notes,
    createdAt: new Date().toISOString(),
  }
  return created
}
export function completeFlight(flightId: string): Flight[] {
  const all = getFlights().map((f) => (f.id === flightId ? { ...f, status: "completed" } : f))
  return all
}

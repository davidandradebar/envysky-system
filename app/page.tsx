"use client"

import React from "react"

import { useEffect, useMemo, useState } from "react"
import Link from "next/link"
import { BadgeCheck, CheckCircle2, Clock, Plane, PlusCircle, Rocket, ShieldAlert, UserPlus, Gauge } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Textarea } from "@/components/ui/textarea"
import { Separator } from "@/components/ui/separator"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { PilotReportButton } from "@/components/pilot-report-button"
import { AircraftReportButton } from "@/components/aircraft-report-button"

import type { Aircraft, Flight, Pilot, Purchase } from "@/lib/types"
import { calculateFlightHours } from "@/lib/types"
import {
  getAircrafts,
  getFlights,
  getPilots,
  getPurchases,
  savePurchase,
  saveAircraft,
  updateAircraft,
  saveFlight,
  updateFlightStatus,
} from "@/lib/db"
import { calcAircraftAccumulatedHours, calcAircraftMaintenance, calcPilotHours } from "@/lib/aggregates"
import { cn } from "@/lib/utils"

// Helper function to safely format numbers
const safeToFixed = (value: any, decimals = 1): string => {
  const num = typeof value === "number" ? value : Number.parseFloat(value) || 0
  return num.toFixed(decimals)
}

function SectionHeader(props: { title: string; description?: string; icon?: React.ReactNode }) {
  return (
    <div className="flex items-center gap-3">
      <div className="rounded-md bg-muted p-2">{props.icon ?? <Rocket className="h-4 w-4" />}</div>
      <div>
        <div className="font-semibold">{props.title}</div>
        {props.description ? <div className="text-sm text-muted-foreground">{props.description}</div> : null}
      </div>
    </div>
  )
}

// Component for completing flights with tachometer - IMPROVED VERSION
function CompleteFlightDialog({
  flight,
  aircrafts,
  pilots,
  onComplete,
}: {
  flight: Flight
  aircrafts: Aircraft[]
  pilots: Pilot[]
  onComplete: () => void
}) {
  const [open, setOpen] = useState(false)
  const [tachometerStart, setTachometerStart] = useState(flight.tachometerStart?.toString() || "")
  const [tachometerEnd, setTachometerEnd] = useState(flight.tachometerEnd?.toString() || "")
  const [isSubmitting, setIsSubmitting] = useState(false)

  const aircraft = aircrafts.find((a) => a.id === flight.aircraftId)
  const pilot1 = pilots.find((p) => p.id === flight.pilotId)
  const pilot2 = flight.pilotId2 ? pilots.find((p) => p.id === flight.pilotId2) : null

  const calculatedHours = useMemo(() => {
    const start = Number.parseFloat(tachometerStart) || 0
    const end = Number.parseFloat(tachometerEnd) || 0
    return end > start ? end - start : 0
  }, [tachometerStart, tachometerEnd])

  const handleComplete = async () => {
    if (!tachometerStart || !tachometerEnd) {
      alert("Please enter both tachometer values.")
      return
    }

    const start = Number.parseFloat(tachometerStart)
    const end = Number.parseFloat(tachometerEnd)

    if (isNaN(start) || isNaN(end)) {
      alert("Please enter valid numeric values.")
      return
    }

    if (end <= start) {
      alert("The final tachometer value must be greater than the initial one.")
      return
    }

    setIsSubmitting(true)
    try {
      console.log("Completing flight with tachometer data:", {
        flightId: flight.id,
        tachometerStart: start,
        tachometerEnd: end,
        calculatedHours: end - start,
      })

      await updateFlightStatus(flight.id, "completed", {
        tachometerStart: start,
        tachometerEnd: end,
      })

      console.log("Flight completed successfully")
      setOpen(false)
      onComplete()
    } catch (error) {
      console.error("Error completing flight:", error)
      alert("Error completing the flight. Please try again.")
    } finally {
      setIsSubmitting(false)
    }
  }

  // Reset form when dialog opens
  React.useEffect(() => {
    if (open) {
      setTachometerStart(flight.tachometerStart?.toString() || "")
      setTachometerEnd(flight.tachometerEnd?.toString() || "")
    }
  }, [open, flight.tachometerStart, flight.tachometerEnd])

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm" className="bg-blue-600 hover:bg-blue-700 text-white">
          <CheckCircle2 className="mr-2 h-4 w-4" />
          Complete
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md bg-white">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-gray-900">
            <Gauge className="h-5 w-5 text-blue-600" />
            Complete Flight
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Flight Info */}
          <div className="bg-gray-50 p-4 rounded-lg space-y-2 border">
            <div className="text-sm">
              <span className="font-medium text-gray-700">Fecha:</span> {flight.date} a las {flight.time}
            </div>
            <div className="text-sm">
              <span className="font-medium text-gray-700">Avión:</span> {aircraft?.tailNumber} - {aircraft?.model}
            </div>
            <div className="text-sm">
              <span className="font-medium text-gray-700">Piloto 1:</span> {pilot1?.fullName}
            </div>
            {pilot2 && (
              <div className="text-sm">
                <span className="font-medium text-gray-700">Piloto 2:</span> {pilot2.fullName}
              </div>
            )}
          </div>

          {/* Tachometer Inputs */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="tach-start" className="text-sm font-medium text-gray-700">
                Initial tachometer
              </Label>
              <Input
                id="tach-start"
                type="number"
                step="0.1"
                placeholder="1500.0"
                value={tachometerStart}
                onChange={(e) => setTachometerStart(e.target.value)}
                className="border-gray-300 focus:border-blue-500 focus:ring-blue-500"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="tach-end" className="text-sm font-medium text-gray-700">
                Final tachometer
              </Label>
              <Input
                id="tach-end"
                type="number"
                step="0.1"
                placeholder="1502.5"
                value={tachometerEnd}
                onChange={(e) => setTachometerEnd(e.target.value)}
                className="border-gray-300 focus:border-blue-500 focus:ring-blue-500"
              />
            </div>
          </div>

          {/* Calculated Hours Display */}
          {calculatedHours > 0 && (
            <div className="bg-green-50 border border-green-200 p-3 rounded-lg">
              <div className="text-sm text-green-800">
                <span className="font-medium">Calculated hours:</span> {safeToFixed(calculatedHours)} hs
              </div>
              <div className="text-xs text-green-600 mt-1">
                They will be automatically deducted from Pilot 1 and Pilot 2, if applicable.: {pilot1?.fullName}
              </div>
            </div>
          )}

          {/* Error Display */}
          {tachometerStart && tachometerEnd && calculatedHours <= 0 && (
            <div className="bg-red-50 border border-red-200 p-3 rounded-lg">
              <div className="text-sm text-red-800">⚠️ The final tachometer must be greater than the initial one.</div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex gap-3 pt-2">
            <Button variant="outline" onClick={() => setOpen(false)} className="flex-1" disabled={isSubmitting}>
              Cancel
            </Button>
            <Button
              onClick={handleComplete}
              disabled={isSubmitting || !tachometerStart || !tachometerEnd || calculatedHours <= 0}
              className="flex-1 bg-blue-600 hover:bg-blue-700 text-white disabled:bg-gray-400"
            >
              {isSubmitting ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Completing...
                </>
              ) : (
                <>
                  <CheckCircle2 className="mr-2 h-4 w-4" />
                  Complete flight
                </>
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}

export default function Page() {
  const [pilots, setPilots] = useState<Pilot[]>([])
  const [aircrafts, setAircrafts] = useState<Aircraft[]>([])
  const [purchases, setPurchases] = useState<Purchase[]>([])
  const [flights, setFlights] = useState<Flight[]>([])
  const [pilotSearch, setPilotSearch] = useState("")

  useEffect(() => {
    const loadData = async () => {
      try {
        const [pilotsData, aircraftsData, flightsData, purchasesData] = await Promise.all([
          getPilots(),
          getAircrafts(),
          getFlights(),
          getPurchases(),
        ])
        setPilots(pilotsData)
        setAircrafts(aircraftsData)
        setFlights(flightsData)
        setPurchases(purchasesData)

        // Debug: Log flight data to see if pilotId2 exists
        console.log("Flights data:", flightsData)
        flightsData.forEach((flight, index) => {
          console.log(`Flight ${index}:`, {
            id: flight.id,
            pilotId: flight.pilotId,
            pilotId2: flight.pilotId2,
            date: flight.date,
            time: flight.time,
            tachometerStart: flight.tachometerStart,
            tachometerEnd: flight.tachometerEnd,
            calculatedHours: calculateFlightHours(flight),
          })
        })
      } catch (error) {
        console.error("Error loading data:", error)
      }
    }
    loadData()
  }, [])

  const reload = async () => {
    try {
      const [pilotsData, aircraftsData, flightsData, purchasesData] = await Promise.all([
        getPilots(),
        getAircrafts(),
        getFlights(),
        getPurchases(),
      ])
      setPilots(pilotsData)
      setAircrafts(aircraftsData)
      setFlights(flightsData)
      setPurchases(purchasesData)
    } catch (error) {
      console.error("Error reloading data:", error)
    }
  }

  const handlePurchase = async () => {
    const hrs = Number.parseFloat(purchaseForm.hours || "0")
    if (!purchaseForm.email || isNaN(hrs) || hrs <= 0) return

    try {
      await savePurchase({
        pilotEmail: purchaseForm.email,
        hours: hrs,
        date: new Date().toISOString().slice(0, 10),
        fullName: purchaseForm.fullName || "Sin nombre",
        phone: purchaseForm.phone || "",
        country: purchaseForm.country || "",
        birthDate: purchaseForm.birthDate || "",
        licenseType: purchaseForm.licenseType || "",
      })
      await reload()
      setPurchaseForm({ fullName: "", email: "", phone: "", country: "", birthDate: "", licenseType: "", hours: "" })
    } catch (error) {
      console.error("Error saving purchase:", error)
    }
  }

  const handleAddAircraft = async () => {
    if (!aircraftForm.tailNumber || !aircraftForm.model) return
    const initial = Number.parseFloat(aircraftForm.initialHours || "0")
    const interval = Number.parseFloat(aircraftForm.maintenanceInterval || "100")

    try {
      await saveAircraft({
        tailNumber: aircraftForm.tailNumber,
        model: aircraftForm.model,
        initialHours: isNaN(initial) ? 0 : initial,
        maintenanceIntervalHours: isNaN(interval) ? 100 : interval,
        status: aircraftForm.status,
      })
      await reload()
      setAircraftForm({ tailNumber: "", model: "", initialHours: "", maintenanceInterval: "100", status: "active" })
    } catch (error) {
      console.error("Error saving aircraft:", error)
    }
  }

  const handleSchedule = async () => {
    if (!scheduleForm.pilotId || !scheduleForm.aircraftId || !scheduleForm.date || !scheduleForm.time) {
      alert("Please complete all required fields")
      return
    }

    // Require both tachometer values
    if (!scheduleForm.tachometerStart || !scheduleForm.tachometerEnd) {
      alert("Please enter both initial and final tachometer values")
      return
    }

    const start = Number.parseFloat(scheduleForm.tachometerStart)
    const end = Number.parseFloat(scheduleForm.tachometerEnd)

    if (isNaN(start) || isNaN(end)) {
      alert("Please enter valid numeric values for tachometer")
      return
    }

    if (end <= start) {
      alert("The final tachometer must be greater than the initial one")
      return
    }

    console.log("Registering completed flight with:", {
      pilotId: scheduleForm.pilotId,
      pilotId2: scheduleForm.pilotId2,
      aircraftId: scheduleForm.aircraftId,
      date: scheduleForm.date,
      time: scheduleForm.time,
      tachometerStart: start,
      tachometerEnd: end,
      calculatedHours: end - start,
    })

    try {
      const newFlight = await saveFlight({
        pilotId: scheduleForm.pilotId,
        pilotId2: scheduleForm.pilotId2 || undefined, // Piloto 2 opcional
        aircraftId: scheduleForm.aircraftId,
        date: scheduleForm.date,
        time: scheduleForm.time,
        duration: 0, // Will be calculated from tachometer
        tachometerStart: start,
        tachometerEnd: end,
        status: "completed", // Save directly as completed
        notes: scheduleForm.notes || "",
      })

      console.log("Flight completed and saved:", newFlight)

      await reload()
      setScheduleForm({
        pilotId: "",
        pilotId2: "",
        aircraftId: "",
        date: "",
        time: "",
        tachometerStart: "",
        tachometerEnd: "",
        notes: "",
      })

      alert(`Flight registered successfully. Hours flown: ${safeToFixed(end - start)}`)
    } catch (error) {
      console.error("Error saving flight:", error)
      alert("Error registering the flight. Please try again.")
    }
  }

  // Quick computed data for dashboard
  const upcomingFlights = useMemo(
    () =>
      flights
        .filter((f) => f.status === "scheduled")
        .sort((a, b) => (a.date + a.time).localeCompare(b.date + b.time))
        .slice(0, 10),
    [flights],
  )

// ✅ FILTRO SIMPLE: Solo aviones activos que necesitan mantenimiento
const maintenanceAlerts = useMemo(() => {
  console.log("🔍 Calculando maintenance alerts...")
  
  const alerts = aircrafts.filter((aircraft) => {
    console.log("🔍 Evaluando aircraft para mantenimiento:", {
      tailNumber: aircraft.tailNumber,
      status: aircraft.status,
    })

    // Solo evaluar aviones que están activos (no en mantenimiento)
    if (aircraft.status !== "active") {
      console.log("❌ Aircraft no activo, saltando:", aircraft.tailNumber)
      return false
    }

    // Calcular horas acumuladas
    const { accumulated } = calcAircraftAccumulatedHours(aircraft, flights)
    const maintenance = calcAircraftMaintenance(aircraft, accumulated)

    console.log("📊 Datos de mantenimiento:", {
      tailNumber: aircraft.tailNumber,
      accumulated: accumulated,
      nextMaintenanceAt: maintenance.nextMaintenanceAt,
      dueNow: maintenance.dueNow,
    })

    // Retornar true solo si necesita mantenimiento AHORA
    return maintenance.dueNow
  })

  console.log("🚨 Aviones que necesitan mantenimiento:", alerts.length)
  return alerts
}, [aircrafts, flights])

  // Forms state
  const [purchaseForm, setPurchaseForm] = useState<{
    fullName: string
    email: string
    phone: string
    country: string
    birthDate: string
    licenseType: string
    hours: string
  }>({
    fullName: "",
    email: "",
    phone: "",
    country: "",
    birthDate: "",
    licenseType: "",
    hours: "",
  })

  const [aircraftForm, setAircraftForm] = useState<{
    tailNumber: string
    model: string
    initialHours: string
    maintenanceInterval: string
    status: "active" | "maintenance"
  }>({ tailNumber: "", model: "", initialHours: "", maintenanceInterval: "100", status: "active" })

  const [scheduleForm, setScheduleForm] = useState<{
    pilotId: string
    pilotId2: string // Piloto 2
    aircraftId: string
    date: string
    time: string
    tachometerStart: string // Now required
    tachometerEnd: string // Now required
    notes: string
  }>({
    pilotId: "",
    pilotId2: "",
    aircraftId: "",
    date: "",
    time: "",
    tachometerStart: "",
    tachometerEnd: "",
    notes: "",
  })

  // Calculate hours for display in schedule form
  const calculatedHours = useMemo(() => {
    const start = Number.parseFloat(scheduleForm.tachometerStart) || 0
    const end = Number.parseFloat(scheduleForm.tachometerEnd) || 0
    return end > start ? end - start : 0
  }, [scheduleForm.tachometerStart, scheduleForm.tachometerEnd])

// ✅ NUEVA FUNCIÓN: Completar mantenimiento de forma simple
const handleCompleteMaintenance = async (aircraftId: string) => {
  try {
    console.log("🔧 === INICIANDO MANTENIMIENTO COMPLETADO ===")
    console.log("Aircraft ID:", aircraftId)

    // PASO 1: Encontrar el avión en la lista
    const aircraft = aircrafts.find((a) => a.id === aircraftId)
    if (!aircraft) {
      console.log("❌ Aircraft no encontrado")
      alert("Aircraft not found")
      return
    }

    console.log("✅ Aircraft encontrado:", {
      tailNumber: aircraft.tailNumber,
      model: aircraft.model,
      currentInitialHours: aircraft.initialHours,
      maintenanceInterval: aircraft.maintenanceIntervalHours,
    })

    // PASO 2: Calcular las horas actuales acumuladas
    const { accumulated } = calcAircraftAccumulatedHours(aircraft, flights)
    console.log("📊 Horas calculadas:", {
      initialHours: aircraft.initialHours,
      flownHours: accumulated - aircraft.initialHours,
      totalAccumulated: accumulated,
    })

    // PASO 3: Crear el avión actualizado con contador reseteado
    const updatedAircraft = {
      ...aircraft,
      initialHours: accumulated, // ← ESTO RESETEA EL CONTADOR DE MANTENIMIENTO
    }

    console.log("🔄 Reseteando contador:", {
      oldInitialHours: aircraft.initialHours,
      newInitialHours: accumulated,
      nextMaintenanceAt: accumulated + aircraft.maintenanceIntervalHours,
    })

    // PASO 4: Guardar en la base de datos/localStorage
    console.log("💾 Guardando cambios...")
    await updateAircraft(updatedAircraft)

    // PASO 5: Actualizar el estado local inmediatamente
    console.log("🔄 Actualizando estado local...")
    setAircrafts((prevAircrafts) => 
      prevAircrafts.map((a) => (a.id === aircraftId ? updatedAircraft : a))
    )

    // PASO 6: Recargar todos los datos para sincronizar
    console.log("🔄 Recargando datos...")
    await reload()

    // PASO 7: Mostrar confirmación al usuario
    const nextMaintenanceHours = accumulated + aircraft.maintenanceIntervalHours
    alert(`✅ Maintenance completed!\n\nNext maintenance at: ${nextMaintenanceHours.toFixed(1)} hours`)
    
    console.log("✅ === MANTENIMIENTO COMPLETADO EXITOSAMENTE ===")
  } catch (error) {
    console.error("❌ Error completando mantenimiento:", error)
    alert("Error completing maintenance: " + error.message)
  }
}
  // Helper function to get pilot name by ID
  const getPilotName = (pilotId: string) => {
    const pilot = pilots.find((p) => p.id === pilotId)
    return pilot ? pilot.fullName : "—"
  }

  // Helper function to render pilots for a flight - IMPROVED VERSION
  const renderFlightPilots = (flight: Flight) => {
    console.log("Rendering pilots for flight:", flight.id, {
      pilotId: flight.pilotId,
      pilotId2: flight.pilotId2,
    })

    const pilot1 = pilots.find((p) => p.id === flight.pilotId)
    const pilot2 = flight.pilotId2 ? pilots.find((p) => p.id === flight.pilotId2) : null

    console.log("Found pilots:", {
      pilot1: pilot1?.fullName,
      pilot2: pilot2?.fullName,
    })

    return (
      <div className="space-y-1">
        <div className="flex items-center gap-1">
          <span className="text-xs text-muted-foreground font-medium">P1:</span>
          <Link className="underline hover:text-primary text-sm" href={`/pilots/${pilot1?.id || ""}`}>
            {pilot1?.fullName || "—"}
          </Link>
        </div>
        {pilot2 && (
          <div className="flex items-center gap-1">
            <span className="text-xs text-muted-foreground font-medium">P2:</span>
            <Link className="underline hover:text-primary text-sm" href={`/pilots/${pilot2.id}`}>
              {pilot2.fullName}
            </Link>
          </div>
        )}
        {flight.pilotId2 && !pilot2 && (
          <div className="flex items-center gap-1">
            <span className="text-xs text-muted-foreground font-medium">P2:</span>
            <span className="text-sm text-red-500">Pilot not found (ID: {flight.pilotId2})</span>
          </div>
        )}
      </div>
    )
  }

  // Helper function to render flight hours (tachometer or duration)
  const renderFlightHours = (flight: Flight) => {
    const hours = calculateFlightHours(flight)
    const hasTachometer = flight.tachometerStart !== undefined || flight.tachometerEnd !== undefined

    if (flight.status === "completed" && hasTachometer) {
      return (
        <div className="space-y-1">
          <div className="text-sm font-medium">{safeToFixed(hours)} hs</div>
          <div className="text-xs text-muted-foreground">
            {flight.tachometerStart !== undefined && flight.tachometerEnd !== undefined
              ? `${safeToFixed(flight.tachometerStart)} → ${safeToFixed(flight.tachometerEnd)}`
              : "Tacómetro"}
          </div>
        </div>
      )
    }

    

  return (
    <main className="mx-auto max-w-7xl p-4 md:p-8 space-y-6">
      <div className="text-center py-8 bg-gradient-to-r from-blue-50 via-sky-50 to-blue-50 rounded-lg border border-blue-100 mb-6">
        <div className="flex items-center justify-center gap-3 mb-2">
          <img src="/envysky-logo.png" alt="ENVYSKY Logo" className="h-16 md:h-20 mx-auto" />
        </div>
        <p className="text-[#2D5F73] mt-2 text-lg">Management of pilots, aircraft, hours, flights, and maintenance.</p>
      </div>

      <Tabs defaultValue="dashboard" className="w-full">
        <TabsList className="flex w-full justify-center overflow-x-auto bg-blue-50 border border-blue-200">
          <TabsTrigger value="dashboard" className="data-[state=active]:bg-blue-600 data-[state=active]:text-white">
            Dashboard
          </TabsTrigger>
          <TabsTrigger value="pilots" className="data-[state=active]:bg-blue-600 data-[state=active]:text-white">
            Pilots
          </TabsTrigger>
          <TabsTrigger value="aircraft" className="data-[state=active]:bg-blue-600 data-[state=active]:text-white">
            Aircrafts
          </TabsTrigger>
          <TabsTrigger value="schedule" className="data-[state=active]:bg-blue-600 data-[state=active]:text-white">
            Schedule
          </TabsTrigger>
          <TabsTrigger value="settings" className="data-[state=active]:bg-blue-600 data-[state=active]:text-white">
            Quick guide
          </TabsTrigger>
        </TabsList>

        <TabsContent value="dashboard" className="space-y-6">
          <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
            <Card className="xl:col-span-2 shadow-sm">
              <CardHeader className="bg-gradient-to-r from-blue-100 to-sky-100 border-b border-blue-200">
                <SectionHeader
                  title="Quick actions"
                  description="Register purchase, create aircraft, register completed flight"
                  icon={<PlusCircle className="h-4 w-4 text-blue-700" />}
                />
              </CardHeader>
              <CardContent className="grid grid-cols-1 lg:grid-cols-3 gap-6 p-6">
                <div className="space-y-3">
                  <div className="font-medium">Pilot Registration</div>
                  <div className="space-y-2">
                    <Label htmlFor="buy-email">Email</Label>
                    <Input
                      id="buy-email"
                      placeholder="pilot@correo.com"
                      value={purchaseForm.email}
                      onChange={(e) => setPurchaseForm((s) => ({ ...s, email: e.target.value }))}
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div className="space-y-2">
                      <Label htmlFor="buy-name">Name</Label>
                      <Input
                        id="buy-name"
                        placeholder="Full Name"
                        value={purchaseForm.fullName}
                        onChange={(e) => setPurchaseForm((s) => ({ ...s, fullName: e.target.value }))}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="buy-phone">Phone</Label>
                      <Input
                        id="buy-phone"
                        placeholder="+1 ..."
                        value={purchaseForm.phone}
                        onChange={(e) => setPurchaseForm((s) => ({ ...s, phone: e.target.value }))}
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div className="space-y-2">
                      <Label htmlFor="buy-country">Country</Label>
                      <Input
                        id="buy-country"
                        placeholder="USA"
                        value={purchaseForm.country}
                        onChange={(e) => setPurchaseForm((s) => ({ ...s, country: e.target.value }))}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="buy-birth">Birthdate</Label>
                      <Input
                        id="buy-birth"
                        type="date"
                        value={purchaseForm.birthDate}
                        onChange={(e) => setPurchaseForm((s) => ({ ...s, birthDate: e.target.value }))}
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="buy-license">License type</Label>
                    <Input
                      id="buy-license"
                      placeholder="PPL / CPL ..."
                      value={purchaseForm.licenseType}
                      onChange={(e) => setPurchaseForm((s) => ({ ...s, licenseType: e.target.value }))}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="buy-hours">Purchased Hours</Label>
                    <Input
                      id="buy-hours"
                      type="number"
                      min="0"
                      step="0.1"
                      placeholder="10"
                      value={purchaseForm.hours}
                      onChange={(e) => setPurchaseForm((s) => ({ ...s, hours: e.target.value }))}
                    />
                  </div>
                  <Button onClick={handlePurchase} className="w-full bg-blue-600 hover:bg-blue-700 text-white">
                    <UserPlus className="mr-2 h-4 w-4" />
                    Register purchase
                  </Button>
                </div>

                <Separator className="lg:hidden" />

                <div className="space-y-3">
                  <div className="font-medium">Aircraft Registration</div>
                  <div className="space-y-2">
                    <Label htmlFor="ac-tail">License plate / ID</Label>
                    <Input
                      id="ac-tail"
                      placeholder="LV-ABC"
                      value={aircraftForm.tailNumber}
                      onChange={(e) => setAircraftForm((s) => ({ ...s, tailNumber: e.target.value }))}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="ac-model">Aircraft model</Label>
                    <Input
                      id="ac-model"
                      placeholder="Cessna 172"
                      value={aircraftForm.model}
                      onChange={(e) => setAircraftForm((s) => ({ ...s, model: e.target.value }))}
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div className="space-y-2">
                      <Label htmlFor="ac-initial">Starting hours</Label>
                      <Input
                        id="ac-initial"
                        type="number"
                        min="0"
                        step="0.1"
                        placeholder="1500"
                        value={aircraftForm.initialHours}
                        onChange={(e) => setAircraftForm((s) => ({ ...s, initialHours: e.target.value }))}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="ac-maint">Maintenance every X hours</Label>
                      <Input
                        id="ac-maint"
                        type="number"
                        min="1"
                        step="1"
                        placeholder="100"
                        value={aircraftForm.maintenanceInterval}
                        onChange={(e) => setAircraftForm((s) => ({ ...s, maintenanceInterval: e.target.value }))}
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label>Status</Label>
                    <Select
                      value={aircraftForm.status}
                      onValueChange={(v: "active" | "maintenance") => setAircraftForm((s) => ({ ...s, status: v }))}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Estado" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="active">Active</SelectItem>
                        <SelectItem value="maintenance">In maintenance"</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <Button onClick={handleAddAircraft} className="w-full bg-blue-600 hover:bg-blue-700 text-white">
                    <Plane className="mr-2 h-4 w-4" />
                    Create aircraft
                  </Button>
                </div>

                <Separator className="lg:hidden" />

                <div className="space-y-3">
                  <div className="font-medium flex items-center gap-2">
                    <Gauge className="h-4 w-4" />
                    Register completed flight
                  </div>
                  <div className="space-y-2">
                    <Label>Pilot 1 (Principal)</Label>
                    <Select
                      value={scheduleForm.pilotId}
                      onValueChange={(v) => setScheduleForm((s) => ({ ...s, pilotId: v }))}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select main pilot" />
                      </SelectTrigger>
                      <SelectContent>
                        {pilots.length === 0 ? <SelectItem value="no-pilots">{"No Pilots"}</SelectItem> : null}
                        {pilots.map((p) => (
                          <SelectItem key={p.id} value={p.id}>
                            {p.fullName} ({p.email})
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Pilot 2 (Optional)</Label>
                    <Select
                      value={scheduleForm.pilotId2}
                      onValueChange={(v) => setScheduleForm((s) => ({ ...s, pilotId2: v === "none" ? "" : v }))}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select pilot 2 (opcional)" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">Without Pilot 2</SelectItem>
                        {pilots
                          .filter((p) => p.id !== scheduleForm.pilotId) // ✅ FILTRAR para evitar el mismo piloto
                          .map((p) => (
                            <SelectItem key={p.id} value={p.id}>
                              {p.fullName} ({p.email})
                            </SelectItem>
                          ))}
                        {/* Mostrar mensaje si no hay otros pilotos disponibles */}
                        {pilots.filter((p) => p.id !== scheduleForm.pilotId).length === 0 && scheduleForm.pilotId && (
                          <SelectItem value="no-other-pilots" disabled>
                            No other pilots available.
                          </SelectItem>
                        )}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Aircraft</Label>
                    <Select
                      value={scheduleForm.aircraftId}
                      onValueChange={(v) => setScheduleForm((s) => ({ ...s, aircraftId: v }))}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select aircraft" />
                      </SelectTrigger>
                      <SelectContent>
                        {aircrafts.length === 0 ? <SelectItem value="no-aircrafts">{"No aircrafts"}</SelectItem> : null}
                        {aircrafts.map((a) => (
                          <SelectItem key={a.id} value={a.id}>
                            {a.tailNumber} - {a.model}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div className="space-y-2">
                      <Label>Date</Label>
                      <Input
                        type="date"
                        value={scheduleForm.date}
                        onChange={(e) => setScheduleForm((s) => ({ ...s, date: e.target.value }))}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Hour</Label>
                      <Input
                        type="time"
                        value={scheduleForm.time}
                        onChange={(e) => setScheduleForm((s) => ({ ...s, time: e.target.value }))}
                      />
                    </div>
                  </div>

                  {/* Modified tachometer section - now both are required */}
                  <div className="grid grid-cols-2 gap-2">
                    <div className="space-y-2">
                      <Label className="text-sm font-medium">Initial tachometer *</Label>
                      <Input
                        type="number"
                        step="0.1"
                        placeholder="1500.0"
                        value={scheduleForm.tachometerStart}
                        onChange={(e) => setScheduleForm((s) => ({ ...s, tachometerStart: e.target.value }))}
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-sm font-medium">Final tachometer *</Label>
                      <Input
                        type="number"
                        step="0.1"
                        placeholder="1502.5"
                        value={scheduleForm.tachometerEnd}
                        onChange={(e) => setScheduleForm((s) => ({ ...s, tachometerEnd: e.target.value }))}
                        required
                      />
                    </div>
                  </div>

                  {/* Calculated Hours Display */}
                  {calculatedHours > 0 && (
                    <div className="bg-green-50 border border-green-200 p-3 rounded-lg">
                      <div className="text-sm text-green-800">
                        <span className="font-medium">Calculated hours:</span> {safeToFixed(calculatedHours)} hs
                      </div>
                      <div className="text-xs text-green-600 mt-1">Will be automatically deducted from Pilot 1 and Pilot 2, if applicable.</div>
                    </div>
                  )}

                  {/* Error Display */}
                  {scheduleForm.tachometerStart && scheduleForm.tachometerEnd && calculatedHours <= 0 && (
                    <div className="bg-red-50 border border-red-200 p-3 rounded-lg">
                      <div className="text-sm text-red-800">
                        ⚠️ The final tachometer must be greater than the initial one
                      </div>
                    </div>
                  )}

                  <div className="space-y-2">
                    <Label>Notes</Label>
                    <Textarea
                      placeholder="Optional"
                      value={scheduleForm.notes}
                      onChange={(e) => setScheduleForm((s) => ({ ...s, notes: e.target.value }))}
                      className="min-h-[40px]"
                    />
                  </div>
                  <Button
                    onClick={handleSchedule}
                    className="w-full bg-blue-600 hover:bg-blue-700 text-white"
                    disabled={!calculatedHours || calculatedHours <= 0}
                  >
                    <CheckCircle2 className="mr-2 h-4 w-4" />
                    Register flight
                  </Button>
                </div>
              </CardContent>
            </Card>
            
            <Card className="shadow-sm">
              <CardHeader className="bg-gradient-to-r from-red-50 to-orange-50 border-b border-red-200">
                <SectionHeader
                  title="Maintenance alerts"
                  description="Aircraft requiring maintenance"
                  icon={<ShieldAlert className="h-4 w-4 text-red-600" />}
                />
              </CardHeader>
              
              <CardContent className="space-y-3">
                {maintenanceAlerts.length === 0 ? (
                  // No hay aviones que necesiten mantenimiento
                  <div className="text-sm text-muted-foreground">No aircraft requiring maintenance</div>
                ) : (
                  // Lista de aviones que necesitan mantenimiento
                  maintenanceAlerts.map((aircraft) => {
                    // Calcular datos para cada avión
                    const { accumulated } = calcAircraftAccumulatedHours(aircraft, flights)
                    const maintenance = calcAircraftMaintenance(aircraft, accumulated)
            
                    return (
                      <div key={aircraft.id} className="rounded-lg border p-3">
                        <div className="flex items-center justify-between">
                          {/* Información del avión */}
                          <div>
                            <div className="font-medium">
                              {aircraft.tailNumber} - {aircraft.model}
                            </div>
                            <div className="text-sm text-muted-foreground">
                              Accumulated: {safeToFixed(accumulated)} hs • Interval: {safeToFixed(aircraft.maintenanceIntervalHours)} hs
                            </div>
                            <div className="text-sm text-red-600 font-medium">
                              Maintenance required now
                            </div>
                          </div>
            
                          {/* ✅ BOTÓN SIMPLE: Solo "Complete" */}
                          <Button
                            onClick={() => handleCompleteMaintenance(aircraft.id)}
                            className="bg-green-600 hover:bg-green-700 text-white"
                            size="sm"
                          >
                            Complete
                          </Button>
                        </div>
                      </div>
                    )
                  })
                )}
              </CardContent>
            </Card>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Replace "Upcoming flights" with "Recent completed flights" */}
            <Card>
              <CardHeader>
                <SectionHeader
                  title="Recent completed flights"
                  description="Latest registered flights"
                  icon={<CheckCircle2 className="h-4 w-4" />}
                />
              </CardHeader>
              <CardContent className="space-y-2 max-h-96 overflow-y-auto">
                {flights.filter((f) => f.status === "completed").length === 0 ? (
                  <div className="text-sm text-muted-foreground">No completed flights.</div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Date</TableHead>
                        <TableHead>Pilot(s)</TableHead>
                        <TableHead>Aircraft</TableHead>
                        <TableHead>Hours flown</TableHead>
                        <TableHead>Tachometer</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {flights
                        .filter((f) => f.status === "completed")
                        .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
                        .map((f) => {
                          const a = aircrafts.find((x) => x.id === f.aircraftId)
                          const hours = calculateFlightHours(f)
                          return (
                            <TableRow key={f.id}>
                              <TableCell>
                                {new Date(f.date).toLocaleDateString("en-US")} {f.time}
                              </TableCell>
                              <TableCell>{renderFlightPilots(f)}</TableCell>
                              <TableCell>
                                <Link className="underline hover:text-primary" href={`/aircrafts/${a?.id || ""}`}>
                                  {a?.tailNumber || "—"}
                                </Link>
                              </TableCell>
                              <TableCell>
                                <div className="font-medium">{safeToFixed(hours)} hs</div>
                              </TableCell>
                              <TableCell>
                                {f.tachometerStart !== undefined && f.tachometerEnd !== undefined ? (
                                  <div className="text-sm">
                                    <div>
                                      {safeToFixed(f.tachometerStart)} → {safeToFixed(f.tachometerEnd)}
                                    </div>
                                    <div className="text-xs text-muted-foreground">
                                      Difference: {safeToFixed(f.tachometerEnd - f.tachometerStart)}
                                    </div>
                                  </div>
                                ) : (
                                  <div className="text-xs text-muted-foreground">
                                    Legacy flight (without tachometer)
                                  </div>
                                )}
                              </TableCell>
                            </TableRow>
                          )
                        })}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <SectionHeader
                  title="Pilots"
                  description="Hours and Status"
                  icon={<BadgeCheck className="h-4 w-4" />}
                />
              </CardHeader>

              {/* 🔍 Buscador de pilotos */}
              <div className="px-6 pb-4">
                <Input
                  placeholder="Search pilots by name or email..."
                  value={pilotSearch}
                  onChange={(e) => setPilotSearch(e.target.value)}
                  className="max-w-sm"
                />
              </div>

              <CardContent className="space-y-2">
                {pilots.length === 0 ? (
                  <div className="text-sm text-muted-foreground">No pilots.</div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Pilot</TableHead>
                        <TableHead>Purchased</TableHead>
                        <TableHead>Flown</TableHead>
                        <TableHead>Remaining</TableHead>
                        <TableHead>Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {pilots
                        .filter(
                          (p) =>
                            p.fullName.toLowerCase().includes(pilotSearch.toLowerCase()) ||
                            p.email.toLowerCase().includes(pilotSearch.toLowerCase()),
                        )
                        .map((p) => {
                          const hours = calcPilotHours(p.id, purchases, flights)
                          const purchased = typeof hours.purchased === "number" ? hours.purchased : 0
                          const flown = typeof hours.flown === "number" ? hours.flown : 0
                          const remaining = typeof hours.remaining === "number" ? hours.remaining : 0

                          return (
                            <TableRow key={p.id}>
                              <TableCell>
                                <Link className="underline" href={`/pilots/${p.id}`}>
                                  {p.fullName}
                                </Link>
                                <div className="text-xs text-muted-foreground">{p.email}</div>
                              </TableCell>
                              <TableCell>{safeToFixed(purchased)}</TableCell>
                              <TableCell>{safeToFixed(flown)}</TableCell>
                              <TableCell className={cn(remaining <= 0 ? "text-red-600" : "")}>
                                {safeToFixed(remaining)}
                              </TableCell>
                              <TableCell>
                                <PilotReportButton
                                  pilot={p}
                                  flights={flights}
                                  purchases={purchases}
                                  aircrafts={aircrafts}
                                  allPilots={pilots}
                                  variant="outline"
                                  size="sm"
                                />
                              </TableCell>
                            </TableRow>
                          )
                        })}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <SectionHeader
                title="Aircrafts"
                description="Status and accumulated hours"
                icon={<Plane className="h-4 w-4" />}
              />
            </CardHeader>
            <CardContent className="space-y-2">
              {aircrafts.length === 0 ? (
                <div className="text-sm text-muted-foreground">No aircrafts.</div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>License Plate</TableHead>
                      <TableHead>Model</TableHead>
                      <TableHead>Total Hours</TableHead>
                      <TableHead>Maintenance interval</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {aircrafts.map((a) => {
                      const { accumulated } = calcAircraftAccumulatedHours(a, flights)
                      return (
                        <TableRow key={a.id}>
                          <TableCell>
                            <Link className="underline" href={`/aircrafts/${a.id}`}>
                              {a.tailNumber}
                            </Link>
                          </TableCell>
                          <TableCell>{a.model}</TableCell>
                          <TableCell>{safeToFixed(accumulated)} hs</TableCell>
                          <TableCell>{safeToFixed(a.maintenanceIntervalHours)} hs</TableCell>
                          <TableCell className="capitalize">{a.status}</TableCell>
                          <TableCell>
                            <AircraftReportButton
                              aircraft={a}
                              flights={flights}
                              pilots={pilots}
                              variant="outline"
                              size="sm"
                            />
                          </TableCell>
                        </TableRow>
                      )
                    })}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="pilots" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Pilots</CardTitle>
              <CardDescription>Complete profiles and hour status.</CardDescription>
            </CardHeader>
            <CardContent>
              {pilots.length === 0 ? (
                <div className="text-sm text-muted-foreground">No pilots</div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead>License</TableHead>
                      <TableHead>Purchased Hours</TableHead>
                      <TableHead>Flown</TableHead>
                      <TableHead>Remaining</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {pilots.map((p) => {
                      const hours = calcPilotHours(p.id, purchases, flights)
                      const purchased = typeof hours.purchased === "number" ? hours.purchased : 0
                      const flown = typeof hours.flown === "number" ? hours.flown : 0
                      const remaining = typeof hours.remaining === "number" ? hours.remaining : 0

                      return (
                        <TableRow key={p.id}>
                          <TableCell>
                            <Link className="underline" href={`/pilots/${p.id}`}>
                              {p.fullName}
                            </Link>
                          </TableCell>
                          <TableCell>{p.email}</TableCell>
                          <TableCell>{p.licenseType || "—"}</TableCell>
                          <TableCell>{safeToFixed(purchased)}</TableCell>
                          <TableCell>{safeToFixed(flown)}</TableCell>
                          <TableCell className={cn(remaining <= 0 ? "text-red-600" : "")}>
                            {safeToFixed(remaining)}
                          </TableCell>
                          <TableCell>
                            <PilotReportButton
                              pilot={p}
                              flights={flights}
                              purchases={purchases}
                              aircrafts={aircrafts}
                              allPilots={pilots}
                              variant="outline"
                              size="sm"
                            />
                          </TableCell>
                        </TableRow>
                      )
                    })}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="aircraft" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Aircrafts</CardTitle>
              <CardDescription>Aircraft and maintenance profiles.</CardDescription>
            </CardHeader>
            <CardContent>
              {aircrafts.length === 0 ? (
                <div className="text-sm text-muted-foreground">No aircrafts</div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Registration</TableHead>
                      <TableHead>Model</TableHead>
                      <TableHead>Total Hours</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Next maintenance</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {aircrafts.map((a) => {
                      const { accumulated } = calcAircraftAccumulatedHours(a, flights)
                      const maint = calcAircraftMaintenance(a, accumulated)
                      return (
                        <TableRow key={a.id}>
                          <TableCell>
                            <Link className="underline" href={`/aircrafts/${a.id}`}>
                              {a.tailNumber}
                            </Link>
                          </TableCell>
                          <TableCell>{a.model}</TableCell>
                          <TableCell>{safeToFixed(accumulated)} hs</TableCell>
                          <TableCell className="capitalize">{a.status}</TableCell>
                          <TableCell className={cn(maint.dueNow ? "text-red-600" : "text-amber-600")}>
                            {maint.dueNow ? "Now" : `${safeToFixed(maint.dueInHours)} hs`}
                          </TableCell>
                          <TableCell>
                            <AircraftReportButton
                              aircraft={a}
                              flights={flights}
                              pilots={pilots}
                              variant="outline"
                              size="sm"
                            />
                          </TableCell>
                        </TableRow>
                      )
                    })}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="schedule" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Gauge className="h-5 w-5" />
                Flight schedule (Tachometer system)
              </CardTitle>
              <CardDescription>Complete flights with initial and final tachometer.</CardDescription>
            </CardHeader>
            <CardContent>
              {flights.filter((f) => f.status === "scheduled").length === 0 ? (
                <div className="text-sm text-muted-foreground">No scheduled flights.</div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Date</TableHead>
                      <TableHead>Pilot(s)</TableHead>
                      <TableHead>Aircraft</TableHead>
                      <TableHead>Tachometer</TableHead>
                      <TableHead>Notes</TableHead>
                      <TableHead />
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {flights
                      .filter((f) => f.status === "scheduled")
                      .sort((a, b) => (a.date + a.time).localeCompare(b.date + b.time))
                      .map((f) => {
                        const a = aircrafts.find((x) => x.id === f.aircraftId)
                        return (
                          <TableRow key={f.id}>
                            <TableCell>
                              {f.date} {f.time}
                            </TableCell>
                            <TableCell>{renderFlightPilots(f)}</TableCell>
                            <TableCell>
                              <Link className="underline hover:text-primary" href={`/aircrafts/${a?.id || ""}`}>
                                {a?.tailNumber || "—"}
                              </Link>
                            </TableCell>
                            <TableCell>
                              {f.tachometerStart !== undefined ? (
                                <div className="text-sm">
                                  <div className="font-medium">Inicial: {safeToFixed(f.tachometerStart)}</div>
                                  <div className="text-xs text-muted-foreground">Ready to complete</div>
                                </div>
                              ) : (
                                <div className="text-xs text-muted-foreground">Will be entered upon completion.</div>
                              )}
                            </TableCell>
                            <TableCell className="max-w-[240px] truncate">{f.notes}</TableCell>
                            <TableCell className="text-right">
                              <CompleteFlightDialog
                                flight={f}
                                aircrafts={aircrafts}
                                pilots={pilots}
                                onComplete={reload}
                              />
                            </TableCell>
                          </TableRow>
                        )
                      })}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>

          {/* Vuelos completados */}
          <Card>
            <CardHeader>
              <CardTitle>Recent completed flights.</CardTitle>
              <CardDescription>Flight history with tachometer data.</CardDescription>
            </CardHeader>
            <CardContent>
              {flights.filter((f) => f.status === "completed").length === 0 ? (
                <div className="text-sm text-muted-foreground">No completed flights.</div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Date</TableHead>
                      <TableHead>Pilot(s)</TableHead>
                      <TableHead>Aircraft</TableHead>
                      <TableHead>Hours flown</TableHead>
                      <TableHead>Tachometer</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {flights
                      .filter((f) => f.status === "completed")
                      .sort((a, b) => (b.date + b.time).localeCompare(a.date + a.time))
                      .slice(0, 10)
                      .map((f) => {
                        const a = aircrafts.find((x) => x.id === f.aircraftId)
                        const hours = calculateFlightHours(f)
                        return (
                          <TableRow key={f.id}>
                            <TableCell>
                              {f.date} {f.time}
                            </TableCell>
                            <TableCell>{renderFlightPilots(f)}</TableCell>
                            <TableCell>
                              <Link className="underline hover:text-primary" href={`/aircrafts/${a?.id || ""}`}>
                                {a?.tailNumber || "—"}
                              </Link>
                            </TableCell>
                            <TableCell>
                              <div className="font-medium">{safeToFixed(hours)} hs</div>
                            </TableCell>
                            <TableCell>
                              {f.tachometerStart !== undefined && f.tachometerEnd !== undefined ? (
                                <div className="text-sm">
                                  <div>
                                    {safeToFixed(f.tachometerStart)} → {safeToFixed(f.tachometerEnd)}
                                  </div>
                                  <div className="text-xs text-muted-foreground">
                                    Diferencia: {safeToFixed(f.tachometerEnd - f.tachometerStart)}
                                  </div>
                                </div>
                              ) : (
                                <div className="text-xs text-muted-foreground">Legacy flight (without tachometer)</div>
                              )}
                            </TableCell>
                          </TableRow>
                        )
                      })}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="settings" className="space-y-6">
          <Card className="bg-gradient-to-br from-blue-50 to-sky-50 border-blue-200">
            <CardHeader className="bg-gradient-to-r from-blue-100 to-sky-100 border-b border-blue-200">
              <CardTitle className="flex items-center gap-2 text-blue-900">
                <Rocket className="h-5 w-5" />
                ENVYSKY Quick guide
              </CardTitle>
              <CardDescription className="text-blue-700">Learn to use the system in 5 minutes.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid md:grid-cols-2 gap-6">
                <Card className="border-l-4 border-l-blue-500">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-lg flex items-center gap-2">
                      <UserPlus className="h-4 w-4" />
                      1. Register pilots
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="text-sm space-y-2">
                    <p>
                      • Go to <strong>"Dashboard"</strong> → <strong>"Quick actions"</strong>
                    </p>
                    <p>
                      • Complete the form <strong>"Purchased hours"</strong>
                    </p>
                    <p>• If the pilot does not exist, it is created automatically</p>
                    <p>• Purchased hours are added to their account</p>
                  </CardContent>
                </Card>

                <Card className="border-l-4 border-l-green-500">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-lg flex items-center gap-2">
                      <Plane className="h-4 w-4" />
                      2. Add aircraft
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="text-sm space-y-2">
                    <p>
                      • In <strong>"Quick actions"</strong> → <strong>"Create aircraft"</strong>
                    </p>
                    <p>• Enter registration, model, and initial hours</p>
                    <p>• Define maintenance interval (e.g., every 100 hrs)</p>
                    <p>• The system will automatically calculate when service is needed</p>
                  </CardContent>
                </Card>

                <Card className="border-l-4 border-l-purple-500">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-lg flex items-center gap-2">
                      <CheckCircle2 className="h-4 w-4" />
                      3. Register completed flights
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="text-sm space-y-2">
                    <p>
                      • You can now select <strong>up to 2 pilots</strong> per flight
                    </p>
                    <p>
                      • <strong>Pilot 1</strong> is mandatory (principal)
                    </p>
                    <p>
                      • <strong>Pilot 2</strong> is optional
                    </p>
                    <p>
                      • Enter both <strong>initial and final tachometer</strong> values
                    </p>
                    <p>• Flight is registered as completed immediately</p>
                  </CardContent>
                </Card>

                <Card className="border-l-4 border-l-orange-500">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-lg flex items-center gap-2">
                      <Gauge className="h-4 w-4" />
                      4. Automatic calculations
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="text-sm space-y-2">
                    <p>
                      • Hours are calculated automatically: <strong>final - initial</strong>
                    </p>
                    <p>
                      • They are deducted from <strong>Pilot 1</strong> and added to the aircraft
                    </p>
                    <p>• View recent flights in the dashboard</p>
                    <p>• Check maintenance alerts regularly</p>
                  </CardContent>
                </Card>
              </div>

              <Separator />

              <div className="bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 p-4 rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <Gauge className="h-5 w-5 text-green-600" />
                  <div className="font-semibold text-green-800">Simplified tachometer system</div>
                </div>
                <div className="text-sm text-green-700 space-y-1">
                  <p>
                    • <strong>Direct registration:</strong> Register completed flights in one step
                  </p>
                  <p>
                    • <strong>More accurate:</strong> Hours are calculated from the aircraft's tachometer
                  </p>
                  <p>
                    • <strong>Automatic:</strong> No more manual duration calculations
                  </p>
                  <p>
                    • <strong>Compatible:</strong> Legacy flights still work
                  </p>
                </div>
              </div>

              <div className="grid md:grid-cols-3 gap-4">
                <div className="text-center p-4 bg-muted/50 rounded-lg">
                  <BadgeCheck className="h-8 w-8 mx-auto mb-2 text-green-600" />
                  <div className="font-medium">Automatic alerts</div>
                  <div className="text-sm text-muted-foreground">
                    The system notifies you when an aircraft requires maintenance
                  </div>
                </div>
                <div className="text-center p-4 bg-muted/50 rounded-lg">
                  <Clock className="h-8 w-8 mx-auto mb-2 text-blue-600" />
                  <div className="font-medium">Hour control</div>
                  <div className="text-sm text-muted-foreground">Automatic tracking of purchased vs. flown hours</div>
                </div>
                <div className="text-center p-4 bg-muted/50 rounded-lg">
                  <Gauge className="h-8 w-8 mx-auto mb-2 text-purple-600" />
                  <div className="font-medium">Accurate tachometer</div>
                  <div className="text-sm text-muted-foreground">
                    Automatic calculation based on the actual tachometer
                  </div>
                </div>
              </div>

              <Card className="bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200">
                <CardHeader>
                  <CardTitle className="text-lg text-blue-900">💡 Useful tips</CardTitle>
                </CardHeader>
                <CardContent className="text-sm space-y-2 text-blue-800">
                  <p>
                    • <strong>Click on names and registrations</strong> to see full details
                  </p>
                  <p>
                    • <strong>Check maintenance alerts</strong> regularly
                  </p>
                  <p>
                    • <strong>Both tachometer values</strong> are required when registering flights
                  </p>
                  <p>
                    • <strong>Data is synced</strong> automatically with the database
                  </p>
                </CardContent>
              </Card>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </main>
  )
}

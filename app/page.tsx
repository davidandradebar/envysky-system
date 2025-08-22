"use client"

import React from "react"

import { useEffect, useMemo, useState } from "react"
import Link from "next/link"
import {
  BadgeCheck,
  Calendar,
  CheckCircle2,
  Clock,
  Plane,
  PlusCircle,
  Rocket,
  ShieldAlert,
  UserPlus,
  Gauge,
} from "lucide-react"

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
      alert("Por favor ingresa ambos valores del tacómetro")
      return
    }

    const start = Number.parseFloat(tachometerStart)
    const end = Number.parseFloat(tachometerEnd)

    if (isNaN(start) || isNaN(end)) {
      alert("Por favor ingresa valores numéricos válidos")
      return
    }

    if (end <= start) {
      alert("El tacómetro final debe ser mayor al inicial")
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
      alert("Error al completar el vuelo. Por favor intenta de nuevo.")
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
          Completar
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md bg-white">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-gray-900">
            <Gauge className="h-5 w-5 text-blue-600" />
            Completar Vuelo
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
                Tacómetro inicial
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
                Tacómetro final
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
                <span className="font-medium">Horas calculadas:</span> {safeToFixed(calculatedHours)} hs
              </div>
              <div className="text-xs text-green-600 mt-1">
                Se descontarán automáticamente del Piloto 1: {pilot1?.fullName}
              </div>
            </div>
          )}

          {/* Error Display */}
          {tachometerStart && tachometerEnd && calculatedHours <= 0 && (
            <div className="bg-red-50 border border-red-200 p-3 rounded-lg">
              <div className="text-sm text-red-800">⚠️ El tacómetro final debe ser mayor al inicial</div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex gap-3 pt-2">
            <Button variant="outline" onClick={() => setOpen(false)} className="flex-1" disabled={isSubmitting}>
              Cancelar
            </Button>
            <Button
              onClick={handleComplete}
              disabled={isSubmitting || !tachometerStart || !tachometerEnd || calculatedHours <= 0}
              className="flex-1 bg-blue-600 hover:bg-blue-700 text-white disabled:bg-gray-400"
            >
              {isSubmitting ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Completando...
                </>
              ) : (
                <>
                  <CheckCircle2 className="mr-2 h-4 w-4" />
                  Completar vuelo
                </>
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}

// Datos de ejemplo para el preview
const samplePilots = [
  { id: "1", fullName: "Juan Pérez", email: "juan@email.com", licenseType: "PPL" },
  { id: "2", fullName: "María García", email: "maria@email.com", licenseType: "CPL" },
]

const sampleAircrafts = [
  { id: "1", tailNumber: "LV-ABC", model: "Cessna 172", status: "active" },
  { id: "2", tailNumber: "LV-XYZ", model: "Piper Cherokee", status: "maintenance" },
]

const sampleFlights = [
  {
    id: "1",
    date: "2024-01-15",
    time: "10:00",
    pilotId: "1",
    pilotId2: "2",
    aircraftId: "1",
    status: "scheduled",
    tachometerStart: 1500.0,
  },
  {
    id: "2",
    date: "2024-01-14",
    time: "14:30",
    pilotId: "2",
    aircraftId: "2",
    status: "completed",
    tachometerStart: 1200.0,
    tachometerEnd: 1202.5,
  },
]

export default function Page() {
  const [pilots, setPilots] = useState<Pilot[]>([])
  const [aircrafts, setAircrafts] = useState<Aircraft[]>([])
  const [purchases, setPurchases] = useState<Purchase[]>([])
  const [flights, setFlights] = useState<Flight[]>([])

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
    if (!scheduleForm.pilotId || !scheduleForm.aircraftId || !scheduleForm.date || !scheduleForm.time) return

    console.log("Scheduling flight with:", {
      pilotId: scheduleForm.pilotId,
      pilotId2: scheduleForm.pilotId2,
      aircraftId: scheduleForm.aircraftId,
      date: scheduleForm.date,
      time: scheduleForm.time,
      tachometerStart: scheduleForm.tachometerStart,
    })

    try {
      const newFlight = await saveFlight({
        pilotId: scheduleForm.pilotId,
        pilotId2: scheduleForm.pilotId2 || undefined, // Piloto 2 opcional
        aircraftId: scheduleForm.aircraftId,
        date: scheduleForm.date,
        time: scheduleForm.time,
        duration: 0, // Will be calculated from tachometer
        tachometerStart: scheduleForm.tachometerStart ? Number.parseFloat(scheduleForm.tachometerStart) : undefined,
        status: "scheduled",
        notes: scheduleForm.notes || "",
      })

      console.log("Flight created:", newFlight)

      await reload()
      setScheduleForm({
        pilotId: "",
        pilotId2: "",
        aircraftId: "",
        date: "",
        time: "",
        tachometerStart: "",
        notes: "",
      })
    } catch (error) {
      console.error("Error saving flight:", error)
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

  const maintenanceAlerts = useMemo(() => {
    return aircrafts
      .map((ac) => {
        const { accumulated } = calcAircraftAccumulatedHours(ac, flights)
        const maint = calcAircraftMaintenance(ac, accumulated)
        return { ac, accumulated, maint }
      })
      .filter(({ maint }) => maint.dueNow || maint.dueInHours <= 5) // show near threshold
      .sort((a, b) => (a.maint.dueInHours || 0) - (b.maint.dueInHours || 0))
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
    tachometerStart: string // Tacómetro inicial (opcional al programar)
    notes: string
  }>({ pilotId: "", pilotId2: "", aircraftId: "", date: "", time: "", tachometerStart: "", notes: "" })

  const handleSetAircraftStatus = (aircraftId: string, status: "active" | "maintenance") => {
    // This function is not updated as per the provided updates
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
            <span className="text-sm text-red-500">Piloto no encontrado (ID: {flight.pilotId2})</span>
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
      <div className="space-y-1">
        <div className="text-sm font-medium">{safeToFixed(hours)} hs</div>
        {flight.status === "scheduled" && flight.tachometerStart !== undefined && (
          <div className="text-xs text-muted-foreground">Inicial: {safeToFixed(flight.tachometerStart)}</div>
        )}
      </div>
    )
  }

  const getAircraftName = (aircraftId: string) => {
    const aircraft = sampleAircrafts.find((a) => a.id === aircraftId)
    return aircraft ? aircraft.tailNumber : "—"
  }

  const renderFlightPilotsSample = (flight: any) => {
    const pilot1 = samplePilots.find((p) => p.id === flight.pilotId)
    const pilot2 = flight.pilotId2 ? samplePilots.find((p) => p.id === flight.pilotId2) : null

    return (
      <div className="space-y-1">
        <div className="flex items-center gap-1">
          <span className="text-xs text-muted-foreground font-medium">P1:</span>
          <span className="text-sm">{pilot1?.fullName || "—"}</span>
        </div>
        {pilot2 && (
          <div className="flex items-center gap-1">
            <span className="text-xs text-muted-foreground font-medium">P2:</span>
            <span className="text-sm">{pilot2.fullName}</span>
          </div>
        )}
      </div>
    )
  }

  return (
    <main className="mx-auto max-w-7xl p-4 md:p-8 space-y-6">
      <div className="text-center py-8 bg-gradient-to-r from-blue-50 via-sky-50 to-blue-50 rounded-lg border border-blue-100 mb-6">
        <h1 className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-blue-600 to-sky-600 bg-clip-text text-transparent">
          ENVYSKY
        </h1>
        <p className="text-blue-700/80 mt-2 text-lg">Gestión de pilotos, aviones, horas, vuelos y mantenimiento.</p>
      </div>

      <Tabs defaultValue="dashboard" className="w-full">
        <TabsList className="flex w-full justify-center overflow-x-auto bg-blue-50 border border-blue-200">
          <TabsTrigger value="dashboard" className="data-[state=active]:bg-blue-600 data-[state=active]:text-white">
            Panel
          </TabsTrigger>
          <TabsTrigger value="pilots" className="data-[state=active]:bg-blue-600 data-[state=active]:text-white">
            Pilotos
          </TabsTrigger>
          <TabsTrigger value="aircraft" className="data-[state=active]:bg-blue-600 data-[state=active]:text-white">
            Aviones
          </TabsTrigger>
          <TabsTrigger value="schedule" className="data-[state=active]:bg-blue-600 data-[state=active]:text-white">
            Agenda
          </TabsTrigger>
          <TabsTrigger value="settings" className="data-[state=active]:bg-blue-600 data-[state=active]:text-white">
            Guía rápida
          </TabsTrigger>
        </TabsList>

        <TabsContent value="dashboard" className="space-y-6">
          <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
            <Card className="xl:col-span-2 shadow-sm">
              <CardHeader className="bg-gradient-to-r from-blue-100 to-sky-100 border-b border-blue-200">
                <SectionHeader
                  title="Acciones rápidas"
                  description="Registrar compra, crear avión, agendar vuelo"
                  icon={<PlusCircle className="h-4 w-4 text-blue-700" />}
                />
              </CardHeader>
              <CardContent className="grid grid-cols-1 lg:grid-cols-3 gap-6 p-6">
                <div className="space-y-3">
                  <div className="font-medium">Compra de horas (crea piloto si no existe)</div>
                  <div className="space-y-2">
                    <Label htmlFor="buy-email">Email</Label>
                    <Input
                      id="buy-email"
                      placeholder="piloto@correo.com"
                      value={purchaseForm.email}
                      onChange={(e) => setPurchaseForm((s) => ({ ...s, email: e.target.value }))}
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div className="space-y-2">
                      <Label htmlFor="buy-name">Nombre</Label>
                      <Input
                        id="buy-name"
                        placeholder="Nombre completo"
                        value={purchaseForm.fullName}
                        onChange={(e) => setPurchaseForm((s) => ({ ...s, fullName: e.target.value }))}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="buy-phone">Teléfono</Label>
                      <Input
                        id="buy-phone"
                        placeholder="+54 ..."
                        value={purchaseForm.phone}
                        onChange={(e) => setPurchaseForm((s) => ({ ...s, phone: e.target.value }))}
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div className="space-y-2">
                      <Label htmlFor="buy-country">País</Label>
                      <Input
                        id="buy-country"
                        placeholder="AR"
                        value={purchaseForm.country}
                        onChange={(e) => setPurchaseForm((s) => ({ ...s, country: e.target.value }))}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="buy-birth">Nacimiento</Label>
                      <Input
                        id="buy-birth"
                        type="date"
                        value={purchaseForm.birthDate}
                        onChange={(e) => setPurchaseForm((s) => ({ ...s, birthDate: e.target.value }))}
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="buy-license">Tipo de licencia</Label>
                    <Input
                      id="buy-license"
                      placeholder="PPL / CPL ..."
                      value={purchaseForm.licenseType}
                      onChange={(e) => setPurchaseForm((s) => ({ ...s, licenseType: e.target.value }))}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="buy-hours">Horas a comprar</Label>
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
                    Registrar compra
                  </Button>
                </div>

                <Separator className="lg:hidden" />

                <div className="space-y-3">
                  <div className="font-medium">Crear avión</div>
                  <div className="space-y-2">
                    <Label htmlFor="ac-tail">Matrícula / ID</Label>
                    <Input
                      id="ac-tail"
                      placeholder="LV-ABC"
                      value={aircraftForm.tailNumber}
                      onChange={(e) => setAircraftForm((s) => ({ ...s, tailNumber: e.target.value }))}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="ac-model">Modelo</Label>
                    <Input
                      id="ac-model"
                      placeholder="Cessna 172"
                      value={aircraftForm.model}
                      onChange={(e) => setAircraftForm((s) => ({ ...s, model: e.target.value }))}
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div className="space-y-2">
                      <Label htmlFor="ac-initial">Horas iniciales</Label>
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
                      <Label htmlFor="ac-maint">Mantenimiento cada X hs</Label>
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
                    <Label>Estado</Label>
                    <Select
                      value={aircraftForm.status}
                      onValueChange={(v: "active" | "maintenance") => setAircraftForm((s) => ({ ...s, status: v }))}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Estado" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="active">Activo</SelectItem>
                        <SelectItem value="maintenance">En mantenimiento</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <Button onClick={handleAddAircraft} className="w-full bg-blue-600 hover:bg-blue-700 text-white">
                    <Plane className="mr-2 h-4 w-4" />
                    Crear avión
                  </Button>
                </div>

                <Separator className="lg:hidden" />

                <div className="space-y-3">
                  <div className="font-medium flex items-center gap-2">
                    <Gauge className="h-4 w-4" />
                    Agendar vuelo (con tacómetro)
                  </div>
                  <div className="space-y-2">
                    <Label>Piloto 1 (Principal)</Label>
                    <Select
                      value={scheduleForm.pilotId}
                      onValueChange={(v) => setScheduleForm((s) => ({ ...s, pilotId: v }))}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Seleccionar piloto principal" />
                      </SelectTrigger>
                      <SelectContent>
                        {pilots.length === 0 ? <SelectItem value="no-pilots">{"No hay pilotos"}</SelectItem> : null}
                        {pilots.map((p) => (
                          <SelectItem key={p.id} value={p.id}>
                            {p.fullName} ({p.email})
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Piloto 2 (Opcional)</Label>
                    <Select
                      value={scheduleForm.pilotId2}
                      onValueChange={(v) => setScheduleForm((s) => ({ ...s, pilotId2: v === "none" ? "" : v }))}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Seleccionar piloto 2 (opcional)" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">Sin piloto 2</SelectItem>
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
                            No hay otros pilotos disponibles
                          </SelectItem>
                        )}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Avión</Label>
                    <Select
                      value={scheduleForm.aircraftId}
                      onValueChange={(v) => setScheduleForm((s) => ({ ...s, aircraftId: v }))}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Seleccionar avión" />
                      </SelectTrigger>
                      <SelectContent>
                        {aircrafts.length === 0 ? (
                          <SelectItem value="no-aircrafts">{"No hay aviones"}</SelectItem>
                        ) : null}
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
                      <Label>Fecha</Label>
                      <Input
                        type="date"
                        value={scheduleForm.date}
                        onChange={(e) => setScheduleForm((s) => ({ ...s, date: e.target.value }))}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Hora</Label>
                      <Input
                        type="time"
                        value={scheduleForm.time}
                        onChange={(e) => setScheduleForm((s) => ({ ...s, time: e.target.value }))}
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label>Tacómetro inicial (opcional)</Label>
                    <Input
                      type="number"
                      step="0.1"
                      placeholder="1500.0"
                      value={scheduleForm.tachometerStart}
                      onChange={(e) => setScheduleForm((s) => ({ ...s, tachometerStart: e.target.value }))}
                    />
                    <div className="text-xs text-muted-foreground">Puedes ingresarlo ahora o al completar el vuelo</div>
                  </div>
                  <div className="space-y-2">
                    <Label>Notas</Label>
                    <Textarea
                      placeholder="Opcional"
                      value={scheduleForm.notes}
                      onChange={(e) => setScheduleForm((s) => ({ ...s, notes: e.target.value }))}
                      className="min-h-[40px]"
                    />
                  </div>
                  <Button onClick={handleSchedule} className="w-full bg-blue-600 hover:bg-blue-700 text-white">
                    <Calendar className="mr-2 h-4 w-4" />
                    Agendar
                  </Button>
                </div>
              </CardContent>
            </Card>

            <Card className="shadow-sm">
              <CardHeader className="bg-gradient-to-r from-red-50 to-orange-50 border-b border-red-200">
                <SectionHeader
                  title="Alertas de mantenimiento"
                  description="Aviones cercanos o en mantenimiento"
                  icon={<ShieldAlert className="h-4 w-4 text-red-600" />}
                />
              </CardHeader>
              <CardContent className="space-y-3">
                {maintenanceAlerts.length === 0 ? (
                  <div className="text-sm text-muted-foreground">Sin alertas.</div>
                ) : (
                  maintenanceAlerts.map(({ ac, accumulated, maint }) => (
                    <div key={ac.id} className="rounded-lg border p-3">
                      <div className="flex items-center justify-between">
                        <div className="font-medium">
                          {ac.tailNumber} - {ac.model}
                        </div>
                        <BadgeCheck className={cn("h-4 w-4", maint.dueNow ? "text-red-600" : "text-amber-600")} />
                      </div>
                      <div className="text-sm text-muted-foreground">
                        Acumuladas: {safeToFixed(accumulated)} hs • Intervalo:{" "}
                        {safeToFixed(ac.maintenanceIntervalHours)} hs
                      </div>
                      <div className={cn("text-sm", maint.dueNow ? "text-red-600" : "text-amber-600")}>
                        {maint.dueNow
                          ? "Mantenimiento requerido ahora"
                          : `Próximo en ~${safeToFixed(maint.dueInHours)} hs`}
                      </div>
                      <div className="pt-2">
                        <Select
                          value={ac.status}
                          onValueChange={(v: "active" | "maintenance") => handleSetAircraftStatus(ac.id, v)}
                        >
                          <SelectTrigger className="h-8 w-full">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="active">Activo</SelectItem>
                            <SelectItem value="maintenance">En mantenimiento</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  ))
                )}
              </CardContent>
            </Card>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <SectionHeader
                  title="Próximos vuelos"
                  description="Agenda de vuelos futuros"
                  icon={<Clock className="h-4 w-4" />}
                />
              </CardHeader>
              <CardContent className="space-y-2">
                {upcomingFlights.length === 0 ? (
                  <div className="text-sm text-muted-foreground">No hay vuelos agendados.</div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Fecha</TableHead>
                        <TableHead>Piloto(s)</TableHead>
                        <TableHead>Avión</TableHead>
                        <TableHead>Tacómetro</TableHead>
                        <TableHead />
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {upcomingFlights.map((f) => {
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
                                <div className="text-sm">Inicial: {safeToFixed(f.tachometerStart)}</div>
                              ) : (
                                <div className="text-xs text-muted-foreground">Se ingresará al completar</div>
                              )}
                            </TableCell>
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

            <Card>
              <CardHeader>
                <SectionHeader title="Pilotos" description="Horas y estado" icon={<BadgeCheck className="h-4 w-4" />} />
              </CardHeader>
              <CardContent className="space-y-2">
                {pilots.length === 0 ? (
                  <div className="text-sm text-muted-foreground">No hay pilotos.</div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Piloto</TableHead>
                        <TableHead>Compradas</TableHead>
                        <TableHead>Voladas</TableHead>
                        <TableHead>Restantes</TableHead>
                        <TableHead>Acciones</TableHead>
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
                                allPilots={pilots} // ✅ Agregar esta línea
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
                title="Aviones"
                description="Estado y horas acumuladas"
                icon={<Plane className="h-4 w-4" />}
              />
            </CardHeader>
            <CardContent className="space-y-2">
              {aircrafts.length === 0 ? (
                <div className="text-sm text-muted-foreground">No hay aviones.</div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Matrícula</TableHead>
                      <TableHead>Modelo</TableHead>
                      <TableHead>Acumuladas</TableHead>
                      <TableHead>Intervalo mant.</TableHead>
                      <TableHead>Estado</TableHead>
                      <TableHead>Acciones</TableHead>
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
              <CardTitle>Pilotos</CardTitle>
              <CardDescription>Perfiles completos y estado de horas.</CardDescription>
            </CardHeader>
            <CardContent>
              {pilots.length === 0 ? (
                <div className="text-sm text-muted-foreground">No hay pilotos.</div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Nombre</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead>Licencia</TableHead>
                      <TableHead>Horas compradas</TableHead>
                      <TableHead>Voladas</TableHead>
                      <TableHead>Restantes</TableHead>
                      <TableHead>Acciones</TableHead>
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
                              allPilots={pilots} // ✅ Agregar esta línea
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
              <CardTitle>Aviones</CardTitle>
              <CardDescription>Perfiles de aeronaves y mantenimiento.</CardDescription>
            </CardHeader>
            <CardContent>
              {aircrafts.length === 0 ? (
                <div className="text-sm text-muted-foreground">No hay aviones.</div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Matrícula</TableHead>
                      <TableHead>Modelo</TableHead>
                      <TableHead>Acumuladas</TableHead>
                      <TableHead>Estado</TableHead>
                      <TableHead>Próx. mant.</TableHead>
                      <TableHead>Acciones</TableHead>
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
                            {maint.dueNow ? "Ahora" : `${safeToFixed(maint.dueInHours)} hs`}
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
                Agenda de vuelos (Sistema de tacómetro)
              </CardTitle>
              <CardDescription>Completar vuelos con tacómetro inicial y final.</CardDescription>
            </CardHeader>
            <CardContent>
              {flights.filter((f) => f.status === "scheduled").length === 0 ? (
                <div className="text-sm text-muted-foreground">No hay vuelos programados.</div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Fecha</TableHead>
                      <TableHead>Piloto(s)</TableHead>
                      <TableHead>Avión</TableHead>
                      <TableHead>Tacómetro</TableHead>
                      <TableHead>Notas</TableHead>
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
                                  <div className="text-xs text-muted-foreground">Listo para completar</div>
                                </div>
                              ) : (
                                <div className="text-xs text-muted-foreground">Se ingresará al completar</div>
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
              <CardTitle>Vuelos completados recientes</CardTitle>
              <CardDescription>Historial de vuelos con datos de tacómetro.</CardDescription>
            </CardHeader>
            <CardContent>
              {flights.filter((f) => f.status === "completed").length === 0 ? (
                <div className="text-sm text-muted-foreground">No hay vuelos completados.</div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Fecha</TableHead>
                      <TableHead>Piloto(s)</TableHead>
                      <TableHead>Avión</TableHead>
                      <TableHead>Horas voladas</TableHead>
                      <TableHead>Tacómetro</TableHead>
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
                                <div className="text-xs text-muted-foreground">Vuelo legacy (sin tacómetro)</div>
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
                Guía rápida de ENVYSKY
              </CardTitle>
              <CardDescription className="text-blue-700">Aprende a usar el sistema en 5 minutos.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid md:grid-cols-2 gap-6">
                <Card className="border-l-4 border-l-blue-500">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-lg flex items-center gap-2">
                      <UserPlus className="h-4 w-4" />
                      1. Registrar pilotos
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="text-sm space-y-2">
                    <p>
                      • Ve a <strong>"Panel"</strong> → <strong>"Acciones rápidas"</strong>
                    </p>
                    <p>
                      • Completa el formulario <strong>"Compra de horas"</strong>
                    </p>
                    <p>• Si el piloto no existe, se crea automáticamente</p>
                    <p>• Las horas compradas se suman a su cuenta</p>
                  </CardContent>
                </Card>

                <Card className="border-l-4 border-l-green-500">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-lg flex items-center gap-2">
                      <Plane className="h-4 w-4" />
                      2. Agregar aviones
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="text-sm space-y-2">
                    <p>
                      • En <strong>"Acciones rápidas"</strong> → <strong>"Crear avión"</strong>
                    </p>
                    <p>• Ingresa matrícula, modelo y horas iniciales</p>
                    <p>• Define intervalo de mantenimiento (ej: cada 100 hs)</p>
                    <p>• El sistema calculará automáticamente cuándo necesita servicio</p>
                  </CardContent>
                </Card>

                <Card className="border-l-4 border-l-purple-500">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-lg flex items-center gap-2">
                      <Calendar className="h-4 w-4" />
                      3. Agendar vuelos
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="text-sm space-y-2">
                    <p>
                      • Ahora puedes seleccionar <strong>hasta 2 pilotos</strong> por vuelo
                    </p>
                    <p>
                      • El <strong>Piloto 1</strong> es obligatorio (principal)
                    </p>
                    <p>
                      • El <strong>Piloto 2</strong> es opcional
                    </p>
                    <p>
                      • Opcionalmente ingresa el <strong>tacómetro inicial</strong>
                    </p>
                  </CardContent>
                </Card>

                <Card className="border-l-4 border-l-orange-500">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-lg flex items-center gap-2">
                      <Gauge className="h-4 w-4" />
                      4. Completar vuelos (NUEVO)
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="text-sm space-y-2">
                    <p>
                      • Ve a <strong>"Agenda"</strong> y click en <strong>"Completar"</strong>
                    </p>
                    <p>
                      • Ingresa <strong>tacómetro inicial y final</strong>
                    </p>
                    <p>
                      • Las horas se calculan automáticamente: <strong>final - inicial</strong>
                    </p>
                    <p>• Se descuentan del Piloto 1 y se suman al avión</p>
                  </CardContent>
                </Card>
              </div>

              <Separator />

              <div className="bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 p-4 rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <Gauge className="h-5 w-5 text-green-600" />
                  <div className="font-semibold text-green-800">🆕 NUEVO: Sistema de tacómetro</div>
                </div>
                <div className="text-sm text-green-700 space-y-1">
                  <p>
                    • <strong>Más preciso:</strong> Las horas se calculan desde el tacómetro del avión
                  </p>
                  <p>
                    • <strong>Automático:</strong> No más cálculos manuales de duración
                  </p>
                  <p>
                    • <strong>Compatible:</strong> Los vuelos antiguos siguen funcionando
                  </p>
                  <p>
                    • <strong>Flexible:</strong> Puedes ingresar el tacómetro inicial al agendar o al completar
                  </p>
                </div>
              </div>

              <div className="grid md:grid-cols-3 gap-4">
                <div className="text-center p-4 bg-muted/50 rounded-lg">
                  <BadgeCheck className="h-8 w-8 mx-auto mb-2 text-green-600" />
                  <div className="font-medium">Alertas automáticas</div>
                  <div className="text-sm text-muted-foreground">
                    El sistema te avisa cuando un avión necesita mantenimiento
                  </div>
                </div>
                <div className="text-center p-4 bg-muted/50 rounded-lg">
                  <Clock className="h-8 w-8 mx-auto mb-2 text-blue-600" />
                  <div className="font-medium">Control de horas</div>
                  <div className="text-sm text-muted-foreground">
                    Seguimiento automático de horas compradas vs. voladas
                  </div>
                </div>
                <div className="text-center p-4 bg-muted/50 rounded-lg">
                  <Gauge className="h-8 w-8 mx-auto mb-2 text-purple-600" />
                  <div className="font-medium">Tacómetro preciso</div>
                  <div className="text-sm text-muted-foreground">Cálculo automático basado en tacómetro real</div>
                </div>
              </div>

              <Card className="bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200">
                <CardHeader>
                  <CardTitle className="text-lg text-blue-900">💡 Consejos útiles</CardTitle>
                </CardHeader>
                <CardContent className="text-sm space-y-2 text-blue-800">
                  <p>
                    • <strong>Click en nombres y matrículas</strong> para ver detalles completos
                  </p>
                  <p>
                    • <strong>Revisa las alertas</strong> de mantenimiento regularmente
                  </p>
                  <p>
                    • <strong>El tacómetro inicial</strong> es opcional al agendar, obligatorio al completar
                  </p>
                  <p>
                    • <strong>Los datos se sincronizan</strong> automáticamente con la base de datos
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

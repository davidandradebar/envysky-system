"use client"

import type React from "react"

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
import { PilotReportButton } from "@/components/pilot-report-button"

import type { Aircraft, Flight, Pilot, Purchase } from "@/lib/types"
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
    const dur = Number.parseFloat(scheduleForm.duration || "1")

    try {
      await saveFlight({
        pilotId: scheduleForm.pilotId,
        aircraftId: scheduleForm.aircraftId,
        date: scheduleForm.date,
        time: scheduleForm.time,
        duration: isNaN(dur) ? 1 : dur,
        status: "scheduled",
        notes: scheduleForm.notes || "",
      })
      await reload()
      setScheduleForm({ pilotId: "", aircraftId: "", date: "", time: "", duration: "", notes: "" })
    } catch (error) {
      console.error("Error saving flight:", error)
    }
  }

  const handleCompleteFlight = async (flightId: string) => {
    try {
      await updateFlightStatus(flightId, "completed")
      await reload()
    } catch (error) {
      console.error("Error completing flight:", error)
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
    aircraftId: string
    date: string
    time: string
    duration: string
    notes: string
  }>({ pilotId: "", aircraftId: "", date: "", time: "", duration: "", notes: "" })

  const handleSetAircraftStatus = (aircraftId: string, status: "active" | "maintenance") => {
    // This function is not updated as per the provided updates
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
                  <div className="font-medium">Agendar vuelo</div>
                  <div className="space-y-2">
                    <Label>Piloto</Label>
                    <Select
                      value={scheduleForm.pilotId}
                      onValueChange={(v) => setScheduleForm((s) => ({ ...s, pilotId: v }))}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Seleccionar piloto" />
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
                  <div className="grid grid-cols-2 gap-2">
                    <div className="space-y-2">
                      <Label>Duración (hs)</Label>
                      <Input
                        type="number"
                        min="0"
                        step="0.1"
                        placeholder="1.5"
                        value={scheduleForm.duration}
                        onChange={(e) => setScheduleForm((s) => ({ ...s, duration: e.target.value }))}
                      />
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
                        <TableHead>Piloto</TableHead>
                        <TableHead>Avión</TableHead>
                        <TableHead>Duración</TableHead>
                        <TableHead />
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {upcomingFlights.map((f) => {
                        const p = pilots.find((x) => x.id === f.pilotId)
                        const a = aircrafts.find((x) => x.id === f.aircraftId)
                        return (
                          <TableRow key={f.id}>
                            <TableCell>
                              {f.date} {f.time}
                            </TableCell>
                            <TableCell>
                              <Link className="underline hover:text-primary" href={`/pilots/${p?.id || ""}`}>
                                {p?.fullName || "—"}
                              </Link>
                            </TableCell>
                            <TableCell>
                              <Link className="underline hover:text-primary" href={`/aircrafts/${a?.id || ""}`}>
                                {a?.tailNumber || "—"}
                              </Link>
                            </TableCell>
                            <TableCell>{safeToFixed(f.duration)} hs</TableCell>
                            <TableCell className="text-right">
                              <Button
                                size="sm"
                                onClick={() => handleCompleteFlight(f.id)}
                                className="w-full bg-blue-600 hover:bg-blue-700 text-white"
                              >
                                <CheckCircle2 className="mr-2 h-4 w-4" />
                                Completar
                              </Button>
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
              <CardTitle>Agenda de vuelos</CardTitle>
              <CardDescription>Completar vuelos realizados o cancelar.</CardDescription>
            </CardHeader>
            <CardContent>
              {flights.filter((f) => f.status === "scheduled").length === 0 ? (
                <div className="text-sm text-muted-foreground">No hay vuelos programados.</div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Fecha</TableHead>
                      <TableHead>Piloto</TableHead>
                      <TableHead>Avión</TableHead>
                      <TableHead>Duración</TableHead>
                      <TableHead>Notas</TableHead>
                      <TableHead />
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {flights
                      .filter((f) => f.status === "scheduled")
                      .sort((a, b) => (a.date + a.time).localeCompare(b.date + b.time))
                      .map((f) => {
                        const p = pilots.find((x) => x.id === f.pilotId)
                        const a = aircrafts.find((x) => x.id === f.aircraftId)
                        return (
                          <TableRow key={f.id}>
                            <TableCell>
                              {f.date} {f.time}
                            </TableCell>
                            <TableCell>
                              <Link className="underline hover:text-primary" href={`/pilots/${p?.id || ""}`}>
                                {p?.fullName || "—"}
                              </Link>
                            </TableCell>
                            <TableCell>
                              <Link className="underline hover:text-primary" href={`/aircrafts/${a?.id || ""}`}>
                                {a?.tailNumber || "—"}
                              </Link>
                            </TableCell>
                            <TableCell>{safeToFixed(f.duration)} hs</TableCell>
                            <TableCell className="max-w-[240px] truncate">{f.notes}</TableCell>
                            <TableCell className="text-right">
                              <div className="flex gap-2 justify-end">
                                <Button
                                  variant="default"
                                  size="sm"
                                  onClick={() => handleCompleteFlight(f.id)}
                                  className="w-full bg-blue-600 hover:bg-blue-700 text-white"
                                >
                                  <CheckCircle2 className="mr-2 h-4 w-4" />
                                  Completar
                                </Button>
                              </div>
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
                      • Ve a <strong>"Agenda"</strong> para ver vuelos programados
                    </p>
                    <p>
                      • Click en <strong>"Completar"</strong> cuando termine el vuelo
                    </p>
                    <p>• Las horas se descuentan automáticamente del piloto</p>
                    <p>• Se suman a las horas acumuladas del avión</p>
                  </CardContent>
                </Card>

                <Card className="border-l-4 border-l-orange-500">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-lg flex items-center gap-2">
                      <CheckCircle2 className="h-4 w-4" />
                      4. Completar vuelos
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="text-sm space-y-2">
                    <p>
                      • Ve a <strong>"Agenda"</strong> para ver vuelos programados
                    </p>
                    <p>
                      • Click en <strong>"Completar"</strong> cuando termine el vuelo
                    </p>
                    <p>• Las horas se descuentan automáticamente del piloto</p>
                    <p>• Se suman a las horas acumuladas del avión</p>
                  </CardContent>
                </Card>
              </div>

              <Separator />

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
                  <ShieldAlert className="h-8 w-8 mx-auto mb-2 text-orange-600" />
                  <div className="font-medium">Gestión de flota</div>
                  <div className="text-sm text-muted-foreground">Control de estado y mantenimiento de aeronaves</div>
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
                    • <strong>Los datos se guardan</strong> automáticamente en tu navegador
                  </p>
                  <p>
                    • <strong>Para uso empresarial</strong>, configura una base de datos (Neon)
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

"use client"

import { useEffect, useMemo, useState } from "react"
import Link from "next/link"
import { ArrowLeft, BadgeCheck, Users } from 'lucide-react'
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

import type { Aircraft, Flight, Pilot } from "@/lib/types"
import { getAircrafts, getFlights, getPilots } from "@/lib/db"
import { calcAircraftAccumulatedHours, calcAircraftMaintenance } from "@/lib/aggregates"
import { cn } from "@/lib/utils"

// Helper function to safely format numbers
const safeToFixed = (value: any, decimals = 1): string => {
  const num = typeof value === "number" ? value : Number.parseFloat(value) || 0
  return num.toFixed(decimals)
}

export default function AircraftPage({ params }: { params: { id: string } }) {
  const [aircraft, setAircraft] = useState<Aircraft | null>(null)
  const [flights, setFlights] = useState<Flight[]>([])
  const [pilots, setPilots] = useState<Pilot[]>([])

  useEffect(() => {
    const loadData = async () => {
      try {
        const [aircraftsData, flightsData, pilotsData] = await Promise.all([getAircrafts(), getFlights(), getPilots()])

        const foundAircraft = aircraftsData.find((a) => a.id === params.id) || null
        setAircraft(foundAircraft)
        setFlights(flightsData)
        setPilots(pilotsData)
      } catch (error) {
        console.error("Error loading aircraft data:", error)
      }
    }
    loadData()
  }, [params.id])

  const { accumulated } = useMemo(
    () => (aircraft ? calcAircraftAccumulatedHours(aircraft, flights) : { accumulated: 0 }),
    [aircraft, flights],
  )
  const maint = useMemo(
    () => (aircraft ? calcAircraftMaintenance(aircraft, accumulated) : { dueNow: false, dueInHours: 0 }),
    [aircraft, accumulated],
  )

  const history = useMemo(() => flights.filter((f) => f.aircraftId === aircraft?.id), [flights, aircraft])

  const pilotsMap = useMemo(() => {
    const map: Record<string, Pilot> = {}
    pilots.forEach((p) => (map[p.id] = p))
    return map
  }, [pilots])

  const handleSetStatus = async (status: "active" | "maintenance") => {
    if (!aircraft) return
    // TODO: Implement aircraft status update API call
    setAircraft({ ...aircraft, status })
  }

  if (!aircraft) {
    return (
      <main className="mx-auto max-w-5xl p-4 md:p-8">
        <div className="mb-4">
          <Button asChild variant="outline" size="sm">
            <Link href="/">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Volver
            </Link>
          </Button>
        </div>
        <Card>
          <CardHeader>
            <CardTitle>Avión no encontrado</CardTitle>
            <CardDescription>El perfil solicitado no existe.</CardDescription>
          </CardHeader>
        </Card>
      </main>
    )
  }

  return (
    <main className="mx-auto max-w-5xl p-4 md:p-8 space-y-6">
      <div className="mb-2">
        <Button asChild variant="outline" size="sm">
          <Link href="/">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Volver
          </Link>
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>
            {aircraft.tailNumber} — {aircraft.model}
          </CardTitle>
          <CardDescription>
            Acumuladas: {safeToFixed(accumulated)} hs • Intervalo mantenimiento:{" "}
            {safeToFixed(aircraft.maintenanceIntervalHours)} hs
          </CardDescription>
        </CardHeader>
        <CardContent className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="rounded-lg border p-3">
            <div className="text-sm text-muted-foreground">Estado</div>
            <Select value={aircraft.status} onValueChange={(v: "active" | "maintenance") => handleSetStatus(v)}>
              <SelectTrigger className="mt-1">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="active">Activo</SelectItem>
                <SelectItem value="maintenance">En mantenimiento</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="rounded-lg border p-3">
            <div className="text-sm text-muted-foreground">Próximo mantenimiento</div>
            <div className={cn("text-2xl font-semibold", maint.dueNow ? "text-red-600" : "text-amber-600")}>
              {maint.dueNow ? "Ahora" : `${safeToFixed(maint.dueInHours)} hs`}
            </div>
          </div>
          <div className="rounded-lg border p-3">
            <div className="text-sm text-muted-foreground">Alerta</div>
            <div className="text-2xl font-semibold flex items-center gap-2">
              <BadgeCheck className={cn("h-5 w-5", maint.dueNow ? "text-red-600" : "text-amber-600")} />
              {maint.dueNow ? "Requerido" : "Próximo"}
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>
            <Users className="h-4 w-4 inline mr-2" />
            Historial de vuelos y pilotos
          </CardTitle>
        </CardHeader>
        <CardContent>
          {history.length === 0 ? (
            <div className="text-sm text-muted-foreground">Sin vuelos.</div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Fecha</TableHead>
                  <TableHead>Piloto</TableHead>
                  <TableHead>Duración</TableHead>
                  <TableHead>Estado</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {history
                  .sort((a, b) => (b.date + b.time).localeCompare(a.date + a.time))
                  .map((f) => (
                    <TableRow key={f.id}>
                      <TableCell>
                        {f.date} {f.time}
                      </TableCell>
                      <TableCell>{pilotsMap[f.pilotId]?.fullName || "—"}</TableCell>
                      <TableCell>{safeToFixed(f.duration)} hs</TableCell>
                      <TableCell className="capitalize">{f.status}</TableCell>
                    </TableRow>
                  ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </main>
  )
}

"use client"

import { useEffect, useMemo, useState } from "react"
import Link from "next/link"
import { ArrowLeft, Calendar, Plane } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { PilotReportButton } from "@/components/pilot-report-button"

import type { Pilot, Flight, Purchase, Aircraft } from "@/lib/types"
import { getPilots, getFlights, getPurchases, getAircrafts } from "@/lib/db"
import { calcPilotHours } from "@/lib/aggregates"

// Helper function to safely format numbers
const safeToFixed = (value: any, decimals = 1): string => {
  const num = typeof value === "number" ? value : Number.parseFloat(value) || 0
  return num.toFixed(decimals)
}

export default function PilotPage({ params }: { params: { id: string } }) {
  const [pilot, setPilot] = useState<Pilot | null>(null)
  const [flights, setFlights] = useState<Flight[]>([])
  const [purchases, setPurchases] = useState<Purchase[]>([])
  const [aircrafts, setAircrafts] = useState<Aircraft[]>([])
  const [pilots, setPilots] = useState<Pilot[]>([])

  useEffect(() => {
    const loadData = async () => {
      try {
        const [pilotsData, flightsData, purchasesData, aircraftsData] = await Promise.all([
          getPilots(),
          getFlights(),
          getPurchases(),
          getAircrafts(),
        ])

        const foundPilot = pilotsData.find((p) => p.id === params.id) || null
        setPilot(foundPilot)
        setFlights(flightsData)
        setPurchases(purchasesData)
        setAircrafts(aircraftsData)
        setPilots(pilotsData)
      } catch (error) {
        console.error("Error loading pilot data:", error)
      }
    }
    loadData()
  }, [params.id])

  const hours = useMemo(() => {
    if (!pilot) return null
    const result = calcPilotHours(pilot.id, purchases, flights)
    return {
      purchased: typeof result.purchased === "number" ? result.purchased : 0,
      flown: typeof result.flown === "number" ? result.flown : 0,
      remaining: typeof result.remaining === "number" ? result.remaining : 0,
    }
  }, [pilot, purchases, flights])

  const pilotFlights = useMemo(
    () => flights.filter((f) => f.pilotId === pilot?.id || f.pilotId2 === pilot?.id),
    [flights, pilot],
  )

  const getAircraft = (id: string) => {
    return aircrafts.find((a) => a.id === id) || null
  }

  if (!pilot) {
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
            <CardTitle>Piloto no encontrado</CardTitle>
            <CardDescription>El perfil solicitado no existe.</CardDescription>
          </CardHeader>
        </Card>
      </main>
    )
  }

  return (
    <main className="mx-auto max-w-5xl p-4 md:p-8 space-y-6">
      <div className="mb-2 flex gap-2">
        <Button asChild variant="outline" size="sm">
          <Link href="/">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Volver
          </Link>
        </Button>
        <PilotReportButton
          pilot={pilot}
          flights={flights}
          purchases={purchases}
          aircrafts={aircrafts}
          allPilots={pilots} // ✅ Agregar esta línea
          variant="default"
          size="sm"
        />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>{pilot.fullName}</CardTitle>
          <CardDescription>
            {pilot.email} • {pilot.licenseType || "Sin licencia"}
          </CardDescription>
        </CardHeader>
        <CardContent className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="rounded-lg border p-3">
            <div className="text-sm text-muted-foreground">Horas compradas</div>
            <div className="text-2xl font-semibold">{safeToFixed(hours?.purchased)}</div>
          </div>
          <div className="rounded-lg border p-3">
            <div className="text-sm text-muted-foreground">Horas voladas</div>
            <div className="text-2xl font-semibold">{safeToFixed(hours?.flown)}</div>
          </div>
          <div className="rounded-lg border p-3">
            <div className="text-sm text-muted-foreground">Horas restantes</div>
            <div className="text-2xl font-semibold">{safeToFixed(hours?.remaining)}</div>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>
              <Calendar className="h-4 w-4 inline mr-2" />
              Vuelos programados
            </CardTitle>
          </CardHeader>
          <CardContent>
            {pilotFlights.filter((f) => f.status === "scheduled").length === 0 ? (
              <div className="text-sm text-muted-foreground">Sin vuelos programados.</div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Fecha</TableHead>
                    <TableHead>Avión</TableHead>
                    <TableHead>Duración</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {pilotFlights
                    .filter((f) => f.status === "scheduled")
                    .sort((a, b) => (a.date + a.time).localeCompare(b.date + b.time))
                    .map((f) => {
                      const ac = getAircraft(f.aircraftId)
                      return (
                        <TableRow key={f.id}>
                          <TableCell>
                            {f.date} {f.time}
                          </TableCell>
                          <TableCell>{ac?.tailNumber || "—"}</TableCell>
                          <TableCell>{safeToFixed(f.duration)} hs</TableCell>
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
            <CardTitle>
              <Plane className="h-4 w-4 inline mr-2" />
              Vuelos realizados
            </CardTitle>
          </CardHeader>
          <CardContent>
            {pilotFlights.filter((f) => f.status === "completed").length === 0 ? (
              <div className="text-sm text-muted-foreground">Sin vuelos realizados.</div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Fecha</TableHead>
                    <TableHead>Piloto(s)</TableHead>
                    <TableHead>Avión</TableHead>
                    <TableHead>Duración</TableHead>
                    <TableHead>Notas</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {pilotFlights
                    .filter((f) => f.status === "completed")
                    .sort((a, b) => (b.date + b.time).localeCompare(a.date + a.time))
                    .map((f) => {
                      const ac = getAircraft(f.aircraftId)
                      const pilot1 = pilots.find((p) => p.id === f.pilotId)
                      const pilot2 = f.pilotId2 ? pilots.find((p) => p.id === f.pilotId2) : null

                      return (
                        <TableRow key={f.id}>
                          <TableCell>
                            {f.date} {f.time}
                          </TableCell>
                          <TableCell>
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
                          </TableCell>
                          <TableCell>{ac?.tailNumber || "—"}</TableCell>
                          <TableCell>{safeToFixed(f.duration)} hs</TableCell>
                          <TableCell className="max-w-[360px] truncate">{f.notes || "—"}</TableCell>
                        </TableRow>
                      )
                    })}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>
    </main>
  )
}

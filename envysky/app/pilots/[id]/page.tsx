"use client"

import { useEffect, useMemo, useState } from "react"
import Link from "next/link"
import { ArrowLeft, Calendar, Plane } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"

import type { Pilot, Flight, Purchase, Aircraft } from "@/lib/types"
import { getPilotById, getFlights, getAircraftById } from "@/lib/local-db"
import { calcPilotHours } from "@/lib/aggregates"

export default function PilotPage({ params }: { params: { id: string } }) {
  const [pilot, setPilot] = useState<Pilot | null>(null)
  const [flights, setFlights] = useState<Flight[]>([])
  const [purchases, setPurchases] = useState<Purchase[]>([])
  const [aircraftCache, setAircraftCache] = useState<Record<string, Aircraft | null>>({})

  useEffect(() => {
    setPilot(getPilotById(params.id) || null)
    setFlights(getFlights())
    const storedPurchases =
      (typeof window !== "undefined" &&
        (JSON.parse(localStorage.getItem("envysky:purchases") || "[]") as Purchase[])) ||
      []
    setPurchases(storedPurchases)
  }, [params.id])

  const hours = useMemo(
    () => (pilot ? calcPilotHours(pilot.id, purchases, flights) : null),
    [pilot, purchases, flights],
  )

  const pilotFlights = useMemo(() => flights.filter((f) => f.pilotId === pilot?.id), [flights, pilot])

  const getAircraft = (id: string) => {
    if (aircraftCache[id] !== undefined) return aircraftCache[id]
    const ac = getAircraftById(id) || null
    setAircraftCache((c) => ({ ...c, [id]: ac }))
    return ac
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
          <CardTitle>{pilot.fullName}</CardTitle>
          <CardDescription>
            {pilot.email} • {pilot.licenseType || "Sin licencia"}
          </CardDescription>
        </CardHeader>
        <CardContent className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="rounded-lg border p-3">
            <div className="text-sm text-muted-foreground">Horas compradas</div>
            <div className="text-2xl font-semibold">{hours?.purchased.toFixed(1)}</div>
          </div>
          <div className="rounded-lg border p-3">
            <div className="text-sm text-muted-foreground">Horas voladas</div>
            <div className="text-2xl font-semibold">{hours?.flown.toFixed(1)}</div>
          </div>
          <div className="rounded-lg border p-3">
            <div className="text-sm text-muted-foreground">Horas restantes</div>
            <div className="text-2xl font-semibold">{hours?.remaining.toFixed(1)}</div>
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
                          <TableCell>{f.duration.toFixed(1)} hs</TableCell>
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
                      return (
                        <TableRow key={f.id}>
                          <TableCell>
                            {f.date} {f.time}
                          </TableCell>
                          <TableCell>{ac?.tailNumber || "—"}</TableCell>
                          <TableCell>{f.duration.toFixed(1)} hs</TableCell>
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

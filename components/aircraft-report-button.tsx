"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { FileText, Plane, Clock, Wrench, AlertTriangle } from "lucide-react"
import type { Aircraft, Flight, Pilot } from "@/lib/types"
import { calcAircraftAccumulatedHours, calcAircraftMaintenance } from "@/lib/aggregates"
import { calculateFlightHours } from "@/lib/types"

interface AircraftReportButtonProps {
  aircraft: Aircraft
  flights: Flight[]
  pilots: Pilot[]
  variant?: "default" | "outline" | "secondary" | "ghost" | "link" | "destructive"
  size?: "default" | "sm" | "lg" | "icon"
}

export function AircraftReportButton({
  aircraft,
  flights,
  pilots,
  variant = "outline",
  size = "sm",
}: AircraftReportButtonProps) {
  const [open, setOpen] = useState(false)

  const aircraftHours = calcAircraftAccumulatedHours(aircraft, flights)
  const maintenanceInfo = calcAircraftMaintenance(aircraft, aircraftHours.accumulated)
  const aircraftFlights = flights.filter((f) => f.aircraftId === aircraft.id)

  // Helper function to safely format numbers
  const safeToFixed = (value: any, decimals = 1): string => {
    const num = typeof value === "number" ? value : Number.parseFloat(value) || 0
    return num.toFixed(decimals)
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant={variant} size={size}>
          <FileText className="mr-2 h-4 w-4" />
          Report
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Plane className="h-5 w-5" />
            Aircraft Report: {aircraft.tailNumber}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Aircraft Information */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Aircraft Information</CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-2 gap-4">
              <div>
                <div className="text-sm font-medium text-muted-foreground">Tail Number</div>
                <div className="font-medium">{aircraft.tailNumber}</div>
              </div>
              <div>
                <div className="text-sm font-medium text-muted-foreground">Model</div>
                <div>{aircraft.model}</div>
              </div>
              <div>
                <div className="text-sm font-medium text-muted-foreground">Status</div>
                <Badge variant={aircraft.status === "active" ? "default" : "secondary"}>{aircraft.status}</Badge>
              </div>
              <div>
                <div className="text-sm font-medium text-muted-foreground">Initial Hours</div>
                <div>{safeToFixed(aircraft.initialHours)} hrs</div>
              </div>
              <div>
                <div className="text-sm font-medium text-muted-foreground">Maintenance Interval</div>
                <div>{safeToFixed(aircraft.maintenanceIntervalHours)} hrs</div>
              </div>
            </CardContent>
          </Card>

          {/* Hours Summary */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Clock className="h-5 w-5" />
                Hours Summary
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-3 gap-4">
                <div className="text-center">
                  <div className="text-2xl font-bold text-blue-600">{safeToFixed(aircraftHours.initial)}</div>
                  <div className="text-sm text-muted-foreground">Initial Hours</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-green-600">{safeToFixed(aircraftHours.flown)}</div>
                  <div className="text-sm text-muted-foreground">Flown Hours</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-purple-600">{safeToFixed(aircraftHours.accumulated)}</div>
                  <div className="text-sm text-muted-foreground">Total Hours</div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Maintenance Status */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Wrench className="h-5 w-5" />
                Maintenance Status
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="space-y-1">
                    <div className="font-medium">Next Maintenance Due</div>
                    <div className="text-sm text-muted-foreground">
                      At {safeToFixed(maintenanceInfo.nextMaintenanceAt)} hours
                    </div>
                  </div>
                  <div className="text-right">
                    {maintenanceInfo.dueNow ? (
                      <div className="flex items-center gap-2 text-red-600">
                        <AlertTriangle className="h-4 w-4" />
                        <span className="font-medium">Due Now</span>
                      </div>
                    ) : (
                      <div className="text-orange-600 font-medium">
                        In {safeToFixed(maintenanceInfo.dueInHours)} hrs
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Recent Flights */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Plane className="h-5 w-5" />
                Recent Flights ({aircraftFlights.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              {aircraftFlights.length === 0 ? (
                <div className="text-sm text-muted-foreground">No flights recorded.</div>
              ) : (
                <div className="space-y-3">
                  {aircraftFlights
                    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
                    .slice(0, 10)
                    .map((flight) => {
                      const pilot1 = pilots.find((p) => p.id === flight.pilotId)
                      const pilot2 = flight.pilotId2 ? pilots.find((p) => p.id === flight.pilotId2) : null
                      const hours = calculateFlightHours(flight)

                      return (
                        <div key={flight.id} className="flex items-center justify-between p-3 border rounded-lg">
                          <div className="space-y-1">
                            <div className="flex items-center gap-2">
                              <Badge variant={flight.status === "completed" ? "default" : "secondary"}>
                                {flight.status}
                              </Badge>
                              <span className="text-sm font-medium">
                                {flight.date} {flight.time}
                              </span>
                            </div>
                            <div className="text-sm text-muted-foreground">
                              Pilot 1: {pilot1?.fullName || "Unknown"}
                            </div>
                            {pilot2 && <div className="text-sm text-muted-foreground">Pilot 2: {pilot2.fullName}</div>}
                            {flight.notes && <div className="text-sm text-muted-foreground">Notes: {flight.notes}</div>}
                          </div>
                          <div className="text-right">
                            <div className="font-medium">{safeToFixed(hours)} hrs</div>
                            {flight.tachometerStart !== undefined && flight.tachometerEnd !== undefined && (
                              <div className="text-xs text-muted-foreground">
                                {safeToFixed(flight.tachometerStart)} → {safeToFixed(flight.tachometerEnd)}
                              </div>
                            )}
                          </div>
                        </div>
                      )
                    })}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </DialogContent>
    </Dialog>
  )
}

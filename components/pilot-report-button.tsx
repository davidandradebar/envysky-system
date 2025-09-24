"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { FileText, User, Clock, Plane } from "lucide-react"
import type { Pilot, Flight, Purchase, Aircraft } from "@/lib/types"
import { calcPilotHours } from "@/lib/aggregates"
import { calculateFlightHours } from "@/lib/types"

interface PilotReportButtonProps {
  pilot: Pilot
  flights: Flight[]
  purchases: Purchase[]
  aircrafts: Aircraft[]
  allPilots: Pilot[]
  variant?: "default" | "outline" | "secondary" | "ghost" | "link" | "destructive"
  size?: "default" | "sm" | "lg" | "icon"
}

export function PilotReportButton({
  pilot,
  flights,
  purchases,
  aircrafts,
  allPilots,
  variant = "outline",
  size = "sm",
}: PilotReportButtonProps) {
  const [open, setOpen] = useState(false)

  const pilotHours = calcPilotHours(pilot.id, purchases, flights)
  const pilotFlights = flights.filter((f) => f.pilotId === pilot.id || f.pilotId2 === pilot.id)
  const pilotPurchases = purchases.filter((p) => p.pilotId === pilot.id)

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
            <User className="h-5 w-5" />
            Pilot Report: {pilot.fullName}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Pilot Information */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Pilot Information</CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-2 gap-4">
              <div>
                <div className="text-sm font-medium text-muted-foreground">Full Name</div>
                <div>{pilot.fullName}</div>
              </div>
              <div>
                <div className="text-sm font-medium text-muted-foreground">Email</div>
                <div>{pilot.email}</div>
              </div>
              <div>
                <div className="text-sm font-medium text-muted-foreground">Phone</div>
                <div>{pilot.phone || "—"}</div>
              </div>
              <div>
                <div className="text-sm font-medium text-muted-foreground">Country</div>
                <div>{pilot.country || "—"}</div>
              </div>
              <div>
                <div className="text-sm font-medium text-muted-foreground">Birth Date</div>
                <div>{pilot.birthDate || "—"}</div>
              </div>
              <div>
                <div className="text-sm font-medium text-muted-foreground">License Type</div>
                <div>{pilot.licenseType || "—"}</div>
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
                  <div className="text-2xl font-bold text-blue-600">{safeToFixed(pilotHours.purchased)}</div>
                  <div className="text-sm text-muted-foreground">Purchased Hours</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-green-600">{safeToFixed(pilotHours.flown)}</div>
                  <div className="text-sm text-muted-foreground">Flown Hours</div>
                </div>
                <div className="text-center">
                  <div
                    className={`text-2xl font-bold ${pilotHours.remaining <= 0 ? "text-red-600" : "text-orange-600"}`}
                  >
                    {safeToFixed(pilotHours.remaining)}
                  </div>
                  <div className="text-sm text-muted-foreground">Remaining Hours</div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Recent Flights */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Plane className="h-5 w-5" />
                Recent Flights ({pilotFlights.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              {pilotFlights.length === 0 ? (
                <div className="text-sm text-muted-foreground">No flights recorded.</div>
              ) : (
                <div className="space-y-3">
                  {pilotFlights
                    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
                    .slice(0, 10)
                    .map((flight) => {
                      const aircraft = aircrafts.find((a) => a.id === flight.aircraftId)
                      const copilot = flight.pilotId2 ? allPilots.find((p) => p.id === flight.pilotId2) : null
                      const hours = calculateFlightHours(flight)
                      const isPilot1 = flight.pilotId === pilot.id

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
                              Aircraft: {aircraft?.tailNumber || "Unknown"} - {aircraft?.model || ""}
                            </div>
                            {copilot && (
                              <div className="text-sm text-muted-foreground">
                                {isPilot1 ? "Copilot" : "Pilot"}: {copilot.fullName}
                              </div>
                            )}
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

          {/* Purchase History */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Purchase History ({pilotPurchases.length})</CardTitle>
            </CardHeader>
            <CardContent>
              {pilotPurchases.length === 0 ? (
                <div className="text-sm text-muted-foreground">No purchases recorded.</div>
              ) : (
                <div className="space-y-2">
                  {pilotPurchases
                    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
                    .map((purchase) => (
                      <div key={purchase.id} className="flex items-center justify-between p-3 border rounded-lg">
                        <div>
                          <div className="font-medium">{purchase.date}</div>
                          <div className="text-sm text-muted-foreground">Purchase ID: {purchase.id}</div>
                        </div>
                        <div className="text-right">
                          <div className="font-medium text-blue-600">+{safeToFixed(purchase.hours)} hrs</div>
                        </div>
                      </div>
                    ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </DialogContent>
    </Dialog>
  )
}

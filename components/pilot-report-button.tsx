"use client"

import { useState } from "react"
import { FileText } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { PilotReport } from "./pilot-report"

import type { Pilot, Flight, Purchase, Aircraft } from "@/lib/types"

interface PilotReportButtonProps {
  pilot: Pilot
  flights: Flight[]
  purchases: Purchase[]
  aircrafts: Aircraft[]
  allPilots?: Pilot[] // Agregar lista de todos los pilotos
  variant?: "default" | "outline" | "ghost"
  size?: "default" | "sm" | "lg"
}

export function PilotReportButton({
  pilot,
  flights,
  purchases,
  aircrafts,
  allPilots = [],
  variant = "outline",
  size = "sm",
}: PilotReportButtonProps) {
  const [open, setOpen] = useState(false)

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button
          variant={variant}
          size={size}
          className="bg-blue-600 hover:bg-blue-700 text-white border-blue-600 hover:border-blue-700"
        >
          <FileText className="h-4 w-4 mr-2" />
          Generate report
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-xl text-blue-900">📋 Full report - {pilot.fullName}</DialogTitle>
        </DialogHeader>
        <PilotReport
          pilot={pilot}
          flights={flights}
          purchases={purchases}
          aircrafts={aircrafts}
          allPilots={allPilots}
        />
      </DialogContent>
    </Dialog>
  )
}

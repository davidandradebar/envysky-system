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
  variant?: "default" | "outline" | "ghost"
  size?: "default" | "sm" | "lg"
}

export function PilotReportButton({
  pilot,
  flights,
  purchases,
  aircrafts,
  variant = "outline",
  size = "sm",
}: PilotReportButtonProps) {
  const [open, setOpen] = useState(false)

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant={variant} size={size} className="bg-green-600 hover:bg-green-700 text-white border-green-600">
          <FileText className="h-4 w-4 mr-2" />
          Generar Informe
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Informe de Piloto - {pilot.fullName}</DialogTitle>
        </DialogHeader>
        <PilotReport pilot={pilot} flights={flights} purchases={purchases} aircrafts={aircrafts} />
      </DialogContent>
    </Dialog>
  )
}

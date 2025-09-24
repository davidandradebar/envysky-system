"use client"

import { useState } from "react"
import { FileText } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { AircraftReport } from "./aircraft-report"

import type { Aircraft, Flight, Pilot } from "@/lib/types"

interface AircraftReportButtonProps {
  aircraft: Aircraft
  flights: Flight[]
  pilots: Pilot[]
  variant?: "default" | "outline" | "ghost"
  size?: "default" | "sm" | "lg"
}

export function AircraftReportButton({
  aircraft,
  flights,
  pilots,
  variant = "outline",
  size = "sm",
}: AircraftReportButtonProps) {
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
          <DialogTitle className="text-xl text-blue-900">
            📋 Full report - {aircraft.tailNumber} ({aircraft.model})
          </DialogTitle>
        </DialogHeader>
        <AircraftReport aircraft={aircraft} flights={flights} pilots={pilots} />
      </DialogContent>
    </Dialog>
  )
}

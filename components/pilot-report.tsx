"use client"

import { useMemo } from "react"
import { FileText, Download, Printer, Calendar, Plane, Clock, User } from "lucide-react"
import { Button } from "@/components/ui/button"

import type { Pilot, Flight, Purchase, Aircraft } from "@/lib/types"
import { calcPilotHours } from "@/lib/aggregates"
import { cn } from "@/lib/utils"

// Helper function to safely format numbers
const safeToFixed = (value: any, decimals = 1): string => {
  const num = typeof value === "number" ? value : Number.parseFloat(value) || 0
  return num.toFixed(decimals)
}

interface PilotReportProps {
  pilot: Pilot
  flights: Flight[]
  purchases: Purchase[]
  aircrafts: Aircraft[]
}

export function PilotReport({ pilot, flights, purchases, aircrafts }: PilotReportProps) {
  const hours = useMemo(() => {
    const result = calcPilotHours(pilot.id, purchases, flights)
    return {
      purchased: typeof result.purchased === "number" ? result.purchased : 0,
      flown: typeof result.flown === "number" ? result.flown : 0,
      remaining: typeof result.remaining === "number" ? result.remaining : 0,
    }
  }, [pilot.id, purchases, flights])

  const pilotFlights = useMemo(
    () =>
      flights.filter((f) => f.pilotId === pilot.id).sort((a, b) => (b.date + b.time).localeCompare(a.date + a.time)),
    [flights, pilot.id],
  )

  const pilotPurchases = useMemo(
    () => purchases.filter((p) => p.pilotId === pilot.id).sort((a, b) => b.date.localeCompare(a.date)),
    [purchases, pilot.id],
  )

  const getAircraft = (id: string) => aircrafts.find((a) => a.id === id)

  const handlePrint = () => {
    window.print()
  }

  const handleDownloadPDF = () => {
    window.print()
  }

  const currentDate = new Date().toLocaleDateString("es-ES", {
    year: "numeric",
    month: "long",
    day: "numeric",
  })

  return (
    <>
      {/* Estilos de impresión mejorados */}
      <style jsx global>{`
        @media print {
          * {
            -webkit-print-color-adjust: exact !important;
            color-adjust: exact !important;
            print-color-adjust: exact !important;
          }
          
          body {
            margin: 0 !important;
            padding: 0 !important;
            font-size: 12px !important;
            line-height: 1.4 !important;
            color: #000 !important;
            background: white !important;
          }
          
          .no-print {
            display: none !important;
          }
          
          .pilot-report {
            display: block !important;
            visibility: visible !important;
            position: static !important;
            width: 100% !important;
            max-width: none !important;
            margin: 0 !important;
            padding: 20px !important;
            box-shadow: none !important;
            border: none !important;
            background: white !important;
          }
          
          .print-card {
            border: 1px solid #ddd !important;
            margin-bottom: 15px !important;
            padding: 15px !important;
            background: white !important;
            page-break-inside: avoid;
          }
          
          .print-header {
            background: #f8f9fa !important;
            padding: 10px !important;
            margin-bottom: 10px !important;
            border-bottom: 2px solid #dee2e6 !important;
          }
          
          .print-table {
            width: 100% !important;
            border-collapse: collapse !important;
            margin-bottom: 15px !important;
          }
          
          .print-table th,
          .print-table td {
            border: 1px solid #ddd !important;
            padding: 8px !important;
            text-align: left !important;
            font-size: 11px !important;
          }
          
          .print-table th {
            background-color: #f8f9fa !important;
            font-weight: bold !important;
          }
          
          .print-summary-grid {
            display: grid !important;
            grid-template-columns: 1fr 1fr 1fr !important;
            gap: 15px !important;
            margin-bottom: 20px !important;
          }
          
          .print-summary-item {
            text-align: center !important;
            padding: 15px !important;
            border: 1px solid #ddd !important;
            background: #f8f9fa !important;
          }
          
          .print-title {
            font-size: 24px !important;
            font-weight: bold !important;
            text-align: center !important;
            margin-bottom: 20px !important;
            color: #1e40af !important;
          }
          
          .print-section-title {
            font-size: 16px !important;
            font-weight: bold !important;
            margin-bottom: 10px !important;
            color: #374151 !important;
            border-bottom: 1px solid #ddd !important;
            padding-bottom: 5px !important;
          }
          
          .page-break {
            page-break-before: always !important;
          }
        }
      `}</style>

      {/* Botones de acción - ocultos en impresión */}
      <div className="no-print flex gap-2 mb-6">
        <Button onClick={handlePrint} className="bg-blue-600 hover:bg-blue-700">
          <Printer className="h-4 w-4 mr-2" />
          Imprimir Informe
        </Button>
        <Button onClick={handleDownloadPDF} variant="outline">
          <Download className="h-4 w-4 mr-2" />
          Descargar PDF
        </Button>
      </div>

      {/* Contenido del informe */}
      <div className="pilot-report bg-white">
        {/* Encabezado */}
        <div className="print-title">
          <div className="flex items-center justify-center gap-3 mb-4">
            <div className="w-12 h-12 bg-blue-600 rounded-lg flex items-center justify-center">
              <Plane className="h-6 w-6 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-blue-900">ENVYSKY</h1>
              <p className="text-blue-600 text-sm">Sistema de Gestión de Vuelos</p>
            </div>
          </div>
          <h2 className="text-2xl font-semibold text-gray-800 mb-2">INFORME DE PILOTO</h2>
          <p className="text-gray-600">Generado el {currentDate}</p>
        </div>

        {/* Información del piloto */}
        <div className="print-card">
          <div className="print-header">
            <h3 className="print-section-title flex items-center gap-2">
              <User className="h-5 w-5" />
              Información del Piloto
            </h3>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-3">
              <div>
                <strong>Nombre Completo:</strong> {pilot.fullName}
              </div>
              <div>
                <strong>Email:</strong> {pilot.email}
              </div>
              <div>
                <strong>Teléfono:</strong> {pilot.phone || "No especificado"}
              </div>
            </div>
            <div className="space-y-3">
              <div>
                <strong>País:</strong> {pilot.country || "No especificado"}
              </div>
              <div>
                <strong>Fecha de Nacimiento:</strong> {pilot.birthDate || "No especificada"}
              </div>
              <div>
                <strong>Tipo de Licencia:</strong> {pilot.licenseType || "No especificada"}
              </div>
            </div>
          </div>
        </div>

        {/* Resumen de horas */}
        <div className="print-card">
          <div className="print-header">
            <h3 className="print-section-title flex items-center gap-2">
              <Clock className="h-5 w-5" />
              Resumen de Horas de Vuelo
            </h3>
          </div>
          <div className="print-summary-grid">
            <div className="print-summary-item">
              <div className="text-3xl font-bold text-blue-600">{safeToFixed(hours.purchased)}</div>
              <div className="text-sm font-medium">Horas Compradas</div>
            </div>
            <div className="print-summary-item">
              <div className="text-3xl font-bold text-green-600">{safeToFixed(hours.flown)}</div>
              <div className="text-sm font-medium">Horas Voladas</div>
            </div>
            <div className="print-summary-item">
              <div className={cn("text-3xl font-bold", hours.remaining <= 0 ? "text-red-600" : "text-orange-600")}>
                {safeToFixed(hours.remaining)}
              </div>
              <div className="text-sm font-medium">Horas Restantes</div>
            </div>
          </div>
        </div>

        {/* Historial de compras */}
        <div className="print-card">
          <div className="print-header">
            <h3 className="print-section-title flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Historial de Compras
            </h3>
          </div>
          {pilotPurchases.length === 0 ? (
            <p className="text-gray-500 text-center py-4">No hay compras registradas</p>
          ) : (
            <table className="print-table">
              <thead>
                <tr>
                  <th>Fecha</th>
                  <th>Horas Compradas</th>
                  <th>Fecha de Registro</th>
                </tr>
              </thead>
              <tbody>
                {pilotPurchases.map((purchase) => (
                  <tr key={purchase.id}>
                    <td>{purchase.date}</td>
                    <td>{safeToFixed(purchase.hours)} hs</td>
                    <td>{new Date(purchase.createdAt).toLocaleDateString("es-ES")}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {/* Historial de vuelos */}
        <div className="print-card page-break">
          <div className="print-header">
            <h3 className="print-section-title flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              Historial Detallado de Vuelos
            </h3>
          </div>
          {pilotFlights.length === 0 ? (
            <p className="text-gray-500 text-center py-4">No hay vuelos registrados</p>
          ) : (
            <table className="print-table">
              <thead>
                <tr>
                  <th>Fecha</th>
                  <th>Hora</th>
                  <th>Avión</th>
                  <th>Duración</th>
                  <th>Estado</th>
                  <th>Notas</th>
                </tr>
              </thead>
              <tbody>
                {pilotFlights.map((flight) => {
                  const aircraft = getAircraft(flight.aircraftId)
                  return (
                    <tr key={flight.id}>
                      <td>{flight.date}</td>
                      <td>{flight.time}</td>
                      <td>
                        {aircraft?.tailNumber || "—"}
                        <br />
                        <small>{aircraft?.model || ""}</small>
                      </td>
                      <td>{safeToFixed(flight.duration)} hs</td>
                      <td>{flight.status === "completed" ? "Completado" : "Programado"}</td>
                      <td>{flight.notes || "—"}</td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          )}
        </div>

        {/* Resumen por aeronave */}
        <div className="print-card">
          <div className="print-header">
            <h3 className="print-section-title flex items-center gap-2">
              <Plane className="h-5 w-5" />
              Resumen por Aeronave
            </h3>
          </div>
          {(() => {
            const aircraftSummary = pilotFlights
              .filter((f) => f.status === "completed")
              .reduce(
                (acc, flight) => {
                  const aircraft = getAircraft(flight.aircraftId)
                  if (aircraft) {
                    const key = aircraft.id
                    if (!acc[key]) {
                      acc[key] = {
                        aircraft,
                        totalHours: 0,
                        flightCount: 0,
                      }
                    }
                    acc[key].totalHours += flight.duration
                    acc[key].flightCount += 1
                  }
                  return acc
                },
                {} as Record<string, { aircraft: Aircraft; totalHours: number; flightCount: number }>,
              )

            const summaryEntries = Object.values(aircraftSummary)

            return summaryEntries.length === 0 ? (
              <p className="text-gray-500 text-center py-4">No hay vuelos completados</p>
            ) : (
              <table className="print-table">
                <thead>
                  <tr>
                    <th>Aeronave</th>
                    <th>Modelo</th>
                    <th>Vuelos Realizados</th>
                    <th>Total de Horas</th>
                  </tr>
                </thead>
                <tbody>
                  {summaryEntries.map(({ aircraft, totalHours, flightCount }) => (
                    <tr key={aircraft.id}>
                      <td>{aircraft.tailNumber}</td>
                      <td>{aircraft.model}</td>
                      <td>{flightCount}</td>
                      <td>{safeToFixed(totalHours)} hs</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )
          })()}
        </div>

        {/* Pie de página */}
        <div className="text-center text-sm text-gray-500 mt-8 pt-4 border-t">
          <p>Este informe fue generado automáticamente por ENVYSKY</p>
          <p>Sistema de Gestión de Vuelos - {currentDate}</p>
        </div>
      </div>
    </>
  )
}

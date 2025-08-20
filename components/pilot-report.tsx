"use client"

import { useMemo } from "react"
import { Download, Printer, Plane } from 'lucide-react'
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

  const currentDate = new Date().toLocaleDateString("es-ES", {
    year: "numeric",
    month: "long",
    day: "numeric",
  })

  const generateReportHTML = () => {
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

    return `
<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Informe de Piloto - ${pilot.fullName}</title>
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }
        
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            line-height: 1.6;
            color: #333;
            background: white;
            padding: 20px;
            font-size: 14px;
        }
        
        .report-container {
            max-width: 800px;
            margin: 0 auto;
            background: white;
        }
        
        .header {
            text-align: center;
            margin-bottom: 30px;
            padding-bottom: 20px;
            border-bottom: 2px solid #e5e7eb;
        }
        
        .logo-section {
            display: flex;
            align-items: center;
            justify-content: center;
            gap: 15px;
            margin-bottom: 20px;
        }
        
        .logo {
            width: 60px;
            height: 60px;
            background: #2563eb;
            border-radius: 8px;
            display: flex;
            align-items: center;
            justify-content: center;
            color: white;
            font-size: 24px;
            font-weight: bold;
        }
        
        .company-info h1 {
            font-size: 32px;
            font-weight: bold;
            color: #1e40af;
            margin-bottom: 5px;
        }
        
        .company-info p {
            color: #2563eb;
            font-size: 14px;
        }
        
        .report-title {
            font-size: 24px;
            font-weight: bold;
            color: #374151;
            margin-bottom: 10px;
        }
        
        .report-date {
            color: #6b7280;
            font-size: 14px;
        }
        
        .section {
            margin-bottom: 30px;
            border: 1px solid #e5e7eb;
            border-radius: 8px;
            overflow: hidden;
        }
        
        .section-header {
            background: #f9fafb;
            padding: 15px;
            border-bottom: 1px solid #e5e7eb;
        }
        
        .section-title {
            font-size: 18px;
            font-weight: bold;
            color: #374151;
            display: flex;
            align-items: center;
            gap: 8px;
        }
        
        .section-content {
            padding: 20px;
        }
        
        .info-grid {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 20px;
        }
        
        .info-item {
            margin-bottom: 15px;
        }
        
        .info-label {
            font-weight: bold;
            color: #374151;
            margin-bottom: 5px;
        }
        
        .info-value {
            color: #6b7280;
        }
        
        .hours-summary {
            display: grid;
            grid-template-columns: 1fr 1fr 1fr;
            gap: 20px;
            margin-bottom: 20px;
        }
        
        .hours-card {
            text-align: center;
            padding: 20px;
            border: 1px solid #e5e7eb;
            border-radius: 8px;
            background: #f9fafb;
        }
        
        .hours-number {
            font-size: 32px;
            font-weight: bold;
            margin-bottom: 8px;
        }
        
        .hours-number.purchased { color: #2563eb; }
        .hours-number.flown { color: #059669; }
        .hours-number.remaining { color: #d97706; }
        .hours-number.remaining.negative { color: #dc2626; }
        
        .hours-label {
            font-size: 12px;
            font-weight: 600;
            color: #374151;
        }
        
        .table {
            width: 100%;
            border-collapse: collapse;
            margin-top: 15px;
        }
        
        .table th,
        .table td {
            padding: 12px;
            text-align: left;
            border-bottom: 1px solid #e5e7eb;
        }
        
        .table th {
            background: #f9fafb;
            font-weight: bold;
            color: #374151;
            font-size: 13px;
        }
        
        .table td {
            font-size: 13px;
            color: #6b7280;
        }
        
        .table tr:hover {
            background: #f9fafb;
        }
        
        .status-badge {
            padding: 4px 8px;
            border-radius: 4px;
            font-size: 11px;
            font-weight: 600;
        }
        
        .status-completed {
            background: #d1fae5;
            color: #065f46;
        }
        
        .status-scheduled {
            background: #fef3c7;
            color: #92400e;
        }
        
        .footer {
            text-align: center;
            margin-top: 40px;
            padding-top: 20px;
            border-top: 1px solid #e5e7eb;
            color: #6b7280;
            font-size: 12px;
        }
        
        .no-data {
            text-align: center;
            color: #9ca3af;
            font-style: italic;
            padding: 20px;
        }
        
        @media print {
            body { margin: 0; padding: 15px; }
            .section { page-break-inside: avoid; }
            .hours-summary { page-break-inside: avoid; }
        }
    </style>
</head>
<body>
    <div class="report-container">
        <!-- Header -->
        <div class="header">
            <div class="logo-section">
                <div class="logo">✈</div>
                <div class="company-info">
                    <h1>ENVYSKY</h1>
                    <p>Sistema de Gestión de Vuelos</p>
                </div>
            </div>
            <h2 class="report-title">INFORME DE PILOTO</h2>
            <p class="report-date">Generado el ${currentDate}</p>
        </div>

        <!-- Información del Piloto -->
        <div class="section">
            <div class="section-header">
                <h3 class="section-title">👤 Información del Piloto</h3>
            </div>
            <div class="section-content">
                <div class="info-grid">
                    <div>
                        <div class="info-item">
                            <div class="info-label">Nombre Completo</div>
                            <div class="info-value">${pilot.fullName}</div>
                        </div>
                        <div class="info-item">
                            <div class="info-label">Email</div>
                            <div class="info-value">${pilot.email}</div>
                        </div>
                        <div class="info-item">
                            <div class="info-label">Teléfono</div>
                            <div class="info-value">${pilot.phone || "No especificado"}</div>
                        </div>
                    </div>
                    <div>
                        <div class="info-item">
                            <div class="info-label">País</div>
                            <div class="info-value">${pilot.country || "No especificado"}</div>
                        </div>
                        <div class="info-item">
                            <div class="info-label">Fecha de Nacimiento</div>
                            <div class="info-value">${pilot.birthDate || "No especificada"}</div>
                        </div>
                        <div class="info-item">
                            <div class="info-label">Tipo de Licencia</div>
                            <div class="info-value">${pilot.licenseType || "No especificada"}</div>
                        </div>
                    </div>
                </div>
            </div>
        </div>

        <!-- Resumen de Horas -->
        <div class="section">
            <div class="section-header">
                <h3 class="section-title">🕒 Resumen de Horas de Vuelo</h3>
            </div>
            <div class="section-content">
                <div class="hours-summary">
                    <div class="hours-card">
                        <div class="hours-number purchased">${safeToFixed(hours.purchased)}</div>
                        <div class="hours-label">Horas Compradas</div>
                    </div>
                    <div class="hours-card">
                        <div class="hours-number flown">${safeToFixed(hours.flown)}</div>
                        <div class="hours-label">Horas Voladas</div>
                    </div>
                    <div class="hours-card">
                        <div class="hours-number remaining ${hours.remaining <= 0 ? "negative" : ""}">${safeToFixed(hours.remaining)}</div>
                        <div class="hours-label">Horas Restantes</div>
                    </div>
                </div>
            </div>
        </div>

        <!-- Historial de Compras -->
        <div class="section">
            <div class="section-header">
                <h3 class="section-title">📄 Historial de Compras</h3>
            </div>
            <div class="section-content">
                ${
                  pilotPurchases.length === 0
                    ? '<div class="no-data">No hay compras registradas</div>'
                    : `<table class="table">
                        <thead>
                            <tr>
                                <th>Fecha</th>
                                <th>Horas Compradas</th>
                                <th>Fecha de Registro</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${pilotPurchases
                              .map(
                                (purchase) => `
                                <tr>
                                    <td>${purchase.date}</td>
                                    <td><strong>${safeToFixed(purchase.hours)} hs</strong></td>
                                    <td>${new Date(purchase.createdAt).toLocaleDateString("es-ES")}</td>
                                </tr>
                            `,
                              )
                              .join("")}
                        </tbody>
                    </table>`
                }
            </div>
        </div>

        <!-- Historial de Vuelos -->
        <div class="section">
            <div class="section-header">
                <h3 class="section-title">📅 Historial Detallado de Vuelos</h3>
            </div>
            <div class="section-content">
                ${
                  pilotFlights.length === 0
                    ? '<div class="no-data">No hay vuelos registrados</div>'
                    : `<table class="table">
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
                            ${pilotFlights
                              .map((flight) => {
                                const aircraft = getAircraft(flight.aircraftId)
                                return `
                                    <tr>
                                        <td>${flight.date}</td>
                                        <td>${flight.time}</td>
                                        <td>
                                            <strong>${aircraft?.tailNumber || "—"}</strong><br>
                                            <small>${aircraft?.model || ""}</small>
                                        </td>
                                        <td><strong>${safeToFixed(flight.duration)} hs</strong></td>
                                        <td>
                                            <span class="status-badge ${flight.status === "completed" ? "status-completed" : "status-scheduled"}">
                                                ${flight.status === "completed" ? "Completado" : "Programado"}
                                            </span>
                                        </td>
                                        <td>${flight.notes || "—"}</td>
                                    </tr>
                                `
                              })
                              .join("")}
                        </tbody>
                    </table>`
                }
            </div>
        </div>

        <!-- Resumen por Aeronave -->
        <div class="section">
            <div class="section-header">
                <h3 class="section-title">✈️ Resumen por Aeronave</h3>
            </div>
            <div class="section-content">
                ${
                  summaryEntries.length === 0
                    ? '<div class="no-data">No hay vuelos completados</div>'
                    : `<table class="table">
                        <thead>
                            <tr>
                                <th>Aeronave</th>
                                <th>Modelo</th>
                                <th>Vuelos Realizados</th>
                                <th>Total de Horas</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${summaryEntries
                              .map(
                                ({ aircraft, totalHours, flightCount }) => `
                                <tr>
                                    <td><strong>${aircraft.tailNumber}</strong></td>
                                    <td>${aircraft.model}</td>
                                    <td>${flightCount}</td>
                                    <td><strong>${safeToFixed(totalHours)} hs</strong></td>
                                </tr>
                            `,
                              )
                              .join("")}
                        </tbody>
                    </table>`
                }
            </div>
        </div>

        <!-- Footer -->
        <div class="footer">
            <p>Este informe fue generado automáticamente por ENVYSKY</p>
            <p>Sistema de Gestión de Vuelos - ${currentDate}</p>
        </div>
    </div>
</body>
</html>
    `
  }

  const handlePrint = () => {
    const reportHTML = generateReportHTML()
    const printWindow = window.open("", "_blank")
    if (printWindow) {
      printWindow.document.write(reportHTML)
      printWindow.document.close()
      printWindow.focus()

      // Esperar a que se cargue el contenido antes de imprimir
      printWindow.onload = () => {
        printWindow.print()
        printWindow.close()
      }
    }
  }

  const handleDownloadPDF = () => {
    const reportHTML = generateReportHTML()
    const printWindow = window.open("", "_blank")
    if (printWindow) {
      printWindow.document.write(reportHTML)
      printWindow.document.close()
      printWindow.focus()

      // Esperar a que se cargue el contenido antes de mostrar el diálogo de impresión
      printWindow.onload = () => {
        printWindow.print()
      }
    }
  }

  return (
    <div className="space-y-6">
      {/* Botones de acción */}
      <div className="flex gap-2 mb-6">
        <Button onClick={handlePrint} className="bg-blue-600 hover:bg-blue-700">
          <Printer className="h-4 w-4 mr-2" />
          Imprimir Informe
        </Button>
        <Button onClick={handleDownloadPDF} variant="outline">
          <Download className="h-4 w-4 mr-2" />
          Descargar PDF
        </Button>
      </div>

      {/* Vista previa del informe */}
      <div className="bg-white p-8 shadow-lg rounded-lg border">
        <div className="text-center mb-8 border-b pb-6">
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

        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="text-center p-4 bg-blue-50 rounded-lg">
              <div className="text-3xl font-bold text-blue-600">{safeToFixed(hours.purchased)}</div>
              <div className="text-sm text-blue-800 font-medium">Horas Compradas</div>
            </div>
            <div className="text-center p-4 bg-green-50 rounded-lg">
              <div className="text-3xl font-bold text-green-600">{safeToFixed(hours.flown)}</div>
              <div className="text-sm text-green-800 font-medium">Horas Voladas</div>
            </div>
            <div className="text-center p-4 bg-orange-50 rounded-lg">
              <div className={cn("text-3xl font-bold", hours.remaining <= 0 ? "text-red-600" : "text-orange-600")}>
                {safeToFixed(hours.remaining)}
              </div>
              <div className={cn("text-sm font-medium", hours.remaining <= 0 ? "text-red-800" : "text-orange-800")}>
                Horas Restantes
              </div>
            </div>
          </div>

          <div className="text-center text-sm text-gray-500">
            <p className="mb-2">👆 Esta es una vista previa del informe</p>
            <p>Usa los botones de arriba para imprimir o descargar el informe completo</p>
          </div>
        </div>
      </div>
    </div>
  )
}

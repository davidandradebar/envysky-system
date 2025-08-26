"use client"

import type React from "react"
import type { Pilot, Flight, Purchase, Aircraft } from "@/lib/types"
import { calcPilotHours } from "@/lib/aggregates"
import { calculateFlightHours } from "@/lib/types"
import { Button } from "@/components/ui/button"
import { FileText, Download, User, Calendar, Plane } from "lucide-react"

interface PilotReportProps {
  pilot: Pilot
  flights: Flight[]
  purchases: Purchase[]
  aircrafts: Aircraft[]
  allPilots?: Pilot[] // Agregar lista de todos los pilotos
}

// Helper function to safely format numbers
const safeToFixed = (value: any, decimals = 1): string => {
  const num = typeof value === "number" ? value : Number.parseFloat(value) || 0
  return num.toFixed(decimals)
}

const generateReportHTML = (
  pilot: Pilot,
  flights: Flight[],
  purchases: Purchase[],
  aircrafts: Aircraft[],
  allPilots: Pilot[] = [],
) => {
  // Calcular horas del piloto
  const hours = calcPilotHours(pilot.id, purchases, flights)

  // Filtrar vuelos del piloto (como piloto 1 o piloto 2)
  const pilotFlights = flights.filter((f) => f.pilotId === pilot.id || f.pilotId2 === pilot.id)
  const completedFlights = pilotFlights.filter((f) => f.status === "completed")
  const scheduledFlights = pilotFlights.filter((f) => f.status === "scheduled")

  // Función para obtener el nombre del piloto acompañante
  const getCompanionPilotName = (flight: Flight) => {
    if (flight.pilotId === pilot.id && flight.pilotId2) {
      // El piloto actual es piloto 1, buscar piloto 2
      const pilot2 = allPilots.find((p) => p.id === flight.pilotId2)
      return pilot2 ? `Piloto 2: ${pilot2.fullName}` : `Piloto 2: ${flight.pilotId2.substring(0, 8)}...`
    } else if (flight.pilotId2 === pilot.id && flight.pilotId) {
      // El piloto actual es piloto 2, buscar piloto 1
      const pilot1 = allPilots.find((p) => p.id === flight.pilotId)
      return pilot1 ? `Piloto 1: ${pilot1.fullName}` : `Piloto 1: ${flight.pilotId.substring(0, 8)}...`
    }
    return "—"
  }

  return `
<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Reporte de Piloto - ${pilot.fullName}</title>
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }
        
        body {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            line-height: 1.6;
            color: #333;
            background: white;
            padding: 20px;
            max-width: 1200px;
            margin: 0 auto;
        }
        
        .header {
            text-align: center;
            margin-bottom: 30px;
            border-bottom: 3px solid #2563eb;
            padding-bottom: 20px;
        }
        
        .header h1 {
            color: #2563eb;
            font-size: 2.5em;
            margin-bottom: 10px;
            font-weight: bold;
        }
        
        .header p {
            color: #666;
            font-size: 1.1em;
        }
        
        .pilot-info {
            background: linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%);
            padding: 25px;
            border-radius: 12px;
            margin-bottom: 30px;
            border: 1px solid #e2e8f0;
        }
        
        .pilot-info h2 {
            color: #1e40af;
            margin-bottom: 15px;
            font-size: 1.8em;
        }
        
        .info-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
            gap: 15px;
        }
        
        .info-item {
            background: white;
            padding: 15px;
            border-radius: 8px;
            border-left: 4px solid #2563eb;
        }
        
        .info-label {
            font-weight: 600;
            color: #374151;
            margin-bottom: 5px;
        }
        
        .info-value {
            color: #1f2937;
            font-size: 1.1em;
        }
        
        .hours-summary {
            display: grid;
            grid-template-columns: repeat(3, 1fr);
            gap: 20px;
            margin: 30px 0;
        }
        
        .hours-card {
            background: white;
            border: 2px solid #e5e7eb;
            border-radius: 12px;
            padding: 20px;
            text-align: center;
            transition: all 0.3s ease;
        }
        
        .hours-card.purchased {
            border-color: #10b981;
            background: linear-gradient(135deg, #ecfdf5 0%, #d1fae5 100%);
        }
        
        .hours-card.flown {
            border-color: #f59e0b;
            background: linear-gradient(135deg, #fffbeb 0%, #fef3c7 100%);
        }
        
        .hours-card.remaining {
            border-color: #3b82f6;
            background: linear-gradient(135deg, #eff6ff 0%, #dbeafe 100%);
        }
        
        .hours-number {
            font-size: 2.5em;
            font-weight: bold;
            margin-bottom: 5px;
        }
        
        .hours-card.purchased .hours-number { color: #059669; }
        .hours-card.flown .hours-number { color: #d97706; }
        .hours-card.remaining .hours-number { color: #2563eb; }
        
        .hours-label {
            font-weight: 600;
            text-transform: uppercase;
            letter-spacing: 0.5px;
            font-size: 0.9em;
        }
        
        .section {
            margin: 40px 0;
        }
        
        .section h3 {
            color: #1e40af;
            font-size: 1.5em;
            margin-bottom: 20px;
            padding-bottom: 10px;
            border-bottom: 2px solid #e5e7eb;
        }
        
        table {
            width: 100%;
            border-collapse: collapse;
            margin-top: 15px;
            background: white;
            border-radius: 8px;
            overflow: hidden;
            box-shadow: 0 1px 3px rgba(0,0,0,0.1);
        }
        
        th {
            background: linear-gradient(135deg, #1e40af 0%, #2563eb 100%);
            color: white;
            padding: 15px 12px;
            text-align: left;
            font-weight: 600;
            font-size: 0.9em;
            text-transform: uppercase;
            letter-spacing: 0.5px;
        }
        
        td {
            padding: 12px;
            border-bottom: 1px solid #f3f4f6;
        }
        
        tr:nth-child(even) {
            background-color: #f9fafb;
        }
        
        tr:hover {
            background-color: #f3f4f6;
        }
        
        .status-completed {
            background: #10b981;
            color: white;
            padding: 4px 8px;
            border-radius: 4px;
            font-size: 0.8em;
            font-weight: 600;
        }
        
        .status-scheduled {
            background: #f59e0b;
            color: white;
            padding: 4px 8px;
            border-radius: 4px;
            font-size: 0.8em;
            font-weight: 600;
        }
        
        .footer {
            margin-top: 50px;
            text-align: center;
            color: #6b7280;
            font-size: 0.9em;
            border-top: 1px solid #e5e7eb;
            padding-top: 20px;
        }
        
        .no-data {
            text-align: center;
            color: #6b7280;
            font-style: italic;
            padding: 30px;
            background: #f9fafb;
            border-radius: 8px;
        }
        
        @media print {
            body { padding: 10px; }
            .hours-summary { grid-template-columns: repeat(3, 1fr); }
            .info-grid { grid-template-columns: repeat(2, 1fr); }
        }
        
        @media (max-width: 768px) {
            .hours-summary { grid-template-columns: 1fr; }
            .info-grid { grid-template-columns: 1fr; }
            table { font-size: 0.9em; }
            th, td { padding: 8px; }
        }
    </style>
</head>
<body>
    <div class="header">
        <h1>ENVYSKY</h1>
        <p>Reporte Individual de Piloto</p>
    </div>
    
    <div class="pilot-info">
        <h2>${pilot.fullName}</h2>
        <div class="info-grid">
            <div class="info-item">
                <div class="info-label">Email</div>
                <div class="info-value">${pilot.email}</div>
            </div>
            <div class="info-item">
                <div class="info-label">Teléfono</div>
                <div class="info-value">${pilot.phone || "—"}</div>
            </div>
            <div class="info-item">
                <div class="info-label">País</div>
                <div class="info-value">${pilot.country || "—"}</div>
            </div>
            <div class="info-item">
                <div class="info-label">Fecha de nacimiento</div>
                <div class="info-value">${pilot.birthDate || "—"}</div>
            </div>
            <div class="info-item">
                <div class="info-label">Tipo de licencia</div>
                <div class="info-value">${pilot.licenseType || "—"}</div>
            </div>
            <div class="info-item">
                <div class="info-label">Fecha de registro</div>
                <div class="info-value">${new Date(pilot.createdAt).toLocaleDateString("es-ES")}</div>
            </div>
        </div>
    </div>
    
    <div class="hours-summary">
        <div class="hours-card purchased">
            <div class="hours-number">${safeToFixed(hours.purchased)}</div>
            <div class="hours-label">Horas Compradas</div>
        </div>
        <div class="hours-card flown">
            <div class="hours-number">${safeToFixed(hours.flown)}</div>
            <div class="hours-label">Horas Voladas</div>
        </div>
        <div class="hours-card remaining">
            <div class="hours-number">${safeToFixed(hours.remaining)}</div>
            <div class="hours-label">Horas Restantes</div>
        </div>
    </div>
    
    <div class="section">
        <h3>📋 Hour purchases</h3>
        ${
          purchases.filter((p) => p.pilotId === pilot.id).length === 0
            ? '<div class="no-data">No purchases recorded.</div>'
            : `<table>
                <thead>
                    <tr>
                        <th>Fecha</th>
                        <th>Hours Purchaseds</th>
                        <th>Registration Date</th>
                    </tr>
                </thead>
                <tbody>
                    ${purchases
                      .filter((p) => p.pilotId === pilot.id)
                      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
                      .map(
                        (purchase) => `
                            <tr>
                                <td>${purchase.date}</td>
                                <td>${safeToFixed(purchase.hours)} hs</td>
                                <td>${new Date(purchase.createdAt).toLocaleDateString("es-ES")}</td>
                            </tr>
                        `,
                      )
                      .join("")}
                </tbody>
            </table>`
        }
    </div>
    
    <div class="section">
        <h3>✈️ Completed Flights</h3>
        ${
          completedFlights.length === 0
            ? '<div class="no-data">No completed flights. </div>'
            : `<table>
                <thead>
                    <tr>
                        <th>Date</th>
                        <th>Time</th>
                        <th>Aircraft</th>
                        <th>Flight Hourss</th>
                        <th>Copilot</th>
                        <th>Tachometer</th>
                        <th>Notes</th>
                    </tr>
                </thead>
                <tbody>
                    ${completedFlights
                      .sort((a, b) => (b.date + b.time).localeCompare(a.date + a.time))
                      .map((flight) => {
                        const aircraft = aircrafts.find((a) => a.id === flight.aircraftId)
                        const hours = calculateFlightHours(flight)
                        const companionPilot = getCompanionPilotName(flight)

                        return `
                                <tr>
                                    <td>${flight.date}</td>
                                    <td>${flight.time}</td>
                                    <td>${aircraft?.tailNumber || "—"} - ${aircraft?.model || ""}</td>
                                    <td>${safeToFixed(hours)} hs</td>
                                    <td>${companionPilot}</td>
                                    <td>${
                                      flight.tachometerStart !== undefined && flight.tachometerEnd !== undefined
                                        ? `${safeToFixed(flight.tachometerStart)} → ${safeToFixed(flight.tachometerEnd)}`
                                        : "Legacy"
                                    }</td>
                                    <td>${flight.notes || "—"}</td>
                                </tr>
                            `
                      })
                      .join("")}
                </tbody>
            </table>`
        }
    </div>
    
    <div class="section">
        <h3>📅 Scheduled Flights</h3>
        ${
          scheduledFlights.length === 0
            ? '<div class="no-data">No Scheduled Flights </div>'
            : `<table>
                <thead>
                    <tr>
                        <th>Date</th>
                        <th>Time</th>
                        <th>Aircraft</th>
                        <th>Copilot</th>
                        <th>Initial Tachometer</th>
                        <th>Notes</th>
                    </tr>
                </thead>
                <tbody>
                    ${scheduledFlights
                      .sort((a, b) => (a.date + a.time).localeCompare(b.date + b.time))
                      .map((flight) => {
                        const aircraft = aircrafts.find((a) => a.id === flight.aircraftId)
                        const companionPilot = getCompanionPilotName(flight)

                        return `
                                <tr>
                                    <td>${flight.date}</td>
                                    <td>${flight.time}</td>
                                    <td>${aircraft?.tailNumber || "—"} - ${aircraft?.model || ""}</td>
                                    <td>${companionPilot}</td>
                                    <td>${flight.tachometerStart !== undefined ? safeToFixed(flight.tachometerStart) : "Por definir"}</td>
                                    <td>${flight.notes || "—"}</td>
                                </tr>
                            `
                      })
                      .join("")}
                </tbody>
            </table>`
        }
    </div>
    
    <div class="footer">
        <p>Reporte generado el ${new Date().toLocaleDateString("es-ES")} a las ${new Date().toLocaleTimeString("es-ES")}</p>
        <p>ENVYSKY - Flight Management System</p>
    </div>
</body>
</html>
  `
}

export const PilotReport: React.FC<PilotReportProps> = ({ pilot, flights, purchases, aircrafts, allPilots = [] }) => {
  const hours = calcPilotHours(pilot.id, purchases, flights)
  const pilotFlights = flights.filter((f) => f.pilotId === pilot.id || f.pilotId2 === pilot.id)
  const completedFlights = pilotFlights.filter((f) => f.status === "completed")
  const scheduledFlights = pilotFlights.filter((f) => f.status === "scheduled")

  const handlePrint = () => {
    const reportHTML = generateReportHTML(pilot, flights, purchases, aircrafts, allPilots)
    const printWindow = window.open("", "_blank")
    if (printWindow) {
      printWindow.document.write(reportHTML)
      printWindow.document.close()
      printWindow.focus()

      printWindow.onload = () => {
        printWindow.print()
        printWindow.close()
      }
    } else {
      alert("Please allow pop-ups to generate the report.")
    }
  }

  const handleDownloadPDF = () => {
    const reportHTML = generateReportHTML(pilot, flights, purchases, aircrafts, allPilots)
    const printWindow = window.open("", "_blank")
    if (printWindow) {
      printWindow.document.write(reportHTML)
      printWindow.document.close()
      printWindow.focus()

      printWindow.onload = () => {
        printWindow.print()
      }
    } else {
      alert("Please allow pop-ups to generate the report")
    }
  }

  return (
    <div className="space-y-6">
      {/* Información del piloto mejorada */}
      <div className="bg-gradient-to-r from-blue-50 to-sky-50 p-6 rounded-lg border border-blue-200">
        <div className="flex items-center gap-3 mb-4">
          <div className="bg-blue-600 p-2 rounded-full">
            <User className="h-5 w-5 text-white" />
          </div>
          <div>
            <h3 className="text-xl font-bold text-blue-900">{pilot.fullName}</h3>
            <p className="text-blue-700">
              {pilot.email} • {pilot.licenseType || "Sin licencia"}
            </p>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-4">
          <div className="bg-white p-4 rounded-lg border border-green-200">
            <div className="text-2xl font-bold text-green-600">{safeToFixed(hours.purchased)}</div>
            <div className="text-sm text-green-700 font-medium">Purchased Hours</div>
          </div>
          <div className="bg-white p-4 rounded-lg border border-orange-200">
            <div className="text-2xl font-bold text-orange-600">{safeToFixed(hours.flown)}</div>
            <div className="text-sm text-orange-700 font-medium">Flown Hours</div>
          </div>
          <div className="bg-white p-4 rounded-lg border border-blue-200">
            <div className="text-2xl font-bold text-blue-600">{safeToFixed(hours.remaining)}</div>
            <div className="text-sm text-blue-700 font-medium">Remaining Hours</div>
          </div>
        </div>
      </div>

      {/* Resumen de actividad */}
      <div className="grid grid-cols-2 gap-4">
        <div className="bg-white p-4 rounded-lg border border-gray-200">
          <div className="flex items-center gap-2 mb-2">
            <Calendar className="h-4 w-4 text-blue-600" />
            <span className="font-medium text-gray-700">Scheduled Flights</span>
          </div>
          <div className="text-2xl font-bold text-blue-600">{scheduledFlights.length}</div>
        </div>
        <div className="bg-white p-4 rounded-lg border border-gray-200">
          <div className="flex items-center gap-2 mb-2">
            <Plane className="h-4 w-4 text-green-600" />
            <span className="font-medium text-gray-700">Completed Flights</span>
          </div>
          <div className="text-2xl font-bold text-green-600">{completedFlights.length}</div>
        </div>
      </div>

      {/* Botones de acción mejorados */}
      <div className="flex gap-3 justify-center p-4 bg-gray-50 rounded-lg border">
        <Button
          onClick={handlePrint}
          variant="outline"
          className="flex items-center gap-2 bg-white hover:bg-gray-50 border-gray-300"
        >
          <FileText className="h-4 w-4" />
          Print Report
        </Button>
        <Button
          onClick={handleDownloadPDF}
          className="flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white"
        >
          <Download className="h-4 w-4" />
          Download PDF
        </Button>
      </div>

      <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
        <p className="text-sm text-blue-800 mb-2">
          <strong>📊 Full Report includes:</strong>
        </p>
        <ul className="text-xs text-blue-700 space-y-1">
          <li>• Personal and contact information</li>
          <li>• Detailed summary of hours (purchased, flown, remaining)</li>
          <li>• Complete history of hour purchases</li>
          <li>
            • List of completed flights with <strong>copilot</strong>
          </li>
          <li>• Pending scheduled flights</li>
          <li>• Tachometer data and flight notes</li>
        </ul>
      </div>
    </div>
  )
}

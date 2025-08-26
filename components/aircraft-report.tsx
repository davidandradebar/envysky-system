"use client"

import type React from "react"
import type { Aircraft, Flight, Pilot } from "@/lib/types"
import { calculateFlightHours } from "@/lib/types"
import { Button } from "@/components/ui/button"
import { FileText, Download, Plane, Calendar, Gauge } from "lucide-react"

interface AircraftReportProps {
  aircraft: Aircraft
  flights: Flight[]
  pilots: Pilot[]
}

// Helper function to safely format numbers
const safeToFixed = (value: any, decimals = 1): string => {
  const num = typeof value === "number" ? value : Number.parseFloat(value) || 0
  return num.toFixed(decimals)
}

const generateAircraftReportHTML = (aircraft: Aircraft, flights: Flight[], pilots: Pilot[]) => {
  // Filtrar vuelos del avión
  const aircraftFlights = flights.filter((f) => f.aircraftId === aircraft.id)
  const completedFlights = aircraftFlights.filter((f) => f.status === "completed")
  const scheduledFlights = aircraftFlights.filter((f) => f.status === "scheduled")

  // Calcular total de horas voladas
  const totalHoursFlown = completedFlights.reduce((sum, flight) => {
    return sum + calculateFlightHours(flight)
  }, 0)

  // Función para obtener el nombre del piloto
  const getPilotName = (pilotId: string) => {
    const pilot = pilots.find((p) => p.id === pilotId)
    return pilot ? pilot.fullName : `ID: ${pilotId.substring(0, 8)}...`
  }

  return `
<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Reporte de Avión - ${aircraft.tailNumber}</title>
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
        
        .aircraft-info {
            background: linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%);
            padding: 25px;
            border-radius: 12px;
            margin-bottom: 30px;
            border: 1px solid #e2e8f0;
        }
        
        .aircraft-info h2 {
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
        
        .hours-card.total {
            border-color: #10b981;
            background: linear-gradient(135deg, #ecfdf5 0%, #d1fae5 100%);
        }
        
        .hours-card.completed {
            border-color: #3b82f6;
            background: linear-gradient(135deg, #eff6ff 0%, #dbeafe 100%);
        }
        
        .hours-card.scheduled {
            border-color: #f59e0b;
            background: linear-gradient(135deg, #fffbeb 0%, #fef3c7 100%);
        }
        
        .hours-number {
            font-size: 2.5em;
            font-weight: bold;
            margin-bottom: 5px;
        }
        
        .hours-card.total .hours-number { color: #059669; }
        .hours-card.completed .hours-number { color: #2563eb; }
        .hours-card.scheduled .hours-number { color: #d97706; }
        
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
        
        .pilots-cell {
            font-size: 0.9em;
        }
        
        .pilot-row {
            margin-bottom: 3px;
        }
        
        .pilot-label {
            font-weight: 600;
            color: #6b7280;
            font-size: 0.8em;
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
        <p>Individual aircraft report</p>
    </div>
    
    <div class="aircraft-info">
        <h2>${aircraft.tailNumber} - ${aircraft.model}</h2>
        <div class="info-grid">
            <div class="info-item">
                <div class="info-label">Registration</div>
                <div class="info-value">${aircraft.tailNumber}</div>
            </div>
            <div class="info-item">
                <div class="info-label">Model</div>
                <div class="info-value">${aircraft.model}</div>
            </div>
            <div class="info-item">
                <div class="info-label">Initial Hours</div>
                <div class="info-value">${safeToFixed(aircraft.initialHours)} hs</div>
            </div>
            <div class="info-item">
                <div class="info-label">Maintenance Interval</div>
                <div class="info-value">Cada ${safeToFixed(aircraft.maintenanceIntervalHours)} hs</div>
            </div>
            <div class="info-item">
                <div class="info-label">Status</div>
                <div class="info-value">${aircraft.status === "active" ? "Activo" : "En mantenimiento"}</div>
            </div>
            <div class="info-item">
                <div class="info-label">Registration Date</div>
                <div class="info-value">${new Date(aircraft.createdAt).toLocaleDateString("es-ES")}</div>
            </div>
        </div>
    </div>
    
    <div class="hours-summary">
        <div class="hours-card total">
            <div class="hours-number">${safeToFixed(totalHoursFlown)}</div>
            <div class="hours-label">Total Flight Hours</div>
        </div>
        <div class="hours-card completed">
            <div class="hours-number">${completedFlights.length}</div>
            <div class="hours-label">Completed Flights</div>
        </div>
        <div class="hours-card scheduled">
            <div class="hours-number">${scheduledFlights.length}</div>
            <div class="hours-label">Scheduled Flights</div>
        </div>
    </div>
    
    <div class="section">
        <h3>✈️ Completed flights history</h3>
        ${
          completedFlights.length === 0
            ? '<div class="no-data">No completed flights for this aircraft.</div>'
            : `<table>
                <thead>
                    <tr>
                        <th>Date</th>
                        <th>Time</th>
                        <th>Initial Tachometer</th>
                        <th>Final Tachometer</th>
                        <th>Hours flown</th>
                        <th>Pilots</th>
                        <th>Notes</th>
                    </tr>
                </thead>
                <tbody>
                    ${completedFlights
                      .sort((a, b) => (b.date + b.time).localeCompare(a.date + a.time))
                      .map((flight) => {
                        const hours = calculateFlightHours(flight)
                        const pilot1 = getPilotName(flight.pilotId)
                        const pilot2 = flight.pilotId2 ? getPilotName(flight.pilotId2) : null

                        return `
                            <tr>
                                <td>${flight.date}</td>
                                <td>${flight.time}</td>
                                <td>${
                                  flight.tachometerStart !== undefined ? safeToFixed(flight.tachometerStart) : "Legacy"
                                }</td>
                                <td>${
                                  flight.tachometerEnd !== undefined ? safeToFixed(flight.tachometerEnd) : "Legacy"
                                }</td>
                                <td>${safeToFixed(hours)} hs</td>
                                <td class="pilots-cell">
                                    <div class="pilot-row">
                                        <span class="pilot-label">P1:</span> ${pilot1}
                                    </div>
                                    ${
                                      pilot2
                                        ? `<div class="pilot-row"><span class="pilot-label">P2:</span> ${pilot2}</div>`
                                        : ""
                                    }
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
    
    <div class="section">
        <h3>📅 Scheduled flights</h3>
        ${
          scheduledFlights.length === 0
            ? '<div class="no-data">No scheduled flights for this aircraft.</div>'
            : `<table>
                <thead>
                    <tr>
                        <th>Date</th>
                        <th>Time</th>
                        <th>Initial Tachometer</th>
                        <th>Pilots</th>
                        <th>Notes</th>
                    </tr>
                </thead>
                <tbody>
                    ${scheduledFlights
                      .sort((a, b) => (a.date + a.time).localeCompare(b.date + b.time))
                      .map((flight) => {
                        const pilot1 = getPilotName(flight.pilotId)
                        const pilot2 = flight.pilotId2 ? getPilotName(flight.pilotId2) : null

                        return `
                            <tr>
                                <td>${flight.date}</td>
                                <td>${flight.time}</td>
                                <td>${
                                  flight.tachometerStart !== undefined
                                    ? safeToFixed(flight.tachometerStart)
                                    : "Por definir"
                                }</td>
                                <td class="pilots-cell">
                                    <div class="pilot-row">
                                        <span class="pilot-label">P1:</span> ${pilot1}
                                    </div>
                                    ${
                                      pilot2
                                        ? `<div class="pilot-row"><span class="pilot-label">P2:</span> ${pilot2}</div>`
                                        : ""
                                    }
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
    
    <div class="footer">
        <p>Report generated the ${new Date().toLocaleDateString("es-ES")} at ${new Date().toLocaleTimeString("es-ES")}</p>
        <p>ENVYSKY - Flight Management System</p>
    </div>
</body>
</html>
  `
}

export const AircraftReport: React.FC<AircraftReportProps> = ({ aircraft, flights, pilots }) => {
  // Filtrar vuelos del avión
  const aircraftFlights = flights.filter((f) => f.aircraftId === aircraft.id)
  const completedFlights = aircraftFlights.filter((f) => f.status === "completed")
  const scheduledFlights = aircraftFlights.filter((f) => f.status === "scheduled")

  // Calcular total de horas voladas
  const totalHoursFlown = completedFlights.reduce((sum, flight) => {
    return sum + calculateFlightHours(flight)
  }, 0)

  const handlePrint = () => {
    const reportHTML = generateAircraftReportHTML(aircraft, flights, pilots)
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
    const reportHTML = generateAircraftReportHTML(aircraft, flights, pilots)
    const printWindow = window.open("", "_blank")
    if (printWindow) {
      printWindow.document.write(reportHTML)
      printWindow.document.close()
      printWindow.focus()

      printWindow.onload = () => {
        printWindow.print()
      }
    } else {
      alert("Please allow pop-ups to generate the report.")
    }
  }

  return (
    <div className="space-y-6">
      {/* Información del avión mejorada */}
      <div className="bg-gradient-to-r from-blue-50 to-sky-50 p-6 rounded-lg border border-blue-200">
        <div className="flex items-center gap-3 mb-4">
          <div className="bg-blue-600 p-2 rounded-full">
            <Plane className="h-5 w-5 text-white" />
          </div>
          <div>
            <h3 className="text-xl font-bold text-blue-900">
              {aircraft.tailNumber} - {aircraft.model}
            </h3>
            <p className="text-blue-700">
              Estado: {aircraft.status === "active" ? "Activo" : "In maintenance"} • Maintenance every{" "}
              {safeToFixed(aircraft.maintenanceIntervalHours)} hs
            </p>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-4">
          <div className="bg-white p-4 rounded-lg border border-green-200">
            <div className="text-2xl font-bold text-green-600">{safeToFixed(totalHoursFlown)}</div>
            <div className="text-sm text-green-700 font-medium">Total Flight Hours</div>
          </div>
          <div className="bg-white p-4 rounded-lg border border-blue-200">
            <div className="text-2xl font-bold text-blue-600">{completedFlights.length}</div>
            <div className="text-sm text-blue-700 font-medium">Completed Flights</div>
          </div>
          <div className="bg-white p-4 rounded-lg border border-orange-200">
            <div className="text-2xl font-bold text-orange-600">{scheduledFlights.length}</div>
            <div className="text-sm text-orange-700 font-medium">Scheduled Flights</div>
          </div>
        </div>
      </div>

      {/* Resumen de actividad */}
      <div className="grid grid-cols-2 gap-4">
        <div className="bg-white p-4 rounded-lg border border-gray-200">
          <div className="flex items-center gap-2 mb-2">
            <Calendar className="h-4 w-4 text-blue-600" />
            <span className="font-medium text-gray-700">Initial Hours</span>
          </div>
          <div className="text-2xl font-bold text-blue-600">{safeToFixed(aircraft.initialHours)}</div>
        </div>
        <div className="bg-white p-4 rounded-lg border border-gray-200">
          <div className="flex items-center gap-2 mb-2">
            <Gauge className="h-4 w-4 text-green-600" />
            <span className="font-medium text-gray-700">Total Hours</span>
          </div>
          <div className="text-2xl font-bold text-green-600">
            {safeToFixed(aircraft.initialHours + totalHoursFlown)}
          </div>
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
          <strong>📊 Full report includes:</strong>
        </p>
        <ul className="text-xs text-blue-700 space-y-1">
          <li>• Technical information of the aircraft (registration, model, initial hours)</li>
          <li>• Total flight hours (sum of all flights)</li>
          <li>• Complete flight history with initial and final tachometer</li>
          <li>• Detail of pilots who participated in each flight</li>
          <li>• Pending scheduled flights</li>
          <li>• Maintenance statistics and current status</li>
        </ul>
      </div>
    </div>
  )
}

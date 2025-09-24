import { type NextRequest, NextResponse } from "next/server"
import { getFlights, saveFlight, updateFlightStatus } from "@/lib/db"

export async function GET() {
  try {
    console.log("🔍 GET /api/flights - Fetching flights...")
    const flights = await getFlights()
    console.log(`✅ Found ${flights.length} flights`)
    return NextResponse.json(flights)
  } catch (error) {
    console.error("❌ Error fetching flights:", error)
    return NextResponse.json({ error: "Failed to fetch flights" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    console.log("📝 POST /api/flights - Creating flight...")
    const body = await request.json()
    console.log("📋 Request body:", body)

    const { pilotId, pilotId2, aircraftId, date, time, duration, status, notes, tachometerStart, tachometerEnd } = body

    if (!pilotId || !aircraftId || !date || !time) {
      console.log("❌ Missing required fields")
      return NextResponse.json({ error: "Pilot ID, aircraft ID, date, and time are required" }, { status: 400 })
    }

    const flight = await saveFlight({
      pilotId,
      pilotId2,
      aircraftId,
      date,
      time,
      duration: Number(duration) || 0,
      status: status || "scheduled",
      notes,
      tachometerStart: tachometerStart ? Number(tachometerStart) : undefined,
      tachometerEnd: tachometerEnd ? Number(tachometerEnd) : undefined,
    })

    console.log("✅ Flight created:", flight)
    return NextResponse.json(flight)
  } catch (error) {
    console.error("❌ Error creating flight:", error)
    return NextResponse.json({ error: "Failed to create flight" }, { status: 500 })
  }
}

export async function PATCH(request: NextRequest) {
  try {
    console.log("🔄 PATCH /api/flights - Updating flight status...")
    const body = await request.json()
    console.log("📋 Request body:", body)

    const { flightId, status, tachometerStart, tachometerEnd } = body

    if (!flightId || !status) {
      console.log("❌ Missing required fields")
      return NextResponse.json({ error: "Flight ID and status are required" }, { status: 400 })
    }

    const updatedFlight = await updateFlightStatus(flightId, status, {
      tachometerStart: tachometerStart ? Number(tachometerStart) : undefined,
      tachometerEnd: tachometerEnd ? Number(tachometerEnd) : undefined,
    })

    if (!updatedFlight) {
      console.log("❌ Flight not found")
      return NextResponse.json({ error: "Flight not found" }, { status: 404 })
    }

    console.log("✅ Flight updated:", updatedFlight)
    return NextResponse.json(updatedFlight)
  } catch (error) {
    console.error("❌ Error updating flight:", error)
    return NextResponse.json({ error: "Failed to update flight" }, { status: 500 })
  }
}

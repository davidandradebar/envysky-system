import { type NextRequest, NextResponse } from "next/server"
import { getPurchases, savePurchase } from "@/lib/db"

export async function GET() {
  try {
    console.log("🔍 GET /api/purchases - Fetching purchases...")
    const purchases = await getPurchases()
    console.log(`✅ Found ${purchases.length} purchases`)
    return NextResponse.json(purchases)
  } catch (error) {
    console.error("❌ Error fetching purchases:", error)
    return NextResponse.json({ error: "Failed to fetch purchases" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    console.log("📝 POST /api/purchases - Creating purchase...")
    const body = await request.json()
    console.log("📋 Request body:", body)

    const { pilotEmail, hours, date, fullName, phone, country, birthDate, licenseType } = body

    if (!pilotEmail || !hours || !date) {
      console.log("❌ Missing required fields")
      return NextResponse.json({ error: "Pilot email, hours, and date are required" }, { status: 400 })
    }

    const purchase = await savePurchase({
      pilotEmail,
      hours: Number(hours),
      date,
      fullName,
      phone,
      country,
      birthDate,
      licenseType,
    })

    console.log("✅ Purchase created:", purchase)
    return NextResponse.json(purchase)
  } catch (error) {
    console.error("❌ Error creating purchase:", error)
    return NextResponse.json({ error: "Failed to create purchase" }, { status: 500 })
  }
}

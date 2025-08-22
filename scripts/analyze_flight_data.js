// Analizar los datos del CSV para entender el problema
async function analyzeFlightData() {
  try {
    const response = await fetch(
      "https://hebbkx1anhila5yf.public.blob.vercel-storage.com/old-scene-59104207_main_neondb_2025-08-22_00-20-29-XmPMPVEE9LD4PjW4wlDpbccJG1Cg5v.csv",
    )
    const csvText = await response.text()

    // Parse CSV
    const lines = csvText.split("\n")
    const headers = lines[0].split(",")
    const data = lines
      .slice(1)
      .filter((line) => line.trim())
      .map((line) => {
        const values = line.split(",")
        const row = {}
        headers.forEach((header, index) => {
          row[header.trim()] = values[index]?.trim() || ""
        })
        return row
      })

    console.log("📊 ANÁLISIS DE DATOS DE VUELOS:")
    console.log(`Total de vuelos: ${data.length}`)

    // Analizar tipos de vuelos
    const flightAnalysis = data.map((flight) => ({
      id: flight.id,
      date: flight.date,
      status: flight.status,
      pilot_id: flight.pilot_id,
      pilot_id_2: flight.pilot_id_2,
      pilot_1_name: flight.pilot_1_name,
      pilot_2_name: flight.pilot_2_name,
      hasPilot2: flight.pilot_id_2 && flight.pilot_id_2 !== "",
      samePilot: flight.pilot_id === flight.pilot_id_2,
      differentPilots: flight.pilot_id !== flight.pilot_id_2 && flight.pilot_id_2 && flight.pilot_id_2 !== "",
    }))

    console.log("\n🔍 DETALLES POR VUELO:")
    flightAnalysis.forEach((flight) => {
      console.log(`Vuelo ${flight.id.substring(0, 8)}...:`)
      console.log(`  - Fecha: ${flight.date}`)
      console.log(`  - Estado: ${flight.status}`)
      console.log(`  - Piloto 1: ${flight.pilot_1_name} (${flight.pilot_id.substring(0, 8)}...)`)
      console.log(`  - Piloto 2: ${flight.pilot_2_name} (${flight.pilot_id_2?.substring(0, 8) || "N/A"}...)`)
      console.log(`  - Tiene Piloto 2: ${flight.hasPilot2}`)
      console.log(`  - Mismo piloto: ${flight.samePilot}`)
      console.log(`  - Pilotos diferentes: ${flight.differentPilots}`)
      console.log("---")
    })

    // Estadísticas
    const stats = {
      total: data.length,
      withPilot2: flightAnalysis.filter((f) => f.hasPilot2).length,
      samePilot: flightAnalysis.filter((f) => f.samePilot).length,
      differentPilots: flightAnalysis.filter((f) => f.differentPilots).length,
      completed: data.filter((f) => f.status === "completed").length,
    }

    console.log("\n📈 ESTADÍSTICAS:")
    console.log(`Total vuelos: ${stats.total}`)
    console.log(`Con Piloto 2: ${stats.withPilot2}`)
    console.log(`Mismo piloto en ambos campos: ${stats.samePilot}`)
    console.log(`Pilotos realmente diferentes: ${stats.differentPilots}`)
    console.log(`Vuelos completados: ${stats.completed}`)

    // Problema identificado
    console.log("\n🚨 PROBLEMA IDENTIFICADO:")
    if (stats.samePilot > 0 && stats.differentPilots === 0) {
      console.log("❌ El sistema está guardando el MISMO piloto como Piloto 1 y Piloto 2")
      console.log("❌ No hay vuelos con pilotos realmente diferentes")
      console.log("✅ SOLUCIÓN: Corregir la interfaz para evitar seleccionar el mismo piloto dos veces")
    }

    return stats
  } catch (error) {
    console.error("Error analizando datos:", error)
  }
}

// Ejecutar análisis
analyzeFlightData()

-- Script de diagnóstico para verificar datos de copiloto
-- Ejecuta este script para ver qué datos tenemos

-- 1. Verificar estructura de la tabla flights
SELECT column_name, data_type, is_nullable
FROM information_schema.columns 
WHERE table_name = 'flights' 
ORDER BY ordinal_position;

-- 2. Ver todos los vuelos y sus pilotos
SELECT 
    id,
    pilot_id,
    pilot_id_2,
    date,
    time,
    status,
    duration,
    tachometer_start,
    tachometer_end,
    created_at
FROM flights 
ORDER BY created_at DESC
LIMIT 10;

-- 3. Ver pilotos disponibles
SELECT id, full_name, email FROM pilots ORDER BY created_at DESC;

-- 4. Verificar vuelos con copiloto
SELECT 
    f.id,
    f.date,
    f.time,
    f.status,
    f.duration,
    p1.full_name as pilot_1_name,
    p2.full_name as pilot_2_name,
    f.pilot_id_2 IS NOT NULL as has_copilot
FROM flights f
LEFT JOIN pilots p1 ON f.pilot_id = p1.id
LEFT JOIN pilots p2 ON f.pilot_id_2 = p2.id
ORDER BY f.created_at DESC;

-- 5. Contar vuelos por tipo
SELECT 
    COUNT(*) as total_flights,
    COUNT(pilot_id_2) as flights_with_copilot,
    COUNT(*) - COUNT(pilot_id_2) as flights_single_pilot
FROM flights;

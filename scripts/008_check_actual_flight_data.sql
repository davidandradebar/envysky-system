-- Ver datos reales de vuelos para diagnosticar el problema

-- 1. Ver todos los vuelos con detalles completos
SELECT 
    f.id,
    f.date,
    f.time,
    f.status,
    f.duration,
    f.pilot_id,
    f.pilot_id_2,
    f.tachometer_start,
    f.tachometer_end,
    p1.full_name as pilot_1_name,
    p1.email as pilot_1_email,
    p2.full_name as pilot_2_name,
    p2.email as pilot_2_email,
    CASE 
        WHEN f.pilot_id_2 IS NULL THEN 'Solo piloto'
        ELSE 'Dos pilotos'
    END as flight_type
FROM flights f
LEFT JOIN pilots p1 ON f.pilot_id = p1.id
LEFT JOIN pilots p2 ON f.pilot_id_2 = p2.id
ORDER BY f.created_at DESC;

-- 2. Estadísticas de vuelos
SELECT 
    COUNT(*) as total_flights,
    COUNT(CASE WHEN pilot_id_2 IS NOT NULL THEN 1 END) as flights_with_copilot,
    COUNT(CASE WHEN pilot_id_2 IS NULL THEN 1 END) as flights_single_pilot,
    COUNT(CASE WHEN status = 'completed' THEN 1 END) as completed_flights,
    COUNT(CASE WHEN status = 'scheduled' THEN 1 END) as scheduled_flights
FROM flights;

-- 3. Ver si hay vuelos completados con copiloto
SELECT 
    f.id,
    f.date,
    f.status,
    f.duration,
    f.tachometer_start,
    f.tachometer_end,
    p1.full_name as pilot_1,
    p2.full_name as pilot_2
FROM flights f
LEFT JOIN pilots p1 ON f.pilot_id = p1.id
LEFT JOIN pilots p2 ON f.pilot_id_2 = p2.id
WHERE f.status = 'completed' AND f.pilot_id_2 IS NOT NULL;

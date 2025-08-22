-- Script completo de diagnóstico para el problema de copiloto

-- 1. Ver estructura actual de la tabla flights
SELECT 
    'ESTRUCTURA DE TABLA' as info,
    column_name, 
    data_type, 
    is_nullable
FROM information_schema.columns 
WHERE table_name = 'flights' 
ORDER BY ordinal_position;

-- 2. Ver todos los pilotos disponibles
SELECT 
    'PILOTOS DISPONIBLES' as info,
    id, 
    full_name, 
    email 
FROM pilots 
ORDER BY created_at;

-- 3. Ver todos los vuelos con detalles completos
SELECT 
    'VUELOS ACTUALES' as info,
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
    p2.full_name as pilot_2_name,
    CASE 
        WHEN f.pilot_id_2 IS NULL THEN 'Solo piloto'
        WHEN f.pilot_id = f.pilot_id_2 THEN 'MISMO PILOTO (ERROR)'
        ELSE 'Dos pilotos diferentes'
    END as flight_type,
    f.notes
FROM flights f
LEFT JOIN pilots p1 ON f.pilot_id = p1.id
LEFT JOIN pilots p2 ON f.pilot_id_2 = p2.id
ORDER BY f.created_at DESC;

-- 4. Estadísticas de vuelos
SELECT 
    'ESTADISTICAS' as info,
    COUNT(*) as total_flights,
    COUNT(CASE WHEN pilot_id_2 IS NOT NULL THEN 1 END) as flights_with_pilot_2,
    COUNT(CASE WHEN pilot_id_2 IS NULL THEN 1 END) as flights_single_pilot,
    COUNT(CASE WHEN pilot_id = pilot_id_2 THEN 1 END) as flights_same_pilot_error,
    COUNT(CASE WHEN pilot_id != pilot_id_2 AND pilot_id_2 IS NOT NULL THEN 1 END) as flights_different_pilots,
    COUNT(CASE WHEN status = 'completed' THEN 1 END) as completed_flights
FROM flights;

-- 5. Ver compras de horas por piloto
SELECT 
    'COMPRAS POR PILOTO' as info,
    p.full_name,
    p.email,
    COALESCE(SUM(pu.hours), 0) as total_purchased_hours
FROM pilots p
LEFT JOIN purchases pu ON p.id = pu.pilot_id
GROUP BY p.id, p.full_name, p.email
ORDER BY total_purchased_hours DESC;

-- 6. Crear vuelo de prueba si tenemos al menos 2 pilotos diferentes
DO $$
DECLARE
    pilot1_id UUID;
    pilot2_id UUID;
    aircraft_id UUID;
    pilot_count INTEGER;
BEGIN
    -- Contar pilotos
    SELECT COUNT(*) INTO pilot_count FROM pilots;
    
    IF pilot_count < 2 THEN
        RAISE NOTICE '❌ Solo hay % piloto(s). Se necesitan al menos 2 para probar copiloto.', pilot_count;
    ELSE
        -- Obtener dos pilotos diferentes
        SELECT id INTO pilot1_id FROM pilots ORDER BY created_at LIMIT 1;
        SELECT id INTO pilot2_id FROM pilots WHERE id != pilot1_id ORDER BY created_at LIMIT 1;
        SELECT id INTO aircraft_id FROM aircrafts ORDER BY created_at LIMIT 1;
        
        -- Eliminar vuelos de prueba anteriores
        DELETE FROM flights WHERE notes LIKE '%PRUEBA COPILOTO%';
        
        -- Crear vuelo de prueba
        INSERT INTO flights (
            pilot_id, 
            pilot_id_2, 
            aircraft_id, 
            date, 
            time, 
            duration, 
            tachometer_start, 
            tachometer_end, 
            status, 
            notes
        ) VALUES (
            pilot1_id,
            pilot2_id,
            aircraft_id,
            CURRENT_DATE,
            '15:00',
            1.5,
            2000.0,
            2001.5,
            'completed',
            'VUELO DE PRUEBA COPILOTO - Ambos pilotos deben tener 1.5 hs descontadas'
        );
        
        RAISE NOTICE '✅ Vuelo de prueba creado con:';
        RAISE NOTICE 'Piloto 1 ID: %', pilot1_id;
        RAISE NOTICE 'Piloto 2 ID: %', pilot2_id;
        RAISE NOTICE 'Duración: 1.5 horas';
        RAISE NOTICE '🎯 Verifica que AMBOS pilotos tengan 1.5 hs descontadas en la app';
    END IF;
END $$;

-- 7. Ver el vuelo de prueba recién creado
SELECT 
    'VUELO DE PRUEBA CREADO' as info,
    f.id,
    f.date,
    f.time,
    f.status,
    f.duration,
    p1.full_name as pilot_1,
    p1.email as pilot_1_email,
    p2.full_name as pilot_2,
    p2.email as pilot_2_email,
    f.tachometer_start,
    f.tachometer_end,
    f.notes
FROM flights f
LEFT JOIN pilots p1 ON f.pilot_id = p1.id
LEFT JOIN pilots p2 ON f.pilot_id_2 = p2.id
WHERE f.notes LIKE '%PRUEBA COPILOTO%'
ORDER BY f.created_at DESC;

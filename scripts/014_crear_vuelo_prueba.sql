-- Crear vuelo de prueba con DOS PILOTOS DIFERENTES
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
        
        RAISE NOTICE '✅ Vuelo de prueba creado exitosamente';
        RAISE NOTICE 'Piloto 1 ID: %', pilot1_id;
        RAISE NOTICE 'Piloto 2 ID: %', pilot2_id;
        RAISE NOTICE 'Duración: 1.5 horas';
    END IF;
END $$;

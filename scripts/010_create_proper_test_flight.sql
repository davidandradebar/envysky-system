-- Crear vuelo de prueba con DOS PILOTOS DIFERENTES
DO $$
DECLARE
    pilot1_id UUID;
    pilot2_id UUID;
    aircraft_id UUID;
    pilot1_name TEXT;
    pilot2_name TEXT;
BEGIN
    -- Obtener dos pilotos DIFERENTES
    SELECT id, full_name INTO pilot1_id, pilot1_name FROM pilots ORDER BY created_at LIMIT 1;
    SELECT id, full_name INTO pilot2_id, pilot2_name FROM pilots WHERE id != pilot1_id ORDER BY created_at LIMIT 1;
    
    -- Obtener el primer avión
    SELECT id INTO aircraft_id FROM aircrafts ORDER BY created_at LIMIT 1;
    
    -- Verificar que tenemos pilotos diferentes
    IF pilot1_id IS NULL OR pilot2_id IS NULL OR pilot1_id = pilot2_id THEN
        RAISE NOTICE '❌ No hay suficientes pilotos DIFERENTES para crear el vuelo de prueba';
        RAISE NOTICE 'Total pilotos: %', (SELECT COUNT(*) FROM pilots);
        RAISE NOTICE 'Se necesitan al menos 2 pilotos diferentes';
    ELSIF aircraft_id IS NULL THEN
        RAISE NOTICE '❌ No hay aviones disponibles';
    ELSE
        -- Eliminar vuelos de prueba anteriores
        DELETE FROM flights WHERE notes LIKE '%TESTING%';
        
        -- Crear vuelo de prueba con DOS PILOTOS DIFERENTES
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
            pilot2_id,  -- ✅ PILOTO DIFERENTE
            aircraft_id,
            CURRENT_DATE,
            '14:30',
            2.0,
            1600.0,
            1602.0,
            'completed',
            'Vuelo de prueba con DOS PILOTOS DIFERENTES - TESTING'
        );
        
        RAISE NOTICE '✅ Vuelo de prueba creado exitosamente:';
        RAISE NOTICE 'Piloto 1: % (ID: %)', pilot1_name, pilot1_id;
        RAISE NOTICE 'Piloto 2: % (ID: %)', pilot2_name, pilot2_id;
        RAISE NOTICE 'Avión: %', aircraft_id;
        RAISE NOTICE '🎯 Ahora ambos pilotos deberían tener 2.0 horas descontadas';
    END IF;
END $$;

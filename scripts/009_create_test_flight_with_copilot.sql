-- Crear vuelo de prueba con copiloto para testing
-- SOLO ejecutar si no hay vuelos con copiloto en el sistema

-- Primero verificar que tengamos al menos 2 pilotos
DO $$
DECLARE
    pilot1_id UUID;
    pilot2_id UUID;
    aircraft_id UUID;
BEGIN
    -- Obtener los primeros 2 pilotos
    SELECT id INTO pilot1_id FROM pilots ORDER BY created_at LIMIT 1;
    SELECT id INTO pilot2_id FROM pilots ORDER BY created_at LIMIT 1 OFFSET 1;
    
    -- Obtener el primer avión
    SELECT id INTO aircraft_id FROM aircrafts ORDER BY created_at LIMIT 1;
    
    -- Verificar que tenemos los datos necesarios
    IF pilot1_id IS NULL OR pilot2_id IS NULL OR aircraft_id IS NULL THEN
        RAISE NOTICE 'No hay suficientes pilotos o aviones para crear el vuelo de prueba';
        RAISE NOTICE 'Pilotos disponibles: %', (SELECT COUNT(*) FROM pilots);
        RAISE NOTICE 'Aviones disponibles: %', (SELECT COUNT(*) FROM aircrafts);
    ELSE
        -- Crear vuelo de prueba con copiloto
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
            '10:00',
            2.5,
            1500.0,
            1502.5,
            'completed',
            'Vuelo de prueba con copiloto - TESTING'
        );
        
        RAISE NOTICE 'Vuelo de prueba creado exitosamente con:';
        RAISE NOTICE 'Piloto 1: %', pilot1_id;
        RAISE NOTICE 'Piloto 2: %', pilot2_id;
        RAISE NOTICE 'Avión: %', aircraft_id;
    END IF;
END $$;

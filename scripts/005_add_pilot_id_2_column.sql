-- Agregar soporte para copiloto en vuelos
-- Ejecutar este script para permitir hasta 2 pilotos por vuelo

-- Verificar si la columna ya existe antes de agregarla
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'flights' AND column_name = 'pilot_id_2'
    ) THEN
        ALTER TABLE flights 
        ADD COLUMN pilot_id_2 UUID REFERENCES pilots(id) ON DELETE CASCADE;
        
        -- Crear índice para el copiloto
        CREATE INDEX IF NOT EXISTS idx_flights_pilot_2 ON flights(pilot_id_2);
        
        -- Mensaje de confirmación
        RAISE NOTICE 'Columna pilot_id_2 agregada exitosamente a la tabla flights';
    ELSE
        RAISE NOTICE 'La columna pilot_id_2 ya existe en la tabla flights';
    END IF;
END $$;

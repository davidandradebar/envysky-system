-- Agregar campos de tacómetro a la tabla flights
-- Ejecutar este script para implementar el sistema de tacómetro

DO $$ 
BEGIN
    -- Agregar columna tachometer_start (tacómetro inicial)
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'flights' AND column_name = 'tachometer_start'
    ) THEN
        ALTER TABLE flights 
        ADD COLUMN tachometer_start NUMERIC;
        RAISE NOTICE 'Columna tachometer_start agregada exitosamente';
    ELSE
        RAISE NOTICE 'La columna tachometer_start ya existe';
    END IF;

    -- Agregar columna tachometer_end (tacómetro final)
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'flights' AND column_name = 'tachometer_end'
    ) THEN
        ALTER TABLE flights 
        ADD COLUMN tachometer_end NUMERIC;
        RAISE NOTICE 'Columna tachometer_end agregada exitosamente';
    ELSE
        RAISE NOTICE 'La columna tachometer_end ya existe';
    END IF;

    -- Migrar datos existentes: copiar duration a tachometer_end para vuelos completados
    -- Esto es para mantener compatibilidad con vuelos existentes
    UPDATE flights 
    SET tachometer_end = duration,
        tachometer_start = 0
    WHERE status = 'completed' 
    AND tachometer_end IS NULL 
    AND duration IS NOT NULL;

    RAISE NOTICE 'Migración de datos completada - vuelos existentes mantienen compatibilidad';
    
END $$;

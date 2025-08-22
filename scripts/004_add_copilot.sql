-- Agregar soporte para copiloto en vuelos
-- Ejecutar este script para permitir hasta 2 pilotos por vuelo

ALTER TABLE flights 
ADD COLUMN pilot_id_2 UUID REFERENCES pilots(id) ON DELETE CASCADE;

-- Crear índice para el copiloto
CREATE INDEX IF NOT EXISTS idx_flights_pilot_2 ON flights(pilot_id_2);

-- Comentario: pilot_id sigue siendo el piloto principal, pilot_id_2 es el copiloto (opcional)

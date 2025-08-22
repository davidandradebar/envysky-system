-- Ver todos los vuelos con detalles
SELECT 
    f.id,
    f.date,
    f.time,
    f.status,
    f.duration,
    f.pilot_id,
    f.pilot_id_2,
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

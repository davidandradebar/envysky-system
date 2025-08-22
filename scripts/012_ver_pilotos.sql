-- Ver todos los pilotos disponibles
SELECT 
    id, 
    full_name, 
    email 
FROM pilots 
ORDER BY created_at;

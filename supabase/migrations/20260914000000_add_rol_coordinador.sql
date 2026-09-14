INSERT INTO roles (id, nombre)
VALUES (6, 'COORDINADOR')
ON CONFLICT (id) DO UPDATE
SET nombre = EXCLUDED.nombre;

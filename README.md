# Simulador de Bases de Datos

[![Database Load Performance](https://github.com/UPT-FAING-EPIS/proyecto-si783-2026-i-u1-simulador-de-carga-de-bds/actions/workflows/performance.yml/badge.svg)](https://github.com/UPT-FAING-EPIS/proyecto-si783-2026-i-u1-simulador-de-carga-de-bds/actions/workflows/performance.yml)
[![Deploy Landing Page](https://github.com/UPT-FAING-EPIS/proyecto-si783-2026-i-u1-simulador-de-carga-de-bds/actions/workflows/pages.yml/badge.svg)](https://github.com/UPT-FAING-EPIS/proyecto-si783-2026-i-u1-simulador-de-carga-de-bds/actions/workflows/pages.yml)

Un IDE web/desktop multi-motor para aprender y practicar SQL y NoSQL **sin instalar nada**. Ejecuta consultas contra SQL Server, MySQL, PostgreSQL, Oracle, SQLite, MongoDB y Redis directamente en el navegador.

---

## Características

### 7 motores de bases de datos
| Motor | Tipo | Sintaxis soportada |
|-------|------|-------------------|
| SQL Server | Relacional | T-SQL, IDENTITY, TOP N, NVARCHAR |
| MySQL | Relacional | AUTO_INCREMENT, LIMIT, CONCAT |
| PostgreSQL | Relacional | SERIAL, LIMIT OFFSET, ARRAY_AGG |
| Oracle | Relacional | ROWNUM, SEQUENCE, NVL, DUAL |
| SQLite | Relacional | AUTOINCREMENT, PRAGMA, sqlite_master |
| MongoDB | Documental | find, insertOne, updateOne, deleteOne, aggregate |
| Redis | Clave-valor | SET/GET, HSET/HGETALL, LPUSH/LRANGE, SADD/SMEMBERS, INCR |

### Editor SQL con esteroides
- Monaco Editor (el mismo de VS Code) con resaltado de sintaxis
- Autocompletado de palabras clave SQL
- Ejecución de **selección parcial** — selecciona parte del script y ejecuta solo eso
- Múltiples tabs de consulta simultáneas
- Pantalla completa del editor (`F11` o botón Maximize)

### Importar / Exportar datos
- **Importar:** scripts `.sql`, archivos `.csv`, `.json`
- **Exportar resultados:** `.csv`, `.json`, `.xlsx` (Excel)
- **Guardar sesión:** descarga un `.json` con todas tus tabs y queries
- **Cargar sesión:** restaura tu workspace completo

### Herramientas educativas
- **Templates por motor:** 8 plantillas específicas por cada motor (TOP N, IDENTITY, ROWNUM, find, SET/GET, etc.)
- **Snippets** clásicos de SQL (JOIN, GROUP BY, CREATE TABLE, etc.)
- **Historial** de consultas con tiempo de ejecución y filas afectadas
- **Errores con sugerencias:** si escribes mal un nombre de tabla o columna, el simulador sugiere la corrección

### Simulación de entornos reales
- Latencia de red configurable (0–5000 ms)
- Simulación de errores aleatorios con probabilidad configurable
- Niveles de aislamiento de transacciones
- Límite de conexiones simultáneas
- Métricas reales: tiempo de ejecución, memoria JS heap, filas afectadas

### Explorador de esquema
- Vista en árbol de todas las bases de datos y tablas
- Preview inline de datos al hacer clic en una tabla
- Actualización automática al crear o modificar tablas

---

## Atajos de teclado

| Atajo | Acción |
|-------|--------|
| `F5` | Ejecutar consulta |
| `Ctrl + Enter` | Ejecutar consulta |
| `F11` | Pantalla completa del editor |
| `Ctrl + /` | Comentar / descomentar línea |
| `Ctrl + Z` | Deshacer |
| `Ctrl + Space` | Activar autocompletado |
| `Ctrl + F` | Buscar en editor |

> Selecciona parte del código y presiona `F5` para ejecutar solo esa selección.

---

## Instalación y uso

### Modo web (Vite)
```bash
npm install
npm run dev
```

### Modo desktop (Electron)
```bash
npm install
npm run electron:dev   # desarrollo
npm run electron:build # build distribuible
```

### Validacion CI/CD de rendimiento

El repositorio incluye el workflow `Database Load Performance`, ejecutado en cada `push`, `pull_request` y de forma manual desde GitHub Actions. El pipeline instala dependencias, compila el proyecto una sola vez y ejecuta pruebas de carga automaticas sobre los 7 motores soportados.

La validacion combina cada motor con tres escenarios:

| Escenario | Consultas | Concurrencia |
|---|---|
| `light` | 120 | 12 |
| `medium` | 240 | 24 |
| `heavy` | 600 | 60 |

Cada prueba mide latencia promedio, latencia p95, TPS, tasa de errores y duracion total. Los umbrales se calculan por motor y escenario para que Redis, SQLite, motores SQL y motores NoSQL tengan criterios acordes a su perfil simulado.

Cada combinacion genera un artifact independiente (`sqlserver-light-report`, `mysql-heavy-report`, `redis-medium-report`, etc.) y el job final `Consolidated performance summary` publica una tabla unica ordenada por TPS con version del simulador, fecha, branch, commit, duracion total, conclusion automatica, resumen por motor y ranking automatico de rendimiento. El artifact `performance-summary` incluye reportes en Markdown, JSON y CSV para revision tecnica o analisis en hojas de calculo. En Pull Requests, el resumen consolidado se publica tambien como comentario automatico.

Para ejecutar la prueba localmente:

```bash
npm run test:performance
```

---

## Stack tecnológico

| Tecnología | Uso |
|-----------|-----|
| React 18 + TypeScript | UI y lógica de componentes |
| Vite | Build tool y dev server |
| Tailwind CSS | Estilos utilitarios |
| Monaco Editor | Editor SQL con IntelliSense |
| AlaSQL | Motor SQL en memoria |
| Zustand | Gestión de estado global |
| IndexedDB | Persistencia de tablas entre sesiones |
| Electron | Empaquetado como app de escritorio |
| SheetJS (xlsx) | Exportación a Excel |

---

## Ejemplo rápido: SQL Server

```sql
-- Crear una tabla
CREATE TABLE empleados (
  id     INT IDENTITY(1,1) PRIMARY KEY,
  nombre NVARCHAR(100) NOT NULL,
  salario DECIMAL(10,2)
);

-- Insertar datos
INSERT INTO empleados (nombre, salario) VALUES ('Ana García', 3200);
INSERT INTO empleados (nombre, salario) VALUES ('Luis Torres', 2800);

-- Consultar
SELECT TOP 5 nombre, salario
FROM empleados
WHERE salario > 2000
ORDER BY salario DESC;
```

## Ejemplo rápido: MongoDB

```javascript
// Requiere que la colección exista como tabla en AlaSQL primero
db.empleados.insertOne({ nombre: "Ana García", salario: 3200, activo: true })
db.empleados.find({ activo: true })
db.empleados.updateOne({ nombre: "Ana García" }, { $set: { salario: 3500 } })
db.empleados.countDocuments({ activo: true })
```

## Ejemplo rápido: Redis

```
SET sesion:user1 "token_abc123"
EXPIRE sesion:user1 3600
TTL sesion:user1

HSET usuario:1 nombre "Juan" email "juan@ejemplo.com"
HGETALL usuario:1

LPUSH cola:tareas "tarea1" "tarea2"
LRANGE cola:tareas 0 -1

INCR contador:visitas
GET contador:visitas
```

---

## Limitaciones conocidas

- Las consultas se ejecutan en memoria (AlaSQL). No soporta procedimientos almacenados, funciones definidas por el usuario ni CTEs complejos.
- Los datos se pierden al recargar la página si no se guardan vía IndexedDB (las tablas creadas con `CREATE TABLE` + `INSERT` sí persisten automáticamente).
- MongoDB y Redis son simulaciones en memoria — los datos no persisten entre recargas de la app.
- No hay conexión a bases de datos reales.

---

## Licencia

MIT

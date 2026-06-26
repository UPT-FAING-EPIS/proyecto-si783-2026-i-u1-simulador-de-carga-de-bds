![Logo](../media/logo-upt.png)

# UNIVERSIDAD PRIVADA DE TACNA

## FACULTAD DE INGENIERIA

### Escuela Profesional de Ingenieria de Sistemas

---

# Manual de Instalacion

## Proyecto: Simulador de Bases de Datos

**Curso:** Calidad y Pruebas de Software

**Docente:** MAG. Patrick Cuadros Quiroga

**Integrantes:**

- Jhony Vargas Luque (2022075754)
- Abel Fernando Pacompia Ortiz (2023076797)

**Tacna - Peru**

**2026**

---

## 1. Objetivo

Este manual describe el proceso para instalar, ejecutar, compilar y empaquetar el **Simulador de Bases de Datos** en modo web y desktop.

## 2. Requisitos previos

| Requisito | Version recomendada | Uso |
|---|---|---|
| Node.js | 18 o superior | Ejecutar Vite, TypeScript y herramientas de build. |
| npm | Incluido con Node.js | Instalar dependencias y ejecutar scripts. |
| Git | Opcional | Clonar o versionar el proyecto. |
| Navegador moderno | Actual | Usar la aplicacion web. |
| Java Runtime | Opcional | Solo si se desea renderizar PlantUML localmente. |

## 3. Estructura principal del proyecto

| Ruta | Descripcion |
|---|---|
| `src/` | Codigo fuente React/TypeScript. |
| `src/components/` | Componentes de interfaz. |
| `src/engines/` | Motor SQL, exportadores y logs. |
| `src/db/` | Persistencia IndexedDB. |
| `src/lib/` | Firebase, auth, presencia y sesiones. |
| `electron/` | Configuracion de aplicacion desktop. |
| `public/` | Recursos publicos. |
| `documentos/` | Documentacion del proyecto. |
| `package.json` | Dependencias, scripts y configuracion Electron. |

## 4. Instalacion en modo desarrollo

### Paso 1: Abrir terminal

Ubicarse en la carpeta del proyecto:

```powershell
cd C:\Users\USUARIO\Documents\proyecto-si783-2026-i-u1-simulador-de-carga-de-bds
```

### Paso 2: Instalar dependencias

```bash
npm install
```

Este comando instala dependencias como React, Vite, Monaco Editor, AlaSQL, Firebase, Zustand, Electron y SheetJS.

### Paso 3: Ejecutar servidor web

```bash
npm run dev
```

Vite mostrara una URL local, normalmente:

```text
http://localhost:5173
```

### Paso 4: Abrir la aplicacion

Entradas disponibles:

| Entrada | Funcion |
|---|---|
| `/app.html` | Aplicacion principal. |
| `/simulator.html` | Simulador de carga independiente. |
| `/admin.html` | Panel administrativo. |

Ejemplos:

```text
http://localhost:5173/app.html
http://localhost:5173/simulator.html
http://localhost:5173/admin.html
```

## 5. Configuracion de Firebase

Firebase es necesario para:

- Registro e inicio de sesion.
- Login con Google.
- Presencia de usuarios.
- Panel administrativo.
- Monitoreo de sesiones del simulador.

Crear un archivo `.env` en la raiz del proyecto con las variables:

```env
VITE_FIREBASE_API_KEY=valor
VITE_FIREBASE_AUTH_DOMAIN=valor
VITE_FIREBASE_DATABASE_URL=valor
VITE_FIREBASE_PROJECT_ID=valor
VITE_FIREBASE_STORAGE_BUCKET=valor
VITE_FIREBASE_MESSAGING_SENDER_ID=valor
VITE_FIREBASE_APP_ID=valor
VITE_ADMIN_EMAILS=correo@dominio.com
```

Si Firebase no esta configurado, algunas funciones colaborativas o administrativas no estaran disponibles.

## 6. Compilacion web

Para generar una version de produccion:

```bash
npm run build
```

El comando ejecuta:

```bash
tsc && vite build
```

La salida se genera en:

```text
dist/
```

## 7. Previsualizar build

```bash
npm run preview
```

Este comando sirve el contenido compilado para verificarlo antes de publicarlo.

## 8. Ejecucion en modo desktop

Para desarrollo con Electron:

```bash
npm run electron:dev
```

Este script:

1. Inicia Vite.
2. Espera `http://localhost:5173`.
3. Abre Electron en modo desarrollo.

## 9. Compilacion desktop

### Build general

```bash
npm run electron:build
```

### Windows

```bash
npm run electron:build:win
```

Genera instalador NSIS y version portable en la carpeta:

```text
release/
```

### macOS

```bash
npm run electron:build:mac
```

### Linux

```bash
npm run electron:build:linux
```

## 10. Scripts disponibles

| Script | Funcion |
|---|---|
| `npm run dev` | Inicia Vite en desarrollo. |
| `npm run build` | Compila TypeScript y genera build web. |
| `npm run preview` | Previsualiza el build. |
| `npm run test:performance` | Ejecuta una prueba automatica de rendimiento del simulador. |
| `npm run electron:dev` | Ejecuta Electron en desarrollo. |
| `npm run electron:build` | Genera build desktop. |
| `npm run electron:build:win` | Genera instalador Windows. |
| `npm run electron:build:mac` | Genera build macOS. |
| `npm run electron:build:linux` | Genera AppImage Linux. |

## 11. CI/CD y rendimiento

El proyecto incluye el workflow de GitHub Actions `Database Load Performance`, definido en:

```text
.github/workflows/performance.yml
```

Este pipeline se ejecuta en `push`, `pull_request` y manualmente desde la pestaña Actions de GitHub. Su objetivo es validar que el simulador mantenga un comportamiento aceptable de rendimiento antes de integrar cambios al repositorio principal.

El flujo realiza:

1. Descarga del repositorio.
2. Instalacion de Node.js 22.
3. Instalacion de dependencias con `npm ci --legacy-peer-deps`.
4. Compilacion con `npm run build`.
5. Ejecucion de `npm run test:performance`.
6. Prueba de los motores `sqlserver`, `mysql`, `postgresql`, `oracle`, `sqlite`, `mongodb` y `redis`.
7. Ejecucion de escenarios `light`, `medium` y `heavy`.
8. Aplicacion de umbrales especificos por motor y escenario.
9. Generacion de reportes individuales por combinacion motor/escenario.
10. Generacion de un resumen consolidado con ranking automatico.

Escenarios configurados:

| Escenario | Consultas | Concurrencia |
|---|---:|---:|
| `light` | 120 | 12 |
| `medium` | 240 | 24 |
| `heavy` | 600 | 60 |

Los artifacts generados son:

| Artifact | Contenido |
|---|---|
| `sqlserver-light-report`, `mysql-heavy-report`, etc. | Reporte individual de una combinacion motor/escenario. |
| `performance-summary` | Reportes Markdown, JSON y CSV con todos los motores y escenarios, fecha, version, branch, commit, duracion total, TPS, latencia, tasa de errores, conclusion automatica, resumen por motor y ranking. |

Criterios de aceptacion:

| Metrica | Umbral |
|---|---|
| Latencia promedio | Definida por motor y ajustada por escenario. |
| Latencia p95 | Definida por motor y ajustada por escenario. |
| TPS | Definido por motor y ajustado por escenario. |
| Tasa de errores | Definida por motor. |

Si alguna combinacion motor/escenario supera los umbrales, el workflow falla y GitHub marca la ejecucion como no aprobada. En Pull Requests, el resumen consolidado se publica como comentario automatico para facilitar la revision.

## 12. Verificacion de instalacion

Luego de instalar, verificar:

1. `npm install` termina sin errores.
2. `npm run dev` muestra URL local.
3. `app.html` carga la pantalla de login.
4. `simulator.html` muestra registro del simulador.
5. `admin.html` muestra login administrativo.
6. `npm run build` genera carpeta `dist`.
7. `npm run test:performance` genera reportes en `reports/` y muestra estado `PASS` si los umbrales se cumplen.

## 13. Problemas comunes

| Problema | Causa probable | Solucion |
|---|---|---|
| `npm` no se reconoce | Node.js no instalado o no esta en PATH. | Instalar Node.js y reiniciar terminal. |
| Error de dependencias | Instalacion incompleta. | Borrar `node_modules` y ejecutar `npm install`. |
| Firebase no funciona | Variables `.env` ausentes o incorrectas. | Revisar claves y URL de Realtime Database. |
| Admin no permite acceso | Usuario sin rol administrador. | Configurar `VITE_ADMIN_EMAILS` o cambiar rol en Firebase. |
| IndexedDB no persiste | Navegador en modo privado o limpieza de datos. | Usar navegador normal y evitar limpiar almacenamiento. |

## 14. Recomendaciones de despliegue

- No subir `.env` con credenciales reales al repositorio.
- Usar variables de entorno del proveedor de hosting.
- Verificar `vite.config.ts` para la base de despliegue.
- Probar `npm run build` antes de publicar.
- Mantener Node.js actualizado.

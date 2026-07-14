# Bitácora de Desarrollo - UNACH-Connect (Fase 1 e Integración de Auth/Postulación)

**Fecha de Registro:** 14 de Julio de 2026  
**Carrera:** Diseño Gráfico (UNACH)  
**Metodología:** CRISP-DM / Lean Startup  

---

## 1. Tareas y Objetivos Completados

### A. Configuración de Entorno y Servidores (Docker & Puertos)
*   **Resolución de Conflictos de Puertos:** Se detectó que el puerto `8000` estaba asignado a otro contenedor en ejecución (`library_web`). Se detuvo el contenedor conflictivo para liberar el puerto y posibilitar la ejecución del backend de UNACH-Connect.
*   **Actualización de Versión de PHP:** Se corrigió un error de plataforma en la construcción del contenedor de Laravel. Las dependencias del `composer.lock` requerían PHP `>= 8.4.1`, por lo que se actualizó el `Dockerfile` del backend para usar `php:8.4-cli` como imagen base.
*   **Servidores Activos:**
    *   **Backend (Laravel 11 API):** Ejecutándose en el puerto `8000`.
    *   **Frontend (React + Vite SPA):** Ejecutándose en el puerto `5173`.

### B. Aplicación de Credenciales de Supabase
*   **Frontend (.env):** Integración de `VITE_SUPABASE_URL` y la clave pública `VITE_SUPABASE_ANON_KEY` del proyecto `deysrerbfbsuehnwijmp`.
*   **Backend (.env):** Configuración de la conexión PostgreSQL directa (`db.deysrerbfbsuehnwijmp.supabase.co`), contraseña de base de datos (`qmV63lzx363JlvJs`) y el `SUPABASE_JWT_SECRET` para firmar y validar tokens de acceso.

### C. Módulo 1 (Autenticación, Registro y Postulación) - Implementación Real
*   **Diseño de Logos Optimizado:** Se incrementó el tamaño de los logotipos oficiales en el Navbar (a `65px`) y en el formulario de login/registro (a `80px`) para solucionar el problema de contraste e invisibilidad sobre el fondo Deep Navy (`#0A0F1D`).
*   **Conexión Directa a la Base de Datos (Supabase Client):** Se inicializó el cliente oficial de Supabase (`supabaseClient.js`) para realizar consultas en vivo.
*   **Inicio de Sesión e Identidad:** Las llamadas de login ahora se comunican en vivo con `supabase.auth.signInWithPassword` y recuperan los datos reales del alumno registrados en la tabla `public.users`.
*   **Registro Institucional Seguro:** Implementación del flujo de registro con `supabase.auth.signUp`, validando visualmente que el correo termine en `@unach.edu.ec` (sincronizado con el Trigger de la base de datos).
*   **Billetera de UNACH-Credits Dinámica:** El saldo y las transacciones se leen en tiempo real de la tabla `public.wallets`, mostrando el monedero real del estudiante.
*   **Postulaciones a Tutor en Caliente:** Formulario interactivo que valida la nota mínima de `8.5/10`, realiza la carga de archivos PDF del Kardex directo al bucket `portfolios` de Supabase Storage e inserta la postulación en la tabla `public.tutors` en estado `pending` (Pendiente).

---

## 2. Próximos Pasos (Fase 2)
1. Escribir el Middleware en Laravel para validación segura del Bearer JWT Token de Supabase en todas las llamadas internas de la API.
2. Desarrollar la interfaz del buscador del Marketplace con los filtros cascada cruzados de materias y profesores de la UNACH.
3. Configurar el panel de administración en React para aprobar/suspender tutores postulados y auditar el historial transaccional de créditos.

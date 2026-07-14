# Guía de Desarrollo y Bitácora del Proyecto: UNACH-Connect

Esta guía documenta los acuerdos tomados en la sesión del **12 de Julio de 2026** y detalla el plan de implementación, arquitectura y configuraciones definidas para el desarrollo del sitio web **UNACH-Connect** (carrera de Diseño Gráfico).

---

## 1. Introducción y Requerimientos del Proyecto
UNACH-Connect busca resolver el problema de conexión y tutorías entre pares en la carrera de Diseño Gráfico, atendiendo al perfil de estudiante "Mateo" (requiere respuestas rápidas, seguridad institucional y accesibilidad móvil).

### Requerimientos Clave
*   **Marketplace de Tutores**: Estudiantes de semestres superiores ofrecen tutorías sobre materias específicas.
*   **Filtros Hiper-Localizados**: Búsqueda cruzada por *Asignatura* (ej. Tipografía, Geometría Descriptiva) y *Docente específico de la UNACH*.
*   **Billetera de UNACH-Credits**: Moneda digital para transaccionar tutorías y canjear en comercios asociados (ploteos, librerías y bares).
*   **Integración Express**: Contacto "fricción cero" vía WhatsApp Business.

---

## 2. Arquitectura de Integración Tecnológica
El proyecto implementa un desacoplamiento híbrido:
1.  **Frontend (React + Vite)**: Aplicación SPA, responsiva, Mobile-First. Se autentica directamente con Supabase Auth y consume la API de Laravel enviando el Bearer JWT Token. Escucha eventos en tiempo real con Supabase Realtime.
2.  **Backend (Laravel 11 API)**: Validador de negocio principal. Conectado directamente a la base de datos PostgreSQL de Supabase. Procesa el algoritmo de emparejamiento, audita la billetera y genera enlaces de redirección a WhatsApp.
3.  **BaaS / Base de Datos (Supabase)**: Proporciona la base de datos PostgreSQL, la autenticación y el almacenamiento de archivos (Supabase Storage).

---

## 3. Control de Acceso y Estructura de Roles

### Restricción de Registro
El acceso está estrictamente limitado a la comunidad universitaria mediante un trigger en la base de datos de Supabase que valida el dominio `@unach.edu.ec`:
```sql
CREATE OR REPLACE FUNCTION check_unach_email()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.email NOT LIKE '%@unach.edu.ec' THEN
        RAISE EXCEPTION 'Registro denegado: Solo se permiten correos institucionales de la UNACH (@unach.edu.ec).';
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;
```

### Roles del Sistema
*   **Alumno (Rol Base)**: Se registra con correo institucional. Puede buscar tutores, agendar sesiones, calificar y ver sus créditos.
*   **Tutor (Rol Especializado - "Referente")**: Alumno de semestres superiores aprobado por la administración. Registrado en la tabla `tutors`, define materias e interactúa en el mercado. *Nota:* Sigue siendo Alumno y puede solicitar tutorías.
*   **Administrador**: Control de asignaturas, docentes y auditoría financiera.
*   **Comercio Aliado (Partner)**: Negocios de impresión, bares y librerías que escanean y validan los códigos QR de canje.

### Gestión de Fotos y Portafolios (Supabase Storage)
*   **Bucket `avatars` (Público)**: Fotos de perfil legibles públicamente. Modificación exclusiva para el dueño del ID de usuario.
*   **Bucket `portfolios` (Privado / Autenticado)**: Resúmenes y PDFs de diseño protegidos mediante RLS.
*   *Optimización:* Las imágenes se consumen aplicando redimensionamiento dinámico desde la URL de Supabase para evitar altos consumos de datos móviles en el cliente.

---

## 4. Estructura de la Base de Datos (3FN / 4FN)
El esquema completo se inicializa con el script en la ruta del proyecto:
📁 **[supabase/migrations/20260712000000_init_schema.sql](file:///home/joelalejandro/Documentos/codes/Unach-conect/supabase/migrations/20260712000000_init_schema.sql)**

### Tablas Principales
*   `public.users`: Información general de perfil.
*   `public.tutors`: Perfil de tutoría y promedio de calificación.
*   `public.subjects` y `public.professors`: Catálogos institucionales.
*   `public.tutor_subjects`: Intersección en 4FN (tutor-materia-docente) y tarifa por hora.
*   `public.tutoring_sessions`: Registro de agendas.
*   `public.reviews`: Calificaciones unitarias ligadas a sesiones de tutoría.
*   `public.wallets` y `public.credit_transactions`: Billetera con arquitectura Ledger.
*   `public.redemption_codes`: Códigos temporales con su respectivo QR de canje.

### Algoritmo de Emparejamiento en Base de Datos (RPC)
Se incluye la función optimizada `find_best_tutors` en Postgres:
```sql
CREATE OR REPLACE FUNCTION public.find_best_tutors(
    p_subject_id INTEGER,
    p_professor_id INTEGER DEFAULT NULL
)
RETURNS TABLE (...) 
```
Ordena priorizando: (1) tutor con el mismo profesor, (2) mayor nota promedio y (3) menor tarifa.

---

## 5. Entorno de Desarrollo (Docker)
El proyecto se orquesta usando el archivo:
📁 **[docker-compose.yml](file:///home/joelalejandro/Documentos/codes/Unach-conect/docker-compose.yml)**

### Configuración de Servicios
1.  **Backend (Laravel)**: Corre en el puerto `8000`. Carga las librerías `libpq-dev` y `firebase/php-jwt` para procesar el token seguro de Supabase.
2.  **Frontend (React)**: Corre en el puerto `5173`. Incorpora soporte para enrutador de React (`react-router-dom`), iconos (`lucide-react`) y el cliente de Supabase (`@supabase/supabase-js`).

### Instrucciones para Iniciar
1.  Llenar credenciales en **`backend/.env`** y **`frontend/.env`**.
2.  Levantar contenedores:
    ```bash
    docker compose up --build -d
    ```

---

## 6. Prototipo Interactivo
Se ha construido un prototipo navegable para previsualizar flujos de búsqueda, agendas, canjes de créditos y la animación dinámica de partículas:
📄 **[prototype.html](file:///home/joelalejandro/Documentos/codes/Unach-conect/prototype.html)** *(hacer doble clic para abrir en el navegador).*

---

## 7. Plan de Implementación Fase a Fase

### [ ] Fase 1: Base de Datos y Supabase (FINALIZADA)
*   [x] Diseño de base de datos normalizada en 3FN/4FN.
*   [x] Generación del script de migración SQL con Triggers y políticas RLS.
*   [x] Definición del mecanismo de almacenamiento de portafolios (Supabase Storage).
*   [x] Restricción de correo institucional `@unach.edu.ec`.

### [ ] Fase 2: Configuración del Backend (Laravel API) - PRÓXIMA FASE
*   [ ] Escribir el middleware de validación del token JWT de Supabase en Laravel.
*   [ ] Crear modelos de Eloquent (`User`, `Tutor`, `Subject`, `Professor`, `TutoringSession`, `Wallet`, `CreditTransaction`).
*   [ ] Definir relaciones en Eloquent.
*   [ ] Crear controladores de la API y rutas protegidas en `routes/api.php`.
*   [ ] Configurar y testear la conexión a Postgres de Supabase.

### [ ] Fase 3: Maquetación del Frontend (React Visual)
*   [ ] Establecer el sistema de diseño visual (colores `#0A0F1D`, `#FF5E13`, tipografías y sombras).
*   [ ] Construir el canvas animado de partículas de la "Red Luminosa".
*   [ ] Maquetar la Landing Page de búsqueda (TOFU).
*   [ ] Maquetar la grilla interactiva y tarjetas de los tutores (MOFU).
*   [ ] Diseñar el panel de billetera y vistas de canje de créditos.

### [ ] Fase 4: Integración del Cliente con el Servidor
*   [ ] Configurar `@supabase/supabase-js` en el frontend para auth del usuario y subida de portafolios.
*   [ ] Conectar llamadas Axios/Fetch del frontend hacia los endpoints de Laravel.
*   [ ] Probar el flujo de solicitud de tutoría y el redireccionamiento a WhatsApp.

### [ ] Fase 5: Módulo de UNACH-Credits e Integraciones
*   [ ] Implementar API del libro mayor transaccional en Laravel.
*   [ ] Crear vista de comercios aliados para escaneo y validación de códigos QR.
*   [ ] Integración fina con WhatsApp Business API.

### [ ] Fase 6: Pruebas y Despliegue
*   [ ] Pruebas unitarias en Laravel e integración en React.
*   [ ] Auditoría final de políticas RLS y seguridad.
*   [ ] Despliegue de Frontend (Vercel) y Backend (VPS/Render).

-- 20260712000000_init_schema.sql
-- Inicialización de la base de datos de UNACH-Connect (3FN / 4FN)

-- Habilitar extensión UUID
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ==========================================
-- 1. ENUMERACIONES (ROLES Y ESTADOS)
-- ==========================================
CREATE TYPE user_role AS ENUM ('student', 'admin', 'partner');
CREATE TYPE tutor_status AS ENUM ('pending', 'approved', 'suspended');
CREATE TYPE session_status AS ENUM ('requested', 'scheduled', 'completed', 'cancelled');
CREATE TYPE transaction_type AS ENUM ('tutoring_payment', 'tutoring_earning', 'shop_redemption', 'refund', 'admin_adjustment');
CREATE TYPE redemption_status AS ENUM ('active', 'claimed', 'expired');

-- ==========================================
-- 2. TABLAR DEL SISTEMA (3FN / 4FN)
-- ==========================================

-- Tabla Base de Usuarios (Sincronizada con auth.users de Supabase)
CREATE TABLE public.users (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    full_name VARCHAR(150) NOT NULL,
    email VARCHAR(150) UNIQUE NOT NULL,
    phone_number VARCHAR(20),
    role user_role NOT NULL DEFAULT 'student',
    avatar_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Tabla de Tutores (Relación 1:1 con Users)
CREATE TABLE public.tutors (
    id UUID PRIMARY KEY REFERENCES public.users(id) ON DELETE CASCADE,
    bio TEXT,
    portfolio_url TEXT,
    status tutor_status NOT NULL DEFAULT 'pending',
    rating_avg NUMERIC(3, 2) DEFAULT 0.00 CHECK (rating_avg >= 0.00 AND rating_avg <= 5.00),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Tabla de Asignaturas / Materias
CREATE TABLE public.subjects (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) UNIQUE NOT NULL,
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Tabla de Profesores / Docentes
CREATE TABLE public.professors (
    id SERIAL PRIMARY KEY,
    name VARCHAR(150) NOT NULL,
    department VARCHAR(100),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Tabla de Asociación: Tutores - Materias - Profesores (Hiper-localización)
-- Cumple con 4FN resolviendo la relación de muchos a muchos sin dependencias multivalor ocultas
CREATE TABLE public.tutor_subjects (
    tutor_id UUID REFERENCES public.tutors(id) ON DELETE CASCADE,
    subject_id INTEGER REFERENCES public.subjects(id) ON DELETE CASCADE,
    professor_id INTEGER REFERENCES public.professors(id) ON DELETE CASCADE,
    price_per_hour NUMERIC(10, 2) NOT NULL CHECK (price_per_hour >= 0.00),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    PRIMARY KEY (tutor_id, subject_id, professor_id)
);

-- Tabla de Sesiones de Tutoría
CREATE TABLE public.tutoring_sessions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    student_id UUID NOT NULL REFERENCES public.users(id) ON DELETE RESTRICT,
    tutor_id UUID NOT NULL REFERENCES public.tutors(id) ON DELETE RESTRICT,
    subject_id INTEGER NOT NULL REFERENCES public.subjects(id) ON DELETE RESTRICT,
    status session_status NOT NULL DEFAULT 'requested',
    scheduled_at TIMESTAMP WITH TIME ZONE NOT NULL,
    whatsapp_initiated BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Tabla de Calificaciones / Reseñas (Relación 1:1 con Tutoring Sessions para evitar duplicidad de reseñas)
CREATE TABLE public.reviews (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    session_id UUID UNIQUE NOT NULL REFERENCES public.tutoring_sessions(id) ON DELETE CASCADE,
    rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
    comment TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Tabla de Billeteras (Relación 1:1 con Users)
CREATE TABLE public.wallets (
    user_id UUID PRIMARY KEY REFERENCES public.users(id) ON DELETE CASCADE,
    balance NUMERIC(12, 2) NOT NULL DEFAULT 0.00 CHECK (balance >= 0.00),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Tabla de Historial de Transacciones de Créditos (Ledger)
CREATE TABLE public.credit_transactions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    wallet_id UUID NOT NULL REFERENCES public.wallets(user_id) ON DELETE RESTRICT,
    amount NUMERIC(12, 2) NOT NULL, -- Positivo para ingresos, negativo para egresos
    type transaction_type NOT NULL,
    description TEXT,
    reference_id UUID, -- Puede referenciar una tutoría o un código de canje
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Tabla de Códigos de Canje en Tiendas Aliadas
CREATE TABLE public.redemption_codes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    transaction_id UUID UNIQUE NOT NULL REFERENCES public.credit_transactions(id) ON DELETE RESTRICT,
    code VARCHAR(12) UNIQUE NOT NULL, -- Código de 8-12 caracteres alfanuméricos
    status redemption_status NOT NULL DEFAULT 'active',
    partner_shop_id UUID NOT NULL REFERENCES public.users(id) ON DELETE RESTRICT,
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    claimed_at TIMESTAMP WITH TIME ZONE
);

-- ==========================================
-- 3. TRIGGERS Y FUNCIONES EN POSTGRES
-- ==========================================

-- A. Restricción de correo institucional de la UNACH
CREATE OR REPLACE FUNCTION public.check_unach_email()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.email NOT LIKE '%@unach.edu.ec' THEN
        RAISE EXCEPTION 'Registro denegado: Solo se permiten correos institucionales de la UNACH (@unach.edu.ec).';
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_check_unach_email
BEFORE INSERT ON auth.users
FOR EACH ROW
EXECUTE FUNCTION public.check_unach_email();


-- B. Sincronización automática de nuevo usuario registrado en auth.users
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.users (id, full_name, email, role, avatar_url)
    VALUES (
        NEW.id,
        COALESCE(NEW.raw_user_meta_data->>'full_name', split_part(NEW.email, '@', 1)),
        NEW.email,
        'student',
        NEW.raw_user_meta_data->>'avatar_url'
    );
    
    INSERT INTO public.wallets (user_id, balance)
    VALUES (NEW.id, 0.00);
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
AFTER INSERT ON auth.users
FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();


-- C. Cálculo automático del saldo de la Billetera (Traspaso de Ledger a Balance)
CREATE OR REPLACE FUNCTION public.update_wallet_balance()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE public.wallets
    SET balance = (
        SELECT COALESCE(SUM(amount), 0.00)
        FROM public.credit_transactions
        WHERE wallet_id = NEW.wallet_id
    ),
    updated_at = timezone('utc'::text, now())
    WHERE user_id = NEW.wallet_id;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER trg_update_balance
AFTER INSERT OR UPDATE ON public.credit_transactions
FOR EACH ROW
EXECUTE FUNCTION public.update_wallet_balance();


-- D. Actualización del Promedio de Calificación de los Tutores
CREATE OR REPLACE FUNCTION public.update_tutor_rating()
RETURNS TRIGGER AS $$
DECLARE
    v_tutor_id UUID;
BEGIN
    -- Obtener el tutor relacionado con la sesión calificada
    SELECT tutor_id INTO v_tutor_id
    FROM public.tutoring_sessions
    WHERE id = NEW.session_id;

    -- Recalcular el promedio
    UPDATE public.tutors
    SET rating_avg = (
        SELECT COALESCE(ROUND(AVG(rating), 2), 0.00)
        FROM public.reviews r
        JOIN public.tutoring_sessions s ON r.session_id = s.id
        WHERE s.tutor_id = v_tutor_id
    )
    WHERE id = v_tutor_id;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER trg_update_tutor_rating
AFTER INSERT OR UPDATE ON public.reviews
FOR EACH ROW
EXECUTE FUNCTION public.update_tutor_rating();

-- ==========================================
-- 4. POLÍTICAS DE SEGURIDAD (RLS)
-- ==========================================

ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tutors ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tutor_subjects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tutoring_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.wallets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.credit_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.redemption_codes ENABLE ROW LEVEL SECURITY;

-- Políticas para Users
CREATE POLICY "Permitir lectura pública de perfiles" ON public.users FOR SELECT USING (true);
CREATE POLICY "Permitir modificación de perfil propio" ON public.users FOR UPDATE USING (auth.uid() = id);

-- Políticas para Tutors
CREATE POLICY "Permitir lectura pública de tutores" ON public.tutors FOR SELECT USING (true);
CREATE POLICY "Permitir postulación como tutor" ON public.tutors FOR INSERT WITH CHECK (auth.uid() = id);
CREATE POLICY "Permitir editar biografía y portafolio propio" ON public.tutors FOR UPDATE USING (auth.uid() = id);

-- Políticas para Tutor_Subjects
CREATE POLICY "Permitir lectura de asignaturas de tutores" ON public.tutor_subjects FOR SELECT USING (true);
CREATE POLICY "Permitir gestionar materias a tutores aprobados" ON public.tutor_subjects 
    FOR ALL USING (
        auth.uid() = tutor_id 
        AND EXISTS (SELECT 1 FROM public.tutors WHERE id = auth.uid() AND status = 'approved')
    );

-- Políticas para Wallets
CREATE POLICY "Permitir ver saldo propio" ON public.wallets FOR SELECT USING (auth.uid() = user_id);

-- Políticas para Credit_Transactions (Solo lectura por el dueño de la billetera)
CREATE POLICY "Permitir ver transacciones propias" ON public.credit_transactions FOR SELECT USING (
    wallet_id IN (SELECT user_id FROM public.wallets WHERE user_id = auth.uid())
);

-- ==========================================
-- 5. FUNCIONES DE NEGOCIO (RPC / MATCHMAKING)
-- ==========================================

-- Función de Matchmaking para buscar y ordenar tutores por relevancia y coincidencia de docente
CREATE OR REPLACE FUNCTION public.find_best_tutors(
    p_subject_id INTEGER,
    p_professor_id INTEGER DEFAULT NULL
)
RETURNS TABLE (
    tutor_id UUID,
    full_name VARCHAR,
    avatar_url TEXT,
    bio TEXT,
    rating_avg NUMERIC,
    price_per_hour NUMERIC,
    matches_professor BOOLEAN
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        u.id AS tutor_id,
        u.full_name,
        u.avatar_url,
        t.bio,
        t.rating_avg,
        ts.price_per_hour,
        (ts.professor_id = p_professor_id) AS matches_professor
    FROM public.tutor_subjects ts
    JOIN public.tutors t ON ts.tutor_id = t.id
    JOIN public.users u ON t.id = u.id
    WHERE ts.subject_id = p_subject_id
      AND t.status = 'approved'
    ORDER BY 
        (ts.professor_id = p_professor_id) DESC, -- Primero los que coinciden con el profesor específico
        t.rating_avg DESC,                       -- Mayor calificación
        ts.price_per_hour ASC;                   -- Menor costo por hora
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;


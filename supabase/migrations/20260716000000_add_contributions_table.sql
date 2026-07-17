-- 20260716000000_add_contributions_table.sql
-- Creación de la tabla de aportaciones/recursos estudiantiles (Foro)

CREATE TABLE IF NOT EXISTS public.contributions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    title VARCHAR(150) NOT NULL,
    description TEXT NOT NULL,
    category VARCHAR(50) NOT NULL CHECK (category IN ('tutorial', 'recurso', 'consejo_general')),
    resource_url TEXT NOT NULL CHECK (resource_url ~* '^https?://[^\s/$.?#].[^\s]*$'), -- Validación de URL básica
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Habilitar Row Level Security (RLS)
ALTER TABLE public.contributions ENABLE ROW LEVEL SECURITY;

-- Políticas de Seguridad RLS

-- 1. Permitir lectura pública de las aportaciones
CREATE POLICY "Permitir lectura de aportaciones" 
ON public.contributions 
FOR SELECT 
USING (true);

-- 2. Permitir que cualquier usuario autenticado cree una aportación propia
CREATE POLICY "Permitir inserción de aportaciones a usuarios autenticados" 
ON public.contributions 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

-- 3. Permitir que el creador o un administrador edite la aportación
CREATE POLICY "Permitir edición a propietarios o admins" 
ON public.contributions 
FOR UPDATE 
USING (
    auth.uid() = user_id 
    OR EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'admin')
);

-- 4. Permitir que el creador o un administrador elimine la aportación
CREATE POLICY "Permitir eliminación a propietarios o admins" 
ON public.contributions 
FOR DELETE 
USING (
    auth.uid() = user_id 
    OR EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'admin')
);

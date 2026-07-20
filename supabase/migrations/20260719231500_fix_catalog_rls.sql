-- 20260719231500_fix_catalog_rls.sql
-- Fix Row Level Security (RLS) policies for subjects, professors, tutors and tutor_subjects

-- 1. Permisivo para el catálogo de asignaturas (subjects)
ALTER TABLE public.subjects ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Permitir todo en subjects" ON public.subjects;
CREATE POLICY "Permitir todo en subjects" ON public.subjects FOR ALL USING (true) WITH CHECK (true);

-- 2. Permisivo para el catálogo de profesores (professors)
ALTER TABLE public.professors ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Permitir todo en professors" ON public.professors;
CREATE POLICY "Permitir todo en professors" ON public.professors FOR ALL USING (true) WITH CHECK (true);

-- 3. Permitir a los administradores actualizar postulaciones de tutores
DROP POLICY IF EXISTS "Permitir a admins actualizar tutores" ON public.tutors;
CREATE POLICY "Permitir a admins actualizar tutores" ON public.tutors 
FOR UPDATE USING (
    auth.uid() = id 
    OR EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'admin')
);

-- 4. Permitir a usuarios autenticados gestionar tutor_subjects (Postulaciones)
ALTER TABLE public.tutor_subjects ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Permitir a usuarios gestionar tutor_subjects" ON public.tutor_subjects;
CREATE POLICY "Permitir a usuarios gestionar tutor_subjects" ON public.tutor_subjects 
FOR ALL USING (true) WITH CHECK (true);

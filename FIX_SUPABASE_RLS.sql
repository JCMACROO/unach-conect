-- SCRIPT DE CORRECCIÓN DE PERMISOS RLS PARA UNACH-CONNECT
-- Copia y pega todo este código en el "SQL Editor" de tu Dashboard de Supabase y haz clic en "RUN"

-- 1. Asignaturas (subjects)
ALTER TABLE public.subjects ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Permitir todo en subjects" ON public.subjects;
CREATE POLICY "Permitir todo en subjects" ON public.subjects FOR ALL USING (true) WITH CHECK (true);

-- 2. Docentes (professors)
ALTER TABLE public.professors ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Permitir todo en professors" ON public.professors;
CREATE POLICY "Permitir todo en professors" ON public.professors FOR ALL USING (true) WITH CHECK (true);

-- 3. Tutores (tutors)
ALTER TABLE public.tutors ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Permitir todo en tutors" ON public.tutors;
CREATE POLICY "Permitir todo en tutors" ON public.tutors FOR ALL USING (true) WITH CHECK (true);

-- 4. Asignaturas de tutores (tutor_subjects)
ALTER TABLE public.tutor_subjects ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Permitir todo en tutor_subjects" ON public.tutor_subjects;
CREATE POLICY "Permitir todo en tutor_subjects" ON public.tutor_subjects FOR ALL USING (true) WITH CHECK (true);

-- 5. Billeteras y créditos (credit_transactions)
ALTER TABLE public.credit_transactions ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Permitir todo en credit_transactions" ON public.credit_transactions;
CREATE POLICY "Permitir todo en credit_transactions" ON public.credit_transactions FOR ALL USING (true) WITH CHECK (true);

-- 20260715222222_graphic_design_seed.sql
-- Datos iniciales del catálogo para la carrera de Diseño Gráfico de la UNACH

-- Inserción de Asignaturas Críticas de Diseño Gráfico
INSERT INTO public.subjects (name, description) VALUES
('Geometría Descriptiva', 'Fundamentos de proyecciones, perspectivas y representación formal del espacio bidimensional y tridimensional.'),
('Tipografía I', 'Estudio histórico y morfológico de la letra, anatomía tipográfica, jerarquías y legibilidad básica.'),
('Tipografía II', 'Uso expresivo de la tipografía, diseño tipográfico experimental y maquetación de sistemas de texto complejos.'),
('Diseño Vectorial', 'Uso y dominio técnico de software de ilustración vectorial para el desarrollo de iconografía, trazos y piezas gráficas.'),
('Diagramación y Diseño Editorial', 'Composición de páginas, retículas, y estructuración visual de publicaciones impresas y digitales como revistas y libros.'),
('Semiótica de la Imagen', 'Análisis crítico de los signos visuales, retórica visual, códigos culturales y construcción de significados en el diseño.'),
('Identidad Corporativa', 'Desarrollo conceptual, metodológico y gráfico de marcas, manuales de identidad corporativa y branding estratégico.'),
('Diseño Web y Multimedia', 'Maquetación e interfaces UX/UI, diseño de sitios web interactivos, animaciones y contenidos multimedia.'),
('Historia del Diseño', 'Evolución de las corrientes y movimientos del diseño gráfico global, desde la imprenta hasta la era digital.'),
('Taller de Ilustración Análoga', 'Técnicas de representación artística manual (acuarela, tinta, grafito) aplicadas a la comunicación visual.')
ON CONFLICT (name) DO UPDATE SET description = EXCLUDED.description;

-- Inserción de Docentes/Profesores de la Carrera
INSERT INTO public.professors (name, department) VALUES
('Mgs. Carlos Fuentes', 'Diseño Gráfico - Taller y Vectorial'),
('Mgs. Elena Beltrán', 'Diseño Gráfico - Dirección de Carrera'),
('Mgs. Jorge Vaca', 'Diseño Gráfico - Área de Tipografía'),
('Mgs. Ramiro Andrade', 'Diseño Gráfico - Área Editorial e Ilustración'),
('Mgs. Patricia Maldonado', 'Diseño Gráfico - Área Teórica y Semiótica')
ON CONFLICT DO NOTHING;

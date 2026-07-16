<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;

class GraphicDesignSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        // Insert Asignaturas Críticas de Diseño Gráfico
        $subjects = [
            ['name' => 'Geometría Descriptiva', 'description' => 'Fundamentos de proyecciones, perspectivas y representación formal del espacio bidimensional y tridimensional.'],
            ['name' => 'Tipografía I', 'description' => 'Estudio histórico y morfológico de la letra, anatomía tipográfica, jerarquías y legibilidad básica.'],
            ['name' => 'Tipografía II', 'description' => 'Uso expresivo de la tipografía, diseño tipográfico experimental y maquetación de sistemas de texto complejos.'],
            ['name' => 'Diseño Vectorial', 'description' => 'Uso y dominio técnico de software de ilustración vectorial para el desarrollo de iconografía, trazos y piezas gráficas.'],
            ['name' => 'Diagramación y Diseño Editorial', 'description' => 'Composición de páginas, retículas, y estructuración visual de publicaciones impresas y digitales como revistas y libros.'],
            ['name' => 'Semiótica de la Imagen', 'description' => 'Análisis crítico de los signos visuales, retórica visual, códigos culturales y construcción de significados en el diseño.'],
            ['name' => 'Identidad Corporativa', 'description' => 'Desarrollo conceptual, metodológico y gráfico de marcas, manuales de identidad corporativa y branding estratégico.'],
            ['name' => 'Diseño Web y Multimedia', 'description' => 'Maquetación e interfaces UX/UI, diseño de sitios web interactivos, animaciones y contenidos multimedia.'],
            ['name' => 'Historia del Diseño', 'description' => 'Evolución de las corrientes y movimientos del diseño gráfico global, desde la imprenta hasta la era digital.'],
            ['name' => 'Taller de Ilustración Análoga', 'description' => 'Técnicas de representación artística manual (acuarela, tinta, grafito) aplicadas a la comunicación visual.']
        ];

        foreach ($subjects as $subject) {
            DB::table('subjects')->updateOrInsert(
                ['name' => $subject['name']],
                ['description' => $subject['description'], 'created_at' => now()]
            );
        }

        // Insert Docentes de Diseño Gráfico
        $professors = [
            ['name' => 'Mgs. Carlos Fuentes', 'department' => 'Diseño Gráfico - Taller y Vectorial'],
            ['name' => 'Mgs. Elena Beltrán', 'department' => 'Diseño Gráfico - Dirección de Carrera'],
            ['name' => 'Mgs. Jorge Vaca', 'department' => 'Diseño Gráfico - Área de Tipografía'],
            ['name' => 'Mgs. Ramiro Andrade', 'department' => 'Diseño Gráfico - Área Editorial e Ilustración'],
            ['name' => 'Mgs. Patricia Maldonado', 'department' => 'Diseño Gráfico - Área Teórica y Semiótica']
        ];

        foreach ($professors as $professor) {
            DB::table('professors')->updateOrInsert(
                ['name' => $professor['name']],
                ['department' => $professor['department'], 'created_at' => now()]
            );
        }
    }
}

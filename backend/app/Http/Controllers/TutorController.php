<?php

namespace App\Http\Controllers;

use App\Models\Tutor;
use App\Models\TutorSubject;
use App\Models\Subject;
use App\Models\Professor;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Exception;

class TutorController extends Controller
{
    /**
     * Submit tutor application.
     */
    public function apply(Request $request)
    {
        $authUser = $request->input('auth_user');

        if (!$authUser || !isset($authUser['id'])) {
            return response()->json([
                'error' => 'No autorizado. Información del usuario no encontrada.'
            ], 401);
        }

        // Validate the request data
        $validated = $request->validate([
            'subject_id' => 'required|integer|exists:subjects,id',
            'professor_id' => 'required|integer|exists:professors,id',
            'grade' => 'required|numeric|min:8.5|max:10',
            'bio' => 'required|string|max:1000',
            'portfolio_url' => 'required|url',
            'price_per_hour' => 'nullable|numeric|min:0'
        ]);

        $tutorId = $authUser['id'];
        $pricePerHour = $validated['price_per_hour'] ?? 5.00; // Default price if not provided

        DB::beginTransaction();
        try {
            // 1. Create or update the tutor profile details
            $tutor = Tutor::updateOrCreate(
                ['id' => $tutorId],
                [
                    'bio' => $validated['bio'],
                    'portfolio_url' => $validated['portfolio_url'],
                    'status' => 'pending' // Enters as pending approval
                ]
            );

            // 2. Associate the tutor with the subject and professor
            // Delete potential duplicates/existing configuration first for clean override, then insert.
            TutorSubject::where('tutor_id', $tutorId)
                ->where('subject_id', $validated['subject_id'])
                ->where('professor_id', $validated['professor_id'])
                ->delete();

            TutorSubject::create([
                'tutor_id' => $tutorId,
                'subject_id' => $validated['subject_id'],
                'professor_id' => $validated['professor_id'],
                'price_per_hour' => $pricePerHour
            ]);

            DB::commit();

            return response()->json([
                'message' => 'Postulación enviada con éxito. Está en cola de revisión por el administrador.',
                'tutor' => $tutor
            ], 201);

        } catch (Exception $e) {
            DB::rollBack();
            return response()->json([
                'error' => 'Error al procesar la postulación.',
                'message' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Get subjects list.
     */
    public function getSubjects()
    {
        try {
            $subjects = Subject::orderBy('name', 'asc')->get();
            return response()->json($subjects);
        } catch (Exception $e) {
            return response()->json([
                'error' => 'Error al obtener asignaturas.',
                'message' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Get professors list.
     */
    public function getProfessors()
    {
        try {
            $professors = Professor::orderBy('name', 'asc')->get();
            return response()->json($professors);
        } catch (Exception $e) {
            return response()->json([
                'error' => 'Error al obtener docentes.',
                'message' => $e->getMessage()
            ], 500);
        }
    }
}

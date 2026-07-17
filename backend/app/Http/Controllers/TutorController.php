<?php

namespace App\Http\Controllers;

use App\Models\Tutor;
use App\Models\TutorSubject;
use App\Models\Subject;
use App\Models\Professor;
use App\Models\TutoringSession;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;
use Carbon\Carbon;
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

    /**
     * Search tutors using postgres RPC.
     */
    public function search(Request $request)
    {
        $validated = $request->validate([
            'subject_id' => 'required|integer',
            'professor_id' => 'nullable|integer'
        ]);

        $subjectId = $validated['subject_id'];
        $professorId = $validated['professor_id'] ?? null;

        try {
            $tutors = DB::select(
                'SELECT * FROM public.find_best_tutors(?, ?)',
                [$subjectId, $professorId]
            );

            return response()->json($tutors);
        } catch (Exception $e) {
            return response()->json([
                'error' => 'Error al buscar tutores.',
                'message' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Get tutor details by user ID.
     */
    public function show($id)
    {
        try {
            $tutor = DB::table('tutors')
                ->join('users', 'tutors.id', '=', 'users.id')
                ->select(
                    'tutors.id',
                    'users.full_name',
                    'users.email',
                    'users.phone_number',
                    'users.avatar_url',
                    'tutors.bio',
                    'tutors.portfolio_url',
                    'tutors.rating_avg'
                )
                ->where('tutors.id', $id)
                ->first();

            if (!$tutor) {
                return response()->json(['error' => 'Tutor no encontrado.'], 404);
            }

            // Get subjects and professors taught by this tutor
            $subjects = DB::table('tutor_subjects')
                ->join('subjects', 'tutor_subjects.subject_id', '=', 'subjects.id')
                ->join('professors', 'tutor_subjects.professor_id', '=', 'professors.id')
                ->select(
                    'subjects.name as subject_name',
                    'professors.name as professor_name',
                    'tutor_subjects.price_per_hour'
                )
                ->where('tutor_subjects.tutor_id', $id)
                ->get();

            return response()->json([
                'tutor' => $tutor,
                'subjects' => $subjects
            ]);
        } catch (Exception $e) {
            return response()->json([
                'error' => 'Error al obtener detalles del tutor.',
                'message' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * POST /api/tutoring-sessions
     * Registers a tutoring session request in the DB.
     */
    public function createSession(Request $request)
    {
        $authUser = $request->input('auth_user');

        if (!$authUser || !isset($authUser['id'])) {
            return response()->json(['error' => 'No autorizado. Información del usuario no encontrada.'], 401);
        }

        $studentId = $authUser['id'];

        $validated = $request->validate([
            'tutor_id' => 'required|uuid|exists:tutors,id',
            'subject_id' => 'required|integer|exists:subjects,id',
            'scheduled_at' => 'required|date'
        ]);

        $tutorId = $validated['tutor_id'];
        $subjectId = $validated['subject_id'];
        $scheduledAt = Carbon::parse($validated['scheduled_at']);

        if ($tutorId === $studentId) {
            return response()->json(['error' => 'No puedes agendar una sesión de tutoría contigo mismo.'], 400);
        }

        try {
            // Verify tutor is approved
            $tutor = Tutor::where('id', $tutorId)->where('status', 'approved')->first();
            if (!$tutor) {
                return response()->json(['error' => 'El tutor seleccionado no está disponible o no ha sido aprobado por el administrador.'], 400);
            }

            // Create Tutoring Session in DB
            $session = TutoringSession::create([
                'id' => Str::uuid()->toString(),
                'student_id' => $studentId,
                'tutor_id' => $tutorId,
                'subject_id' => $subjectId,
                'status' => 'requested', // Status begins as requested
                'scheduled_at' => $scheduledAt,
                'whatsapp_initiated' => true,
                'created_at' => Carbon::now()
            ]);

            return response()->json([
                'message' => 'Sesión de tutoría registrada con éxito.',
                'session' => $session
            ], 201);

        } catch (Exception $e) {
            return response()->json([
                'error' => 'Error al agendar la sesión de tutoría.',
                'message' => $e->getMessage()
            ], 500);
        }
    }
}

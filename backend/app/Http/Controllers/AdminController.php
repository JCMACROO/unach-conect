<?php

namespace App\Http\Controllers;

use App\Models\Subject;
use App\Models\Professor;
use App\Models\Tutor;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Exception;

class AdminController extends Controller
{
    /**
     * Helper to verify if the authenticated user is an admin.
     */
    private function verifyAdmin(Request $request)
    {
        $authUser = $request->input('auth_user');
        if (!$authUser || $authUser['role'] !== 'admin') {
            return false;
        }
        return true;
    }

    /**
     * GET /api/admin/applications
     * List all pending tutor applications.
     */
    public function getApplications(Request $request)
    {
        if (!$this->verifyAdmin($request)) {
            return response()->json(['error' => 'No autorizado. Se requiere rol de administrador.'], 403);
        }

        try {
            // Join tutors with users and tutor_subjects to get full application detail
            $applications = DB::table('tutors')
                ->join('users', 'tutors.id', '=', 'users.id')
                ->leftJoin('tutor_subjects', 'tutors.id', '=', 'tutor_subjects.tutor_id')
                ->leftJoin('subjects', 'tutor_subjects.subject_id', '=', 'subjects.id')
                ->leftJoin('professors', 'tutor_subjects.professor_id', '=', 'professors.id')
                ->select(
                    'tutors.id as tutor_id',
                    'users.full_name',
                    'users.email',
                    'tutors.bio',
                    'tutors.portfolio_url',
                    'tutors.status',
                    'subjects.name as subject_name',
                    'professors.name as professor_name',
                    'tutor_subjects.price_per_hour'
                )
                ->where('tutors.status', 'pending')
                ->get();

            return response()->json($applications);
        } catch (Exception $e) {
            return response()->json([
                'error' => 'Error al obtener postulaciones.',
                'message' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * PUT /api/admin/applications/{tutor}/status
     * Approve or reject (suspend) a tutor application.
     */
    public function updateApplicationStatus(Request $request, $tutorId)
    {
        if (!$this->verifyAdmin($request)) {
            return response()->json(['error' => 'No autorizado. Se requiere rol de administrador.'], 403);
        }

        $validated = $request->validate([
            'status' => 'required|in:approved,suspended,pending'
        ]);

        try {
            $tutor = Tutor::find($tutorId);
            if (!$tutor) {
                return response()->json(['error' => 'Tutor no encontrado.'], 404);
            }

            $tutor->status = $validated['status'];
            $tutor->save();

            return response()->json([
                'message' => 'Estado de la postulación actualizado con éxito.',
                'tutor' => $tutor
            ]);
        } catch (Exception $e) {
            return response()->json([
                'error' => 'Error al actualizar el estado de la postulación.',
                'message' => $e->getMessage()
            ], 500);
        }
    }

    // =========================================================================
    // SUBJECTS CRUD
    // =========================================================================

    public function storeSubject(Request $request)
    {
        if (!$this->verifyAdmin($request)) {
            return response()->json(['error' => 'No autorizado. Se requiere rol de administrador.'], 403);
        }

        $validated = $request->validate([
            'name' => 'required|string|max:100|unique:subjects,name',
            'description' => 'nullable|string'
        ]);

        try {
            $subject = Subject::create($validated);
            return response()->json([
                'message' => 'Asignatura creada con éxito.',
                'subject' => $subject
            ], 201);
        } catch (Exception $e) {
            return response()->json([
                'error' => 'Error al crear la asignatura.',
                'message' => $e->getMessage()
            ], 500);
        }
    }

    public function updateSubject(Request $request, $id)
    {
        if (!$this->verifyAdmin($request)) {
            return response()->json(['error' => 'No autorizado. Se requiere rol de administrador.'], 403);
        }

        $validated = $request->validate([
            'name' => 'required|string|max:100|unique:subjects,name,' . $id,
            'description' => 'nullable|string'
        ]);

        try {
            $subject = Subject::find($id);
            if (!$subject) {
                return response()->json(['error' => 'Asignatura no encontrada.'], 404);
            }

            $subject->update($validated);
            return response()->json([
                'message' => 'Asignatura actualizada con éxito.',
                'subject' => $subject
            ]);
        } catch (Exception $e) {
            return response()->json([
                'error' => 'Error al actualizar la asignatura.',
                'message' => $e->getMessage()
            ], 500);
        }
    }

    public function destroySubject(Request $request, $id)
    {
        if (!$this->verifyAdmin($request)) {
            return response()->json(['error' => 'No autorizado. Se requiere rol de administrador.'], 403);
        }

        try {
            $subject = Subject::find($id);
            if (!$subject) {
                return response()->json(['error' => 'Asignatura no encontrada.'], 404);
            }

            $subject->delete();
            return response()->json(['message' => 'Asignatura eliminada con éxito.']);
        } catch (Exception $e) {
            return response()->json([
                'error' => 'Error al eliminar la asignatura.',
                'message' => $e->getMessage()
            ], 500);
        }
    }

    // =========================================================================
    // PROFESSORS CRUD
    // =========================================================================

    public function storeProfessor(Request $request)
    {
        if (!$this->verifyAdmin($request)) {
            return response()->json(['error' => 'No autorizado. Se requiere rol de administrador.'], 403);
        }

        $validated = $request->validate([
            'name' => 'required|string|max:150',
            'department' => 'required|string|max:100'
        ]);

        try {
            $professor = Professor::create($validated);
            return response()->json([
                'message' => 'Docente creado con éxito.',
                'professor' => $professor
            ], 201);
        } catch (Exception $e) {
            return response()->json([
                'error' => 'Error al crear el docente.',
                'message' => $e->getMessage()
            ], 500);
        }
    }

    public function updateProfessor(Request $request, $id)
    {
        if (!$this->verifyAdmin($request)) {
            return response()->json(['error' => 'No autorizado. Se requiere rol de administrador.'], 403);
        }

        $validated = $request->validate([
            'name' => 'required|string|max:150',
            'department' => 'required|string|max:100'
        ]);

        try {
            $professor = Professor::find($id);
            if (!$professor) {
                return response()->json(['error' => 'Docente no encontrado.'], 404);
            }

            $professor->update($validated);
            return response()->json([
                'message' => 'Docente actualizado con éxito.',
                'professor' => $professor
            ]);
        } catch (Exception $e) {
            return response()->json([
                'error' => 'Error al actualizar el docente.',
                'message' => $e->getMessage()
            ], 500);
        }
    }

    public function destroyProfessor(Request $request, $id)
    {
        if (!$this->verifyAdmin($request)) {
            return response()->json(['error' => 'No autorizado. Se requiere rol de administrador.'], 403);
        }

        try {
            $professor = Professor::find($id);
            if (!$professor) {
                return response()->json(['error' => 'Docente no encontrado.'], 404);
            }

            $professor->delete();
            return response()->json(['message' => 'Docente eliminado con éxito.']);
        } catch (Exception $e) {
            return response()->json([
                'error' => 'Error al eliminar el docente.',
                'message' => $e->getMessage()
            ], 500);
        }
    }
}

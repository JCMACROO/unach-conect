<?php

namespace App\Http\Controllers;

use App\Models\Contribution;
use Illuminate\Http\Request;
use Illuminate\Support\Str;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\DB;
use Exception;

class ContributionController extends Controller
{
    /**
     * GET /api/contributions
     * List contributions with optional search and category filters.
     */
    public function index(Request $request)
    {
        try {
            $query = Contribution::with('user:id,full_name,email,avatar_url');

            // Filter by category
            if ($request->has('category') && $request->input('category') !== '') {
                $query->where('category', $request->input('category'));
            }

            // Search by keyword (title or description)
            if ($request->has('search') && $request->input('search') !== '') {
                $search = $request->input('search');
                $query->where(function ($q) use ($search) {
                    $q->where('title', 'like', '%' . $search . '%')
                      ->orWhere('description', 'like', '%' . $search . '%');
                });
            }

            // Order by most recent
            $contributions = $query->orderBy('created_at', 'desc')->get();

            return response()->json($contributions);
        } catch (Exception $e) {
            return response()->json([
                'error' => 'Error al obtener aportaciones.',
                'message' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * POST /api/contributions
     * Publish a new contribution in the forum.
     */
    public function store(Request $request)
    {
        $authUser = $request->input('auth_user');

        if (!$authUser || !isset($authUser['id'])) {
            return response()->json([
                'error' => 'No autorizado. Información del usuario no encontrada.'
            ], 401);
        }

        // Validate incoming request
        $validated = $request->validate([
            'title' => 'required|string|max:150',
            'description' => 'required|string|max:2000',
            'category' => 'required|string|in:tutorial,recurso,consejo_general',
            'resource_url' => 'required|url'
        ]);

        try {
            DB::transaction(function () use ($authUser, $validated, &$contribution) {
                $contribution = Contribution::create([
                    'id' => Str::uuid()->toString(),
                    'user_id' => $authUser['id'],
                    'title' => $validated['title'],
                    'description' => $validated['description'],
                    'category' => $validated['category'],
                    'resource_url' => $validated['resource_url']
                ]);

                // Recompensa automática de +10.00 UNACH-Credits
                DB::table('credit_transactions')->insert([
                    'id' => Str::uuid()->toString(),
                    'wallet_id' => $authUser['id'],
                    'amount' => 10.00,
                    'type' => 'admin_adjustment',
                    'description' => 'Recompensa por aportar en el Foro Académico: ' . $validated['title'],
                    'created_at' => now()
                ]);
            });

            // Load user relation for immediate frontend display
            $contribution->load('user:id,full_name,email,avatar_url');

            return response()->json([
                'message' => 'Aportación publicada correctamente. ¡Has ganado +10.00 UNACH-Credits!',
                'contribution' => $contribution
            ], 201);
        } catch (Exception $e) {
            Log::error('Error al registrar aportación en el foro: ' . $e->getMessage(), [
                'exception' => $e,
                'user_id' => $authUser['id'] ?? null
            ]);

            return response()->json([
                'error' => 'Error al guardar la aportación.',
                'message' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * DELETE /api/contributions/{id}
     * Remove a contribution. Only the owner or an admin can delete.
     */
    public function destroy(Request $request, $id)
    {
        $authUser = $request->input('auth_user');

        if (!$authUser || !isset($authUser['id'])) {
            return response()->json([
                'error' => 'No autorizado.'
            ], 401);
        }

        try {
            $contribution = Contribution::findOrFail($id);

            // Access check: Owner or Admin
            if ($contribution->user_id !== $authUser['id'] && $authUser['role'] !== 'admin') {
                return response()->json([
                    'error' => 'No autorizado. Solo el creador de la aportación o un administrador pueden eliminarla.'
                ], 403);
            }

            $contribution->delete();

            return response()->json([
                'message' => 'Aportación eliminada correctamente.'
            ]);
        } catch (Exception $e) {
            return response()->json([
                'error' => 'Error al eliminar la aportación.',
                'message' => $e->getMessage()
            ], 500);
        }
    }
}

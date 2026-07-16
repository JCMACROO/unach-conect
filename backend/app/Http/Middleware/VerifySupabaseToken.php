<?php

namespace App\Http\Middleware;

use Closure;
use Exception;
use Firebase\JWT\JWT;
use Firebase\JWT\Key;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class VerifySupabaseToken
{
    /**
     * Handle an incoming request.
     *
     * @param  \Closure(\Illuminate\Http\Request): (\Symfony\Component\HttpFoundation\Response)  $next
     */
    public function handle(Request $request, Closure $next): Response
    {
        $authorizationHeader = $request->header('Authorization');

        if (!$authorizationHeader || !str_starts_with($authorizationHeader, 'Bearer ')) {
            return response()->json([
                'error' => 'No autorizado. Se requiere un token Bearer válido.'
            ], 401);
        }

        $token = str_replace('Bearer ', '', $authorizationHeader);

        try {
            $jwtSecret = config('services.supabase.jwt_secret');
            $anonKey = config('services.supabase.anon_key');
            
            if (!$jwtSecret) {
                return response()->json([
                    'error' => 'Error de configuración del servidor. Secreto JWT no definido.'
                ], 500);
            }

            // Set clock tolerance to 5 minutes to prevent token validation failures due to server/client time drifts
            JWT::$leeway = 300;

            // Parse the JWT header to find the algorithm (alg)
            $tokenParts = explode('.', $token);
            if (count($tokenParts) !== 3) {
                return response()->json(['error' => 'Formato de token inválido.'], 401);
            }
            $headerJson = base64_decode($tokenParts[0]);
            $header = json_decode($headerJson, true);
            $algorithm = $header['alg'] ?? 'HS256';

            $decoded = null;

            if ($algorithm === 'ES256' || $algorithm === 'RS256') {
                // Asymmetric validation using JWKS (ECC keys standard on current Supabase)
                $dbHost = config('database.connections.pgsql.host');
                $ref = 'deysrerbfbsuehnwijmp'; // fallback
                if ($dbHost && preg_match('/db\.(.*?)\.supabase/', $dbHost, $matches)) {
                    $ref = $matches[1];
                }
                
                $jwksUrl = "https://{$ref}.supabase.co/auth/v1/.well-known/jwks.json";

                // Fetch JWKS keys from Supabase API Gateway sending api key
                $response = \Illuminate\Support\Facades\Http::withHeaders([
                    'apikey' => $anonKey
                ])->timeout(5)->get($jwksUrl);

                if (!$response->successful()) {
                    throw new Exception('No se pudieron obtener las llaves públicas de Supabase para decodificar (JWKS HTTP ' . $response->status() . ').');
                }

                $jwks = $response->json();
                $keys = \Firebase\JWT\JWK::parseKeySet($jwks);
                $decoded = JWT::decode($token, $keys);
            } else {
                // Symmetric validation using HS256 (legacy keys)
                // Try 1: Decoded from base64 (default signing method for legacy Supabase projects)
                try {
                    $binarySecret = base64_decode($jwtSecret);
                    $decoded = JWT::decode($token, new Key($binarySecret, 'HS256'));
                } catch (Exception $e) {
                    // Try 2: Raw string (fallback for standard text HS256 secrets)
                    $decoded = JWT::decode($token, new Key($jwtSecret, 'HS256'));
                }
            }

            // Fetch actual user role from the public.users database table to ensure real-time accuracy
            $dbUser = \Illuminate\Support\Facades\DB::table('users')
                ->where('id', $decoded->sub)
                ->first();

            $userRole = $dbUser ? $dbUser->role : 'student';

            // Merge user attributes in the request
            $request->merge([
                'auth_user' => [
                    'id' => $decoded->sub,
                    'email' => $decoded->email ?? ($dbUser->email ?? null),
                    'role' => $userRole,
                    'user_metadata' => (array) ($decoded->user_metadata ?? [])
                ]
            ]);

            return $next($request);
        } catch (Exception $e) {
            \Illuminate\Support\Facades\Log::error('Supabase JWT Auth Exception: ' . $e->getMessage(), [
                'token_snippet' => isset($token) ? substr($token, 0, 15) . '...' : 'none',
                'exception_type' => get_class($e)
            ]);

            return response()->json([
                'error' => $e->getMessage(),
                'message' => $e->getMessage()
            ], 401);
        }
    }
}

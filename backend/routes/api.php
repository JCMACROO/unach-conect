<?php

use Illuminate\Support\Facades\Route;
use App\Http\Controllers\TutorController;
use App\Http\Controllers\AdminController;

/*
|--------------------------------------------------------------------------
| API Routes
|--------------------------------------------------------------------------
|
| Here is where you can register API routes for your application. These
| routes are loaded by the RouteServiceProvider and all of them will
| be assigned to the "api" middleware group. Make something great!
|
*/

Route::middleware('auth.supabase')->group(function () {
    // Catalogs
    Route::get('/subjects', [TutorController::class, 'getSubjects']);
    Route::get('/professors', [TutorController::class, 'getProfessors']);

    // Tutor application
    Route::post('/tutors/apply', [TutorController::class, 'apply']);

    // Admin - Applications Approval
    Route::get('/admin/applications', [AdminController::class, 'getApplications']);
    Route::put('/admin/applications/{tutor}/status', [AdminController::class, 'updateApplicationStatus']);

    // Admin CRUD - Subjects
    Route::post('/admin/subjects', [AdminController::class, 'storeSubject']);
    Route::put('/admin/subjects/{id}', [AdminController::class, 'updateSubject']);
    Route::delete('/admin/subjects/{id}', [AdminController::class, 'destroySubject']);

    // Admin CRUD - Professors
    Route::post('/admin/professors', [AdminController::class, 'storeProfessor']);
    Route::put('/admin/professors/{id}', [AdminController::class, 'updateProfessor']);
    Route::delete('/admin/professors/{id}', [AdminController::class, 'destroyProfessor']);
});

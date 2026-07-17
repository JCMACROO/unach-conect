<?php

use Illuminate\Support\Facades\Route;
use App\Http\Controllers\TutorController;
use App\Http\Controllers\AdminController;
use App\Http\Controllers\ContributionController;
use App\Http\Controllers\WalletController;

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
    Route::get('/tutors/search', [TutorController::class, 'search']);
    Route::get('/tutors/{id}', [TutorController::class, 'show']);

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

    // Contributions (Forum)
    Route::get('/contributions', [ContributionController::class, 'index']);
    Route::post('/contributions', [ContributionController::class, 'store']);
    Route::delete('/contributions/{id}', [ContributionController::class, 'destroy']);

    // Wallet & Credits
    Route::get('/wallet/balance', [WalletController::class, 'getBalance']);
    Route::get('/partners', [WalletController::class, 'getPartners']);
    Route::post('/wallet/redeem/code', [WalletController::class, 'generateRedemptionCode']);
    Route::post('/partner/redeem/claim', [WalletController::class, 'claimRedemptionCode']);

    // Tutoring Sessions
    Route::post('/tutoring-sessions', [TutorController::class, 'createSession']);
});

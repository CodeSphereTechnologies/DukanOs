<?php

use App\Http\Controllers\Api\V1\Auth\AuthController;
use Illuminate\Support\Facades\Route;

/*
|--------------------------------------------------------------------------
| API Routes
|--------------------------------------------------------------------------
|
| These routes are stateless (bearer-token) and are consumed by the React
| frontend and the future Flutter mobile application.
|
*/

Route::prefix('v1')->name('v1.')->group(function () {
    Route::prefix('auth')->name('auth.')->group(function () {
        Route::post('login', [AuthController::class, 'login'])
            ->middleware('throttle:6,1')
            ->name('login');

        Route::middleware('auth:sanctum')->group(function () {
            Route::post('logout', [AuthController::class, 'logout'])->name('logout');
            Route::post('logout-all', [AuthController::class, 'logoutAll'])->name('logout-all');
            Route::get('me', [AuthController::class, 'me'])->name('me');
            Route::put('profile', [AuthController::class, 'updateProfile'])->name('profile.update');
            Route::put('password', [AuthController::class, 'updatePassword'])->name('password.update');
            Route::get('tokens', [AuthController::class, 'tokens'])->name('tokens.index');
            Route::delete('tokens/{tokenId}', [AuthController::class, 'revokeToken'])->name('tokens.revoke');
        });
    });
});

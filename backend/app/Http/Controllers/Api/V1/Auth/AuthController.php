<?php

namespace App\Http\Controllers\Api\V1\Auth;

use App\Http\Controllers\Controller;
use App\Http\Requests\Auth\LoginRequest;
use App\Http\Requests\Auth\UpdatePasswordRequest;
use App\Http\Requests\Auth\UpdateProfileRequest;
use App\Http\Resources\UserResource;
use App\Services\Auth\AuthenticationService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\ValidationException;

class AuthController extends Controller
{
    public function __construct(private readonly AuthenticationService $service) {}

    /**
     * Authenticate a user and issue a Sanctum bearer token.
     */
    public function login(LoginRequest $request): JsonResponse
    {
        $result = $this->service->login(
            $request->only('email', 'password'),
            $request->string('device_name')->toString() ?: null,
        );

        return response()->json([
            'success' => true,
            'message' => 'Login successful.',
            'data' => [
                'user' => new UserResource($result['user']),
                'token' => $result['token'],
                'token_type' => 'Bearer',
            ],
        ]);
    }

    /**
     * Revoke the current access token.
     */
    public function logout(Request $request): JsonResponse
    {
        $this->service->logout($request->user());

        return response()->json([
            'success' => true,
            'message' => 'Logged out successfully.',
        ]);
    }

    /**
     * Revoke all access tokens (logout from every device).
     */
    public function logoutAll(Request $request): JsonResponse
    {
        $this->service->logoutAll($request->user());

        return response()->json([
            'success' => true,
            'message' => 'Logged out from all devices.',
        ]);
    }

    /**
     * Return the currently authenticated user with role and permissions.
     */
    public function me(Request $request): JsonResponse
    {
        $user = $request->user()->load(['role', 'tenant']);

        return response()->json([
            'success' => true,
            'message' => 'Authenticated user retrieved.',
            'data' => new UserResource($user),
        ]);
    }

    /**
     * Update the authenticated user's profile.
     */
    public function updateProfile(UpdateProfileRequest $request): JsonResponse
    {
        $user = $this->service->updateProfile($request->user(), $request->validated());

        return response()->json([
            'success' => true,
            'message' => 'Profile updated successfully.',
            'data' => new UserResource($user),
        ]);
    }

    /**
     * Change the authenticated user's password.
     */
    public function updatePassword(UpdatePasswordRequest $request): JsonResponse
    {
        $this->service->updatePassword(
            $request->user(),
            $request->string('current_password')->toString(),
            $request->string('password')->toString(),
        );

        return response()->json([
            'success' => true,
            'message' => 'Password updated successfully.',
        ]);
    }

    /**
     * List the user's active access tokens.
     */
    public function tokens(Request $request): JsonResponse
    {
        $currentId = $request->user()->currentAccessToken()?->id;

        $tokens = $request->user()->tokens()->orderByDesc('last_used_at')->get()->map(fn ($token) => [
            'id' => $token->id,
            'name' => $token->name,
            'last_used_at' => $token->last_used_at?->toIso8601String(),
            'created_at' => $token->created_at?->toIso8601String(),
            'is_current' => $token->id === $currentId,
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Active tokens retrieved.',
            'data' => $tokens,
        ]);
    }

    /**
     * Revoke a specific access token.
     */
    public function revokeToken(Request $request, int $tokenId): JsonResponse
    {
        $token = $request->user()->tokens()->whereKey($tokenId)->first();

        if (! $token) {
            throw ValidationException::withMessages([
                'token' => ['The specified token was not found.'],
            ]);
        }

        $token->delete();

        return response()->json([
            'success' => true,
            'message' => 'Token revoked successfully.',
        ]);
    }
}

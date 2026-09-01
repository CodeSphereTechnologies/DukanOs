<?php

namespace App\Services\Auth;

use App\Models\User;
use App\Services\AuditService;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\ValidationException;

class AuthenticationService
{
    /**
     * Authenticate a user and issue a new Sanctum token.
     *
     * @param  array{email: string, password: string}  $credentials
     * @return array{user: User, token: string}
     *
     * @throws ValidationException
     */
    public function login(array $credentials, ?string $deviceName = null): array
    {
        $user = User::query()
            ->with(['role', 'tenant'])
            ->where('email', $credentials['email'])
            ->first();

        if (! $user || ! Hash::check($credentials['password'], $user->password)) {
            throw ValidationException::withMessages([
                'email' => ['The provided credentials are incorrect.'],
            ]);
        }

        if ($user->status !== 'active') {
            throw ValidationException::withMessages([
                'email' => ['Your account has been deactivated. Please contact your administrator.'],
            ]);
        }

        $token = $user->createToken($deviceName ?: 'api-token', ['*'])->plainTextToken;

        $user->forceFill(['last_login_at' => now()])->save();

        AuditService::log($user, 'login', 'auth');

        return ['user' => $user, 'token' => $token];
    }

    /**
     * Revoke the token used for the current request.
     */
    public function logout(User $user): void
    {
        AuditService::log($user, 'logout', 'auth');

        $user->currentAccessToken()?->delete();
    }

    /**
     * Revoke every token belonging to the user (logout from all devices).
     */
    public function logoutAll(User $user): void
    {
        AuditService::log($user, 'logout', 'auth', null, null, null, ['scope' => 'all']);

        $user->tokens()->delete();
    }

    /**
     * Update the user's profile attributes.
     */
    public function updateProfile(User $user, array $data): User
    {
        $old = $user->only(['name', 'email', 'phone']);

        $user->update($data);

        AuditService::log(
            $user,
            'updated',
            'profile',
            'user',
            $user->id,
            $old,
            $user->only(['name', 'email', 'phone']),
        );

        return $user->fresh(['role', 'tenant']);
    }

    /**
     * Change the user's password.
     *
     * @throws ValidationException
     */
    public function updatePassword(User $user, string $currentPassword, string $newPassword): void
    {
        if (! Hash::check($currentPassword, $user->password)) {
            throw ValidationException::withMessages([
                'current_password' => ['The current password is incorrect.'],
            ]);
        }

        $user->forceFill(['password' => Hash::make($newPassword)])->save();

        // Invalidate all other sessions but keep the current one active.
        $user->tokens()->whereKeyNot($user->currentAccessToken()?->id)->delete();

        AuditService::log($user, 'password_changed', 'auth', 'user', $user->id);
    }
}

<?php

namespace App\Models;

// use Illuminate\Contracts\Auth\MustVerifyEmail;
use Database\Factories\UserFactory;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Attributes\Hidden;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasOne;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Illuminate\Support\Collection;
use Laravel\Sanctum\HasApiTokens;

#[Fillable([
    'tenant_id', 'role_id', 'name', 'email', 'password', 'phone',
    'status', 'last_login_at', 'email_verified_at', 'remember_token',
])]
#[Hidden(['password', 'remember_token'])]
class User extends Authenticatable
{
    /** @use HasFactory<UserFactory> */
    use HasApiTokens, HasFactory, Notifiable, SoftDeletes;

    /**
     * Get the attributes that should be cast.
     *
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'email_verified_at' => 'datetime',
            'password' => 'hashed',
            'last_login_at' => 'datetime',
        ];
    }

    public function tenant(): BelongsTo
    {
        return $this->belongsTo(Tenant::class);
    }

    public function role(): BelongsTo
    {
        return $this->belongsTo(Role::class);
    }

    public function employee(): HasOne
    {
        return $this->hasOne(Employee::class);
    }

    /**
     * Whether the user is a platform-level super admin (no tenant).
     */
    public function isSuperAdmin(): bool
    {
        return $this->role?->slug === Role::SUPER_ADMIN;
    }

    /**
     * Whether the user belongs to the given role slug(s).
     */
    public function hasRole(string|array $slugs): bool
    {
        $current = $this->role?->slug;

        return $current !== null && in_array($current, (array) $slugs, true);
    }

    /**
     * Whether the user holds the given permission slug. Super admins are
     * granted every permission implicitly.
     */
    public function hasPermission(string $slug): bool
    {
        if ($this->isSuperAdmin()) {
            return true;
        }

        return (bool) $this->role?->permissions()->where('slug', $slug)->exists();
    }

    /**
     * The collection of permissions effective for this user.
     */
    public function permissions(): Collection
    {
        if ($this->isSuperAdmin()) {
            return Permission::query()->get();
        }

        return $this->role ? $this->role->permissions()->get() : collect();
    }

    /**
     * The list of permission slugs effective for this user.
     *
     * @return array<int, string>
     */
    public function permissionSlugs(): array
    {
        return $this->permissions()->pluck('slug')->all();
    }
}

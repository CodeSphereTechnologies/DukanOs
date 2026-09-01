<?php

namespace App\Services;

use App\Models\AuditLog;
use App\Models\User;

class AuditService
{
    /**
     * Record an immutable audit log entry.
     */
    public static function log(
        ?User $user,
        string $action,
        string $module,
        ?string $entityType = null,
        ?int $entityId = null,
        ?array $oldValues = null,
        ?array $newValues = null,
    ): void {
        $request = request();

        AuditLog::create([
            'tenant_id' => $user?->tenant_id,
            'user_id' => $user?->id,
            'action' => $action,
            'module' => $module,
            'entity_type' => $entityType,
            'entity_id' => $entityId,
            'old_values' => $oldValues,
            'new_values' => $newValues,
            'ip_address' => $request?->ip(),
            'user_agent' => $request?->userAgent(),
            'device' => self::detectDevice($request?->userAgent()),
        ]);
    }

    /**
     * Infer a coarse device class from the User-Agent string.
     */
    private static function detectDevice(?string $userAgent): string
    {
        if (empty($userAgent)) {
            return 'Unknown';
        }

        $ua = strtolower($userAgent);

        if (str_contains($ua, 'tablet') || str_contains($ua, 'ipad')) {
            return 'Tablet';
        }

        if (str_contains($ua, 'mobile') || str_contains($ua, 'android') || str_contains($ua, 'iphone')) {
            return 'Mobile';
        }

        return 'Desktop';
    }
}

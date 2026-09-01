<?php

namespace App\Services;

/**
 * Generates tenant-scoped, sequential document numbers.
 */
class NumberGenerator
{
    /**
     * Generate the next sequential number for a given column within a tenant.
     */
    public function next(string $modelClass, int $tenantId, string $column, string $prefix, int $pad = 4): string
    {
        $last = $modelClass::query()
            ->where('tenant_id', $tenantId)
            ->orderByDesc($column)
            ->value($column);

        if (! $last) {
            return $prefix.'-'.str_pad('1', $pad, '0', STR_PAD_LEFT);
        }

        $sequence = (int) preg_replace('/\D/', '', $last);

        return $prefix.'-'.str_pad((string) ($sequence + 1), $pad, '0', STR_PAD_LEFT);
    }
}

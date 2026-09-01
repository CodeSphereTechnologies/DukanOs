<?php

namespace App\Support;

class Pricing
{
    /**
     * Compute the monetary discount amount for a given type and base.
     */
    public static function discountAmount(?string $type, float $value, float $base): float
    {
        if ($type === 'percentage') {
            return round($base * $value / 100, 2);
        }

        if ($type === 'fixed') {
            return round($value, 2);
        }

        return 0.0;
    }

    /**
     * Compute a line total: (unit_price * quantity) - discount.
     */
    public static function lineTotal(float $unitPrice, float $quantity, ?string $discountType = null, float $discountValue = 0): float
    {
        $gross = $unitPrice * $quantity;

        return round($gross - self::discountAmount($discountType, $discountValue, $gross), 2);
    }
}

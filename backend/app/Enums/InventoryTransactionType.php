<?php

namespace App\Enums;

enum InventoryTransactionType: string
{
    case In = 'in';
    case Out = 'out';
    case Adjustment = 'adjustment';
}

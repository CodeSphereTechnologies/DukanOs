<?php

namespace App\Enums;

enum RefundType: string
{
    case Cash = 'cash';
    case Credit = 'credit';
    case Ledger = 'ledger';
}

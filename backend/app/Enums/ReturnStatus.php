<?php

namespace App\Enums;

enum ReturnStatus: string
{
    case Completed = 'completed';
    case Voided = 'voided';
}

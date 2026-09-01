<?php

namespace App\Enums;

enum ProductStatus: string
{
    case Active = 'active';
    case Paused = 'paused';
    case Deleted = 'deleted';
}

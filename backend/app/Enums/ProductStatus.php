<?php

namespace App\Enums;

enum ProductStatus: string
{
    case Active = 'active';
    case Inactive = 'inactive';
    case Archived = 'archived';
    case Paused = 'paused';
    case Deleted = 'deleted';
}

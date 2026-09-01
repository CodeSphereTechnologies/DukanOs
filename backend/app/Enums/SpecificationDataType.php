<?php

namespace App\Enums;

enum SpecificationDataType: string
{
    case Text = 'text';
    case Select = 'select';
    case Number = 'number';
    case Boolean = 'boolean';
}

<?php

namespace App\Enums;

enum SalaryStatus: string
{
    case Pending = 'pending';
    case Paid = 'paid';
}

<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

#[Fillable([
    'tenant_id', 'user_id', 'name', 'phone', 'email', 'designation',
    'salary', 'joining_date', 'address', 'status',
])]
class Employee extends Model
{
    protected function casts(): array
    {
        return [
            'salary' => 'decimal:2',
            'joining_date' => 'date',
        ];
    }

    public function tenant(): BelongsTo
    {
        return $this->belongsTo(Tenant::class);
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function salaryRecords(): HasMany
    {
        return $this->hasMany(SalaryRecord::class);
    }
}

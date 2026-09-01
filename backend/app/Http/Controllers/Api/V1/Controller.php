<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller as BaseController;
use App\Support\Traits\ApiResponder;
use App\Support\Traits\ResolvesTenant;
use Illuminate\Database\Eloquent\Model;

abstract class Controller extends BaseController
{
    use ApiResponder;
    use ResolvesTenant;

    protected function findOrFail(?Model $model, string $message = 'Resource not found.'): Model
    {
        abort_if($model === null, 404, $message);

        return $model;
    }
}

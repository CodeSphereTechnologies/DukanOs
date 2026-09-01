<?php

namespace App\Support\Traits;

use Illuminate\Http\JsonResponse;

trait ApiResponder
{
    protected function success(mixed $data = null, string $message = 'Success.', int $status = 200): JsonResponse
    {
        return response()->json([
            'success' => true,
            'message' => $message,
            'data' => $data,
        ], $status);
    }

    protected function created(mixed $data = null, string $message = 'Resource created.'): JsonResponse
    {
        return $this->success($data, $message, 201);
    }

    protected function deleted(string $message = 'Resource deleted.'): JsonResponse
    {
        return $this->success(null, $message);
    }
}

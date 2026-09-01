<?php

namespace App\Http\Controllers\Api\V1\Admin;

use App\Http\Controllers\Api\V1\Controller;
use App\Http\Resources\AuditLogResource;
use App\Repositories\AuditLogRepository;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class AuditLogController extends Controller
{
    public function __construct(private readonly AuditLogRepository $auditLogs) {}

    public function index(Request $request): JsonResponse
    {
        // Super admin sees all tenants; store users see only their own tenant.
        $tenantId = $request->user()->isSuperAdmin() ? $request->integer('tenant_id') ?: null : $this->tenantId();

        $logs = $this->auditLogs->paginate($tenantId, $request->integer('per_page', 25), $request->query('module'), $request->query('action'));

        return $this->success(AuditLogResource::collection($logs)->response()->getData(true), 'Audit logs retrieved.');
    }
}

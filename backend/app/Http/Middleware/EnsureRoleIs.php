<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class EnsureRoleIs
{
    /**
     * Allow access only to users holding at least one of the given roles.
     *
     * @param  string  ...$roles  Role slugs (e.g. "owner", "manager").
     */
    public function handle(Request $request, Closure $next, string ...$roles): Response
    {
        $user = $request->user();

        if (! $user || ! $user->hasRole($roles)) {
            return response()->json([
                'success' => false,
                'message' => 'You do not have the required role to perform this action.',
            ], Response::HTTP_FORBIDDEN);
        }

        return $next($request);
    }
}

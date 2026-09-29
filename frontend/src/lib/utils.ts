import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { ApiError } from '../types/api.types';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function generateId(): string {
  return Math.random().toString(36).substring(2, 9);
}

export function formatError(err: unknown): string {
  if (err instanceof ApiError) {
    const first = err.errors ? Object.values(err.errors).flat()[0] : undefined;
    if (first) return `${err.message}: ${first}`;
    return err.message || 'Something went wrong. Please try again.';
  }
  if (err instanceof Error && err.message) return err.message;
  return 'Something went wrong. Please try again.';
}

/**
 * Normalise a list endpoint payload.
 *
 * Paginated endpoints wrap the rows in `{ data: [...], meta, links }`, so a
 * bare `Array.isArray(res.data)` check always fails for them. Failing that
 * check used to drop callers into a demo-data fallback, which silently served
 * records that do not exist in the database.
 */
export function unwrapList<T>(payload: unknown): T[] {
  if (Array.isArray(payload)) return payload as T[];
  if (payload && typeof payload === 'object' && Array.isArray((payload as { data?: unknown }).data)) {
    return (payload as { data: T[] }).data;
  }
  return [];
}

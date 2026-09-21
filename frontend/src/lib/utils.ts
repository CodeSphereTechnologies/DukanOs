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

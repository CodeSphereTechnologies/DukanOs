import { describe, it, expect, vi, beforeEach } from 'vitest';
import { unwrapList } from '../../lib/utils';
import { tenantService } from '../../services/tenant.service';
import { apiClient } from '../../services/api-client';
import { ApiError } from '../../types/api.types';

describe('unwrapList', () => {
  it('returns a plain array untouched', () => {
    expect(unwrapList<number>([1, 2, 3])).toEqual([1, 2, 3]);
  });

  it('unwraps a paginated envelope', () => {
    const payload = { data: [1, 2], meta: { total: 2 }, links: {} };
    expect(unwrapList<number>(payload)).toEqual([1, 2]);
  });

  it('returns an empty list for anything else', () => {
    expect(unwrapList(null)).toEqual([]);
    expect(unwrapList(undefined)).toEqual([]);
    expect(unwrapList({ meta: {} })).toEqual([]);
    expect(unwrapList('nope')).toEqual([]);
  });
});

describe('tenantService.getAll', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.restoreAllMocks();
  });

  it('reads the rows out of the paginated response', async () => {
    // Regression: the endpoint returns { data: { data: [...], meta } }, so the
    // old `Array.isArray(res.data)` check failed and the demo tenant list was
    // served instead. Offering a store that does not exist made staff creation
    // fail validation on tenant_id.
    vi.spyOn(apiClient, 'get').mockResolvedValue({
      success: true,
      data: { data: [{ id: 7, name: 'Real Store', slug: 'real-store' }], meta: { total: 1 } },
    });

    const res = await tenantService.getAll();

    expect(res.data).toHaveLength(1);
    expect(res.data?.[0]).toMatchObject({ id: 7, name: 'Real Store' });
  });

  it('does not invent stores when the backend is unreachable', async () => {
    vi.spyOn(apiClient, 'get').mockRejectedValue(new TypeError('Failed to fetch'));

    const res = await tenantService.getAll();

    expect(res.data).toEqual([]);
  });

  it('propagates real API errors instead of masking them as an empty list', async () => {
    vi.spyOn(apiClient, 'get').mockRejectedValue(
      new ApiError('Unauthenticated.', 401)
    );

    await expect(tenantService.getAll()).rejects.toBeInstanceOf(ApiError);
  });
});

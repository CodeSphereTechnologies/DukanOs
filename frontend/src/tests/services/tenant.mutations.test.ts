import { describe, it, expect, vi, beforeEach } from 'vitest';
import { tenantService } from '../../services/tenant.service';
import { apiClient } from '../../services/api-client';
import { ApiError } from '../../types/api.types';

describe('tenantService.create', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.restoreAllMocks();
  });

  it('surfaces a rejected store instead of reporting success', async () => {
    // Regression: a duplicate slug returns 422. The old catch-all swallowed it
    // and returned success, so the page showed "provisioned successfully" for a
    // store that was never created.
    vi.spyOn(apiClient, 'post').mockRejectedValue(
      new ApiError('The given data was invalid.', 422, {
        slug: ['This slug is already in use.'],
      })
    );

    await expect(
      tenantService.create({ name: 'Dup Store', slug: 'punjab-electric-store' })
    ).rejects.toBeInstanceOf(ApiError);
  });

  it('does not claim success when the backend is unreachable', async () => {
    vi.spyOn(apiClient, 'post').mockRejectedValue(new TypeError('Failed to fetch'));

    const res = await tenantService.create({ name: 'Offline Store', slug: 'offline-store' });

    expect(res.success).toBe(false);
  });
});

describe('tenantService.toggleStatus', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.restoreAllMocks();
  });

  it('uses the status endpoint rather than a full-record PUT', async () => {
    // Regression: PUT /tenants/{id} validates the whole record and rejects a
    // status-only body (name and slug are required), so the toggle never
    // persisted. The failure was swallowed and the badge flipped anyway.
    const patch = vi.spyOn(apiClient, 'patch').mockResolvedValue({
      success: true,
      data: { id: 1, name: 'Store', slug: 'store', status: 'suspended' },
    });
    const put = vi.spyOn(apiClient, 'put');

    const res = await tenantService.toggleStatus(1, 'suspended');

    expect(patch).toHaveBeenCalledWith('/tenants/1/status', { status: 'suspended' });
    expect(put).not.toHaveBeenCalled();
    expect(res.data?.status).toBe('suspended');
  });

  it('propagates a rejected status change', async () => {
    vi.spyOn(apiClient, 'patch').mockRejectedValue(
      new ApiError('Unauthenticated.', 401)
    );

    await expect(tenantService.toggleStatus(1, 'suspended')).rejects.toBeInstanceOf(ApiError);
  });

  it('does not require a warm local cache', async () => {
    // The old implementation looked the tenant up in localStorage first and
    // threw "Tenant not found" on a cold cache.
    vi.spyOn(apiClient, 'patch').mockResolvedValue({
      success: true,
      data: { id: 99, name: 'Cold Cache Store', slug: 'cold', status: 'suspended' },
    });

    const res = await tenantService.toggleStatus(99, 'suspended');

    expect(res.data?.id).toBe(99);
  });
});

describe('tenantService.delete', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.restoreAllMocks();
  });

  it('propagates a refused delete', async () => {
    vi.spyOn(apiClient, 'delete').mockRejectedValue(
      new ApiError('This action is unauthorized.', 403)
    );

    await expect(tenantService.delete(1)).rejects.toBeInstanceOf(ApiError);
  });
});

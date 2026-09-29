<?php

namespace Tests\Feature\Api;

use App\Models\Tenant;

class TenantStatusApiTest extends ApiTestCase
{
    public function test_status_can_be_toggled_without_resending_the_record(): void
    {
        // Regression: the tenants page sent { status } to PUT /tenants/{id},
        // but TenantRequest requires name and slug, so the toggle always 422'd
        // and the UI showed a status the platform never stored.
        $this->withToken($this->token($this->superAdmin))
            ->patchJson('/api/v1/tenants/'.$this->tenant->id.'/status', ['status' => 'suspended'])
            ->assertOk()
            ->assertJsonPath('data.status', 'suspended');

        $this->assertSame('suspended', $this->tenant->fresh()->status);
    }

    public function test_status_can_be_reactivated(): void
    {
        $this->tenant->update(['status' => 'suspended']);

        $this->withToken($this->token($this->superAdmin))
            ->patchJson('/api/v1/tenants/'.$this->tenant->id.'/status', ['status' => 'active'])
            ->assertOk()
            ->assertJsonPath('data.status', 'active');
    }

    public function test_an_invalid_status_is_rejected(): void
    {
        $this->withToken($this->token($this->superAdmin))
            ->patchJson('/api/v1/tenants/'.$this->tenant->id.'/status', ['status' => 'nonsense'])
            ->assertStatus(422)
            ->assertJsonValidationErrors('status');

        $this->assertSame('active', $this->tenant->fresh()->status);
    }

    public function test_store_users_cannot_toggle_tenant_status(): void
    {
        $this->withToken($this->token($this->owner))
            ->patchJson('/api/v1/tenants/'.$this->tenant->id.'/status', ['status' => 'suspended'])
            ->assertForbidden();

        $this->assertSame('active', $this->tenant->fresh()->status);
    }

    public function test_tenant_resource_exposes_created_at(): void
    {
        $this->withToken($this->token($this->superAdmin))
            ->getJson('/api/v1/tenants')
            ->assertOk()
            ->assertJsonStructure(['data' => ['data' => [['id', 'name', 'slug', 'status', 'created_at']]]]);
    }

    public function test_creating_a_duplicate_slug_is_rejected(): void
    {
        // The page must be able to surface this instead of claiming success.
        $this->withToken($this->token($this->superAdmin))->postJson('/api/v1/tenants', [
            'name' => 'Duplicate Store',
            'slug' => $this->tenant->slug,
            'currency' => 'PKR',
            'status' => 'active',
        ])->assertStatus(422)->assertJsonValidationErrors('slug');

        $this->assertSame(1, Tenant::count());
    }
}

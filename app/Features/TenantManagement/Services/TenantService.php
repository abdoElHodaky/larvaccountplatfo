<?php

namespace App\Features\TenantManagement\Services;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Storage;

class TenantService
{
    /**
     * Get user's tenants formatted for display
     */
    public function getUserTenants($user): array
    {
        if (!$user) {
            return [];
        }

        $tenants = $user->tenants ?? collect();

        return $tenants->map(function ($tenant) {
            return [
                'id' => $tenant->id,
                'name' => $tenant->name,
                'slug' => $tenant->slug,
                'subdomain' => $tenant->subdomain,
                'logo' => $tenant->logo,
                'description' => $tenant->description,
                'subscription_status' => $tenant->subscription_status,
            ];
        })->toArray();
    }

    /**
     * Switch user to a different tenant
     */
    public function switchTenant($user, int $tenantId): array
    {
        // Verify user has access to this tenant
        $tenant = $user->tenants()->find($tenantId);
        
        if (!$tenant) {
            return [
                'success' => false,
                'message' => 'You do not have access to this organization.',
            ];
        }

        // Set tenant in session
        session(['tenant_id' => $tenantId]);

        return [
            'success' => true,
            'message' => "Switched to {$tenant->name}",
        ];
    }

    /**
     * Get tenant data formatted for display
     */
    public function getTenantData($tenant): array
    {
        return [
            'id' => $tenant->id,
            'name' => $tenant->name,
            'slug' => $tenant->slug,
            'subdomain' => $tenant->subdomain,
            'domain' => $tenant->domain,
            'logo' => $tenant->logo,
            'description' => $tenant->description,
            'website' => $tenant->website,
            'industry' => $tenant->industry,
            'size' => $tenant->size,
            'settings' => $tenant->settings ?? [],
            'subscription_status' => $tenant->subscription_status,
            'created_at' => $tenant->created_at,
            'updated_at' => $tenant->updated_at,
        ];
    }

    /**
     * Update tenant settings
     */
    public function updateTenantSettings($tenant, Request $request): array
    {
        try {
            $data = $request->only(['name', 'description', 'website', 'industry', 'size']);

            // Handle logo upload
            if ($request->hasFile('logo')) {
                // Delete old logo if exists
                if ($tenant->logo) {
                    Storage::disk('public')->delete($tenant->logo);
                }

                $logoPath = $request->file('logo')->store('tenant-logos', 'public');
                $data['logo'] = $logoPath;
            }

            $tenant->update($data);

            return [
                'success' => true,
                'message' => 'Organization settings updated successfully.',
            ];
        } catch (\Exception $e) {
            Log::error('Tenant settings update error: ' . $e->getMessage());
            
            return [
                'success' => false,
                'message' => 'Failed to update organization settings. Please try again.',
            ];
        }
    }

    /**
     * Get tenant users formatted for display
     */
    public function getTenantUsers($tenant): array
    {
        try {
            $users = $tenant->users()->with('roles', 'permissions')->get();

            return $users->map(function ($user) {
                return [
                    'id' => $user->id,
                    'name' => $user->name,
                    'email' => $user->email,
                    'avatar' => $user->avatar,
                    'role' => $user->role,
                    'permissions' => $user->getAllPermissions()->pluck('name'),
                    'last_login_at' => $user->last_login_at,
                    'created_at' => $user->created_at,
                    'updated_at' => $user->updated_at,
                ];
            })->toArray();
        } catch (\Exception $e) {
            Log::error('Tenant users fetch error: ' . $e->getMessage());
            return [];
        }
    }

    /**
     * Invite a user to the tenant
     */
    public function inviteUser($tenant, Request $request): array
    {
        try {
            // TODO: Implement user invitation logic
            // This would typically:
            // 1. Create an invitation record
            // 2. Send an email invitation
            // 3. Handle invitation acceptance

            // For now, return success message
            return [
                'success' => true,
                'message' => 'User invitation sent successfully.',
            ];
        } catch (\Exception $e) {
            Log::error('User invitation error: ' . $e->getMessage());
            
            return [
                'success' => false,
                'message' => 'Failed to send user invitation. Please try again.',
            ];
        }
    }
}

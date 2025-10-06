<?php

namespace Modules\Accounting\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class AccountHierarchyResource extends JsonResource
{
    /**
     * Transform the resource into an array.
     */
    public function toArray(Request $request): array
    {
        $account = $this->resource;

        return [
            'id' => $account['id'] ?? null,
            'code' => $account['code'] ?? null,
            'name' => $account['name'] ?? null,
            'type' => $account['type'] ?? null,
            'subtype' => $account['subtype'] ?? null,
            'parent_id' => $account['parent_id'] ?? null,
            'description' => $account['description'] ?? null,
            'is_active' => $account['is_active'] ?? true,
            'balance' => $account['balance'] ?? null,
            'hierarchy_balance' => $account['hierarchy_balance'] ?? null,
            'level' => $this->calculateLevel($account),
            'has_children' => !empty($account['children']),
            'children_count' => count($account['children'] ?? []),
            'children' => $this->when(
                !empty($account['children']),
                function () use ($account) {
                    return self::collection($account['children']);
                }
            ),
            'timestamps' => [
                'created_at' => $account['created_at'] ?? null,
                'updated_at' => $account['updated_at'] ?? null,
            ],
            'links' => [
                'self' => $account['id'] ? route('api.accounts.show', $account['id']) : null,
                'parent' => $account['parent_id'] ? route('api.accounts.show', $account['parent_id']) : null,
                'children' => $account['id'] ? route('api.accounts.hierarchy', ['parent_id' => $account['id']]) : null,
            ],
        ];
    }

    /**
     * Calculate the level of the account in the hierarchy.
     */
    private function calculateLevel(array $account): int
    {
        $code = $account['code'] ?? '';
        
        // Simple level calculation based on code length
        // This could be enhanced based on your specific hierarchy rules
        return strlen($code);
    }
}

<?php

namespace Modules\Accounting\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;
use Modules\Accounting\Domain\Entities\Account;

class AccountResource extends JsonResource
{
    /**
     * Transform the resource into an array.
     */
    public function toArray(Request $request): array
    {
        /** @var Account $account */
        $account = $this->resource;

        return [
            'id' => $account->getId(),
            'code' => $account->getCode()->getValue(),
            'name' => $account->getName(),
            'type' => $account->getType(),
            'subtype' => $account->getSubtype(),
            'parent_id' => $account->getParentId(),
            'description' => $account->getDescription(),
            'is_active' => $account->isActive(),
            'balance' => [
                'amount' => $account->getBalance()->getAmount(),
                'amount_float' => $account->getBalance()->getAmountAsFloat(),
                'currency' => $account->getBalance()->getCurrency(),
                'formatted' => $account->getBalance()->format(),
            ],
            'account_properties' => [
                'is_debit_account' => $account->isDebitAccount(),
                'is_credit_account' => $account->isCreditAccount(),
                'is_asset' => $account->isAsset(),
                'is_liability' => $account->isLiability(),
                'is_equity' => $account->isEquity(),
                'is_revenue' => $account->isRevenue(),
                'is_expense' => $account->isExpense(),
                'is_current_asset' => $account->isCurrentAsset(),
                'is_fixed_asset' => $account->isFixedAsset(),
                'is_current_liability' => $account->isCurrentLiability(),
                'is_long_term_liability' => $account->isLongTermLiability(),
                'has_parent' => $account->hasParent(),
            ],
            'timestamps' => [
                'created_at' => $account->getCreatedAt()->format('Y-m-d H:i:s'),
                'updated_at' => $account->getUpdatedAt()->format('Y-m-d H:i:s'),
            ],
            'links' => [
                'self' => route('api.accounts.show', $account->getId()),
                'hierarchy' => route('api.accounts.hierarchy', ['parent_id' => $account->getId()]),
            ],
        ];
    }
}

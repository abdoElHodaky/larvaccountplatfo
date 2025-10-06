<?php

namespace Modules\Accounting\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class UpdateAccountRequest extends FormRequest
{
    /**
     * Determine if the user is authorized to make this request.
     */
    public function authorize(): bool
    {
        return true; // Add proper authorization logic here
    }

    /**
     * Get the validation rules that apply to the request.
     */
    public function rules(): array
    {
        $account = $this->route('account');

        return [
            'parent_id' => ['nullable', 'exists:accounts,id'],
            'code' => [
                'required',
                'string',
                'max:20',
                Rule::unique('accounts')->where(function ($query) {
                    return $query->where('tenant_id', tenant()->id);
                })->ignore($account->id),
            ],
            'name' => ['required', 'string', 'max:255'],
            'description' => ['nullable', 'string', 'max:1000'],
            'type' => [
                'required',
                'string',
                Rule::in(['asset', 'liability', 'equity', 'revenue', 'expense']),
            ],
            'subtype' => ['required', 'string', 'max:100'],
            'normal_balance' => [
                'required',
                'string',
                Rule::in(['debit', 'credit']),
            ],
            'is_active' => ['boolean'],
            'allow_manual_entries' => ['boolean'],
            'currency' => ['required', 'string', 'size:3'],
            'tax_code' => ['nullable', 'string', 'max:50'],
            'reporting_categories' => ['nullable', 'array'],
            'reporting_categories.*' => ['string', 'max:100'],
            'metadata' => ['nullable', 'array'],
        ];
    }

    /**
     * Get custom messages for validator errors.
     */
    public function messages(): array
    {
        return [
            'code.unique' => 'An account with this code already exists.',
            'parent_id.exists' => 'The selected parent account does not exist.',
            'type.in' => 'The account type must be one of: asset, liability, equity, revenue, expense.',
            'normal_balance.in' => 'The normal balance must be either debit or credit.',
            'currency.size' => 'The currency must be a 3-letter ISO code.',
        ];
    }

    /**
     * Prepare the data for validation.
     */
    protected function prepareForValidation(): void
    {
        // Set default values
        $this->merge([
            'is_active' => $this->boolean('is_active', true),
            'allow_manual_entries' => $this->boolean('allow_manual_entries', true),
        ]);
    }

    /**
     * Configure the validator instance.
     */
    public function withValidator($validator): void
    {
        $account = $this->route('account');

        $validator->after(function ($validator) use ($account) {
            // Prevent system accounts from being modified in critical ways
            if ($account->is_system) {
                if ($this->input('type') !== $account->type) {
                    $validator->errors()->add('type', 'Cannot change type of system account.');
                }
                if ($this->input('code') !== $account->code) {
                    $validator->errors()->add('code', 'Cannot change code of system account.');
                }
            }

            // Validate parent account type compatibility
            if ($this->filled('parent_id')) {
                $parent = \Modules\Accounting\Models\Account::find($this->input('parent_id'));
                if ($parent && $parent->type !== $this->input('type')) {
                    $validator->errors()->add('parent_id', 'Parent account must be of the same type.');
                }

                // Prevent circular references
                if ($parent && $this->wouldCreateCircularReference($account, $parent)) {
                    $validator->errors()->add('parent_id', 'This would create a circular reference.');
                }
            }

            // Validate subtype based on account type
            $validSubtypes = $this->getValidSubtypes($this->input('type'));
            if (!in_array($this->input('subtype'), $validSubtypes)) {
                $validator->errors()->add('subtype', 'Invalid subtype for the selected account type.');
            }

            // Prevent changing account type if it has transactions
            if ($this->input('type') !== $account->type && $account->hasTransactions()) {
                $validator->errors()->add('type', 'Cannot change account type when account has transactions.');
            }

            // Prevent changing normal balance if it has transactions
            if ($this->input('normal_balance') !== $account->normal_balance && $account->hasTransactions()) {
                $validator->errors()->add('normal_balance', 'Cannot change normal balance when account has transactions.');
            }
        });
    }

    /**
     * Check if setting the parent would create a circular reference.
     */
    private function wouldCreateCircularReference($account, $parent): bool
    {
        $currentParent = $parent;
        while ($currentParent) {
            if ($currentParent->id === $account->id) {
                return true;
            }
            $currentParent = $currentParent->parent;
        }
        return false;
    }

    /**
     * Get valid subtypes for an account type.
     */
    private function getValidSubtypes(string $type): array
    {
        $subtypes = [
            'asset' => ['current_asset', 'fixed_asset', 'other_asset'],
            'liability' => ['current_liability', 'long_term_liability', 'other_liability'],
            'equity' => ['owner_equity', 'retained_earnings'],
            'revenue' => ['operating_revenue', 'other_revenue'],
            'expense' => ['operating_expense', 'other_expense', 'cost_of_goods_sold'],
        ];

        return $subtypes[$type] ?? [];
    }
}

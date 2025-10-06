<?php

namespace Modules\Accounting\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class CreateAccountRequest extends FormRequest
{
    /**
     * Determine if the user is authorized to make this request.
     */
    public function authorize(): bool
    {
        // This would integrate with your authorization system
        return true;
    }

    /**
     * Get the validation rules that apply to the request.
     */
    public function rules(): array
    {
        return [
            'code' => [
                'required',
                'string',
                'regex:/^[0-9]{3,10}$/',
                'unique:accounts,code',
            ],
            'name' => [
                'required',
                'string',
                'max:255',
                'min:2',
            ],
            'type' => [
                'required',
                'string',
                Rule::in(['asset', 'liability', 'equity', 'revenue', 'expense']),
            ],
            'subtype' => [
                'required',
                'string',
                'max:100',
                function ($attribute, $value, $fail) {
                    $type = $this->input('type');
                    $validSubtypes = $this->getValidSubtypes();
                    
                    if (!isset($validSubtypes[$type]) || !in_array($value, $validSubtypes[$type])) {
                        $fail("The selected subtype is invalid for the account type '{$type}'.");
                    }
                },
            ],
            'parent_id' => [
                'nullable',
                'integer',
                'exists:accounts,id',
                function ($attribute, $value, $fail) {
                    if ($value) {
                        // Additional validation for parent-child relationship
                        // This would check if the parent account type matches
                        // and if the code hierarchy is valid
                    }
                },
            ],
            'description' => [
                'nullable',
                'string',
                'max:1000',
            ],
            'is_active' => [
                'sometimes',
                'boolean',
            ],
        ];
    }

    /**
     * Get custom messages for validator errors.
     */
    public function messages(): array
    {
        return [
            'code.required' => 'Account code is required.',
            'code.regex' => 'Account code must be 3-10 digits only.',
            'code.unique' => 'This account code is already in use.',
            'name.required' => 'Account name is required.',
            'name.min' => 'Account name must be at least 2 characters.',
            'type.required' => 'Account type is required.',
            'type.in' => 'Account type must be one of: asset, liability, equity, revenue, expense.',
            'subtype.required' => 'Account subtype is required.',
            'parent_id.exists' => 'The selected parent account does not exist.',
        ];
    }

    /**
     * Get custom attributes for validator errors.
     */
    public function attributes(): array
    {
        return [
            'code' => 'account code',
            'name' => 'account name',
            'type' => 'account type',
            'subtype' => 'account subtype',
            'parent_id' => 'parent account',
            'description' => 'description',
        ];
    }

    /**
     * Prepare the data for validation.
     */
    protected function prepareForValidation(): void
    {
        $this->merge([
            'code' => $this->sanitizeAccountCode($this->input('code')),
            'name' => $this->sanitizeString($this->input('name')),
            'description' => $this->sanitizeString($this->input('description')),
        ]);
    }

    /**
     * Get the validated data from the request with additional processing.
     */
    public function validated($key = null, $default = null)
    {
        $validated = parent::validated($key, $default);
        
        // Set default values
        $validated['is_active'] = $validated['is_active'] ?? true;
        $validated['description'] = $validated['description'] ?? '';
        
        return $validated;
    }

    /**
     * Get valid subtypes for each account type.
     */
    private function getValidSubtypes(): array
    {
        return [
            'asset' => ['current_asset', 'fixed_asset', 'other_asset'],
            'liability' => ['current_liability', 'long_term_liability', 'other_liability'],
            'equity' => ['owner_equity', 'retained_earnings'],
            'revenue' => ['operating_revenue', 'other_revenue'],
            'expense' => ['operating_expense', 'other_expense'],
        ];
    }

    /**
     * Sanitize account code input.
     */
    private function sanitizeAccountCode(?string $code): ?string
    {
        if (!$code) {
            return null;
        }
        
        // Remove any non-numeric characters
        return preg_replace('/[^0-9]/', '', $code);
    }

    /**
     * Sanitize string input.
     */
    private function sanitizeString(?string $value): ?string
    {
        if (!$value) {
            return null;
        }
        
        return trim($value);
    }
}

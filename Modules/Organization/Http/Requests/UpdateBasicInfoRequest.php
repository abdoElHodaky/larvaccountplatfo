<?php

namespace Modules\Organization\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class UpdateBasicInfoRequest extends FormRequest
{
    /**
     * Determine if the user is authorized to make this request.
     */
    public function authorize(): bool
    {
        /** @var \App\Models\Tenant $tenant */
        $tenant = app('tenant');
        
        return $this->user()->can('update', $tenant);
    }

    /**
     * Get the validation rules that apply to the request.
     */
    public function rules(): array
    {
        return [
            'name' => 'required|string|max:255',
            'settings.company_email' => 'nullable|email|max:255',
            'settings.company_phone' => 'nullable|string|max:50',
            'settings.company_website' => 'nullable|url|max:255',
            'settings.company_address' => 'nullable|string|max:500',
            'settings.company_city' => 'nullable|string|max:100',
            'settings.company_state' => 'nullable|string|max:100',
            'settings.company_country' => 'nullable|string|max:100',
            'settings.company_postal_code' => 'nullable|string|max:20',
            'settings.company_logo' => 'nullable|string|max:255',
            'settings.company_description' => 'nullable|string|max:1000',
        ];
    }

    /**
     * Get custom attributes for validator errors.
     */
    public function attributes(): array
    {
        return [
            'name' => 'organization name',
            'settings.company_email' => 'company email',
            'settings.company_phone' => 'company phone',
            'settings.company_website' => 'company website',
            'settings.company_address' => 'company address',
            'settings.company_city' => 'city',
            'settings.company_state' => 'state/province',
            'settings.company_country' => 'country',
            'settings.company_postal_code' => 'postal code',
            'settings.company_logo' => 'company logo',
            'settings.company_description' => 'company description',
        ];
    }

    /**
     * Get custom messages for validator errors.
     */
    public function messages(): array
    {
        return [
            'name.required' => 'The organization name is required.',
            'settings.company_email.email' => 'Please enter a valid email address.',
            'settings.company_website.url' => 'Please enter a valid website URL.',
        ];
    }
}

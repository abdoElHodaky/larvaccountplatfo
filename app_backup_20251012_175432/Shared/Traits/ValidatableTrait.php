<?php

namespace App\Shared\Traits;

use Illuminate\Support\Facades\Validator;
use Illuminate\Validation\ValidationException;

/**
 * Validatable Trait
 *
 * Provides validation functionality for models and services.
 * Includes validation rules, custom validation methods, and error handling.
 */
trait ValidatableTrait
{
    /**
     * Validation rules for this entity
     */
    protected $validationRules = [];

    /**
     * Custom validation messages
     */
    protected $validationMessages = [];

    /**
     * Validation attributes (human-readable names)
     */
    protected $validationAttributes = [];

    /**
     * Validate data against rules
     */
    public function validate(array $data, ?array $rules = null): array
    {
        $rules = $rules ?? $this->getValidationRules();

        $validator = Validator::make(
            $data,
            $rules,
            $this->getValidationMessages(),
            $this->getValidationAttributes()
        );

        if ($validator->fails()) {
            throw new ValidationException($validator);
        }

        return $validator->validated();
    }

    /**
     * Validate data and return boolean result
     */
    public function isValid(array $data, ?array $rules = null): bool
    {
        try {
            $this->validate($data, $rules);

            return true;
        } catch (ValidationException $e) {
            return false;
        }
    }

    /**
     * Get validation errors without throwing exception
     */
    public function getValidationErrors(array $data, ?array $rules = null): array
    {
        $rules = $rules ?? $this->getValidationRules();

        $validator = Validator::make(
            $data,
            $rules,
            $this->getValidationMessages(),
            $this->getValidationAttributes()
        );

        return $validator->errors()->toArray();
    }

    /**
     * Get validation rules for this entity
     */
    public function getValidationRules(): array
    {
        return $this->validationRules;
    }

    /**
     * Set validation rules
     */
    public function setValidationRules(array $rules): self
    {
        $this->validationRules = $rules;

        return $this;
    }

    /**
     * Add validation rule
     */
    public function addValidationRule(string $field, $rule): self
    {
        $this->validationRules[$field] = $rule;

        return $this;
    }

    /**
     * Get validation messages
     */
    public function getValidationMessages(): array
    {
        return $this->validationMessages;
    }

    /**
     * Set validation messages
     */
    public function setValidationMessages(array $messages): self
    {
        $this->validationMessages = $messages;

        return $this;
    }

    /**
     * Add validation message
     */
    public function addValidationMessage(string $key, string $message): self
    {
        $this->validationMessages[$key] = $message;

        return $this;
    }

    /**
     * Get validation attributes
     */
    public function getValidationAttributes(): array
    {
        return $this->validationAttributes;
    }

    /**
     * Set validation attributes
     */
    public function setValidationAttributes(array $attributes): self
    {
        $this->validationAttributes = $attributes;

        return $this;
    }

    /**
     * Add validation attribute
     */
    public function addValidationAttribute(string $field, string $attribute): self
    {
        $this->validationAttributes[$field] = $attribute;

        return $this;
    }

    /**
     * Validate for creation
     */
    public function validateForCreation(array $data): array
    {
        $rules = $this->getCreationRules();

        return $this->validate($data, $rules);
    }

    /**
     * Validate for update
     */
    public function validateForUpdate(array $data, $id = null): array
    {
        $rules = $this->getUpdateRules($id);

        return $this->validate($data, $rules);
    }

    /**
     * Get creation-specific validation rules
     */
    protected function getCreationRules(): array
    {
        return $this->getValidationRules();
    }

    /**
     * Get update-specific validation rules
     */
    protected function getUpdateRules($id = null): array
    {
        $rules = $this->getValidationRules();

        // Make fields optional for updates
        foreach ($rules as $field => $rule) {
            if (is_string($rule) && strpos($rule, 'required') !== false) {
                $rules[$field] = str_replace('required', 'sometimes|required', $rule);
            } elseif (is_array($rule) && in_array('required', $rule)) {
                $key = array_search('required', $rule);
                $rule[$key] = 'sometimes';
                $rule[] = 'required';
                $rules[$field] = $rule;
            }
        }

        return $rules;
    }

    /**
     * Custom validation method - override in implementing classes
     */
    protected function customValidation(array $data): array
    {
        return [];
    }

    /**
     * Validate with custom rules
     */
    public function validateWithCustomRules(array $data): array
    {
        // First run standard validation
        $validated = $this->validate($data);

        // Then run custom validation
        $customErrors = $this->customValidation($data);

        if (! empty($customErrors)) {
            $validator = Validator::make([], []);
            foreach ($customErrors as $field => $messages) {
                if (is_array($messages)) {
                    foreach ($messages as $message) {
                        $validator->errors()->add($field, $message);
                    }
                } else {
                    $validator->errors()->add($field, $messages);
                }
            }
            throw new ValidationException($validator);
        }

        return $validated;
    }

    /**
     * Validate required fields only
     */
    public function validateRequired(array $data): array
    {
        $rules = [];
        foreach ($this->getValidationRules() as $field => $rule) {
            if (is_string($rule) && strpos($rule, 'required') !== false) {
                $rules[$field] = $rule;
            } elseif (is_array($rule) && in_array('required', $rule)) {
                $rules[$field] = $rule;
            }
        }

        return $this->validate($data, $rules);
    }

    /**
     * Get validation summary
     */
    public function getValidationSummary(): array
    {
        return [
            'rules_count' => count($this->getValidationRules()),
            'messages_count' => count($this->getValidationMessages()),
            'attributes_count' => count($this->getValidationAttributes()),
            'has_custom_validation' => method_exists($this, 'customValidation'),
        ];
    }

    /**
     * Sanitize data before validation
     */
    protected function sanitizeData(array $data): array
    {
        // Override in implementing classes for custom sanitization
        return array_map(function ($value) {
            if (is_string($value)) {
                return trim($value);
            }

            return $value;
        }, $data);
    }

    /**
     * Validate and sanitize data
     */
    public function validateAndSanitize(array $data, ?array $rules = null): array
    {
        $sanitized = $this->sanitizeData($data);

        return $this->validate($sanitized, $rules);
    }
}

import React, { memo } from 'react';
import { Select } from '@chakra-ui/react';
import { FormField, FormFieldProps } from './FormField';

export interface FormSelectProps extends Omit<FormFieldProps, 'children'> {
  value?: string | number;
  onChange?: (value: string) => void;
  options: Array<{ value: string | number; label: string }>;
  placeholder?: string;
}

export const FormSelect: React.FC<FormSelectProps> = memo(({
  value,
  onChange,
  options,
  placeholder,
  ...fieldProps
}) => {
  const handleChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    onChange?.(event.target.value);
  };

  return (
    <FormField {...fieldProps}>
      <Select
        value={value || ''}
        onChange={handleChange}
        placeholder={placeholder}
        isInvalid={fieldProps.isInvalid}
        isDisabled={fieldProps.isDisabled}
      >
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </Select>
    </FormField>
  );
});

FormSelect.displayName = 'FormSelect';

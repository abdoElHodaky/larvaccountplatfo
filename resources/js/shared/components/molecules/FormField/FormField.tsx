import React, { memo } from 'react';
import {
  FormControl,
  FormLabel,
  FormErrorMessage,
  FormHelperText,
  Box,
  Text,
} from '@chakra-ui/react';

export interface FormFieldProps {
  label?: string;
  error?: string;
  helperText?: string;
  required?: boolean;
  isInvalid?: boolean;
  children: React.ReactNode;
  labelProps?: Record<string, any>;
  containerProps?: Record<string, any>;
}

/**
 * Enhanced FormField component for consistent form styling
 * Integrates with Inertia.js form validation
 */
export const FormField = memo<FormFieldProps>(({
  label,
  error,
  helperText,
  required = false,
  isInvalid,
  children,
  labelProps = {},
  containerProps = {},
}) => {
  const hasError = Boolean(error) || isInvalid;

  return (
    <FormControl
      isRequired={required}
      isInvalid={hasError}
      {...containerProps}
    >
      {label && (
        <FormLabel
          fontSize="sm"
          fontWeight="medium"
          color="gray.700"
          mb={2}
          {...labelProps}
        >
          {label}
          {required && (
            <Text as="span" color="red.500" ml={1}>
              *
            </Text>
          )}
        </FormLabel>
      )}
      
      <Box>
        {children}
      </Box>
      
      {hasError && error && (
        <FormErrorMessage fontSize="sm" mt={1}>
          {error}
        </FormErrorMessage>
      )}
      
      {!hasError && helperText && (
        <FormHelperText fontSize="sm" mt={1} color="gray.600">
          {helperText}
        </FormHelperText>
      )}
    </FormControl>
  );
});

FormField.displayName = 'FormField';

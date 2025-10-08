import React, { Fragment, memo, useMemo } from 'react';
import {
  FormControl,
  FormLabel,
  FormErrorMessage,
  FormHelperText,
  Box,
  Text,
  useColorModeValue,
} from '@chakra-ui/react';

/**
 * Performance-Optimized Form Field Component
 * Provides consistent form field layout with validation support
 */

export interface FormFieldProps {
  label?: string;
  error?: string | string[];
  helperText?: string;
  isRequired?: boolean;
  isInvalid?: boolean;
  isDisabled?: boolean;
  children: React.ReactNode;
  className?: string;
  labelProps?: Record<string, any>;
  size?: 'sm' | 'md' | 'lg';
  variant?: 'default' | 'financial' | 'compact';
}

export const FormField: React.FC<FormFieldProps> = memo(({
  label,
  error,
  helperText,
  isRequired = false,
  isInvalid = false,
  isDisabled = false,
  children,
  className,
  labelProps = {},
  size = 'md',
  variant = 'default',
}) => {
  // Memoized color values for performance
  const labelColor = useColorModeValue('gray.700', 'gray.200');
  const errorColor = useColorModeValue('red.500', 'red.300');
  const helperColor = useColorModeValue('gray.500', 'gray.400');

  // Memoized error processing
  const errorMessage = useMemo(() => {
    if (!error) return null;
    if (Array.isArray(error)) {
      return error.join(', ');
    }
    return error;
  }, [error]);

  // Memoized validation state
  const isFieldInvalid = useMemo(() => 
    isInvalid || Boolean(errorMessage),
    [isInvalid, errorMessage]
  );

  // Memoized size configurations
  const sizeConfig = useMemo(() => {
    const configs = {
      sm: { spacing: 2, fontSize: 'sm' },
      md: { spacing: 3, fontSize: 'md' },
      lg: { spacing: 4, fontSize: 'lg' },
    };
    return configs[size];
  }, [size]);

  // Memoized variant styles
  const variantStyles = useMemo(() => {
    const styles = {
      default: {},
      financial: {
        borderLeft: '3px solid',
        borderLeftColor: 'blue.400',
        pl: 3,
        bg: useColorModeValue('blue.50', 'blue.900'),
      },
      compact: {
        spacing: 1,
      },
    };
    return styles[variant];
  }, [variant]);

  // Memoized label content
  const labelContent = useMemo(() => {
    if (!label) return null;
    
    return (
      <FormLabel
        fontSize={sizeConfig.fontSize}
        color={labelColor}
        fontWeight="medium"
        mb={variant === 'compact' ? 1 : 2}
        {...labelProps}
      >
        {label}
        {isRequired && (
          <Text as="span" color={errorColor} ml={1}>
            *
          </Text>
        )}
      </FormLabel>
    );
  }, [label, isRequired, labelColor, errorColor, sizeConfig.fontSize, variant, labelProps]);

  // Memoized helper text content
  const helperContent = useMemo(() => {
    if (!helperText || isFieldInvalid) return null;
    
    return (
      <FormHelperText
        fontSize="sm"
        color={helperColor}
        mt={1}
      >
        {helperText}
      </FormHelperText>
    );
  }, [helperText, isFieldInvalid, helperColor]);

  // Memoized error content
  const errorContent = useMemo(() => {
    if (!isFieldInvalid || !errorMessage) return null;
    
    return (
      <FormErrorMessage
        fontSize="sm"
        mt={1}
        fontWeight="medium"
      >
        {errorMessage}
      </FormErrorMessage>
    );
  }, [isFieldInvalid, errorMessage]);

  return (
    <FormControl
      isRequired={isRequired}
      isInvalid={isFieldInvalid}
      isDisabled={isDisabled}
      className={className}
      {...variantStyles}
    >
      <Fragment>
        {labelContent}
        
        <Box>
          {children}
        </Box>
        
        {helperContent}
        {errorContent}
      </Fragment>
    </FormControl>
  );
});

FormField.displayName = 'FormField';

/**
 * Compact Form Field for dense layouts
 */
export const CompactFormField: React.FC<Omit<FormFieldProps, 'variant'>> = memo((props) => (
  <FormField {...props} variant="compact" />
));

CompactFormField.displayName = 'CompactFormField';

/**
 * Financial Form Field with specialized styling
 */
export const FinancialFormField: React.FC<Omit<FormFieldProps, 'variant'>> = memo((props) => (
  <FormField {...props} variant="financial" />
));

FinancialFormField.displayName = 'FinancialFormField';

export default FormField;
